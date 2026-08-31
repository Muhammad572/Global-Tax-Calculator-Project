/**
 * Time card / timesheet: multiple day rows with breaks and overnight shifts,
 * rolled up to a week with an overtime split and optional gross pay.
 *
 * All inputs are strings/loose numbers as they arrive from a form; this module
 * validates them and returns a fully itemized result plus a list of
 * `CalcIssue`s the UI renders inline. It never throws for bad input.
 */

import { type CalcIssue, issue } from "./errors.js";
import { type Cents, multiplyCents, toCents } from "./money.js";
import {
  MINUTES_PER_HOUR,
  minutesToDecimalHours,
  parseTimeOfDay,
  roundMinutes,
  spanMinutes,
} from "./time.js";
import {
  type OvertimeConfig,
  computeOvertimePay,
  computeOvertimeSplit,
} from "./overtime.js";

export interface TimeCardDayInput {
  /** Free label, e.g. "Mon" or a date. Optional. */
  label?: string;
  /** Clock-in, any format {@link parseTimeOfDay} accepts. Empty = skipped day. */
  start?: string;
  /** Clock-out. */
  end?: string;
  /** Unpaid break in minutes (lunch). Default 0. Accepts number or numeric string. */
  unpaidBreakMinutes?: number | string;
  /** Paid break in minutes (counts toward paid time but not "worked at desk"). Default 0. */
  paidBreakMinutes?: number | string;
}

export interface TimeCardConfig {
  /** Hourly rate in dollars (not cents) as entered by the user. Omit to skip pay. */
  hourlyRate?: number | string;
  overtime?: OvertimeConfig;
  /** Round each day's worked minutes to this increment (e.g. 6 or 15). Default 0 = no rounding. */
  roundToMinutes?: number;
  /** 12h/24h — only affects formatting hints returned for the UI. Default "12h". */
  clock?: "12h" | "24h";
}

export interface TimeCardDayResult {
  label: string;
  index: number;
  skipped: boolean;
  startMinutes: number | null;
  endMinutes: number | null;
  crossedMidnight: boolean;
  rawMinutes: number;
  unpaidBreakMinutes: number;
  paidBreakMinutes: number;
  /** rawMinutes - unpaidBreak, after rounding, floored at 0. */
  workedMinutes: number;
  workedHours: number;
  issues: CalcIssue[];
}

export interface TimeCardResult {
  days: TimeCardDayResult[];
  totalWorkedMinutes: number;
  totalWorkedHours: number;
  regularMinutes: number;
  overtimeMinutes: number;
  doubleTimeMinutes: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  hourlyRateCents: Cents | null;
  regularPayCents: Cents | null;
  overtimePayCents: Cents | null;
  doubleTimePayCents: Cents | null;
  grossPayCents: Cents | null;
  overtimeNotes: string[];
  issues: CalcIssue[];
  hasBlockingIssue: boolean;
}

function toMinutesNumber(v: number | string | undefined): { value: number; bad: boolean } {
  if (v === undefined || v === "" || v === null) return { value: 0, bad: false };
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return { value: 0, bad: true };
  return { value: n, bad: false };
}

function computeDay(input: TimeCardDayInput, index: number, config: TimeCardConfig): TimeCardDayResult {
  const label = input.label?.trim() || `Day ${index + 1}`;
  const issues: CalcIssue[] = [];
  const startStr = (input.start ?? "").trim();
  const endStr = (input.end ?? "").trim();

  const base: TimeCardDayResult = {
    label,
    index,
    skipped: false,
    startMinutes: null,
    endMinutes: null,
    crossedMidnight: false,
    rawMinutes: 0,
    unpaidBreakMinutes: 0,
    paidBreakMinutes: 0,
    workedMinutes: 0,
    workedHours: 0,
    issues,
  };

  if (startStr === "" && endStr === "") {
    return { ...base, skipped: true };
  }

  const parsedStart = parseTimeOfDay(startStr);
  const parsedEnd = parseTimeOfDay(endStr);
  if (!parsedStart.ok) {
    issues.push(issue(startStr === "" ? "REQUIRED" : "UNPARSEABLE_TIME", `${label}: enter a valid start time (e.g. 9:00 AM).`, `days.${index}.start`));
  }
  if (!parsedEnd.ok) {
    issues.push(issue(endStr === "" ? "REQUIRED" : "UNPARSEABLE_TIME", `${label}: enter a valid end time (e.g. 5:30 PM).`, `days.${index}.end`));
  }

  const unpaid = toMinutesNumber(input.unpaidBreakMinutes);
  const paid = toMinutesNumber(input.paidBreakMinutes);
  if (unpaid.bad) issues.push(issue("NOT_A_NUMBER", `${label}: unpaid break must be a number of minutes.`, `days.${index}.unpaidBreakMinutes`));
  if (paid.bad) issues.push(issue("NOT_A_NUMBER", `${label}: paid break must be a number of minutes.`, `days.${index}.paidBreakMinutes`));
  if (!unpaid.bad && unpaid.value < 0) issues.push(issue("NEGATIVE", `${label}: unpaid break cannot be negative.`, `days.${index}.unpaidBreakMinutes`));
  if (!paid.bad && paid.value < 0) issues.push(issue("NEGATIVE", `${label}: paid break cannot be negative.`, `days.${index}.paidBreakMinutes`));

  const unpaidBreakMinutes = unpaid.bad ? 0 : Math.max(0, Math.round(unpaid.value));
  const paidBreakMinutes = paid.bad ? 0 : Math.max(0, Math.round(paid.value));

  if (!parsedStart.ok || !parsedEnd.ok) {
    return { ...base, unpaidBreakMinutes, paidBreakMinutes };
  }

  const span = spanMinutes(parsedStart.minutes, parsedEnd.minutes, { allowOvernight: true });
  let rawMinutes = span.minutes;
  if (rawMinutes === 0) {
    issues.push(issue("INCONSISTENT_INPUT", `${label}: start and end time are the same — that's a zero-length shift.`, `days.${index}.end`));
  }

  if (unpaidBreakMinutes >= rawMinutes && rawMinutes > 0) {
    issues.push(issue("BREAK_EXCEEDS_SHIFT", `${label}: the unpaid break (${unpaidBreakMinutes} min) is longer than the shift (${rawMinutes} min).`, `days.${index}.unpaidBreakMinutes`));
  }

  let workedMinutes = Math.max(0, rawMinutes - unpaidBreakMinutes);
  const round = config.roundToMinutes ?? 0;
  if (round > 1) workedMinutes = roundMinutes(workedMinutes, round);

  return {
    label,
    index,
    skipped: false,
    startMinutes: parsedStart.minutes,
    endMinutes: parsedEnd.minutes,
    crossedMidnight: span.crossedMidnight,
    rawMinutes,
    unpaidBreakMinutes,
    paidBreakMinutes,
    workedMinutes,
    workedHours: minutesToDecimalHours(workedMinutes),
    issues,
  };
}

/** Compute a full time card. `now` is unused — kept for signature symmetry with dated engines. */
export function computeTimeCard(days: readonly TimeCardDayInput[], config: TimeCardConfig = {}): TimeCardResult {
  const dayResults = days.map((d, i) => computeDay(d, i, config));
  const active = dayResults.filter((d) => !d.skipped);
  const allIssues = dayResults.flatMap((d) => d.issues);

  const totalWorkedMinutes = active.reduce((sum, d) => sum + d.workedMinutes, 0);

  // Rate
  let hourlyRateCents: Cents | null = null;
  if (config.hourlyRate !== undefined && config.hourlyRate !== "") {
    const rate = typeof config.hourlyRate === "number" ? config.hourlyRate : Number(String(config.hourlyRate).trim());
    if (!Number.isFinite(rate)) {
      allIssues.push(issue("NOT_A_NUMBER", "Hourly rate must be a number.", "hourlyRate"));
    } else if (rate < 0) {
      allIssues.push(issue("NEGATIVE", "Hourly rate cannot be negative.", "hourlyRate"));
    } else {
      hourlyRateCents = toCents(rate);
    }
  }

  // Overtime split
  const otConfig: OvertimeConfig = config.overtime ?? { jurisdiction: "us-flsa" };
  const perDayMinutes = active.map((d) => d.workedMinutes);
  const split = computeOvertimeSplit(totalWorkedMinutes, otConfig, perDayMinutes);

  // Pay
  let regularPayCents: Cents | null = null;
  let overtimePayCents: Cents | null = null;
  let doubleTimePayCents: Cents | null = null;
  let grossPayCents: Cents | null = null;
  if (hourlyRateCents !== null) {
    const pay = computeOvertimePay({
      regularMinutes: split.regularMinutes,
      overtimeMinutes: split.overtimeMinutes,
      doubleTimeMinutes: split.doubleTimeMinutes,
      hourlyRateCents,
      multiplier: split.multiplier,
      doubleMultiplier: split.doubleMultiplier,
    });
    regularPayCents = pay.regularPayCents;
    overtimePayCents = pay.overtimePayCents;
    doubleTimePayCents = pay.doubleTimePayCents;
    grossPayCents = pay.grossPayCents;
  }

  const blocking = allIssues.some((i) => i.code === "REQUIRED" || i.code === "UNPARSEABLE_TIME" || i.code === "NOT_A_NUMBER");

  return {
    days: dayResults,
    totalWorkedMinutes,
    totalWorkedHours: minutesToDecimalHours(totalWorkedMinutes),
    regularMinutes: split.regularMinutes,
    overtimeMinutes: split.overtimeMinutes,
    doubleTimeMinutes: split.doubleTimeMinutes,
    regularHours: minutesToDecimalHours(split.regularMinutes),
    overtimeHours: minutesToDecimalHours(split.overtimeMinutes),
    doubleTimeHours: minutesToDecimalHours(split.doubleTimeMinutes),
    hourlyRateCents,
    regularPayCents,
    overtimePayCents,
    doubleTimePayCents,
    grossPayCents,
    overtimeNotes: split.notes,
    issues: allIssues,
    hasBlockingIssue: blocking,
  };
}

/** Convenience: a single worked span (Hours Worked Calculator) — one day, optional rate. */
export function computeSingleSpan(params: {
  start: string;
  end: string;
  unpaidBreakMinutes?: number | string;
  hourlyRate?: number | string;
}): {
  workedMinutes: number;
  workedHours: number;
  rawMinutes: number;
  crossedMidnight: boolean;
  payCents: Cents | null;
  issues: CalcIssue[];
} {
  const dayInput: TimeCardDayInput = { start: params.start, end: params.end };
  if (params.unpaidBreakMinutes !== undefined) dayInput.unpaidBreakMinutes = params.unpaidBreakMinutes;
  const config: TimeCardConfig = {};
  if (params.hourlyRate !== undefined) config.hourlyRate = params.hourlyRate;
  const card = computeTimeCard([dayInput], config);
  const day = card.days[0]!;
  return {
    workedMinutes: card.totalWorkedMinutes,
    workedHours: card.totalWorkedHours,
    rawMinutes: day.rawMinutes,
    crossedMidnight: day.crossedMidnight,
    payCents: card.hourlyRateCents !== null ? multiplyCents(card.hourlyRateCents, card.totalWorkedMinutes / MINUTES_PER_HOUR) : null,
    issues: card.issues,
  };
}
