import type { Cents } from "../money.js";
import type { PayFrequency } from "../payConversion.js";

/** Federal filing status. `mfs` = married filing separately. */
export type FilingStatus = "single" | "mfj" | "hoh" | "mfs";

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  mfj: "Married filing jointly",
  hoh: "Head of household",
  mfs: "Married filing separately",
};

/**
 * A supported US state code, `"none"` for "no state selected", or `"other"` for
 * a US state the engine does not yet have 2026 withholding tables for (returns
 * an explicit not-supported result — never a fabricated number).
 */
export type StateCode =
  | "none"
  | "other"
  | "TX"
  | "FL"
  | "WA"
  | "TN"
  | "NV"
  | "SD"
  | "WY"
  | "AK"
  | "NH"
  | "PA"
  | "IL"
  | "CA"
  | "NY";

export interface PaycheckInput {
  /** Gross pay for ONE pay period, in cents. */
  grossPerPeriodCents: Cents;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  /** Tax year. Only 2026 is supported at MVP. */
  taxYear: number;
  state: StateCode;

  /** 2020+ Form W-4 Step 2 checkbox ("multiple jobs") is checked. Default false. */
  w4Step2Checkbox?: boolean;
  /** Form W-4 Step 3 — annual dependent/other credits, in cents. Default 0. */
  w4DependentsAnnualCents?: Cents;
  /** Form W-4 Step 4(a) — other annual income, in cents. Default 0. */
  w4OtherIncomeAnnualCents?: Cents;
  /** Form W-4 Step 4(b) — annual deductions above the standard deduction, in cents. Default 0. */
  w4DeductionsAnnualCents?: Cents;
  /** Form W-4 Step 4(c) — extra withholding per pay period, in cents. Default 0. */
  w4ExtraPerPeriodCents?: Cents;

  /** State withholding allowances (IL, CA, NY). Defaults per state/status if omitted. */
  stateAllowances?: number;

  /** Pre-tax deductions per period (401k, HSA, section-125) in cents — reduce taxable wages. */
  preTaxPerPeriodCents?: Cents;
  /** Post-tax deductions per period in cents — reduce net only. */
  postTaxPerPeriodCents?: Cents;
}

export interface LineItem {
  key: string;
  label: string;
  amountCents: Cents;
  /** Optional note shown under the line. */
  note?: string;
}

export interface JurisdictionResult {
  supported: boolean;
  /** When `supported` is false, why — shown verbatim to the user. */
  reason?: string;
  withholdingPerPeriodCents: Cents;
  withholdingAnnualCents: Cents;
  lines: LineItem[];
  source?: string;
}

export interface PaycheckResult {
  supported: boolean;
  /** Overall message when the requested jurisdiction/year is not fully supported. */
  reason?: string;

  grossPerPeriodCents: Cents;
  grossAnnualCents: Cents;
  taxablePerPeriodCents: Cents;

  federal: JurisdictionResult;
  fica: JurisdictionResult;
  state: JurisdictionResult;

  preTaxPerPeriodCents: Cents;
  postTaxPerPeriodCents: Cents;

  totalWithholdingPerPeriodCents: Cents;
  netPerPeriodCents: Cents;
  netAnnualCents: Cents;

  /** Effective total tax + FICA rate on gross, 0..1. */
  effectiveRate: number;

  assumptions: string[];
  disclaimers: string[];
}
