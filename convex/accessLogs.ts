import { v } from "convex/values"
import { query, internalMutation, internalQuery } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

const statusValidator = v.union(v.literal("GRANTED"), v.literal("DENIED"))

// If a device racks up this many DENIED scans within the window below, raise an alarm.
const DENIED_THRESHOLD = 3
const DENIED_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

/** Public: every access log, newest first, for the Access Logs dashboard page. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("accessLogs").order("desc").take(500)
  },
})

/** Public: counts for the summary cards. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.db.query("accessLogs").order("desc").take(1000)
    return {
      total: recent.length,
      granted: recent.filter((r) => r.status === "GRANTED").length,
      denied: recent.filter((r) => r.status === "DENIED").length,
    }
  },
})

/** Internal: count how many DENIED scans a device has logged since `since`. */
export const countRecentDenials = internalQuery({
  args: { deviceId: v.id("devices"), since: v.number() },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("accessLogs")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(50)
    return logs.filter((l) => l.status === "DENIED" && l._creationTime >= args.since).length
  },
})

/**
 * Internal: record a fingerprint scan from an ESP32. Looks up the matching
 * employee (if the fingerprintId is recognised) and, on a run of DENIED
 * scans, raises a MEDIUM alarm.
 */
export const record = internalMutation({
  args: {
    deviceId: v.id("devices"),
    esp32Id: v.string(),
    fingerprintId: v.optional(v.number()),
    status: statusValidator,
  },
  handler: async (ctx, args): Promise<{ accessLogId: Id<"accessLogs">; alarmRaised: boolean }> => {
    let employeeName: string | undefined
    let employeeNumber: string | undefined

    if (args.fingerprintId !== undefined) {
      const employee = await ctx.db
        .query("fingerprintUsers")
        .withIndex("by_fingerprintId", (q) => q.eq("fingerprintId", args.fingerprintId!))
        .unique()
      if (employee && employee.active) {
        employeeName = employee.fullName
        employeeNumber = employee.employeeNumber
      }
    }

    const accessLogId = await ctx.db.insert("accessLogs", {
      deviceId: args.deviceId,
      esp32Id: args.esp32Id,
      fingerprintId: args.fingerprintId,
      employeeName,
      employeeNumber,
      status: args.status,
    })

    let alarmRaised = false
    if (args.status === "DENIED") {
      const recentDenials: number = await ctx.runQuery(internal.accessLogs.countRecentDenials, {
        deviceId: args.deviceId,
        since: Date.now() - DENIED_WINDOW_MS,
      })
      if (recentDenials >= DENIED_THRESHOLD) {
        const alarmId: Id<"alarmEvents"> | null = await ctx.runMutation(
          internal.alarmEvents.createFromDeniedAccess,
          {
            deviceId: args.deviceId,
            esp32Id: args.esp32Id,
            reason: "Multiple denied access attempts",
            severity: "MEDIUM",
          },
        )
        alarmRaised = alarmId !== null
      }
    }

    return { accessLogId, alarmRaised }
  },
})