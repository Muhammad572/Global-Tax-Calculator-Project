/**
 * Overtime rules and pay.
 *
 * IMPORTANT — these presets are **calculation conveniences, not legal advice**.
 * Overtime entitlement depends on employee classification (exempt/non-exempt),
 * industry awards, collective agreements, province/state, and current
 * legislation. Every preset carries a `legalNote`; the UI must surface it and
 * must not present a preset result as a statement of what an employer owes.
 *
 * The rule set is data, not code branches, so it can evolve as laws change and
 * so new jurisdictions are one object literal away.
 */

import { type Cents, multiplyCents } from "./money.js";
import { MINUTES_PER_HOUR } from "./time.js";

export type OvertimeJurisdictionId =
  | "us-flsa"
  | "us-ca"
  | "ca-federal"
  | "ca-on"
  | "uk"
  | "au"
  | "custom";

export interface OvertimeTier {
  /** Hours (per the tier's `basis`) beyond which this multiplier applies. */
  thresholdHours: number;
  /** Pay multiplier on the regular rate (1.5 = time-and-a-half, 2 = double time). */
  multiplier: number;
  basis: "weekly" | "daily";
}

export interface OvertimeRule {
  id: OvertimeJurisdictionId;
  label: string;
  /** Any order; the engine sorts by threshold within each basis. */
  tiers: OvertimeTier[];
  summary: string;
  legalNote: string;
  source: string;
}

export const OVERTIME_RULES: Record<OvertimeJurisdictionId, OvertimeRule> = {
  "us-flsa": {
    id: "us-flsa",
    label: "United States — federal (FLSA)",
    tiers: [{ thresholdHours: 40, multiplier: 1.5, basis: "weekly" }],
    summary: "Time-and-a-half after 40 hours in a workweek.",
    legalNote:
      "US federal law (FLSA) requires 1.5x pay for hours over 40 in a workweek for non-exempt employees. Some states add daily overtime or stricter rules. Exempt (salaried) employees are generally not entitled to overtime.",
    source: "29 U.S.C. §207; U.S. DOL Fact Sheet #23",
  },
  "us-ca": {
    id: "us-ca",
    label: "United States — California",
    tiers: [
      { thresholdHours: 8, multiplier: 1.5, basis: "daily" },
      { thresholdHours: 12, multiplier: 2, basis: "daily" },
      { thresholdHours: 40, multiplier: 1.5, basis: "weekly" },
    ],
    summary: "1.5x after 8h/day or 40h/week; 2x after 12h/day.",
    legalNote:
      "California requires daily overtime (1.5x after 8h, 2x after 12h) and 7th-consecutive-day rules in addition to the 40h weekly rule. This tool applies the daily and weekly thresholds but not the 7th-day rule; check the California DIR for your situation.",
    source: "California Labor Code §510; CA DIR",
  },
  "ca-federal": {
    id: "ca-federal",
    label: "Canada — federal (Canada Labour Code)",
    tiers: [{ thresholdHours: 40, multiplier: 1.5, basis: "weekly" }],
    summary: "1.5x after 40 hours in a week (federally regulated work).",
    legalNote:
      "The Canada Labour Code standard applies to federally regulated industries only. Most workplaces follow provincial employment standards instead — pick the matching province.",
    source: "Canada Labour Code, R.S.C. 1985, c. L-2, s.174",
  },
  "ca-on": {
    id: "ca-on",
    label: "Canada — Ontario (ESA)",
    tiers: [{ thresholdHours: 44, multiplier: 1.5, basis: "weekly" }],
    summary: "1.5x after 44 hours in a work week.",
    legalNote:
      "Ontario's Employment Standards Act sets the overtime threshold at 44 hours per week (not 40). Some jobs are exempt or have a different threshold; averaging agreements can change this.",
    source: "Ontario Employment Standards Act, 2000, O. Reg. 285/01",
  },
  uk: {
    id: "uk",
    label: "United Kingdom",
    tiers: [{ thresholdHours: 40, multiplier: 1.5, basis: "weekly" }],
    summary: "No statutory overtime rate — threshold and multiplier are your contract's.",
    legalNote:
      "UK law does not require any premium pay for overtime. Pay for extra hours is whatever the employment contract says, as long as average pay stays at or above the minimum wage. The 48-hour Working Time limit caps average hours for health and safety; it is not a pay rule. The 40h / 1.5x values here are a common contractual default — override them to match your contract.",
    source: "Employment Rights Act 1996; Working Time Regulations 1998",
  },
  au: {
    id: "au",
    label: "Australia",
    tiers: [
      { thresholdHours: 38, multiplier: 1.5, basis: "weekly" },
      { thresholdHours: 41, multiplier: 2, basis: "weekly" },
    ],
    summary: "Common award pattern: 1.5x for the first 3 OT hours/week, then 2x (38h ordinary week).",
    legalNote:
      "Australian overtime is set by the relevant modern award or enterprise agreement, not by a single national rule. A very common pattern is 1.5x for the first 2-3 overtime hours and 2x after, on a 38-hour ordinary week. Check your award on the Fair Work Ombudsman site.",
    source: "Fair Work Act 2009; modern awards (Fair Work Ombudsman)",
  },
  custom: {
    id: "custom",
    label: "Custom",
    tiers: [{ thresholdHours: 40, multiplier: 1.5, basis: "weekly" }],
    summary: "Set your own threshold and multiplier.",
    legalNote: "You define the threshold and multiplier. No legal rules are applied.",
    source: "user-defined",
  },
};

export interface OvertimeConfig {
  jurisdiction: OvertimeJurisdictionId;
  /** Override the (primary) weekly threshold in hours. */
  weeklyThresholdHours?: number;
  /** Override the primary overtime multiplier (the 1.5x-equivalent tier). */
  multiplier?: number;
  /** Override the daily threshold in hours. Only applied when > 0. */
  dailyThresholdHours?: number;
  /** Multiplier for the double-time tier. */
  doubleMultiplier?: number;
  /** Force daily-overtime evaluation even if the preset has no daily tier. */
  applyDailyRules?: boolean;
}

export interface OvertimeSplit {
  regularMinutes: number;
  overtimeMinutes: number;
  doubleTimeMinutes: number;
  multiplier: number;
  doubleMultiplier: number;
  weeklyThresholdHours: number;
  dailyThresholdHours: number | null;
  notes: string[];
}

interface ResolvedTiers {
  /** ascending threshold minutes for the [1.5x, 2x] weekly tiers; second may be Infinity */
  weekly: { otThreshold: number; dtThreshold: number };
  daily: { otThreshold: number; dtThreshold: number } | null;
  multiplier: number;
  doubleMultiplier: number;
}

function resolveTiers(config: OvertimeConfig): ResolvedTiers {
  const rule = OVERTIME_RULES[config.jurisdiction] ?? OVERTIME_RULES["us-flsa"];
  const weekly = [...rule.tiers.filter((t) => t.basis === "weekly")].sort((a, b) => a.thresholdHours - b.thresholdHours);
  const daily = [...rule.tiers.filter((t) => t.basis === "daily")].sort((a, b) => a.thresholdHours - b.thresholdHours);

  const wantDaily = config.applyDailyRules === true || daily.length > 0 || config.dailyThresholdHours !== undefined;

  const weeklyOtHours = config.weeklyThresholdHours ?? weekly[0]?.thresholdHours ?? 40;
  const weeklyDtHours = weekly[1]?.thresholdHours ?? Number.POSITIVE_INFINITY;
  const dailyOtHours = config.dailyThresholdHours ?? daily[0]?.thresholdHours ?? 8;
  const dailyDtHours = daily[1]?.thresholdHours ?? Number.POSITIVE_INFINITY;

  return {
    multiplier: config.multiplier ?? weekly[0]?.multiplier ?? daily[0]?.multiplier ?? 1.5,
    doubleMultiplier: config.doubleMultiplier ?? weekly[1]?.multiplier ?? daily[1]?.multiplier ?? 2,
    weekly: {
      otThreshold: weeklyOtHours * MINUTES_PER_HOUR,
      dtThreshold: weeklyDtHours * MINUTES_PER_HOUR,
    },
    daily: wantDaily
      ? { otThreshold: dailyOtHours * MINUTES_PER_HOUR, dtThreshold: dailyDtHours * MINUTES_PER_HOUR }
      : null,
  };
}

/**
 * Split worked minutes into regular / overtime (primary premium) / double-time
 * (>= 2x tier) buckets. Daily rules (where the jurisdiction has them and per-day
 * minutes are supplied) are applied first; the weekly rule then applies to
 * whatever is still "regular".
 */
export function computeOvertimeSplit(
  totalWorkedMinutes: number,
  config: OvertimeConfig,
  dailyMinutes?: readonly number[],
): OvertimeSplit {
  const t = resolveTiers(config);
  const notes: string[] = [];
  const total = Math.max(0, Math.round(totalWorkedMinutes));

  let dailyOt = 0;
  let dailyDt = 0;
  if (t.daily && dailyMinutes && dailyMinutes.length > 0) {
    for (const dmRaw of dailyMinutes) {
      const d = Math.max(0, Math.round(dmRaw));
      if (d > t.daily.dtThreshold) {
        dailyDt += d - t.daily.dtThreshold;
        dailyOt += t.daily.dtThreshold - t.daily.otThreshold;
      } else if (d > t.daily.otThreshold) {
        dailyOt += d - t.daily.otThreshold;
      }
    }
    if (dailyOt || dailyDt) notes.push(`Daily overtime applied above ${t.daily.otThreshold / 60}h/day.`);
  } else if (t.daily && (!dailyMinutes || dailyMinutes.length === 0)) {
    notes.push(
      "Daily overtime rules exist for this selection, but no per-day hours were provided, so only the weekly rule was applied.",
    );
  }

  const nonDaily = Math.max(0, total - dailyOt - dailyDt);

  let weeklyDt = 0;
  let weeklyOt = 0;
  let regular = nonDaily;
  if (nonDaily > t.weekly.otThreshold) {
    const premium = nonDaily - t.weekly.otThreshold;
    regular = t.weekly.otThreshold;
    const dtBand = Math.max(0, t.weekly.dtThreshold - t.weekly.otThreshold);
    weeklyOt = Math.min(premium, dtBand);
    weeklyDt = premium - weeklyOt;
    notes.push(`Weekly overtime applied above ${t.weekly.otThreshold / 60}h/week.`);
    if (weeklyDt > 0 && Number.isFinite(t.weekly.dtThreshold)) {
      notes.push(`Double time applied above ${t.weekly.dtThreshold / 60}h/week.`);
    }
  }

  return {
    regularMinutes: regular,
    overtimeMinutes: dailyOt + weeklyOt,
    doubleTimeMinutes: dailyDt + weeklyDt,
    multiplier: t.multiplier,
    doubleMultiplier: t.doubleMultiplier,
    weeklyThresholdHours: t.weekly.otThreshold / 60,
    dailyThresholdHours: t.daily ? t.daily.otThreshold / 60 : null,
    notes,
  };
}

export interface OvertimePayInput {
  regularMinutes: number;
  overtimeMinutes: number;
  doubleTimeMinutes?: number;
  hourlyRateCents: Cents;
  multiplier: number;
  doubleMultiplier?: number;
}

export interface OvertimePayResult {
  regularPayCents: Cents;
  overtimePayCents: Cents;
  doubleTimePayCents: Cents;
  grossPayCents: Cents;
  overtimeRateCents: Cents;
  doubleTimeRateCents: Cents;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
}

/** Turn a regular/OT/DT minute split + a rate into pay, with each line itemized. */
export function computeOvertimePay(input: OvertimePayInput): OvertimePayResult {
  const { hourlyRateCents, multiplier } = input;
  const doubleMultiplier = input.doubleMultiplier ?? 2;
  const regMin = Math.max(0, input.regularMinutes);
  const otMin = Math.max(0, input.overtimeMinutes);
  const dtMin = Math.max(0, input.doubleTimeMinutes ?? 0);

  const regularPayCents = multiplyCents(hourlyRateCents, regMin / MINUTES_PER_HOUR);
  const overtimeRateCents = multiplyCents(hourlyRateCents, multiplier);
  const doubleTimeRateCents = multiplyCents(hourlyRateCents, doubleMultiplier);
  const overtimePayCents = multiplyCents(overtimeRateCents, otMin / MINUTES_PER_HOUR);
  const doubleTimePayCents = multiplyCents(doubleTimeRateCents, dtMin / MINUTES_PER_HOUR);

  return {
    regularPayCents,
    overtimePayCents,
    doubleTimePayCents,
    grossPayCents: regularPayCents + overtimePayCents + doubleTimePayCents,
    overtimeRateCents,
    doubleTimeRateCents,
    regularHours: regMin / MINUTES_PER_HOUR,
    overtimeHours: otMin / MINUTES_PER_HOUR,
    doubleTimeHours: dtMin / MINUTES_PER_HOUR,
  };
}
