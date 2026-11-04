import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Mark an alarm as resolved (from the dashboard).
 */
export const resolveAlarm = mutation({
  args: {
    alarmEventId: v.id("alarmEvents"),
    resolvedBy: v.optional(v.string()), // Prisma user id if available
  },

  handler: async (ctx, args) => {
    const alarm = await ctx.db.get(args.alarmEventId);
    if (!alarm) {
      throw new Error("Alarm event not found");
    }
    if (alarm.status === "RESOLVED") {
      return { success: true, alreadyResolved: true };
    }

    await ctx.db.patch(args.alarmEventId, {
      status: "RESOLVED",
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
    });

    // If this alarm was linked to a motion event, also resolve the motion event
    if (alarm.motionEventId) {
      const motion = await ctx.db.get(alarm.motionEventId);
      if (motion && !motion.resolved) {
        await ctx.db.patch(alarm.motionEventId, {
          resolved: true,
          resolvedAt: Date.now(),
        });
      }
    }

    return { success: true, alreadyResolved: false };
  },
});
