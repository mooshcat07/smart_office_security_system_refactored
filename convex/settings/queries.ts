import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_HOURS,
  catDateKey,
  resolveSchedule,
  isAfterHoursForSchedule,
} from "./helpers";

/** Current default weekday/weekend hours. */
export const getWorkingHoursSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("workingHoursSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();

    if (!row) {
      return {
        ...DEFAULT_HOURS,
        exists: false as const,
      };
    }
    return {
      weekdayStart: row.weekdayStart,
      weekdayEnd: row.weekdayEnd,
      weekendStart: row.weekendStart,
      weekendEnd: row.weekendEnd,
      exists: true as const,
    };
  },
});

/** All date overrides, newest date first. */
export const getDateOverrides = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("dateOverrides").collect();
    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return rows.map((r) => ({
      id: r._id,
      date: r.date,
      closed: r.closed,
      start: r.start ?? null,
      end: r.end ?? null,
      label: r.label ?? null,
    }));
  },
});

/** Override for a single date (YYYY-MM-DD), if any. */
export const getOverrideForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("dateOverrides")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
    if (!row) return null;
    return {
      id: row._id,
      date: row.date,
      closed: row.closed,
      start: row.start ?? null,
      end: row.end ?? null,
      label: row.label ?? null,
    };
  },
});

/**
 * Preview: for "now" (or a given timestamp), what schedule applies and
 * whether we are currently after hours.
 */
export const getCurrentScheduleStatus = query({
  args: { at: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const ts = args.at ?? Date.now();

    const settingsRow = await ctx.db
      .query("workingHoursSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();

    const defaults = settingsRow
      ? {
          weekdayStart: settingsRow.weekdayStart,
          weekdayEnd: settingsRow.weekdayEnd,
          weekendStart: settingsRow.weekendStart,
          weekendEnd: settingsRow.weekendEnd,
        }
      : DEFAULT_HOURS;

    const date = catDateKey(ts);
    const override = await ctx.db
      .query("dateOverrides")
      .withIndex("by_date", (q) => q.eq("date", date))
      .unique();

    const schedule = resolveSchedule(
      ts,
      defaults,
      override
        ? {
            closed: override.closed,
            start: override.start,
            end: override.end,
            label: override.label,
          }
        : null,
    );

    return {
      date,
      schedule,
      afterHours: isAfterHoursForSchedule(ts, schedule),
      defaults,
    };
  },
});
