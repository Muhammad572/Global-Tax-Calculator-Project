/**
 * Time-of-day parsing/formatting and duration math.
 *
 * Conventions:
 *  - A *time of day* is minutes since local midnight, an integer in `0..1439`.
 *  - A *duration* is a signed integer number of minutes and may exceed 24h.
 *  - Nothing here touches `Date` or the system clock; callers pass everything in.
 */

export type MinutesOfDay = number; // 0..1439
export type DurationMinutes = number; // signed, unbounded

export const MINUTES_PER_DAY = 1440;
export const MINUTES_PER_HOUR = 60;

/** Result of {@link parseTimeOfDay}. */
export type ParsedTime =
  | { ok: true; minutes: MinutesOfDay }
  | { ok: false; reason: "empty" | "format" | "range" };

const TIME_RE =
  /^\s*(\d{1,2})\s*(?::\s*(\d{2}))?\s*(?::\s*(\d{2}))?\s*([ap]\.?m\.?)?\s*$/i;
const COMPACT_RE = /^\s*(\d{3,4})\s*([ap]\.?m\.?)?\s*$/i;

/**
 * Parse a human time-of-day string. Accepts, case-insensitively:
 *   `9`, `9:30`, `09:30`, `9:30 AM`, `9:30am`, `9.30pm` (dot as separator),
 *   `0930`, `1745`, `17:45`, `12am` (midnight -> 0), `12pm` (noon -> 720),
 *   `24:00` / `2400` (-> 0, end-of-day).
 * Rejects anything else. Never throws.
 */
export function parseTimeOfDay(input: string): ParsedTime {
  if (input == null || String(input).trim() === "") return { ok: false, reason: "empty" };
  const raw = String(input).trim().replace(/\./g, (m, i, s) => (/\d\.\d/.test(s.slice(i - 1, i + 2)) ? ":" : ""));

  let hours: number;
  let minutes = 0;
  let meridiem: string | undefined;

  const compact = COMPACT_RE.exec(raw);
  if (compact) {
    const digits = compact[1]!;
    hours = Number(digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2));
    minutes = Number(digits.slice(-2));
    meridiem = compact[2];
  } else {
    const m = TIME_RE.exec(raw);
    if (!m) return { ok: false, reason: "format" };
    hours = Number(m[1]);
    minutes = m[2] ? Number(m[2]) : 0;
    meridiem = m[4];
  }

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return { ok: false, reason: "format" };
  if (minutes > 59) return { ok: false, reason: "range" };

  if (meridiem) {
    const pm = /^p/i.test(meridiem);
    if (hours < 1 || hours > 12) return { ok: false, reason: "range" };
    if (hours === 12) hours = pm ? 12 : 0;
    else if (pm) hours += 12;
  } else {
    // 24:00 / 2400 is a legal "end of day" spelling of midnight.
    if (hours === 24 && minutes === 0) return { ok: true, minutes: 0 };
    if (hours > 23) return { ok: false, reason: "range" };
  }

  return { ok: true, minutes: hours * 60 + minutes };
}

export interface FormatTimeOptions {
  /** `"12h"` -> `9:05 AM`; `"24h"` -> `09:05`. Default `"12h"`. */
  clock?: "12h" | "24h";
  /** Include a space before AM/PM in 12h mode. Default `true`. */
  spaceBeforeMeridiem?: boolean;
}

/** Format minutes-of-day (`0..1439`) as a clock string. */
export function formatTimeOfDay(minutesOfDay: MinutesOfDay, options: FormatTimeOptions = {}): string {
  const { clock = "12h", spaceBeforeMeridiem = true } = options;
  const norm = ((Math.round(minutesOfDay) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const mm = String(m).padStart(2, "0");
  if (clock === "24h") return `${String(h24).padStart(2, "0")}:${mm}`;
  const meridiem = h24 < 12 ? "AM" : "PM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mm}${spaceBeforeMeridiem ? " " : ""}${meridiem}`;
}

export interface FormatDurationOptions {
  /**
   *  - `"hm"`      -> `8h 30m` (or `8h`, `30m`, `0m`)
   *  - `"hm-long"` -> `8 hours 30 minutes`
   *  - `"clock"`   -> `8:30`
   *  - `"decimal"` -> `8.50`
   * Default `"hm"`.
   */
  style?: "hm" | "hm-long" | "clock" | "decimal";
  /** Decimal places for `"decimal"`. Default `2`. */
  decimals?: number;
}

/** Format a signed duration in minutes. */
export function formatDuration(totalMinutes: DurationMinutes, options: FormatDurationOptions = {}): string {
  const { style = "hm", decimals = 2 } = options;
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;

  switch (style) {
    case "decimal":
      return `${sign}${(abs / 60).toFixed(decimals)}`;
    case "clock":
      return `${sign}${h}:${String(m).padStart(2, "0")}`;
    case "hm-long": {
      const parts: string[] = [];
      if (h) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
      if (m || !h) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
      return sign + parts.join(" ");
    }
    case "hm":
    default: {
      if (!h && !m) return "0m";
      const parts: string[] = [];
      if (h) parts.push(`${h}h`);
      if (m) parts.push(`${m}m`);
      return sign + parts.join(" ");
    }
  }
}

/** Minutes -> decimal hours, rounded to `decimals` places (default 2). `450` -> `7.5`. */
export function minutesToDecimalHours(minutes: DurationMinutes, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((minutes / 60) * factor) / factor;
}

/** Decimal hours -> whole minutes. `7.75` -> `465`. */
export function decimalHoursToMinutes(hours: number): DurationMinutes {
  return Math.round(hours * 60);
}

export interface SpanOptions {
  /**
   * When the end time is at or before the start time, treat the shift as
   * crossing midnight and add 24h. Default `true`.
   */
  allowOvernight?: boolean;
}

export interface SpanResult {
  /** Elapsed minutes between the two times (before any break deduction). */
  minutes: DurationMinutes;
  /** True when 24h was added because the shift crossed midnight. */
  crossedMidnight: boolean;
}

/**
 * Elapsed minutes from `startOfDay` to `endOfDay` (both minutes-of-day).
 * With `allowOvernight` (default), an end <= start rolls into the next day.
 * Without it, an end <= start yields `0` and `crossedMidnight: false`
 * (callers that want an error should check `endOfDay <= startOfDay` themselves).
 */
export function spanMinutes(
  startOfDay: MinutesOfDay,
  endOfDay: MinutesOfDay,
  options: SpanOptions = {},
): SpanResult {
  const { allowOvernight = true } = options;
  let end = endOfDay;
  let crossedMidnight = false;
  if (end <= startOfDay) {
    if (allowOvernight && end !== startOfDay) {
      end += MINUTES_PER_DAY;
      crossedMidnight = true;
    } else {
      return { minutes: end === startOfDay ? 0 : 0, crossedMidnight: false };
    }
  }
  return { minutes: end - startOfDay, crossedMidnight };
}

/** Round a duration to the nearest `increment` minutes (payroll rounding, e.g. 6 or 15). */
export function roundMinutes(minutes: DurationMinutes, increment: number): DurationMinutes {
  if (increment <= 1) return Math.round(minutes);
  return Math.round(minutes / increment) * increment;
}

export type TimeOp = "+" | "-";

/** Add/subtract a sequence of `{op, hours, minutes}` terms. Powers the Time Calculator. */
export function accumulateDuration(
  terms: readonly { op: TimeOp; hours?: number; minutes?: number; seconds?: number }[],
): { totalSeconds: number; totalMinutes: number } {
  let seconds = 0;
  for (const t of terms) {
    const termSeconds = (t.hours ?? 0) * 3600 + (t.minutes ?? 0) * 60 + (t.seconds ?? 0);
    seconds += t.op === "-" ? -termSeconds : termSeconds;
  }
  return { totalSeconds: seconds, totalMinutes: seconds / 60 };
}
