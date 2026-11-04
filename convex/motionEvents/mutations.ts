import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_HOURS,
  catDateKey,
  resolveSchedule,
  isAfterHoursForSchedule,
} from "../settings/helpers";

/**
 * Called by the ESP32 when the PIR detects motion.
 *
 * Working hours (from Settings + date overrides):
 *   - Motion is acknowledged but NOT written to the database.
 *   - No alarm, no buzzer hint.
 *
 * Outside working hours (or closed-day override):
 *   - Insert motionEvents row
 *   - Insert HIGH alarmEvents row
 *   - triggerBuzzer: true for the ESP32
 */
export const recordMotion = mutation({
  args: {
    esp32Id: v.string(),
  },

  handler: async (ctx, args) => {
    const device = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique();

    if (!device) {
      throw new Error(`Device ${args.esp32Id} is not registered`);
    }

    const now = Date.now();

    const settingsRow = await ctx.db
      .query("workingHoursSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();

    const defaults = settingsRow
      ? {
          weekdayStart: settingsRow.weekdayStart,
          weekdayEnd: settingsRow.weekdayEnd,
          weekendStart: settingsRow.weekendStart,
          weekendEnd: settingsRow.weekendEnd,
        }
      : DEFAULT_HOURS;

    const date = catDateKey(now);
    const overrideRow = await ctx.db
      .query("dateOverrides")
      .withIndex("by_date", (q) => q.eq("date", date))
      .unique();

    const schedule = resolveSchedule(
      now,
      defaults,
      overrideRow
        ? {
            closed: overrideRow.closed,
            start: overrideRow.start,
            end: overrideRow.end,
            label: overrideRow.label,
          }
        : null,
    );

    const afterHours = isAfterHoursForSchedule(now, schedule);

    const schedulePayload = {
      start: schedule.start,
      end: schedule.end,
      closed: schedule.closed,
      source: schedule.source,
    };

    // ── During working hours: do not store anything ───────────────────────
    if (!afterHours) {
      return {
        success: true,
        recorded: false,
        motionEventId: null,
        alarmEventId: null,
        afterHours: false,
        schedule: schedulePayload,
        triggerBuzzer: false,
        message: "Within working hours — motion not stored",
      };
    }

    // ── After hours / closed day: store motion + alarm ────────────────────
    const motionEventId = await ctx.db.insert("motionEvents", {
      deviceId: device._id,
      esp32Id: args.esp32Id,
      resolved: false,
    });

    const reason = schedule.closed
      ? schedule.label
        ? `Motion on closed day (${schedule.label})`
        : "Motion detected on a closed day"
      : "Motion detected after hours";

    const alarmEventId = await ctx.db.insert("alarmEvents", {
      motionEventId,
      deviceId: device._id,
      esp32Id: args.esp32Id,
      reason,
      severity: "HIGH",
      status: "ACTIVE",
    });

    return {
      success: true,
      recorded: true,
      motionEventId,
      alarmEventId,
      afterHours: true,
      schedule: schedulePayload,
      triggerBuzzer: true,
      message: reason,
    };
  },
});

/**
 * Mark a motion event as resolved (from the dashboard).
 */
export const resolveMotionEvent = mutation({
  args: {
    motionEventId: v.id("motionEvents"),
  },

  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.motionEventId);
    if (!event) {
      throw new Error("Motion event not found");
    }
    if (event.resolved) {
      return { success: true, alreadyResolved: true };
    }

    await ctx.db.patch(args.motionEventId, {
      resolved: true,
      resolvedAt: Date.now(),
    });

    return { success: true, alreadyResolved: false };
  },
});
