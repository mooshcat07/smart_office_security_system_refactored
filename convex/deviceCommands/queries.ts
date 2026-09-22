import { query } from "../_generated/server";
import { v } from "convex/values";

export const getPendingCommand = query({
  args: {
    esp32Id: v.string(),
  },

  handler: async (ctx, args) => {
    const command = await ctx.db
      .query("deviceCommands")
      .withIndex("by_esp32_status", (q) =>
        q
          .eq("esp32Id", args.esp32Id)
          .eq("status", "PENDING")
      )
      .first();

    if (!command) {
      return null;
    }

    return {
      commandId: command._id,
      command: command.command,
      fingerprintId: command.fingerprintId ?? null,
      durationMs: command.durationMs ?? null,
    };
  },
});

export const listByDevice = query({
  args: {
    deviceId: v.id("devices"),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("deviceCommands")
      .withIndex("by_device_status", (q) =>
        q.eq("deviceId", args.deviceId)
      )
      .order("desc")
      .take(20);
  },
});
