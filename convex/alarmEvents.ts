import { v } from "convex/values"
import { query, mutation, internalMutation } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

const severityValidator = v.union(v.literal("HIGH"), v.literal("MEDIUM"), v.literal("LOW"))

/** Public: every alarm, newest first, for the Alarms dashboard page. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alarmEvents").order("desc").take(200)
  },
})

/** Public: counts for the summary cards. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.db.query("alarmEvents").order("desc").take(500)
    return {
      active: recent.filter((a) => a.status === "ACTIVE").length,
      highSeverity: recent.filter((a) => a.severity === "HIGH").length,
    }
  },
})

/** Public: mark an alarm resolved (the "Resolve" dashboard button). */
export const resolve = mutation({
  args: { alarmEventId: v.id("alarmEvents"), resolvedBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch("alarmEvents", args.alarmEventId, {
      status: "RESOLVED",
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
    })
    return null
  },
})

/** Internal: true if the device already has an unresolved alarm. Keeps a
 *  single bad run of denials/motion triggers from flooding the alarm list. */
async function hasActiveAlarm(ctx: MutationCtx, deviceId: Id<"devices">): Promise<boolean> {
  const recent = await ctx.db
    .query("alarmEvents")
    .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
    .order("desc")
    .take(20)
  return recent.some((a) => a.status === "ACTIVE")
}

/**
 * Internal: raise an alarm from a run of denied access attempts. Returns
 * null (no alarm created) if the device already has an active alarm.
 */
export const createFromDeniedAccess = internalMutation({
  args: {
    deviceId: v.id("devices"),
    esp32Id: v.string(),
    reason: v.string(),
    severity: severityValidator,
  },
  handler: async (ctx, args): Promise<Id<"alarmEvents"> | null> => {
    if (await hasActiveAlarm(ctx, args.deviceId)) {
      return null
    }
    return await ctx.db.insert("alarmEvents", {
      deviceId: args.deviceId,
      esp32Id: args.esp32Id,
      reason: args.reason,
      severity: args.severity,
      status: "ACTIVE",
    })
  },
})

/**
 * Internal: raise an alarm from an after-hours motion trigger. Deduped
 * against any already-active alarm for the same device. Returns null if
 * no alarm was created.
 */
export const createFromMotion = internalMutation({
  args: {
    motionEventId: v.id("motionEvents"),
    deviceId: v.id("devices"),
    esp32Id: v.string(),
    reason: v.string(),
    severity: severityValidator,
  },
  handler: async (ctx, args): Promise<Id<"alarmEvents"> | null> => {
    if (await hasActiveAlarm(ctx, args.deviceId)) {
      return null
    }
    return await ctx.db.insert("alarmEvents", {
      motionEventId: args.motionEventId,
      deviceId: args.deviceId,
      esp32Id: args.esp32Id,
      reason: args.reason,
      severity: args.severity,
      status: "ACTIVE",
    })
  },
})
