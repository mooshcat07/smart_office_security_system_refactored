import { query } from "../_generated/server";
import { v } from "convex/values";

// Malawi (CAT) is UTC+2 with no daylight saving.
const CAT_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function catDayKey(timestamp: number) {
  return new Date(timestamp + CAT_OFFSET_MS).toISOString().slice(0, 10);
}

export const getAllAccessLogs = query({
  args: {},

  handler: async (ctx) => {
    const logs = await ctx.db
      .query("accessLogs")
      .order("desc")
      .collect();

    const result = [];

    for (const log of logs) {
      const device = await ctx.db.get(log.deviceId);

      result.push({
        id: log._id,
        employeeName: log.employeeName ?? "Unknown",
        employeeNumber: log.employeeNumber ?? null,
        device: device?.name ?? log.esp32Id,
        location: device?.location ?? "Unknown",
        status: log.status,
        direction: log.direction ?? null,
        durationMs: log.durationMs ?? null,
        denyReason: log.denyReason ?? null,
        timestamp: new Date(log._creationTime).toISOString(),
      });
    }

    return result;
  },
});

// =====================================================
// Attendance summary
//
// One entry per day (CAT) in the window, each with the people
// who were on site that day, so the chart can drive a table.
// =====================================================

type PersonDay = {
  fingerprintId: number;
  name: string;
  employeeNumber: string | null;
  visits: number;
  firstEntry: number | null;
  lastExit: number | null;
  totalMs: number;
  stillInside: boolean;
};

export const getAttendanceSummary = query({
  args: { days: v.number() },

  handler: async (ctx, args) => {
    const days = Math.min(Math.max(Math.floor(args.days), 1), 90);

    const now = Date.now();
    const todayKey = catDayKey(now);

    // Start of the first day in the window, in real (UTC) ms
    const todayStartCat =
      Math.floor((now + CAT_OFFSET_MS) / DAY_MS) * DAY_MS - CAT_OFFSET_MS;
    const windowStart = todayStartCat - (days - 1) * DAY_MS;

    const logs = await ctx.db
      .query("accessLogs")
      .withIndex("by_creation_time", (q) =>
        q.gte("_creationTime", windowStart),
      )
      .collect();

    // Only completed-direction GRANTED scans, oldest first
    const events = logs
      .filter(
        (log) =>
          log.status === "GRANTED" &&
          log.direction !== undefined &&
          log.fingerprintId !== undefined,
      )
      .sort((a, b) => a._creationTime - b._creationTime);

    // day -> fingerprintId -> PersonDay
    const byDay = new Map<string, Map<number, PersonDay>>();

    for (const log of events) {
      const dayKey = catDayKey(log._creationTime);
      const fingerprintId = log.fingerprintId!;

      let people = byDay.get(dayKey);
      if (!people) {
        people = new Map();
        byDay.set(dayKey, people);
      }

      let person = people.get(fingerprintId);
      if (!person) {
        person = {
          fingerprintId,
          name: log.employeeName ?? "Unknown",
          employeeNumber: log.employeeNumber ?? null,
          visits: 0,
          firstEntry: null,
          lastExit: null,
          totalMs: 0,
          stillInside: false,
        };
        people.set(fingerprintId, person);
      }

      if (log.direction === "ENTRY") {
        person.visits += 1;
        person.firstEntry ??= log._creationTime;
        person.stillInside = true;
      } else {
        person.lastExit = log._creationTime;
        person.totalMs += log.durationMs ?? 0;
        person.stillInside = false;
      }
    }

    // Build every day in the window (including empty days)
    const result = [];

    for (let i = 0; i < days; i++) {
      const dayStart = windowStart + i * DAY_MS;
      const dayKey = catDayKey(dayStart);
      const people = Array.from(byDay.get(dayKey)?.values() ?? []);

      const totalMs = people.reduce((sum, p) => sum + p.totalMs, 0);

      result.push({
        date: dayKey,
        isToday: dayKey === todayKey,
        totalHours: Math.round((totalMs / 3_600_000) * 100) / 100,
        totalMs,
        visits: people.reduce((sum, p) => sum + p.visits, 0),
        peopleCount: people.length,
        people: people
          .sort((a, b) => (a.firstEntry ?? 0) - (b.firstEntry ?? 0))
          .map((p) => ({
            fingerprintId: p.fingerprintId,
            name: p.name,
            employeeNumber: p.employeeNumber,
            visits: p.visits,
            firstEntry: p.firstEntry
              ? new Date(p.firstEntry).toISOString()
              : null,
            lastExit: p.lastExit
              ? new Date(p.lastExit).toISOString()
              : null,
            totalMs: p.totalMs,
            // "Inside" only means something for today
            stillInside: p.stillInside && dayKey === todayKey,
          })),
      });
    }

    const todayPeople = result[result.length - 1]?.people ?? [];

    return {
      days: result,
      currentlyInside: todayPeople.filter((p) => p.stillInside).length,
    };
  },
});
