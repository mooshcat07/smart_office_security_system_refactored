import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const startFingerprintEnrollment = mutation({
  args: {
    esp32Id: v.string(),
    fullName: v.string(),
    employeeNumber: v.string(),
    department: v.optional(v.string()),
    role: v.optional(v.string()),
    fingerprintId: v.number(),
  },

  handler: async (ctx, args) => {
    // -------------------------------------------------
    // Find device
    // -------------------------------------------------

    const device = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique();

    if (!device) {
      throw new Error(`Device ${args.esp32Id} is not registered`);
    }

    // -------------------------------------------------
    // Validate fingerprint ID
    // -------------------------------------------------

    if (args.fingerprintId < 1 || args.fingerprintId > 127) {
      throw new Error("Fingerprint ID must be between 1 and 127");
    }

    // -------------------------------------------------
    // Check employee number
    // -------------------------------------------------

    const existingEmployee = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_employeeNumber", (q) =>
        q.eq("employeeNumber", args.employeeNumber),
      )
      .unique();

    if (existingEmployee) {
      throw new Error(`Employee number ${args.employeeNumber} already exists`);
    }

    // -------------------------------------------------
    // Check fingerprint ID
    // -------------------------------------------------

    const existingFingerprint = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) =>
        q.eq("fingerprintId", args.fingerprintId),
      )
      .unique();

    if (existingFingerprint) {
      throw new Error(
        `Fingerprint ID ${args.fingerprintId} is already registered`,
      );
    }

    // -------------------------------------------------
    // Check for another pending command
    // -------------------------------------------------

    const pendingCommand = await ctx.db
      .query("deviceCommands")
      .withIndex("by_esp32_status", (q) =>
        q.eq("esp32Id", args.esp32Id).eq("status", "PENDING"),
      )
      .first();

    if (pendingCommand) {
      throw new Error("This device already has a pending command");
    }

    // -------------------------------------------------
    // Create enrollment command
    // -------------------------------------------------

    const commandId = await ctx.db.insert("deviceCommands", {
      deviceId: device._id,

      esp32Id: args.esp32Id,

      command: "ENROLL_FINGERPRINT",

      fingerprintId: args.fingerprintId,

      // Staff information
      fullName: args.fullName,
      employeeNumber: args.employeeNumber,
      department: args.department,
      role: args.role,

      status: "PENDING",

      createdAt: Date.now(),
    });

    // -------------------------------------------------
    // Return command information
    // -------------------------------------------------

    return {
      success: true,

      commandId,

      fingerprintId: args.fingerprintId,

      message: "Fingerprint enrollment command created",
    };
  },
});

// =====================================================
// Update staff data (name, number, department, role, active)
//
// Pure data edit — no ESP32 round trip needed, since the
// fingerprint template on the sensor is untouched.
// =====================================================

export const updateFingerprintUser = mutation({
  args: {
    id: v.id("fingerprintUsers"),
    fullName: v.string(),
    employeeNumber: v.string(),
    department: v.optional(v.string()),
    role: v.optional(v.string()),
    active: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (!user) {
      throw new Error("Staff member not found");
    }

    // -------------------------------------------------
    // Check employee number isn't taken by someone else
    // -------------------------------------------------

    const existingEmployee = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_employeeNumber", (q) =>
        q.eq("employeeNumber", args.employeeNumber),
      )
      .unique();

    if (existingEmployee && existingEmployee._id !== args.id) {
      throw new Error(`Employee number ${args.employeeNumber} already exists`);
    }

    await ctx.db.patch(args.id, {
      fullName: args.fullName,
      employeeNumber: args.employeeNumber,
      department: args.department,
      role: args.role,
      active: args.active,
    });

    return { success: true };
  },
});