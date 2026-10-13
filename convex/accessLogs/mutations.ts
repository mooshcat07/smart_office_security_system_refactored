import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Malawi (CAT) is UTC+2 with no daylight saving.
const CAT_OFFSET_MS = 2 * 60 * 60 * 1000;

function catDayKey(timestamp: number) {
  return new Date(timestamp + CAT_OFFSET_MS).toISOString().slice(0, 10);
}

export const recordFingerprintAccess = mutation({
  args: {
    esp32Id: v.string(),
    fingerprintId: v.number(),
    // What the SENSOR concluded. The server has the final say:
    // a recognised print can still be DENIED (inactive / archived user).
    result: v.union(v.literal("GRANTED"), v.literal("DENIED")),
  },

  handler: async (ctx, args) => {
    const device = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique();

    if (!device) {
      throw new Error(`Device ${args.esp32Id} is not registered`);
    }

    // -------------------------------------------------
    // Sensor did not recognise the print
    // -------------------------------------------------

    if (args.result === "DENIED") {
      const accessLogId = await ctx.db.insert("accessLogs", {
        deviceId: device._id,
        esp32Id: args.esp32Id,
        status: "DENIED",
        denyReason: "UNRECOGNISED",
      });

      return {
        success: true,
        accessLogId,
        status: "DENIED" as const,
        reason: "UNRECOGNISED" as const,
        direction: null,
        employeeName: null,
      };
    }

    // -------------------------------------------------
    // Sensor recognised the print -> check the user record
    // -------------------------------------------------

    const fingerprintUser = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) =>
        q.eq("fingerprintId", args.fingerprintId),
      )
      .unique();

    // Print exists on the sensor but not in our database
    if (!fingerprintUser) {
      const accessLogId = await ctx.db.insert("accessLogs", {
        deviceId: device._id,
        esp32Id: args.esp32Id,
        fingerprintId: args.fingerprintId,
        status: "DENIED",
        denyReason: "UNRECOGNISED",
      });

      return {
        success: true,
        accessLogId,
        status: "DENIED" as const,
        reason: "UNRECOGNISED" as const,
        direction: null,
        employeeName: null,
      };
    }

    // Archived or inactive -> deny, but keep who tried (audit trail)
    if (fingerprintUser.archived || !fingerprintUser.active) {
      const reason = fingerprintUser.archived ? "ARCHIVED" : "INACTIVE";

      const accessLogId = await ctx.db.insert("accessLogs", {
        deviceId: device._id,
        esp32Id: args.esp32Id,
        fingerprintId: args.fingerprintId,
        employeeName: fingerprintUser.fullName,
        employeeNumber: fingerprintUser.employeeNumber,
        status: "DENIED",
        denyReason: reason,
      });

      return {
        success: true,
        accessLogId,
        status: "DENIED" as const,
        reason,
        direction: null,
        employeeName: fingerprintUser.fullName,
      };
    }

    // -------------------------------------------------
    // Active user -> alternate ENTRY / EXIT
    //
    // First scan = ENTRY, next = EXIT, next = ENTRY ...
    // If the last ENTRY was on an earlier day (person never
    // scanned out), the new scan starts a fresh ENTRY.
    // -------------------------------------------------

    const now = Date.now();

    const lastGranted = await ctx.db
      .query("accessLogs")
      .withIndex("by_fingerprintId", (q) =>
        q.eq("fingerprintId", args.fingerprintId),
      )
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "GRANTED"))
      .first();

    const isInside =
      lastGranted?.direction === "ENTRY" &&
      catDayKey(lastGranted._creationTime) === catDayKey(now);

    const direction = isInside ? ("EXIT" as const) : ("ENTRY" as const);

    const accessLogId = await ctx.db.insert("accessLogs", {
      deviceId: device._id,
      esp32Id: args.esp32Id,
      fingerprintId: args.fingerprintId,
      employeeName: fingerprintUser.fullName,
      employeeNumber: fingerprintUser.employeeNumber,
      status: "GRANTED",
      direction,
      durationMs:
        direction === "EXIT" && lastGranted
          ? now - lastGranted._creationTime
          : undefined,
    });

    return {
      success: true,
      accessLogId,
      status: "GRANTED" as const,
      reason: null,
      direction,
      employeeName: fingerprintUser.fullName,
    };
  },
});
