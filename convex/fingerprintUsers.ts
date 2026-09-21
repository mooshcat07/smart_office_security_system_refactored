import { v } from "convex/values"
import { query, mutation, internalQuery } from "./_generated/server"

/** Public: list all registered employees for the Users dashboard page. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fingerprintUsers").order("desc").take(500)
  },
})

/** Internal: look up an employee by the fingerprint ID stored on the sensor (1-127). */
export const getByFingerprintId = internalQuery({
  args: { fingerprintId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) => q.eq("fingerprintId", args.fingerprintId))
      .unique()
  },
})

/** Public: register a new employee. Called from the "Add Employee" dashboard action. */
export const register = mutation({
  args: {
    fingerprintId: v.number(),
    fullName: v.string(),
    employeeNumber: v.string(),
    department: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const byFingerprint = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_fingerprintId", (q) => q.eq("fingerprintId", args.fingerprintId))
      .unique()
    if (byFingerprint) {
      throw new Error(`Fingerprint ID ${args.fingerprintId} is already registered`)
    }

    const byEmployeeNumber = await ctx.db
      .query("fingerprintUsers")
      .withIndex("by_employeeNumber", (q) => q.eq("employeeNumber", args.employeeNumber))
      .unique()
    if (byEmployeeNumber) {
      throw new Error(`Employee number ${args.employeeNumber} is already registered`)
    }

    return await ctx.db.insert("fingerprintUsers", {
      fingerprintId: args.fingerprintId,
      fullName: args.fullName,
      employeeNumber: args.employeeNumber,
      department: args.department,
      role: args.role,
      active: true,
    })
  },
})

/** Public: activate/deactivate an employee (e.g. offboarding) without deleting history. */
export const setActive = mutation({
  args: {
    userId: v.id("fingerprintUsers"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("fingerprintUsers", args.userId, { active: args.active })
    return null
  },
})