import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const recordFingerprintAccess = mutation({
  args: {
    esp32Id: v.string(),
    fingerprintId: v.number(),
    result: v.union(
      v.literal("GRANTED"),
      v.literal("DENIED")
    ),
  },

  handler: async (ctx, args) => {
    // Find the device that sent the fingerprint event
    const device = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) =>
        q.eq("esp32Id", args.esp32Id)
      )
      .unique();

    if (!device) {
      throw new Error(
        `Device ${args.esp32Id} is not registered`
      );
    }

    // GRANTED fingerprint
    if (args.result === "GRANTED") {
      const fingerprintUser = await ctx.db
        .query("fingerprintUsers")
        .withIndex("by_fingerprintId", (q) =>
          q.eq("fingerprintId", args.fingerprintId)
        )
        .unique();

      const accessLogId = await ctx.db.insert("accessLogs", {
        deviceId: device._id,
        esp32Id: args.esp32Id,
        fingerprintId: args.fingerprintId,
        employeeName: fingerprintUser?.fullName,
        employeeNumber: fingerprintUser?.employeeNumber,
        status: "GRANTED",
      });

      return {
        success: true,
        accessLogId,
        status: "GRANTED",
        employeeName: fingerprintUser?.fullName ?? null,
      };
    }

    // DENIED fingerprint
    const accessLogId = await ctx.db.insert("accessLogs", {
      deviceId: device._id,
      esp32Id: args.esp32Id,
      status: "DENIED",
    });

    return {
      success: true,
      accessLogId,
      status: "DENIED",
    };
  },
});