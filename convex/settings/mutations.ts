import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { DEFAULT_HOURS } from "./helpers";

function assertTime(value: string, field: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${field} must be HH:mm`);
  }
  const [h, m] = value.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`${field} is not a valid time`);
  }
}

/** Create or update the singleton weekday/weekend defaults. */
export const upsertWorkingHoursSettings = mutation({
  args: {
    weekdayStart: v.string(),
    weekdayEnd: v.string(),
    weekendStart: v.string(),
    weekendEnd: v.string(),
  },
  handler: async (ctx, args) => {
    assertTime(args.weekdayStart, "weekdayStart");
    assertTime(args.weekdayEnd, "weekdayEnd");
    assertTime(args.weekendStart, "weekendStart");
    assertTime(args.weekendEnd, "weekendEnd");

    const existing = await ctx.db
      .query("workingHoursSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        weekdayStart: args.weekdayStart,
        weekdayEnd: args.weekdayEnd,
        weekendStart: args.weekendStart,
        weekendEnd: args.weekendEnd,
      });
      return { success: true, id: existing._id };
    }

    const id = await ctx.db.insert("workingHoursSettings", {
      key: "default",
      weekdayStart: args.weekdayStart,
      weekdayEnd: args.weekdayEnd,
      weekendStart: args.weekendStart,
      weekendEnd: args.weekendEnd,
    });
    return { success: true, id };
  },
});

/**
 * Seed defaults if the settings row does not exist yet.
 * Safe to call from the dashboard on first load.
 */
export const ensureDefaultWorkingHours = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("workingHoursSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();

    if (existing) {
      return { created: false, id: existing._id };
    }

    const id = await ctx.db.insert("workingHoursSettings", {
      key: "default",
      ...DEFAULT_HOURS,
    });
    return { created: true, id };
  },
});

/**
 * Set or update a per-date override.
 * closed=true means the whole day is treated as after-hours (e.g. public holiday).
 * When closed=false, start/end define the working window for that day.
 */
export const upsertDateOverride = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD
    closed: v.boolean(),
    start: v.optional(v.string()),
    end: v.optional(v.string()),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      throw new Error("date must be YYYY-MM-DD");
    }
    if (!args.closed) {
      if (!args.start || !args.end) {
        throw new Error("start and end are required when the day is not closed");
      }
      assertTime(args.start, "start");
      assertTime(args.end, "end");
    }

    const existing = await ctx.db
      .query("dateOverrides")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();

    const payload = {
      date: args.date,
      closed: args.closed,
      start: args.closed ? undefined : args.start,
      end: args.closed ? undefined : args.end,
      label: args.label,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { success: true, id: existing._id };
    }

    const id = await ctx.db.insert("dateOverrides", payload);
    return { success: true, id };
  },
});

/** Remove a date override (reverts that day to weekday/weekend defaults). */
export const deleteDateOverride = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dateOverrides")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
    if (!existing) {
      return { success: true, deleted: false };
    }
    await ctx.db.delete(existing._id);
    return { success: true, deleted: true };
  },
});
