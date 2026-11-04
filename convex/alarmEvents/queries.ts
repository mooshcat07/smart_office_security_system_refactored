import { query } from "../_generated/server";

/**
 * All alarm events, newest first, with device name/location.
 */
export const getAllAlarms = query({
  args: {},

  handler: async (ctx) => {
    const alarms = await ctx.db
      .query("alarmEvents")
      .order("desc")
      .collect();

    const result = [];

    for (const alarm of alarms) {
      const device = await ctx.db.get(alarm.deviceId);

      result.push({
        id: alarm._id,
        device: device?.name ?? alarm.esp32Id,
        location: device?.location ?? "Unknown",
        reason: alarm.reason,
        severity: alarm.severity,
        status: alarm.status,
        triggeredAt: new Date(alarm._creationTime).toISOString(),
        resolvedAt: alarm.resolvedAt
          ? new Date(alarm.resolvedAt).toISOString()
          : null,
        motionEventId: alarm.motionEventId ?? null,
      });
    }

    return result;
  },
});
