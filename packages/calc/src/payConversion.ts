/**
 * Pay-rate conversion between frequencies (hourly <-> annual <-> weekly <->
 * biweekly <-> semi-monthly <-> monthly ...), plus raises and PTO-adjusted
 * "real" hourly rate.
 *
 * The canonical internal unit is **annual cents**. Every frequency defines how
 * many pay periods make a year, or — for hourly/daily — is derived from the
 * work schedule. Assumptions (hours/week, weeks/year) are explicit inputs and
 * are echoed back in the result so the UI can show them.
 */

import { type Cents, multiplyCents, roundHalfUp } from "./money.js";

export type PayFrequency =
  | "hourly"
  | "daily"
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "quarterly"
  | "annual";

export const PAY_FREQUENCIES: PayFrequency[] = [
  "hourly",
  "daily",
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "quarterly",
  "annual",
];

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly (every 2 weeks)",
  semimonthly: "Semi-monthly (twice a month)",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

export interface ScheduleAssumptions {
  /** Paid hours per week. Default 40. */
  hoursPerWeek?: number;
  /** Paid weeks per year (52 = no unpaid time off). Default 52. */
  weeksPerYear?: number;
  /** Work days per week (for daily <-> other). Default 5. */
  daysPerWeek?: number;
}

interface ResolvedSchedule {
  hoursPerWeek: number;
  weeksPerYear: number;
  daysPerWeek: number;
}

function resolve(a: ScheduleAssumptions = {}): ResolvedSchedule {
  return {
    hoursPerWeek: a.hoursPerWeek && a.hoursPerWeek > 0 ? a.hoursPerWeek : 40,
    weeksPerYear: a.weeksPerYear && a.weeksPerYear > 0 ? a.weeksPerYear : 52,
    daysPerWeek: a.daysPerWeek && a.daysPerWeek > 0 ? a.daysPerWeek : 5,
  };
}

/** Number of pay periods in a year for a fixed-period frequency. */
export function periodsPerYear(freq: PayFrequency, schedule: ScheduleAssumptions = {}): number {
  const s = resolve(schedule);
  switch (freq) {
    case "hourly":
      return s.hoursPerWeek * s.weeksPerYear;
    case "daily":
      return s.daysPerWeek * s.weeksPerYear;
    case "weekly":
      return 52;
    case "biweekly":
      return 26;
    case "semimonthly":
      return 24;
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "annual":
      return 1;
  }
}

/** A per-period amount at `from` frequency -> annual cents. */
export function annualize(amountCents: Cents, from: PayFrequency, schedule: ScheduleAssumptions = {}): Cents {
  return roundHalfUp(amountCents * periodsPerYear(from, schedule));
}

/** Annual cents -> a per-period amount at `to` frequency. */
export function deannualize(annualCents: Cents, to: PayFrequency, schedule: ScheduleAssumptions = {}): Cents {
  const n = periodsPerYear(to, schedule);
  return n === 0 ? 0 : roundHalfUp(annualCents / n);
}

export interface ConversionResult {
  annualCents: Cents;
  perFrequency: Record<PayFrequency, Cents>;
  assumptions: ResolvedSchedule;
  notes: string[];
}

/** Convert one rate into every frequency at once. */
export function convertPay(
  amountCents: Cents,
  from: PayFrequency,
  schedule: ScheduleAssumptions = {},
): ConversionResult {
  const s = resolve(schedule);
  const annualCents = annualize(amountCents, from, s);
  const perFrequency = Object.fromEntries(
    PAY_FREQUENCIES.map((f) => [f, deannualize(annualCents, f, s)]),
  ) as Record<PayFrequency, Cents>;

  const notes: string[] = [
    `Assumes ${s.hoursPerWeek} hours/week and ${s.weeksPerYear} paid weeks/year (${s.hoursPerWeek * s.weeksPerYear} paid hours/year).`,
  ];
  if (from === "hourly" || from === "daily") {
    notes.push("Hourly and daily figures depend on the hours/week and weeks/year you set above.");
  }
  if (s.weeksPerYear < 52) {
    notes.push("Because paid weeks/year is below 52, unpaid time off is being subtracted.");
  }

  return { annualCents, perFrequency, assumptions: s, notes };
}

/** Direct single conversion `from` -> `to`. */
export function convertPayTo(
  amountCents: Cents,
  from: PayFrequency,
  to: PayFrequency,
  schedule: ScheduleAssumptions = {},
): Cents {
  return deannualize(annualize(amountCents, from, schedule), to, schedule);
}

export interface RaiseResult {
  oldAnnualCents: Cents;
  newAnnualCents: Cents;
  increaseCents: Cents;
  increasePercent: number;
  newPerFrequency: Record<PayFrequency, Cents>;
}

/** Apply a percentage or flat raise to a rate at any frequency. */
export function applyRaise(
  amountCents: Cents,
  from: PayFrequency,
  raise: { percent?: number; flatAnnualCents?: Cents },
  schedule: ScheduleAssumptions = {},
): RaiseResult {
  const oldAnnualCents = annualize(amountCents, from, schedule);
  let newAnnualCents = oldAnnualCents;
  if (raise.percent !== undefined && Number.isFinite(raise.percent)) {
    newAnnualCents = multiplyCents(oldAnnualCents, 1 + raise.percent / 100);
  }
  if (raise.flatAnnualCents !== undefined && Number.isFinite(raise.flatAnnualCents)) {
    newAnnualCents += roundHalfUp(raise.flatAnnualCents);
  }
  const increaseCents = newAnnualCents - oldAnnualCents;
  return {
    oldAnnualCents,
    newAnnualCents,
    increaseCents,
    increasePercent: oldAnnualCents === 0 ? 0 : roundHalfUp((increaseCents / oldAnnualCents) * 10000) / 100,
    newPerFrequency: convertPay(newAnnualCents, "annual", schedule).perFrequency,
  };
}

export interface RealHourlyResult {
  nominalHourlyCents: Cents;
  realHourlyCents: Cents;
  paidHoursPerYear: number;
  workedHoursPerYear: number;
  ptoHoursPerYear: number;
}

/**
 * "Real" hourly rate: annual pay divided by hours *actually worked* once paid
 * time off (vacation + holidays) is removed. Salaried workers earn their PTO,
 * so their real hourly is higher than salary / 2080.
 */
export function realHourlyRate(params: {
  annualCents: Cents;
  hoursPerWeek?: number;
  weeksPerYear?: number;
  ptoDaysPerYear?: number;
  holidayDaysPerYear?: number;
  hoursPerWorkday?: number;
}): RealHourlyResult {
  const hoursPerWeek = params.hoursPerWeek && params.hoursPerWeek > 0 ? params.hoursPerWeek : 40;
  const weeksPerYear = params.weeksPerYear && params.weeksPerYear > 0 ? params.weeksPerYear : 52;
  const hoursPerWorkday = params.hoursPerWorkday && params.hoursPerWorkday > 0 ? params.hoursPerWorkday : hoursPerWeek / 5;
  const ptoHoursPerYear = Math.max(0, (params.ptoDaysPerYear ?? 0) + (params.holidayDaysPerYear ?? 0)) * hoursPerWorkday;

  const paidHoursPerYear = hoursPerWeek * weeksPerYear;
  const workedHoursPerYear = Math.max(1, paidHoursPerYear - ptoHoursPerYear);

  return {
    nominalHourlyCents: roundHalfUp(params.annualCents / paidHoursPerYear),
    realHourlyCents: roundHalfUp(params.annualCents / workedHoursPerYear),
    paidHoursPerYear,
    workedHoursPerYear,
    ptoHoursPerYear,
  };
}
