import { describe, expect, it } from "vitest";
import { fromCents, toCents } from "../src/money.js";
import { computeFica } from "../src/paycheck/fica.js";
import { computeFederalWithholding } from "../src/paycheck/federal.js";
import { computeStateWithholding } from "../src/paycheck/states.js";
import {
  computePaycheck,
  computeTakeHomeFromAnnualSalary,
  getSupportedJurisdictions,
} from "../src/paycheck/index.js";

describe("FICA 2026", () => {
  it("Social Security 6.2% + Medicare 1.45% below the wage base", () => {
    const r = computeFica({
      taxableSsWagesPerPeriodCents: toCents(2000),
      taxableMedicareWagesPerPeriodCents: toCents(2000),
      payPeriodsPerYear: 26,
      taxYear: 2026,
    });
    expect(fromCents(r.lines.find((l) => l.key === "social_security")!.amountCents)).toBeCloseTo(124, 2);
    expect(fromCents(r.lines.find((l) => l.key === "medicare")!.amountCents)).toBeCloseTo(29, 2);
  });

  it("caps Social Security at the $184,500 wage base", () => {
    const r = computeFica({
      taxableSsWagesPerPeriodCents: toCents(20000), // $520k/yr
      taxableMedicareWagesPerPeriodCents: toCents(20000),
      payPeriodsPerYear: 26,
      taxYear: 2026,
    });
    // Max SS for 2026 = 184,500 * 0.062 = $11,439
    expect(fromCents(r.withholdingAnnualCents)).toBeGreaterThan(0);
    const ssAnnual = r.lines.find((l) => l.key === "social_security")!.amountCents * 26;
    expect(fromCents(ssAnnual)).toBeCloseTo(11439, 0);
  });

  it("adds Additional Medicare 0.9% over $200k/year", () => {
    const r = computeFica({
      taxableSsWagesPerPeriodCents: toCents(10000),
      taxableMedicareWagesPerPeriodCents: toCents(10000), // $260k/yr
      payPeriodsPerYear: 26,
      taxYear: 2026,
    });
    const addl = r.lines.find((l) => l.key === "additional_medicare");
    expect(addl).toBeDefined();
    // 0.9% * (260,000 - 200,000) = $540/yr
    expect(fromCents(addl!.amountCents * 26)).toBeCloseTo(540, 0);
  });

  it("unsupported year", () => {
    const r = computeFica({
      taxableSsWagesPerPeriodCents: 1000,
      taxableMedicareWagesPerPeriodCents: 1000,
      payPeriodsPerYear: 26,
      taxYear: 2019,
    });
    expect(r.supported).toBe(false);
  });
});

describe("Federal withholding 2026 (Pub 15-T percentage method)", () => {
  it("single, $60,000/yr, standard W-4 -> $5,020 annual tentative", () => {
    const r = computeFederalWithholding({
      annualTaxableWagesCents: toCents(60000),
      filingStatus: "single",
      taxYear: 2026,
      payPeriodsPerYear: 52,
      step2Checkbox: false,
      dependentsAnnualCents: 0,
      otherIncomeAnnualCents: 0,
      deductionsAnnualCents: 0,
      extraPerPeriodCents: 0,
    });
    // AAWA = 60,000 - 8,600 = 51,400 -> 1,240 + 12% of (51,400 - 19,900) = 5,020
    expect(fromCents(r.withholdingAnnualCents)).toBeCloseTo(5020, 0);
  });

  it("MFJ, $120,000/yr, standard -> 0% band then 10% then 12%", () => {
    const r = computeFederalWithholding({
      annualTaxableWagesCents: toCents(120000),
      filingStatus: "mfj",
      taxYear: 2026,
      payPeriodsPerYear: 26,
      step2Checkbox: false,
      dependentsAnnualCents: 0,
      otherIncomeAnnualCents: 0,
      deductionsAnnualCents: 0,
      extraPerPeriodCents: 0,
    });
    // AAWA = 120,000 - 12,900 = 107,100 -> 2,480 + 12% of (107,100 - 44,100) = 10,040
    expect(fromCents(r.withholdingAnnualCents)).toBeCloseTo(10040, 0);
  });

  it("Step 3 dependent credits reduce withholding", () => {
    const base = {
      annualTaxableWagesCents: toCents(80000),
      filingStatus: "single" as const,
      taxYear: 2026,
      payPeriodsPerYear: 26,
      step2Checkbox: false,
      otherIncomeAnnualCents: 0,
      deductionsAnnualCents: 0,
      extraPerPeriodCents: 0,
    };
    const without = computeFederalWithholding({ ...base, dependentsAnnualCents: 0 });
    const withKids = computeFederalWithholding({ ...base, dependentsAnnualCents: toCents(4000) });
    expect(without.withholdingAnnualCents - withKids.withholdingAnnualCents).toBeCloseTo(toCents(4000), -2);
  });

  it("very low wage -> zero withholding, never negative", () => {
    const r = computeFederalWithholding({
      annualTaxableWagesCents: toCents(9000),
      filingStatus: "single",
      taxYear: 2026,
      payPeriodsPerYear: 52,
      step2Checkbox: false,
      dependentsAnnualCents: 0,
      otherIncomeAnnualCents: 0,
      deductionsAnnualCents: 0,
      extraPerPeriodCents: 0,
    });
    expect(r.withholdingAnnualCents).toBe(0);
  });

  it("unsupported year", () => {
    const r = computeFederalWithholding({
      annualTaxableWagesCents: toCents(50000),
      filingStatus: "single",
      taxYear: 2024,
      payPeriodsPerYear: 52,
      step2Checkbox: false,
      dependentsAnnualCents: 0,
      otherIncomeAnnualCents: 0,
      deductionsAnnualCents: 0,
      extraPerPeriodCents: 0,
    });
    expect(r.supported).toBe(false);
  });
});

describe("State withholding 2026", () => {
  const common = { taxYear: 2026, payPeriodsPerYear: 26, filingStatus: "single" as const, allowances: undefined };

  it("no-income-tax states withhold $0", () => {
    for (const state of ["TX", "FL", "WA"] as const) {
      const r = computeStateWithholding({ ...common, state, annualTaxableWagesCents: toCents(80000) });
      expect(r.supported).toBe(true);
      expect(r.withholdingPerPeriodCents).toBe(0);
    }
  });

  it("Pennsylvania flat 3.07%", () => {
    const r = computeStateWithholding({ ...common, state: "PA", annualTaxableWagesCents: toCents(52000) });
    // 3.07% of 52,000 = 1,596.40/yr
    expect(fromCents(r.withholdingAnnualCents)).toBeCloseTo(1596.4, 0);
  });

  it("Illinois 4.95% after one $2,925 allowance", () => {
    const r = computeStateWithholding({ ...common, state: "IL", annualTaxableWagesCents: toCents(60000), allowances: 1 });
    // (60,000 - 2,925) * 4.95% = 2,825.21/yr
    expect(fromCents(r.withholdingAnnualCents)).toBeCloseTo(2825.21, 0);
  });

  it("California Method B matches EDD DE 44 worked Example F ($57,000 married, 4 allowances -> $86.00/yr)", () => {
    const r = computeStateWithholding({
      state: "CA",
      taxYear: 2026,
      payPeriodsPerYear: 12,
      filingStatus: "mfj",
      annualTaxableWagesCents: toCents(57000),
      allowances: 4,
    });
    expect(fromCents(r.withholdingAnnualCents)).toBeCloseTo(86, 0);
  });

  it("California below the low income exemption -> $0", () => {
    const r = computeStateWithholding({
      state: "CA",
      taxYear: 2026,
      payPeriodsPerYear: 26,
      filingStatus: "single",
      annualTaxableWagesCents: toCents(15000),
      allowances: 1,
    });
    expect(r.withholdingPerPeriodCents).toBe(0);
  });

  it("New York produces a positive, sane withholding", () => {
    const r = computeStateWithholding({
      state: "NY",
      taxYear: 2026,
      payPeriodsPerYear: 26,
      filingStatus: "single",
      annualTaxableWagesCents: toCents(70000),
      allowances: 1,
    });
    expect(r.supported).toBe(true);
    const annual = fromCents(r.withholdingAnnualCents);
    expect(annual).toBeGreaterThan(2500);
    expect(annual).toBeLessThan(4500);
  });

  it("unsupported year for a taxed state", () => {
    const r = computeStateWithholding({ state: "CA", taxYear: 2025, payPeriodsPerYear: 26, filingStatus: "single", annualTaxableWagesCents: toCents(50000), allowances: 1 });
    expect(r.supported).toBe(false);
  });
});

describe("computePaycheck orchestration", () => {
  it("full biweekly paycheck: TX, single, $2,000/period", () => {
    const r = computePaycheck({
      grossPerPeriodCents: toCents(2000),
      payFrequency: "biweekly",
      filingStatus: "single",
      taxYear: 2026,
      state: "TX",
    });
    expect(r.supported).toBe(true);
    expect(r.netPerPeriodCents).toBeLessThan(r.grossPerPeriodCents);
    expect(r.netPerPeriodCents).toBeGreaterThan(toCents(1500));
    // FICA alone is 7.65% = $153
    expect(fromCents(r.fica.withholdingPerPeriodCents)).toBeCloseTo(153, 0);
  });

  it("pre-tax 401k reduces taxable wages and withholding", () => {
    const base = {
      grossPerPeriodCents: toCents(3000),
      payFrequency: "biweekly" as const,
      filingStatus: "single" as const,
      taxYear: 2026,
      state: "PA" as const,
    };
    const no401k = computePaycheck(base);
    const with401k = computePaycheck({ ...base, preTaxPerPeriodCents: toCents(300) });
    expect(with401k.federal.withholdingPerPeriodCents).toBeLessThan(no401k.federal.withholdingPerPeriodCents);
    expect(with401k.taxablePerPeriodCents).toBe(toCents(2700));
  });

  it("unsupported state: federal+FICA only, clear disclaimer, still returns numbers", () => {
    const r = computePaycheck({
      grossPerPeriodCents: toCents(2500),
      payFrequency: "biweekly",
      filingStatus: "single",
      taxYear: 2026,
      state: "OH" as never,
    });
    expect(r.supported).toBe(false);
    expect(r.state.supported).toBe(false);
    expect(r.state.withholdingPerPeriodCents).toBe(0);
    expect(r.disclaimers.join(" ")).toMatch(/not a supported state/i);
    expect(r.netPerPeriodCents).toBeGreaterThan(0);
  });

  it("unsupported tax year", () => {
    const r = computePaycheck({
      grossPerPeriodCents: toCents(2000),
      payFrequency: "biweekly",
      filingStatus: "single",
      taxYear: 2030,
      state: "CA",
    });
    expect(r.supported).toBe(false);
    expect(r.reason).toMatch(/2030/);
  });

  it("computeTakeHomeFromAnnualSalary: $90k CA single", () => {
    const r = computeTakeHomeFromAnnualSalary({
      annualSalaryCents: toCents(90000),
      filingStatus: "single",
      taxYear: 2026,
      state: "CA",
    });
    expect(r.supported).toBe(true);
    const netAnnual = fromCents(r.netAnnualCents);
    // ~$66k-$70k take-home is the right neighbourhood for $90k CA single
    expect(netAnnual).toBeGreaterThan(62000);
    expect(netAnnual).toBeLessThan(74000);
  });
});

describe("getSupportedJurisdictions", () => {
  it("lists 2026 and the MVP states", () => {
    const s = getSupportedJurisdictions();
    expect(s.taxYears).toEqual([2026]);
    expect(s.states.map((x) => x.code)).toContain("CA");
    expect(s.states.map((x) => x.code)).toContain("TX");
    expect(s.states.map((x) => x.code)).not.toContain("OH");
    expect(s.states.map((x) => x.code)).not.toContain("other");
  });
});

describe("D4 boundary & consistency cases", () => {
  const base = {
    payFrequency: "biweekly" as const,
    filingStatus: "single" as const,
    taxYear: 2026,
    state: "TX" as const,
  };

  it("Social Security stops at the 2026 wage base ($184,500)", () => {
    const atBase = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: toCents(184_500) });
    const overBase = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: toCents(300_000) });
    const ss = (r: typeof atBase) => r.fica.lines.find((l) => l.key === "social_security")!.amountCents;
    expect(fromCents(ss(atBase))).toBeCloseTo(11_439, 0); // 184,500 * 6.2%
    expect(ss(overBase)).toBe(ss(atBase)); // capped — no more SS above the base
  });

  it("Additional Medicare kicks in only above $200,000/year", () => {
    const under = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: toCents(199_000) });
    const over = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: toCents(250_000) });
    expect(under.fica.lines.some((l) => l.key === "additional_medicare")).toBe(false);
    const addl = over.fica.lines.find((l) => l.key === "additional_medicare")!;
    expect(fromCents(addl.amountCents)).toBeCloseTo((250_000 - 200_000) * 0.009, 0);
  });

  it("filing status changes federal withholding (single > mfj at the same wage)", () => {
    const wage = toCents(100_000);
    const single = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: wage, filingStatus: "single" });
    const mfj = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: wage, filingStatus: "mfj" });
    const hoh = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: wage, filingStatus: "hoh" });
    expect(single.federal.withholdingAnnualCents).toBeGreaterThan(mfj.federal.withholdingAnnualCents);
    expect(single.federal.withholdingAnnualCents).toBeGreaterThan(hoh.federal.withholdingAnnualCents);
  });

  it("pay-frequency independence: net annual is stable across frequencies (within rounding)", () => {
    const salary = 78_000;
    const nets = (["weekly", "biweekly", "semimonthly", "monthly"] as const).map((payFrequency) => {
      const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 }[payFrequency];
      const r = computePaycheck({ ...base, payFrequency, grossPerPeriodCents: toCents(salary / periods), state: "CA" });
      return fromCents(r.netPerPeriodCents * periods);
    });
    const spread = Math.max(...nets) - Math.min(...nets);
    expect(spread).toBeLessThan(150); // a few dollars of per-period rounding across a year
  });

  it("zero income -> zero withholding, net 0, no crash", () => {
    const r = computePaycheck({ ...base, grossPerPeriodCents: 0 });
    expect(r.totalWithholdingPerPeriodCents).toBe(0);
    expect(r.netPerPeriodCents).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });

  it("pre-tax deductions lower federal, state, AND net", () => {
    const noPre = computePaycheck({ ...base, grossPerPeriodCents: toCents(3000), state: "NY" });
    const withPre = computePaycheck({ ...base, grossPerPeriodCents: toCents(3000), state: "NY", preTaxPerPeriodCents: toCents(400) });
    expect(withPre.federal.withholdingPerPeriodCents).toBeLessThan(noPre.federal.withholdingPerPeriodCents);
    expect(withPre.state.withholdingPerPeriodCents).toBeLessThan(noPre.state.withholdingPerPeriodCents);
    expect(withPre.taxablePerPeriodCents).toBe(toCents(2600));
  });

  it("'other' US state -> not supported, federal + FICA still computed", () => {
    const r = computePaycheck({ ...base, state: "other", grossPerPeriodCents: toCents(2500) });
    expect(r.supported).toBe(false);
    expect(r.state.supported).toBe(false);
    expect(r.state.withholdingPerPeriodCents).toBe(0);
    expect(r.federal.supported).toBe(true);
    expect(r.fica.supported).toBe(true);
    expect(r.netPerPeriodCents).toBeGreaterThan(0);
    expect(r.disclaimers.join(" ")).toMatch(/isn't supported yet|not a supported state|not yet supported/i);
  });

  it("unsupported tax year -> nothing computed, clear reason", () => {
    const r = computePaycheck({ ...base, taxYear: 2027, grossPerPeriodCents: toCents(2500) });
    expect(r.supported).toBe(false);
    expect(r.federal.supported).toBe(false);
    expect(r.fica.supported).toBe(false);
    expect(r.reason).toMatch(/2027/);
  });

  it("high earner in CA: sane effective rate", () => {
    const r = computePaycheck({ ...base, payFrequency: "annual", grossPerPeriodCents: toCents(400_000), state: "CA", filingStatus: "single" });
    expect(r.effectiveRate).toBeGreaterThan(0.25);
    expect(r.effectiveRate).toBeLessThan(0.5);
  });
});
