/**
 * FICA — Social Security and Medicare employee withholding.
 *
 * Data: SSA 2026 wage base announcement; IRS (Additional Medicare Tax is a
 * statutory 0.9% on wages over $200,000, not inflation-adjusted, and employers
 * withhold it regardless of the employee's filing status).
 */

import { type Cents, multiplyCents } from "../money.js";
import type { JurisdictionResult } from "./types.js";

export interface FicaTable {
  year: number;
  socialSecurityRate: number;
  socialSecurityWageBaseCents: Cents;
  medicareRate: number;
  additionalMedicareRate: number;
  additionalMedicareThresholdCents: Cents;
  source: string;
}

export const FICA_TABLES: Record<number, FicaTable> = {
  2026: {
    year: 2026,
    socialSecurityRate: 0.062,
    socialSecurityWageBaseCents: 184_500_00,
    medicareRate: 0.0145,
    additionalMedicareRate: 0.009,
    additionalMedicareThresholdCents: 200_000_00,
    source: "SSA 2026 wage base ($184,500); IRC §3101 / §3121; IRS Additional Medicare Tax",
  },
};

/**
 * FICA for one pay period. `priorYtdSsWagesCents` lets a caller that knows
 * year-to-date wages stop Social Security at the wage base; omitted, it assumes
 * the period is below the cap (correct for the common single-job case unless
 * annualised pay exceeds the base — the orchestrator handles that).
 */
export function computeFica(params: {
  taxableSsWagesPerPeriodCents: Cents;
  taxableMedicareWagesPerPeriodCents: Cents;
  payPeriodsPerYear: number;
  taxYear: number;
}): JurisdictionResult {
  const table = FICA_TABLES[params.taxYear];
  if (!table) {
    return {
      supported: false,
      reason: `FICA tables for ${params.taxYear} are not loaded. Only 2026 is supported.`,
      withholdingPerPeriodCents: 0,
      withholdingAnnualCents: 0,
      lines: [],
    };
  }

  const periods = Math.max(1, params.payPeriodsPerYear);
  const annualSsWages = params.taxableSsWagesPerPeriodCents * periods;
  const cappedAnnualSsWages = Math.min(annualSsWages, table.socialSecurityWageBaseCents);
  const ssAnnual = multiplyCents(cappedAnnualSsWages, table.socialSecurityRate);
  const ssPerPeriod = Math.round(ssAnnual / periods);

  const medicareBase = multiplyCents(params.taxableMedicareWagesPerPeriodCents, table.medicareRate);
  const annualMedicareWages = params.taxableMedicareWagesPerPeriodCents * periods;
  const additionalAnnual = multiplyCents(
    Math.max(0, annualMedicareWages - table.additionalMedicareThresholdCents),
    table.additionalMedicareRate,
  );
  const additionalPerPeriod = Math.round(additionalAnnual / periods);
  const medicarePerPeriod = medicareBase + additionalPerPeriod;

  const lines = [
    {
      key: "social_security",
      label: "Social Security (6.2%)",
      amountCents: ssPerPeriod,
      note:
        annualSsWages > table.socialSecurityWageBaseCents
          ? "Capped at the $184,500 Social Security wage base for 2026."
          : undefined,
    },
    { key: "medicare", label: "Medicare (1.45%)", amountCents: medicareBase },
  ] as JurisdictionResult["lines"];
  if (additionalPerPeriod > 0) {
    lines.push({
      key: "additional_medicare",
      label: "Additional Medicare (0.9%)",
      amountCents: additionalPerPeriod,
      note: "On wages over $200,000/year. Employers withhold this regardless of filing status.",
    });
  }

  const perPeriod = ssPerPeriod + medicarePerPeriod;
  return {
    supported: true,
    withholdingPerPeriodCents: perPeriod,
    withholdingAnnualCents: perPeriod * periods,
    lines,
    source: table.source,
  };
}
