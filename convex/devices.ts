import { v } from "convex/values"
import { query, internalMutation, internalQuery } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"

// How long without a heartbeat before we consider a device offline.
const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

/** Public: list all devices for the dashboard, computing a live online/offline status. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("devices").order("desc").take(200)
    const now = Date.now()
    return devices.map((d) => ({
      ...d,
      status:
        now - d.lastSeen > OFFLINE_THRESHOLD_MS ? ("OFFLINE" as const) : d.status,
    }))
  },
})

/** Internal: look up a device by its ESP32 hardware id. */
export const getByEsp32Id = internalQuery({
  args: { esp32Id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique()
  },
})

/**
 * Internal: register (or re-register) a device. Called when an ESP32 boots up.
 * Upserts by esp32Id so re-flashing/rebooting a device never creates a duplicate.
 */
export const register = internalMutation({
  args: {
    esp32Id: v.string(),
    name: v.string(),
    location: v.string(),
    firmware: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"devices">> => {
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique()

    if (existing) {
      await ctx.db.patch("devices", existing._id, {
        name: args.name,
        location: args.location,
        firmware: args.firmware,
        status: "ONLINE",
        lastSeen: Date.now(),
      })
      return existing._id
    }

    return await ctx.db.insert("devices", {
      esp32Id: args.esp32Id,
      name: args.name,
      location: args.location,
      firmware: args.firmware,
      status: "ONLINE",
      lastSeen: Date.now(),
    })
  },
})

/**
 * Internal: heartbeat ping. If the device hasn't registered yet, upserts a
 * placeholder record so a stray heartbeat never gets silently dropped.
 */
export const heartbeat = internalMutation({
  args: {
    esp32Id: v.string(),
    firmware: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"devices">> => {
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_esp32Id", (q) => q.eq("esp32Id", args.esp32Id))
      .unique()

    if (!existing) {
      return await ctx.db.insert("devices", {
        esp32Id: args.esp32Id,
        name: args.esp32Id,
        location: "Unassigned",
        firmware: args.firmware,
        status: "ONLINE",
        lastSeen: Date.now(),
      })
    }

    await ctx.db.patch("devices", existing._id, {
      status: "ONLINE",
      lastSeen: Date.now(),
      ...(args.firmware ? { firmware: args.firmware } : {}),
    })
    return existing._id
  },
})

/** Internal: mark a single device offline. */
export const setOffline = internalMutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    await ctx.db.patch("devices", args.deviceId, { status: "OFFLINE" })
    return null
  },
})

/**
 * Internal: sweep every device and flip any that have gone quiet past the
 * threshold to OFFLINE. Intended to be run on a schedule (see crons.ts).
 */
export const sweepStaleDevices = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - OFFLINE_THRESHOLD_MS
    const devices = await ctx.db.query("devices").take(500)
    let flipped = 0
    for (const d of devices) {
      if (d.status === "ONLINE" && d.lastSeen < cutoff) {
        await ctx.db.patch("devices", d._id, { status: "OFFLINE" })
        flipped++
      }
    }
    return { checked: devices.length, flipped }
  },
})