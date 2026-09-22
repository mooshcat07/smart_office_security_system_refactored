import { mutation } from "../_generated/server";
import { v } from "convex/values";

// =====================================================
// Acknowledge / fail a normal device command
// =====================================================

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
      throw new Error("Command has already been processed");
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


// =====================================================
// Complete fingerprint enrollment
// =====================================================

export const completeFingerprintEnrollment = mutation({
  args: {
    commandId: v.id("deviceCommands"),
    success: v.boolean(),
    failureReason: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    // -------------------------------------------------
    // Get command
    // -------------------------------------------------

    const command = await ctx.db.get(args.commandId);

    if (!command) {
      throw new Error("Command not found");
    }

    // -------------------------------------------------
    // Make sure this is an enrollment command
    // -------------------------------------------------

    if (command.command !== "ENROLL_FINGERPRINT") {
      throw new Error(
        "This command is not a fingerprint enrollment command"
      );
    }

    // -------------------------------------------------
    // Make sure it hasn't already been processed
    // -------------------------------------------------

    if (command.status !== "PENDING") {
      throw new Error(
        "This command has already been processed"
      );
    }

    // -------------------------------------------------
    // Enrollment failed
    // -------------------------------------------------

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

    // -------------------------------------------------
    // Make sure required staff information exists
    // -------------------------------------------------

    if (
      command.fingerprintId === undefined ||
      command.fullName === undefined ||
      command.employeeNumber === undefined
    ) {
      throw new Error(
        "Enrollment command is missing required staff information"
      );
    }

    // -------------------------------------------------
    // Check fingerprint ID again
    // -------------------------------------------------

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

    // -------------------------------------------------
    // Create fingerprint user
    // -------------------------------------------------

    const fingerprintUserId =
      await ctx.db.insert("fingerprintUsers", {
        fingerprintId: command.fingerprintId,
        fullName: command.fullName,
        employeeNumber: command.employeeNumber,
        department: command.department,
        role: command.role,
        active: true,
      });

    // -------------------------------------------------
    // Mark command as acknowledged
    // -------------------------------------------------

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

export const startFingerprintDeletion = mutation({
  args: {
    esp32Id: v.string(),
    fingerprintId: v.number(),
  },

  handler: async (ctx, args) => {
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

    if (
      args.fingerprintId < 1 ||
      args.fingerprintId > 127
    ) {
      throw new Error(
        "Fingerprint ID must be between 1 and 127"
      );
    }

    const fingerprintUser = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) =>
        q.eq("fingerprintId", args.fingerprintId)
      )
      .unique();

    if (!fingerprintUser) {
      throw new Error(
        `No staff member is registered with fingerprint ID ${args.fingerprintId}`
      );
    }

    const pendingCommand = await ctx.db
      .query("deviceCommands")
      .withIndex("by_esp32_status", (q) =>
        q
          .eq("esp32Id", args.esp32Id)
          .eq("status", "PENDING")
      )
      .first();

    if (pendingCommand) {
      throw new Error(
        "This device already has a pending command"
      );
    }

    const commandId = await ctx.db.insert(
      "deviceCommands",
      {
        deviceId: device._id,
        esp32Id: args.esp32Id,
        command: "DELETE_FINGERPRINT",
        fingerprintId: args.fingerprintId,
        status: "PENDING",
        createdAt: Date.now(),
      }
    );

    return {
      success: true,
      commandId,
      fingerprintId: args.fingerprintId,
      message:
        "Fingerprint deletion command created",
    };
  },
});