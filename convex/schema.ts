import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ESP32 devices registered in the system
  devices: defineTable({
    esp32Id: v.string(),
    name: v.string(),
    location: v.string(),
    status: v.union(v.literal("ONLINE"), v.literal("OFFLINE")),
    lastSeen: v.number(), // Date.now() timestamp
    firmware: v.optional(v.string()),
    fingerprintConnected: v.boolean(),
    fingerprintTemplateCount: v.number(),
  }).index("by_esp32Id", ["esp32Id"]),

  // Fingerprint-registered employees
  fingerprintUsers: defineTable({
    fingerprintId: v.number(), // ID stored on sensor (1–127)
    fullName: v.string(),
    employeeNumber: v.string(),
    department: v.optional(v.string()),
    role: v.optional(v.string()),
    active: v.boolean(),
  })
    .index("by_fingerprintId", ["fingerprintId"])
    .index("by_employeeNumber", ["employeeNumber"]),

  // Fingerprint scan events
  accessLogs: defineTable({
    deviceId: v.id("devices"),
    esp32Id: v.string(),
    fingerprintId: v.optional(v.number()), // null if unrecognised
    employeeName: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    status: v.union(v.literal("GRANTED"), v.literal("DENIED")),
  })
    .index("by_device", ["deviceId"])
    .index("by_status", ["status"]),

  // PIR motion detection events
  motionEvents: defineTable({
    deviceId: v.id("devices"),
    esp32Id: v.string(),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_device", ["deviceId"])
    .index("by_resolved", ["resolved"]),

  // Alarm events — triggered from motion events
  alarmEvents: defineTable({
    motionEventId: v.optional(v.id("motionEvents")),
    deviceId: v.id("devices"),
    esp32Id: v.string(),
    reason: v.string(),
    severity: v.union(v.literal("HIGH"), v.literal("MEDIUM"), v.literal("LOW")),
    status: v.union(v.literal("ACTIVE"), v.literal("RESOLVED")),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()), // Prisma User id
  })
    .index("by_device", ["deviceId"])
    .index("by_status", ["status"]),

  // Device commands — sent from dashboard to ESP32
  deviceCommands: defineTable({
    deviceId: v.id("devices"),
    esp32Id: v.string(),
    command: v.union(
      v.literal("TRIGGER_BUZZER"),
      v.literal("SILENCE_BUZZER"),
      v.literal("ENROLL_FINGERPRINT"),
      v.literal("DELETE_FINGERPRINT"),
    ),
    durationMs: v.optional(v.number()),
    fingerprintId: v.optional(v.number()),
    fullName: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    department: v.optional(v.string()),
    role: v.optional(v.string()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACKNOWLEDGED"),
      v.literal("FAILED"),
    ),
    createdAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_device_status", ["deviceId", "status"])
    .index("by_esp32_status", ["esp32Id", "status"]),
});
