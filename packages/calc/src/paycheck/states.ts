/**
 * State income tax withholding for the MVP-supported states, tax year 2026.
 *
 * Sources:
 *  - No wage income tax: AK, FL, NH (wages), NV, SD, TN, TX, WA, WY.
 *  - PA: flat 3.07%, no allowances — PA Dept. of Revenue.
 *  - IL: flat 4.95%, 2026 personal exemption allowance $2,925 — IL Booklet IL-700-T (2026).
 *  - CA: Method B Exact Calculation, 2026 — EDD DE 44 "California Withholding
 *    Schedules for 2026", annual payroll period (Tables 1, 3, 4, 5, 6, 7).
 *  - NY: Method II Exact Calculation, 2026 — Publication NYS-50-T-NYS (1/26),
 *    Annual Tax Rate Schedule + Table A.
 *
 * Every result is a *withholding estimate*, not a tax-return liability. Local
 * city/county taxes (e.g. NYC, Yonkers, Philadelphia wage tax) are NOT included.
 */

import { type Cents, multiplyCents } from "../money.js";
import type { FilingStatus, JurisdictionResult, StateCode } from "./types.js";

const NO_INCOME_TAX_STATES: StateCode[] = ["TX", "FL", "WA", "TN", "NV", "SD", "WY", "AK", "NH"];

export const SUPPORTED_STATES: StateCode[] = [...NO_INCOME_TAX_STATES, "PA", "IL", "CA", "NY"];

export const STATE_LABELS: Record<StateCode, string> = {
  none: "No state selected",
  other: "Another US state (not yet supported)",
  TX: "Texas",
  FL: "Florida",
  WA: "Washington",
  TN: "Tennessee",
  NV: "Nevada",
  SD: "South Dakota",
  WY: "Wyoming",
  AK: "Alaska",
  NH: "New Hampshire",
  PA: "Pennsylvania",
  IL: "Illinois",
  CA: "California",
  NY: "New York",
};

interface StateInput {
  state: StateCode;
  taxYear: number;
  filingStatus: FilingStatus;
  annualTaxableWagesCents: Cents;
  payPeriodsPerYear: number;
  allowances: number | undefined;
}

interface AnnualBracket {
  overCents: Cents;
  baseCents: Cents;
  rate: number;
}

const b = (over: number, base: number, rate: number): AnnualBracket => ({
  overCents: Math.round(over * 100),
  baseCents: Math.round(base * 100),
  rate,
});

function applyAnnualBrackets(taxableCents: Cents, brackets: AnnualBracket[]): Cents {
  let chosen = brackets[0]!;
  for (const br of brackets) {
    if (taxableCents > br.overCents) chosen = br;
    else break;
  }
  return chosen.baseCents + multiplyCents(taxableCents - chosen.overCents, chosen.rate);
}

// ---- CA 2026 Method B annual data (EDD DE 44) ------------------------------

const CA_2026 = {
  lowIncomeExemption: { single: 18_896_00, married: 37_791_00, hoh: 37_791_00 },
  standardDeduction: { single: 5_706_00, married: 11_412_00, hoh: 11_412_00 },
  exemptionCreditAnnualPerAllowance: 168_30, // Table 4, annual, one allowance
  // Table 5 (Single / dual-income married), Table 6 (Married), Table 7 (HoH)
  single: [
    b(0, 0, 0.011),
    b(11_079, 121.87, 0.022),
    b(26_264, 455.94, 0.044),
    b(41_452, 1_124.21, 0.066),
    b(57_542, 2_186.15, 0.088),
    b(72_724, 3_522.17, 0.1023),
    b(371_479, 34_084.81, 0.1133),
    b(445_771, 42_502.09, 0.1243),
    b(742_953, 79_441.81, 0.1353),
    b(1_000_000, 114_220.27, 0.1463),
  ],
  married: [
    b(0, 0, 0.011),
    b(22_158, 243.74, 0.022),
    b(52_528, 911.88, 0.044),
    b(82_904, 2_248.42, 0.066),
    b(115_084, 4_372.3, 0.088),
    b(145_448, 7_044.33, 0.1023),
    b(742_958, 68_169.6, 0.1133),
    b(891_542, 85_004.17, 0.1243),
    b(1_000_000, 98_485.5, 0.1353),
    b(1_485_906, 164_228.58, 0.1463),
  ],
  hoh: [
    b(0, 0, 0.011),
    b(22_173, 243.9, 0.022),
    b(52_530, 911.75, 0.044),
    b(67_716, 1_579.93, 0.066),
    b(83_805, 2_641.8, 0.088),
    b(98_990, 3_978.08, 0.1023),
    b(505_208, 45_534.18, 0.1133),
    b(606_251, 56_982.35, 0.1243),
    b(1_000_000, 105_925.35, 0.1353),
    b(1_010_417, 107_334.77, 0.1463),
  ],
  source: "California EDD DE 44 — California Withholding Schedules for 2026, Method B (annual)",
};

// ---- NY 2026 Method II annual data (NYS-50-T-NYS 1/26) --------------------

const NY_2026 = {
  // Table A combined deduction + exemption allowance (annual): base + 1000 * exemptions
  tableABaseAnnual: { single: 7_400_00, married: 7_950_00 },
  tableAPerExemptionAnnual: 1_000_00,
  single: [
    b(0, 0, 0.039),
    b(8_500, 332, 0.044),
    b(11_700, 472, 0.0515),
    b(13_900, 586, 0.054),
    b(80_650, 4_190, 0.059),
    b(96_800, 5_143, 0.0703),
    b(107_650, 5_906, 0.0753),
    b(157_650, 9_673, 0.064),
    b(215_400, 13_369, 0.1144),
    b(265_400, 19_091, 0.0735),
  ],
  married: [
    b(0, 0, 0.039),
    b(8_500, 332, 0.044),
    b(11_700, 472, 0.0515),
    b(13_900, 586, 0.054),
    b(80_650, 4_190, 0.059),
    b(96_800, 5_143, 0.0657),
    b(107_650, 5_855, 0.0707),
    b(157_650, 9_388, 0.0801),
    b(211_550, 13_708, 0.064),
    b(323_200, 20_854, 0.1349),
    b(373_200, 27_600, 0.0735),
    b(1_077_550, 79_369, 0.0765),
  ],
  source: "NY Publication NYS-50-T-NYS (1/26) — Annual Tax Rate Schedule + Table A",
};

function unsupported(reason: string): JurisdictionResult {
  return { supported: false, reason, withholdingPerPeriodCents: 0, withholdingAnnualCents: 0, lines: [] };
}

function flat(perPeriod: Cents, periods: number, lines: JurisdictionResult["lines"], source: string): JurisdictionResult {
  return {
    supported: true,
    withholdingPerPeriodCents: perPeriod,
    withholdingAnnualCents: perPeriod * periods,
    lines,
    source,
  };
}

export function computeStateWithholding(input: StateInput): JurisdictionResult {
  const { state, annualTaxableWagesCents: annual, payPeriodsPerYear } = input;
  const periods = Math.max(1, payPeriodsPerYear);

  if (state === "none") {
    return { supported: true, withholdingPerPeriodCents: 0, withholdingAnnualCents: 0, lines: [], source: "No state selected" };
  }

  if (state === "other") {
    return unsupported(
      "This US state isn't supported yet. We only publish a paycheck estimate where we have validated 2026 state withholding tables. The federal and FICA figures below still apply; your real paycheck will be lower by your state's income tax.",
    );
  }

  if (input.taxYear !== 2026) {
    return unsupported(`State withholding is only available for tax year 2026. ${input.taxYear} is not supported.`);
  }

  if (NO_INCOME_TAX_STATES.includes(state)) {
    return {
      supported: true,
      withholdingPerPeriodCents: 0,
      withholdingAnnualCents: 0,
      lines: [{ key: "state_none", label: `${STATE_LABELS[state]} — no state income tax on wages`, amountCents: 0 }],
      source: `${STATE_LABELS[state]} does not tax wage income`,
    };
  }

  if (state === "PA") {
    const perPeriodTax = multiplyCents(Math.round(annual / periods), 0.0307);
    return flat(
      perPeriodTax,
      periods,
      [{ key: "pa_flat", label: "Pennsylvania income tax (3.07% flat)", amountCents: perPeriodTax, note: "PA has no allowances or standard deduction. Local wage taxes (e.g. Philadelphia) are not included." }],
      "PA Department of Revenue — flat 3.07%",
    );
  }

  if (state === "IL") {
    const allowances = input.allowances ?? 1;
    const exemption = allowances * 2_925_00; // 2026 IL personal exemption allowance
    const taxable = Math.max(0, annual - exemption);
    const annualTax = multiplyCents(taxable, 0.0495);
    const perPeriod = Math.round(annualTax / periods);
    return flat(
      perPeriod,
      periods,
      [
        { key: "il_exemption", label: `Illinois allowances (${allowances} × $2,925)`, amountCents: -exemption },
        { key: "il_tax", label: "Illinois income tax (4.95% flat)", amountCents: perPeriod },
      ],
      "IL Booklet IL-700-T (2026) — 4.95%, $2,925 exemption allowance",
    );
  }

  if (state === "CA") {
    const status: "single" | "married" | "hoh" =
      input.filingStatus === "mfj" ? "married" : input.filingStatus === "hoh" ? "hoh" : "single";
    const allowances = input.allowances ?? (status === "married" ? 2 : 1);
    const lowInc = CA_2026.lowIncomeExemption[status];
    if (annual <= lowInc) {
      return flat(
        0,
        periods,
        [{ key: "ca_low_income", label: "California — below the low income exemption threshold", amountCents: 0 }],
        CA_2026.source,
      );
    }
    const taxable = Math.max(0, annual - CA_2026.standardDeduction[status]);
    const computedTax = applyAnnualBrackets(taxable, CA_2026[status]);
    const credit = allowances * CA_2026.exemptionCreditAnnualPerAllowance;
    const annualWithholding = Math.max(0, computedTax - credit);
    const perPeriod = Math.round(annualWithholding / periods);
    return flat(
      perPeriod,
      periods,
      [
        { key: "ca_std_deduction", label: "California standard deduction", amountCents: -CA_2026.standardDeduction[status] },
        { key: "ca_computed_tax", label: "California computed tax (Method B)", amountCents: computedTax },
        { key: "ca_exemption_credit", label: `Exemption allowance credit (${allowances} × $168.30)`, amountCents: -credit },
      ],
      CA_2026.source,
    );
  }

  if (state === "NY") {
    const marital: "single" | "married" = input.filingStatus === "mfj" ? "married" : "single";
    const exemptions = input.allowances ?? (marital === "married" ? 1 : 0);
    const tableA = NY_2026.tableABaseAnnual[marital] + Math.max(0, exemptions) * NY_2026.tableAPerExemptionAnnual;
    const netWages = Math.max(0, annual - tableA);
    const annualTax = applyAnnualBrackets(netWages, NY_2026[marital]);
    const perPeriod = Math.round(annualTax / periods);
    return flat(
      perPeriod,
      periods,
      [
        { key: "ny_table_a", label: `NY deduction + ${exemptions} exemption(s)`, amountCents: -tableA },
        { key: "ny_tax", label: "New York State income tax (Method II)", amountCents: perPeriod, note: "New York City and Yonkers resident taxes are not included." },
      ],
      NY_2026.source,
    );
  }

  return unsupported(`${state} is not a supported state for tax year 2026.`);
}
