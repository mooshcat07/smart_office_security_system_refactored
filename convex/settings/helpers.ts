/**
 * Shared helpers for CAT (UTC+2) working-hours checks.
 * Used by motionEvents mutations and settings queries.
 */

export const CAT_OFFSET_MS = 2 * 60 * 60 * 1000;

export type DaySchedule = {
  start: string; // "HH:mm"
  end: string;
  closed: boolean;
  source: "override" | "weekday" | "weekend";
  label?: string;
};

export type WorkingHoursDefaults = {
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
};

/** Default schedule seeded on first use. */
export const DEFAULT_HOURS: WorkingHoursDefaults = {
  weekdayStart: "07:30",
  weekdayEnd: "18:00",
  weekendStart: "08:00",
  weekendEnd: "12:00",
};

/** "HH:mm" → minutes since midnight. */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Timestamp → CAT calendar date "YYYY-MM-DD". */
export function catDateKey(timestampMs: number): string {
  return new Date(timestampMs + CAT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Timestamp → minutes since midnight in CAT. */
export function catMinutesSinceMidnight(timestampMs: number): number {
  const d = new Date(timestampMs + CAT_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** 0 = Sunday … 6 = Saturday (CAT wall clock). */
export function catWeekday(timestampMs: number): number {
  return new Date(timestampMs + CAT_OFFSET_MS).getUTCDay();
}

export function isWeekend(weekday: number): boolean {
  return weekday === 0 || weekday === 6; // Sun or Sat
}

/**
 * Resolve the effective schedule for a given moment.
 * Priority: date override → weekday/weekend defaults.
 */
export function resolveSchedule(
  timestampMs: number,
  defaults: WorkingHoursDefaults,
  override:
    | {
        closed: boolean;
        start?: string;
        end?: string;
        label?: string;
      }
    | null,
): DaySchedule {
  if (override) {
    if (override.closed) {
      return {
        start: "00:00",
        end: "00:00",
        closed: true,
        source: "override",
        label: override.label,
      };
    }
    return {
      start: override.start ?? defaults.weekdayStart,
      end: override.end ?? defaults.weekdayEnd,
      closed: false,
      source: "override",
      label: override.label,
    };
  }

  const weekend = isWeekend(catWeekday(timestampMs));
  if (weekend) {
    return {
      start: defaults.weekendStart,
      end: defaults.weekendEnd,
      closed: false,
      source: "weekend",
    };
  }
  return {
    start: defaults.weekdayStart,
    end: defaults.weekdayEnd,
    closed: false,
    source: "weekday",
  };
}

/**
 * True when the timestamp falls outside the effective working window.
 * Closed days are always after-hours.
 */
export function isAfterHoursForSchedule(
  timestampMs: number,
  schedule: DaySchedule,
): boolean {
  if (schedule.closed) return true;
  const mins = catMinutesSinceMidnight(timestampMs);
  const start = parseTimeToMinutes(schedule.start);
  const end = parseTimeToMinutes(schedule.end);
  // Outside [start, end)
  return mins < start || mins >= end;
}
