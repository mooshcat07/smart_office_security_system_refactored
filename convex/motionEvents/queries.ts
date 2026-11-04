import { query } from "../_generated/server";
import { v } from "convex/values";

// Malawi (CAT) is UTC+2 with no daylight saving.
const CAT_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function catDayKey(timestamp: number) {
  return new Date(timestamp + CAT_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * All motion events, newest first, with device name/location.
 */
export const getAllMotionEvents = query({
  args: {},

  handler: async (ctx) => {
    const events = await ctx.db
      .query("motionEvents")
      .order("desc")
      .collect();

    const result = [];

    for (const event of events) {
      const device = await ctx.db.get(event.deviceId);

      result.push({
        id: event._id,
        device: device?.name ?? event.esp32Id,
        location: device?.location ?? "Unknown",
        detectedAt: new Date(event._creationTime).toISOString(),
        resolved: event.resolved,
        resolvedAt: event.resolvedAt
          ? new Date(event.resolvedAt).toISOString()
          : null,
      });
    }

    return result;
  },
});

/**
 * Hourly bucket counts for "today" (CAT calendar day) — for the bar chart.
 */
export const getMotionHourlyToday = query({
  args: {},

  handler: async (ctx) => {
    const now = Date.now();
    const todayKey = catDayKey(now);

    // Start of today in CAT, expressed as UTC ms
    const todayStartCat =
      Math.floor((now + CAT_OFFSET_MS) / DAY_MS) * DAY_MS - CAT_OFFSET_MS;

    const events = await ctx.db
      .query("motionEvents")
      .withIndex("by_creation_time", (q) =>
        q.gte("_creationTime", todayStartCat),
      )
      .collect();

    // 24 buckets
    const buckets: { hour: string; events: number }[] = [];
    for (let h = 0; h < 24; h++) {
      buckets.push({
        hour: `${h.toString().padStart(2, "0")}:00`,
        events: 0,
      });
    }

    for (const event of events) {
      if (catDayKey(event._creationTime) !== todayKey) continue;
      const catDate = new Date(event._creationTime + CAT_OFFSET_MS);
      const hour = catDate.getUTCHours();
      buckets[hour].events += 1;
    }

    return buckets;
  },
});
