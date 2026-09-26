import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const acknowledgeCommand = mutation({
  args: {
    commandId: v.id("deviceCommands"),
    success: v.boolean(),
    failureReason: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const command = await ctx.db.get(args.commandId);

    if (!command) {
      throw new Error("Command not found");
    }

    if (command.status !== "PENDING") {
      throw new Error(
        `Command has already been processed`
      );
    }

    if (args.success) {
      await ctx.db.patch(command._id, {
        status: "ACKNOWLEDGED",
        acknowledgedAt: Date.now(),
      });

      return {
        success: true,
        status: "ACKNOWLEDGED",
      };
    }

    await ctx.db.patch(command._id, {
      status: "FAILED",
      acknowledgedAt: Date.now(),
      failureReason:
        args.failureReason ?? "Device command failed",
    });

    return {
      success: true,
      status: "FAILED",
    };
  },
});

export const completeFingerprintEnrollment = mutation({
  args: {
    commandId: v.id("deviceCommands"),
    success: v.boolean(),
    failureReason: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const command = await ctx.db.get(args.commandId);

    if (!command) {
      throw new Error("Command not found");
    }

    if (command.command !== "ENROLL_FINGERPRINT") {
      throw new Error(
        "This command is not a fingerprint enrollment command"
      );
    }

    if (command.status !== "PENDING") {
      throw new Error(
        "This command has already been processed"
      );
    }

    // Enrollment failed
    if (!args.success) {
      await ctx.db.patch(command._id, {
        status: "FAILED",
        acknowledgedAt: Date.now(),
        failureReason:
          args.failureReason ??
          "Fingerprint enrollment failed",
      });

      return {
        success: true,
        status: "FAILED",
      };
    }

    // Make sure required enrollment data exists
    if (
      command.fingerprintId === undefined ||
      command.fullName === undefined ||
      command.employeeNumber === undefined
    ) {
      throw new Error(
        "Enrollment command is missing required staff information"
      );
    }

    // Check again that the fingerprint ID isn't already registered
    const existingFingerprint = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) =>
        q.eq(
          "fingerprintId",
          command.fingerprintId!
        )
      )
      .unique();

    if (existingFingerprint) {
      throw new Error(
        `Fingerprint ID ${command.fingerprintId} is already registered`
      );
    }

    // Create the staff fingerprint record
    const fingerprintUserId =
      await ctx.db.insert("fingerprintUsers", {
        fingerprintId: command.fingerprintId,
        fullName: command.fullName,
        employeeNumber: command.employeeNumber,
        department: command.department,
        role: command.role,
        active: true,
      });

    // Mark command as completed
    await ctx.db.patch(command._id, {
      status: "ACKNOWLEDGED",
      acknowledgedAt: Date.now(),
    });

    return {
      success: true,
      status: "ACKNOWLEDGED",
      fingerprintUserId,
      fingerprintId: command.fingerprintId,
    };
  },
});