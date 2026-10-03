import { mutation } from "../_generated/server";
import { v } from "convex/values";

// =====================================================
// Acknowledge / fail a device command
//
// IMPORTANT: this is the only result endpoint the ESP32
// firmware ever calls (code.cpp -> sendCommandResult() ->
// COMMAND_RESULT_API -> /api/devices/commands/result), for
// every command type, including ENROLL_FINGERPRINT and
// DELETE_FINGERPRINT. So this mutation has to apply the
// fingerprintUsers side effects itself, not just flip status.
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

    if (!args.success) {
      await ctx.db.patch(command._id, {
        status: "FAILED",
        acknowledgedAt: Date.now(),
        failureReason: args.failureReason ?? "Device command failed",
      });

      return { success: true, status: "FAILED" };
    }

    // -------------------------------------------------
    // Success: apply side effects for fingerprint commands
    // -------------------------------------------------

    if (command.command === "ENROLL_FINGERPRINT") {
      if (
        command.fingerprintId === undefined ||
        command.fullName === undefined ||
        command.employeeNumber === undefined
      ) {
        throw new Error(
          "Enrollment command is missing required staff information",
        );
      }

      const existingFingerprint = await ctx.db
        .query("fingerprintUsers")
        .withIndex("by_fingerprintId", (q) =>
          q.eq("fingerprintId", command.fingerprintId!),
        )
        .unique();

      if (existingFingerprint) {
        throw new Error(
          `Fingerprint ID ${command.fingerprintId} is already registered`,
        );
      }

      await ctx.db.insert("fingerprintUsers", {
        fingerprintId: command.fingerprintId,
        fullName: command.fullName,
        employeeNumber: command.employeeNumber,
        department: command.department,
        role: command.role,
        active: true,
      });
    }

    if (command.command === "DELETE_FINGERPRINT") {
      if (command.fingerprintId === undefined) {
        throw new Error("Deletion command is missing a fingerprint ID");
      }

      const fingerprintUser = await ctx.db
        .query("fingerprintUsers")
        .withIndex("by_fingerprintId", (q) =>
          q.eq("fingerprintId", command.fingerprintId!),
        )
        .unique();

      if (fingerprintUser) {
        await ctx.db.delete(fingerprintUser._id);
      }
    }

    await ctx.db.patch(command._id, {
      status: "ACKNOWLEDGED",
      acknowledgedAt: Date.now(),
    });

    return { success: true, status: "ACKNOWLEDGED" };
  },
});

// =====================================================
// Complete fingerprint deletion (kept as an explicit,
// directly-callable mutation for dashboard/manual use —
// the firmware path goes through acknowledgeCommand above)
// =====================================================

export const completeFingerprintDeletion = mutation({
  args: {
    commandId: v.id("deviceCommands"),
    success: v.boolean(),
    failureReason: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const command = await ctx.db.get(args.commandId);

    if (!command) throw new Error("Command not found");
    if (command.command !== "DELETE_FINGERPRINT") {
      throw new Error("This command is not a fingerprint deletion command");
    }
    if (command.status !== "PENDING") {
      throw new Error("This command has already been processed");
    }

    if (!args.success) {
      await ctx.db.patch(command._id, {
        status: "FAILED",
        acknowledgedAt: Date.now(),
        failureReason: args.failureReason ?? "Fingerprint deletion failed",
      });
      return { success: true, status: "FAILED" };
    }

    if (command.fingerprintId === undefined) {
      throw new Error("Deletion command is missing a fingerprint ID");
    }

    const fingerprintUser = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) =>
        q.eq("fingerprintId", command.fingerprintId!),
      )
      .unique();

    if (fingerprintUser) {
      await ctx.db.delete(fingerprintUser._id);
    }

    await ctx.db.patch(command._id, {
      status: "ACKNOWLEDGED",
      acknowledgedAt: Date.now(),
    });

    return {
      success: true,
      status: "ACKNOWLEDGED",
      fingerprintId: command.fingerprintId,
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
    const command = await ctx.db.get(args.commandId);

    if (!command) throw new Error("Command not found");
    if (command.command !== "ENROLL_FINGERPRINT") throw new Error("This command is not a fingerprint enrollment command");
    if (command.status !== "PENDING") throw new Error("This command has already been processed");

    if (!args.success) {
      await ctx.db.patch(command._id, {
        status: "FAILED",
        acknowledgedAt: Date.now(),
        failureReason: args.failureReason ?? "Fingerprint enrollment failed",
      });
      return { success: true, status: "FAILED" };
    }

    if (
      command.fingerprintId === undefined ||
      command.fullName === undefined ||
      command.employeeNumber === undefined
    ) {
      throw new Error("Enrollment command is missing required staff information");
    }

    const existingFingerprint = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) => q.eq("fingerprintId", command.fingerprintId!))
      .unique();

    if (existingFingerprint) {
      throw new Error(`Fingerprint ID ${command.fingerprintId} is already registered`);
    }

    const fingerprintUserId = await ctx.db.insert("fingerprintUsers", {
      fingerprintId: command.fingerprintId,
      fullName: command.fullName,
      employeeNumber: command.employeeNumber,
      department: command.department,
      role: command.role,
      active: true,
    });

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
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique();

    if (!device) throw new Error(`Device ${args.esp32Id} is not registered`);
    if (args.fingerprintId < 1 || args.fingerprintId > 127) throw new Error("Fingerprint ID must be between 1 and 127");

    const fingerprintUser = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) => q.eq("fingerprintId", args.fingerprintId))
      .unique();

    if (!fingerprintUser) throw new Error(`No staff member is registered with fingerprint ID ${args.fingerprintId}`);

    const pendingCommand = await ctx.db
      .query("deviceCommands")
      .withIndex("by_esp32_status", (q) => q.eq("esp32Id", args.esp32Id).eq("status", "PENDING"))
      .first();

    if (pendingCommand) throw new Error("This device already has a pending command");

    const commandId = await ctx.db.insert("deviceCommands", {
      deviceId: device._id,
      esp32Id: args.esp32Id,
      command: "DELETE_FINGERPRINT",
      fingerprintId: args.fingerprintId,
      status: "PENDING",
      createdAt: Date.now(),
    });

    return { success: true, commandId, fingerprintId: args.fingerprintId, message: "Fingerprint deletion command created" };
  },
});

// =====================================================
// Trigger buzzer
// =====================================================

export const triggerBuzzer = mutation({
  args: {
    deviceId: v.id("devices"),
    durationMs: v.number(),
  },

  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    // Cancel any existing pending command first instead of rejecting
    const pendingCommand = await ctx.db
      .query("deviceCommands")
      .withIndex("by_device_status", (q) => q.eq("deviceId", args.deviceId).eq("status", "PENDING"))
      .first();

    if (pendingCommand) {
      await ctx.db.patch(pendingCommand._id, {
        status: "FAILED",
        acknowledgedAt: Date.now(),
        failureReason: "Superseded by new command",
      });
    }

    const commandId = await ctx.db.insert("deviceCommands", {
      deviceId: device._id,
      esp32Id: device.esp32Id,
      command: "TRIGGER_BUZZER",
      durationMs: args.durationMs,
      status: "PENDING",
      createdAt: Date.now(),
    });

    return { success: true, commandId };
  },
});

// =====================================================
// Silence buzzer — cancels any pending command first
// =====================================================

export const silenceBuzzer = mutation({
  args: {
    deviceId: v.id("devices"),
  },

  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    // Cancel ALL pending commands for this device (including any active buzzer trigger)
    const pendingCommands = await ctx.db
      .query("deviceCommands")
      .withIndex("by_device_status", (q) => q.eq("deviceId", args.deviceId).eq("status", "PENDING"))
      .collect();

    for (const cmd of pendingCommands) {
      await ctx.db.patch(cmd._id, {
        status: "FAILED",
        acknowledgedAt: Date.now(),
        failureReason: "Cancelled by silence command",
      });
    }

    // Insert the silence command
    const commandId = await ctx.db.insert("deviceCommands", {
      deviceId: device._id,
      esp32Id: device.esp32Id,
      command: "SILENCE_BUZZER",
      status: "PENDING",
      createdAt: Date.now(),
    });

    return { success: true, commandId };
  },
});