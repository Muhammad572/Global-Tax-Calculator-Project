/**
 * Paycheck / take-home pay orchestration.
 *
 * Combines federal income tax withholding, FICA, and state income tax
 * withholding into a per-period net-pay estimate. This is a **withholding
 * estimate**, not a statement of tax owed: it does not model tax-return
 * credits/deductions, local city taxes, SUI/SDI beyond noted cases,
 * garnishments, or year-to-date wage-base tracking across multiple jobs.
 */

import { type Cents } from "../money.js";
import { type PayFrequency, periodsPerYear } from "../payConversion.js";
import { computeFederalWithholding } from "./federal.js";
import { computeFica } from "./fica.js";
import { SUPPORTED_STATES, STATE_LABELS, computeStateWithholding } from "./states.js";
import type { FilingStatus, PaycheckInput, PaycheckResult, StateCode } from "./types.js";

export * from "./types.js";
export { FICA_TABLES } from "./fica.js";
export { FEDERAL_TABLES } from "./federal.js";
export { SUPPORTED_STATES, STATE_LABELS } from "./states.js";

export const SUPPORTED_TAX_YEARS = [2026];

export interface SupportedJurisdictions {
  taxYears: number[];
  states: { code: StateCode; label: string }[];
  filingStatuses: FilingStatus[];
}

export function getSupportedJurisdictions(): SupportedJurisdictions {
  return {
    taxYears: [...SUPPORTED_TAX_YEARS],
    states: SUPPORTED_STATES.map((code) => ({ code, label: STATE_LABELS[code] })),
    filingStatuses: ["single", "mfj", "hoh", "mfs"],
  };
}

export function isStateSupported(state: StateCode): boolean {
  return state === "none" || SUPPORTED_STATES.includes(state);
}

const PERIODS: Record<PayFrequency, number> = {
  hourly: 2080,
  daily: 260,
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  quarterly: 4,
  annual: 1,
};

export function computePaycheck(input: PaycheckInput): PaycheckResult {
  const periods = input.payFrequency === "hourly" || input.payFrequency === "daily"
    ? periodsPerYear(input.payFrequency)
    : PERIODS[input.payFrequency];

  const gross = Math.max(0, Math.round(input.grossPerPeriodCents));
  const preTax = Math.max(0, Math.round(input.preTaxPerPeriodCents ?? 0));
  const postTax = Math.max(0, Math.round(input.postTaxPerPeriodCents ?? 0));

  // Pre-tax deductions reduce federal + state taxable wages. For simplicity the
  // engine treats all pre-tax deductions as also reducing FICA wages (true for
  // section-125 and HSA, not for 401(k)); this is called out in disclaimers.
  const taxablePerPeriod = Math.max(0, gross - preTax);
  const annualTaxableWages = taxablePerPeriod * periods;

  const disclaimers: string[] = [
    "This is an estimate of paycheck withholding, not the tax you ultimately owe. Your tax return reconciles the difference.",
    "Assumes a 2020-or-later Form W-4. Pre-2020 W-4s with allowances are not modeled.",
    "Local city or county income taxes (for example New York City, Yonkers, or the Philadelphia wage tax) are not included.",
  ];
  const assumptions: string[] = [
    `Pay frequency: ${input.payFrequency} (${periods} periods/year).`,
    `Filing status: ${input.filingStatus}.`,
    `Tax year: ${input.taxYear}.`,
  ];

  const yearSupported = SUPPORTED_TAX_YEARS.includes(input.taxYear);
  const stateSupported = isStateSupported(input.state);

  const federal = yearSupported
    ? computeFederalWithholding({
        annualTaxableWagesCents: annualTaxableWages,
        filingStatus: input.filingStatus,
        taxYear: input.taxYear,
        payPeriodsPerYear: periods,
        step2Checkbox: input.w4Step2Checkbox ?? false,
        dependentsAnnualCents: Math.max(0, input.w4DependentsAnnualCents ?? 0),
        otherIncomeAnnualCents: Math.max(0, input.w4OtherIncomeAnnualCents ?? 0),
        deductionsAnnualCents: Math.max(0, input.w4DeductionsAnnualCents ?? 0),
        extraPerPeriodCents: Math.max(0, input.w4ExtraPerPeriodCents ?? 0),
      })
    : {
        supported: false,
        reason: `Federal withholding is only available for tax year ${SUPPORTED_TAX_YEARS.join(", ")}.`,
        withholdingPerPeriodCents: 0,
        withholdingAnnualCents: 0,
        lines: [],
      };

  const fica = yearSupported
    ? computeFica({
        taxableSsWagesPerPeriodCents: taxablePerPeriod,
        taxableMedicareWagesPerPeriodCents: taxablePerPeriod,
        payPeriodsPerYear: periods,
        taxYear: input.taxYear,
      })
    : {
        supported: false,
        reason: `FICA is only available for tax year ${SUPPORTED_TAX_YEARS.join(", ")}.`,
        withholdingPerPeriodCents: 0,
        withholdingAnnualCents: 0,
        lines: [],
      };

  const state = computeStateWithholding({
    state: input.state,
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    annualTaxableWagesCents: annualTaxableWages,
    payPeriodsPerYear: periods,
    allowances: input.stateAllowances,
  });

  if (!state.supported) {
    disclaimers.unshift(
      `${STATE_LABELS[input.state] ?? input.state} is not a supported state yet — the estimate below covers federal tax and FICA only, with no state income tax withheld. Your real paycheck will be lower if your state taxes wages.`,
    );
  }

  const totalWithholding =
    federal.withholdingPerPeriodCents + fica.withholdingPerPeriodCents + state.withholdingPerPeriodCents;
  const net = gross - totalWithholding - postTax;

  const overallSupported = yearSupported && stateSupported;

  const result: PaycheckResult = {
    supported: overallSupported,
    grossPerPeriodCents: gross,
    grossAnnualCents: gross * periods,
    taxablePerPeriodCents: taxablePerPeriod,
    federal,
    fica,
    state,
    preTaxPerPeriodCents: preTax,
    postTaxPerPeriodCents: postTax,
    totalWithholdingPerPeriodCents: totalWithholding,
    netPerPeriodCents: net,
    netAnnualCents: net * periods,
    effectiveRate: gross > 0 ? (totalWithholding + postTax > 0 ? (gross - net) / gross : 0) : 0,
    assumptions,
    disclaimers,
  };
  if (!overallSupported) {
    result.reason = !yearSupported
      ? `Tax year ${input.taxYear} is not supported. Supported: ${SUPPORTED_TAX_YEARS.join(", ")}.`
      : `${STATE_LABELS[input.state] ?? input.state} is not supported for tax year ${input.taxYear}.`;
  }
  return result;
}

/** Convenience for the Take-Home Pay tool: annual salary in, annual + monthly net out. */
export function computeTakeHomeFromAnnualSalary(params: {
  annualSalaryCents: Cents;
  filingStatus: FilingStatus;
  taxYear: number;
  state: StateCode;
  payFrequency?: PayFrequency;
  w4Step2Checkbox?: boolean;
  stateAllowances?: number;
  preTaxAnnualCents?: Cents;
}): PaycheckResult {
  const freq: PayFrequency = params.payFrequency ?? "biweekly";
  const periods = PERIODS[freq];
  return computePaycheck({
    grossPerPeriodCents: Math.round(params.annualSalaryCents / periods),
    payFrequency: freq,
    filingStatus: params.filingStatus,
    taxYear: params.taxYear,
    state: params.state,
    w4Step2Checkbox: params.w4Step2Checkbox ?? false,
    stateAllowances: params.stateAllowances,
    preTaxPerPeriodCents: Math.round((params.preTaxAnnualCents ?? 0) / periods),
  });
}
