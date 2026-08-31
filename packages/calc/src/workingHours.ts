/**
 * Schedule-level working-hours math: hours in a week / month / year, business
 * days, and full-time-equivalent (FTE). This is the "Working Hours Calculator"
 * engine — distinct from the time card (which totals actual clocked shifts) and
 * from Hours Worked (a single span).
 *
 * Date-based helpers take an explicit `year`/date so they stay pure.
 */

import { minutesToDecimalHours } from "./time.js";

export interface AnnualHoursInput {
  hoursPerWeek?: number;
  /** Paid weeks per year. Default 52. */
  weeksPerYear?: number;
  /** Vacation days subtracted from worked (not paid) hours. Default 0. */
  ptoDaysPerYear?: number;
  /** Public holidays subtracted from worked hours. Default 0. */
  holidayDaysPerYear?: number;
  /** Hours in a standard workday, for converting PTO days to hours. Default hoursPerWeek/5. */
  hoursPerWorkday?: number;
}

export interface AnnualHoursResult {
  hoursPerWeek: number;
  hoursPerWorkday: number;
  /** hoursPerWeek * weeksPerYear — the "paid" figure. */
  scheduledHoursPerYear: number;
  scheduledHoursPerMonth: number;
  /** After PTO + holidays removed. */
  workedHoursPerYear: number;
  ptoHoursPerYear: number;
  notes: string[];
}

export function annualWorkingHours(input: AnnualHoursInput = {}): AnnualHoursResult {
  const hoursPerWeek = input.hoursPerWeek && input.hoursPerWeek > 0 ? input.hoursPerWeek : 40;
  const weeksPerYear = input.weeksPerYear && input.weeksPerYear > 0 ? input.weeksPerYear : 52;
  const hoursPerWorkday =
    input.hoursPerWorkday && input.hoursPerWorkday > 0 ? input.hoursPerWorkday : hoursPerWeek / 5;
  const ptoDays = Math.max(0, input.ptoDaysPerYear ?? 0);
  const holidayDays = Math.max(0, input.holidayDaysPerYear ?? 0);
  const ptoHoursPerYear = (ptoDays + holidayDays) * hoursPerWorkday;

  const scheduledHoursPerYear = hoursPerWeek * weeksPerYear;
  const workedHoursPerYear = Math.max(0, scheduledHoursPerYear - ptoHoursPerYear);

  const notes: string[] = [`Based on ${hoursPerWeek} hours/week over ${weeksPerYear} weeks.`];
  if (ptoHoursPerYear > 0) {
    notes.push(
      `${ptoDays + holidayDays} days off (${ptoDays} PTO + ${holidayDays} holidays) at ${hoursPerWorkday}h/day removes ${ptoHoursPerYear} hours.`,
    );
  }

  return {
    hoursPerWeek,
    hoursPerWorkday,
    scheduledHoursPerYear,
    scheduledHoursPerMonth: Math.round((scheduledHoursPerYear / 12) * 100) / 100,
    workedHoursPerYear,
    ptoHoursPerYear,
    notes,
  };
}

export interface BusinessDaysOptions {
  /** 0=Sun .. 6=Sat. Default [1,2,3,4,5] (Mon-Fri). */
  workingWeekdays?: readonly number[];
  /** ISO `YYYY-MM-DD` dates to exclude when they fall on a working weekday. */
  holidays?: readonly string[];
}

function eachDateUTC(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  while (d.getTime() <= last) {
    out.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Count business days in `[startISO, endISO]` inclusive. Dates are `YYYY-MM-DD`. */
export function businessDaysBetween(startISO: string, endISO: string, options: BusinessDaysOptions = {}): number {
  const working = new Set(options.workingWeekdays ?? [1, 2, 3, 4, 5]);
  const holidays = new Set(options.holidays ?? []);
  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.getTime() > end.getTime()) return 0;

  let count = 0;
  for (const day of eachDateUTC(start, end)) {
    if (!working.has(day.getUTCDay())) continue;
    const iso = day.toISOString().slice(0, 10);
    if (holidays.has(iso)) continue;
    count += 1;
  }
  return count;
}

/** Business days in a calendar year. */
export function businessDaysInYear(year: number, options: BusinessDaysOptions = {}): number {
  return businessDaysBetween(`${year}-01-01`, `${year}-12-31`, options);
}

export interface FteResult {
  fte: number;
  actualHoursPerWeek: number;
  fullTimeHoursPerWeek: number;
}

/** Full-time-equivalent: actual weekly hours / full-time weekly hours, rounded to 2 dp. */
export function fullTimeEquivalent(actualHoursPerWeek: number, fullTimeHoursPerWeek = 40): FteResult {
  const ft = fullTimeHoursPerWeek > 0 ? fullTimeHoursPerWeek : 40;
  return {
    fte: Math.round((Math.max(0, actualHoursPerWeek) / ft) * 100) / 100,
    actualHoursPerWeek: Math.max(0, actualHoursPerWeek),
    fullTimeHoursPerWeek: ft,
  };
}

/** Sum a set of weekly shift durations (minutes) into weekly hours. */
export function weeklyHoursFromShifts(shiftMinutes: readonly number[]): number {
  return minutesToDecimalHours(shiftMinutes.reduce((s, m) => s + Math.max(0, m), 0));
}
