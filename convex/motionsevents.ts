import { v } from "convex/values"
import { query, mutation, internalMutation } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

// Outside this window a motion trigger is treated as "after hours".
const AFTER_HOURS_START = 18 // 18:00
const AFTER_HOURS_END = 7 // 07:00

function isAfterHours(timestampMs: number) {
  const hour = new Date(timestampMs).getHours()
  return hour >= AFTER_HOURS_START || hour < AFTER_HOURS_END
}

/** Public: every motion event, newest first, for the Motion Events dashboard page. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("motionEvents").order("desc").take(200)
  },
})

/** Public: mark a motion event resolved (the "Mark Resolved" dashboard button). */
export const resolve = mutation({
  args: { motionEventId: v.id("motionEvents") },
  handler: async (ctx, args) => {
    await ctx.db.patch("motionEvents", args.motionEventId, {
      resolved: true,
      resolvedAt: Date.now(),
    })
    return null
  },
})

/**
 * Internal: record a PIR trigger from an ESP32. If it happened after hours,
 * also raises a HIGH severity alarm (deduped against any already-active
 * after-hours alarm for the same device).
 */
export const record = internalMutation({
  args: {
    deviceId: v.id("devices"),
    esp32Id: v.string(),
  },
  handler: async (ctx, args): Promise<{ motionEventId: Id<"motionEvents">; alarmRaised: boolean }> => {
    const now = Date.now()
    const motionEventId = await ctx.db.insert("motionEvents", {
      deviceId: args.deviceId,
      esp32Id: args.esp32Id,
      resolved: false,
    })

    let alarmRaised = false
    if (isAfterHours(now)) {
      const alarmId: Id<"alarmEvents"> | null = await ctx.runMutation(
        internal.alarmEvents.createFromMotion,
        {
          motionEventId,
          deviceId: args.deviceId,
          esp32Id: args.esp32Id,
          reason: "Motion detected after hours",
          severity: "HIGH",
        },
      )
      alarmRaised = alarmId !== null
    }

    return { motionEventId, alarmRaised }
  },
})