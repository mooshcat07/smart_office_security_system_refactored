import { v } from "convex/values"
import { query, mutation, internalMutation, internalQuery } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"

const commandValidator = v.union(v.literal("TRIGGER_BUZZER"), v.literal("SILENCE_BUZZER"))
const statusValidator = v.union(v.literal("PENDING"), v.literal("ACKNOWLEDGED"), v.literal("FAILED"))

/** Public: trigger the buzzer from the dashboard. */
export const triggerBuzzer = mutation({
  args: {
    deviceId: v.id("devices"),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId)
    if (!device) {
      throw new Error(`Device not found: ${args.deviceId}`)
    }

    const commandId = await ctx.db.insert("deviceCommands", {
      deviceId: args.deviceId,
      esp32Id: device.esp32Id,
      command: "TRIGGER_BUZZER",
      durationMs: args.durationMs || 2000,
      status: "PENDING",
      createdAt: Date.now(),
    })

    return commandId
  },
})

/** Public: silence the buzzer from the dashboard. */
export const silenceBuzzer = mutation({
  args: {
    deviceId: v.id("devices"),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId)
    if (!device) {
      throw new Error(`Device not found: ${args.deviceId}`)
    }

    const commandId = await ctx.db.insert("deviceCommands", {
      deviceId: args.deviceId,
      esp32Id: device.esp32Id,
      command: "SILENCE_BUZZER",
      status: "PENDING",
      createdAt: Date.now(),
    })

    return commandId
  },
})

/** Internal: get all pending commands for a specific ESP32. */
export const getPendingForDevice = internalQuery({
  args: { esp32Id: v.string() },
  handler: async (ctx, args): Promise<Doc<"deviceCommands">[]> => {
    return await ctx.db
      .query("deviceCommands")
      .withIndex("by_esp32_status", (q) => q.eq("esp32Id", args.esp32Id).eq("status", "PENDING"))
      .order("asc")
      .take(10)
  },
})

/** Internal: acknowledge a command from the ESP32. */
export const acknowledge = internalMutation({
  args: {
    commandId: v.id("deviceCommands"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("deviceCommands", args.commandId, {
      status: "ACKNOWLEDGED",
      acknowledgedAt: Date.now(),
    })
    return null
  },
})

/** Internal: mark a command as failed. */
export const markFailed = internalMutation({
  args: {
    commandId: v.id("deviceCommands"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("deviceCommands", args.commandId, {
      status: "FAILED",
      failureReason: args.reason,
    })
    return null
  },
})

/** Public: list recent commands for a device. */
export const listByDevice = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deviceCommands")
      .withIndex("by_device_status", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(50)
  },
})

/** Public: get a single command by ID. */
export const get = query({
  args: { commandId: v.id("deviceCommands") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.commandId)
  },
})
