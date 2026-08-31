/**
 * US federal income tax withholding — Percentage Method for Automated Payroll
 * Systems (IRS Publication 15-T, "Worksheet 1A"), 2026.
 *
 * Data source: IRS Publication 15-T (for use in 2026), Percentage Method Tables
 * for Automated Payroll Systems, Annual pay period. Cross-checked: each
 * schedule's 0% band + the Step-2-unchecked amount equals the 2026 standard
 * deduction ($16,100 single / $24,150 HoH / $32,200 MFJ).
 *
 * Scope: models a 2020-or-later Form W-4. Pre-2020 W-4s (with allowances) are
 * not modeled — the orchestrator flags that.
 */

import { type Cents, multiplyCents } from "../money.js";
import type { FilingStatus, JurisdictionResult } from "./types.js";

interface Bracket {
  /** Adjusted Annual Wage over this amount (cents). */
  overCents: Cents;
  /** Tentative withholding at the bracket floor (cents). */
  baseCents: Cents;
  rate: number;
}

interface FederalTable {
  year: number;
  /** Added to Step 4b deductions when the W-4 Step 2 box is NOT checked. */
  step2UncheckedAddCents: Record<"mfj" | "other", Cents>;
  standard: Record<"mfj" | "single" | "hoh", Bracket[]>;
  step2Checkbox: Record<"mfj" | "single" | "hoh", Bracket[]>;
  source: string;
}

// Brackets are ascending by `overCents`; the last applies to all higher wages.
const B = (over: number, base: number, rate: number): Bracket => ({
  overCents: Math.round(over * 100),
  baseCents: Math.round(base * 100),
  rate,
});

export const FEDERAL_TABLES: Record<number, FederalTable> = {
  2026: {
    year: 2026,
    step2UncheckedAddCents: { mfj: 12_900_00, other: 8_600_00 },
    source: "IRS Publication 15-T (2026), Percentage Method — Annual payroll period",
    standard: {
      mfj: [
        B(0, 0, 0),
        B(19_300, 0, 0.1),
        B(44_100, 2_480, 0.12),
        B(120_100, 11_600, 0.22),
        B(230_700, 35_932, 0.24),
        B(422_850, 82_048, 0.32),
        B(531_750, 116_896, 0.35),
        B(788_000, 206_583.5, 0.37),
      ],
      single: [
        B(0, 0, 0),
        B(7_500, 0, 0.1),
        B(19_900, 1_240, 0.12),
        B(57_900, 5_800, 0.22),
        B(113_200, 17_966, 0.24),
        B(209_275, 41_024, 0.32),
        B(263_725, 58_448, 0.35),
        B(648_100, 192_979.25, 0.37),
      ],
      hoh: [
        B(0, 0, 0),
        B(15_550, 0, 0.1),
        B(33_250, 1_770, 0.12),
        B(83_000, 7_740, 0.22),
        B(121_250, 16_155, 0.24),
        B(217_300, 39_207, 0.32),
        B(271_750, 56_631, 0.35),
        B(656_150, 191_171, 0.37),
      ],
    },
    step2Checkbox: {
      mfj: [
        B(0, 0, 0),
        B(16_100, 0, 0.1),
        B(28_500, 1_240, 0.12),
        B(66_500, 5_800, 0.22),
        B(121_800, 17_966, 0.24),
        B(217_875, 41_024, 0.32),
        B(272_325, 58_448, 0.35),
        B(400_450, 103_291.75, 0.37),
      ],
      single: [
        B(0, 0, 0),
        B(8_050, 0, 0.1),
        B(14_250, 620, 0.12),
        B(33_250, 2_900, 0.22),
        B(60_900, 8_983, 0.24),
        B(108_938, 20_512, 0.32),
        B(136_163, 29_224, 0.35),
        B(328_350, 96_489.63, 0.37),
      ],
      hoh: [
        B(0, 0, 0),
        B(12_075, 0, 0.1),
        B(20_925, 885, 0.12),
        B(45_800, 3_870, 0.22),
        B(64_925, 8_077.5, 0.24),
        B(112_950, 19_603.5, 0.32),
        B(140_175, 28_315.5, 0.35),
        B(332_375, 95_585.5, 0.37),
      ],
    },
  },
};

function scheduleKey(status: FilingStatus): "mfj" | "single" | "hoh" {
  if (status === "mfj") return "mfj";
  if (status === "hoh") return "hoh";
  return "single"; // single and mfs share the single schedule
}

function applyBrackets(adjustedAnnualWageCents: Cents, brackets: Bracket[]): Cents {
  let chosen = brackets[0]!;
  for (const b of brackets) {
    if (adjustedAnnualWageCents > b.overCents) chosen = b;
    else break;
  }
  return chosen.baseCents + multiplyCents(adjustedAnnualWageCents - chosen.overCents, chosen.rate);
}

export interface FederalInput {
  annualTaxableWagesCents: Cents;
  filingStatus: FilingStatus;
  taxYear: number;
  payPeriodsPerYear: number;
  step2Checkbox: boolean;
  dependentsAnnualCents: Cents;
  otherIncomeAnnualCents: Cents;
  deductionsAnnualCents: Cents;
  extraPerPeriodCents: Cents;
}

export function computeFederalWithholding(input: FederalInput): JurisdictionResult {
  const table = FEDERAL_TABLES[input.taxYear];
  if (!table) {
    return {
      supported: false,
      reason: `Federal withholding tables for ${input.taxYear} are not loaded. Only 2026 is supported.`,
      withholdingPerPeriodCents: 0,
      withholdingAnnualCents: 0,
      lines: [],
    };
  }

  const key = scheduleKey(input.filingStatus);
  const periods = Math.max(1, input.payPeriodsPerYear);

  // Worksheet 1A
  const line1c = input.annualTaxableWagesCents + input.otherIncomeAnnualCents; // 1a + 4a
  const step2Add = input.step2Checkbox
    ? 0
    : table.step2UncheckedAddCents[input.filingStatus === "mfj" ? "mfj" : "other"];
  const line1f = input.deductionsAnnualCents + step2Add; // 4b + standard-ish
  const adjustedAnnualWage = Math.max(0, line1c - line1f); // 1g

  const brackets = input.step2Checkbox ? table.step2Checkbox[key] : table.standard[key];
  const tentativeAnnual = applyBrackets(adjustedAnnualWage, brackets);
  const afterCredits = Math.max(0, tentativeAnnual - input.dependentsAnnualCents);

  const perPeriodBeforeExtra = Math.round(afterCredits / periods);
  const perPeriod = perPeriodBeforeExtra + Math.max(0, input.extraPerPeriodCents);

  const lines: JurisdictionResult["lines"] = [
    { key: "adjusted_annual_wage", label: "Adjusted annual wage amount", amountCents: adjustedAnnualWage },
    { key: "tentative_annual", label: "Tentative annual withholding", amountCents: tentativeAnnual },
  ];
  if (input.dependentsAnnualCents > 0) {
    lines.push({ key: "w4_step3", label: "Less Step 3 credits (annual)", amountCents: -input.dependentsAnnualCents });
  }
  if (input.extraPerPeriodCents > 0) {
    lines.push({ key: "w4_step4c", label: "Plus Step 4(c) extra withholding", amountCents: input.extraPerPeriodCents });
  }

  return {
    supported: true,
    withholdingPerPeriodCents: perPeriod,
    withholdingAnnualCents: perPeriod * periods,
    lines,
    source: table.source,
  };
}
