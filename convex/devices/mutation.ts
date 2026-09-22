import { mutation } from "../_generated/server";
import { v } from "convex/values";

// ==========================================
// REGISTER DEVICE
// ==========================================

export const registerDevice = mutation({
  args: {
    esp32Id: v.string(),
    name: v.string(),
    location: v.string(),
    firmware: v.optional(v.string()),

    // Fingerprint sensor status
    fingerprintConnected: v.boolean(),
    fingerprintTemplateCount: v.number(),
  },

  handler: async (ctx, args) => {
    // Check if device already exists
    const existingDevice = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique();

    if (existingDevice) {
      throw new Error(`Device ${args.esp32Id} already exists`);
    }

    // Create device
    const deviceId = await ctx.db.insert("devices", {
      esp32Id: args.esp32Id,
      name: args.name,
      location: args.location,

      status: "OFFLINE",

      lastSeen: Date.now(),

      firmware: args.firmware,

      fingerprintConnected: args.fingerprintConnected,

      fingerprintTemplateCount: args.fingerprintTemplateCount,
    });

    return {
      success: true,
      deviceId,
    };
  },
});

// ==========================================
// UPDATE DEVICE STATUS
// ==========================================

export const updateDeviceStatus = mutation({
  args: {
    esp32Id: v.string(),
    firmware: v.optional(v.string()),

    // Fingerprint sensor status
    fingerprintConnected: v.boolean(),
    fingerprintTemplateCount: v.number(),
  },

  handler: async (ctx, args) => {
    // Find the device
    const device = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique();

    if (!device) {
      throw new Error(`Device ${args.esp32Id} is not registered`);
    }

    // Update device and component status
    await ctx.db.patch(device._id, {
      status: "ONLINE",

      lastSeen: Date.now(),

      ...(args.firmware !== undefined && {
        firmware: args.firmware,
      }),

      fingerprintConnected: args.fingerprintConnected,

      fingerprintTemplateCount: args.fingerprintTemplateCount,
    });

    return {
      success: true,
      deviceId: device._id,
      fingerprintConnected: args.fingerprintConnected,
      fingerprintTemplateCount: args.fingerprintTemplateCount,
    };
  },
});
