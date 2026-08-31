import { describe, expect, it } from "vitest";
import { fromCents, toCents } from "../src/money.js";
import {
  annualize,
  applyRaise,
  convertPay,
  convertPayTo,
  deannualize,
  periodsPerYear,
  realHourlyRate,
} from "../src/payConversion.js";

describe("periodsPerYear", () => {
  it("fixed frequencies", () => {
    expect(periodsPerYear("weekly")).toBe(52);
    expect(periodsPerYear("biweekly")).toBe(26);
    expect(periodsPerYear("semimonthly")).toBe(24);
    expect(periodsPerYear("monthly")).toBe(12);
    expect(periodsPerYear("annual")).toBe(1);
  });
  it("schedule-derived frequencies", () => {
    expect(periodsPerYear("hourly")).toBe(2080);
    expect(periodsPerYear("hourly", { hoursPerWeek: 37.5, weeksPerYear: 52 })).toBe(1950);
    expect(periodsPerYear("daily", { daysPerWeek: 5, weeksPerYear: 50 })).toBe(250);
  });
});

describe("convert", () => {
  it("$25/hr -> $52,000/yr at 40h x 52wk", () => {
    expect(annualize(toCents(25), "hourly")).toBe(toCents(52000));
  });
  it("$52,000/yr -> $25/hr", () => {
    expect(fromCents(deannualize(toCents(52000), "hourly"))).toBe(25);
  });
  it("$60,000/yr -> biweekly", () => {
    expect(fromCents(convertPayTo(toCents(60000), "annual", "biweekly"))).toBeCloseTo(2307.69, 2);
  });
  it("convertPay returns every frequency + assumptions + notes", () => {
    const r = convertPay(toCents(25), "hourly");
    expect(fromCents(r.annualCents)).toBe(52000);
    expect(fromCents(r.perFrequency.monthly)).toBeCloseTo(4333.33, 2);
    expect(fromCents(r.perFrequency.weekly)).toBe(1000);
    expect(r.assumptions.hoursPerWeek).toBe(40);
    expect(r.notes.join(" ")).toMatch(/2080 paid hours/);
  });
  it("part-time hours change the hourly figure", () => {
    const r = convertPay(toCents(50000), "annual", { hoursPerWeek: 30 });
    // 50000 / (30*52) = 32.05
    expect(fromCents(r.perFrequency.hourly)).toBeCloseTo(32.05, 2);
  });
  it("weeksPerYear < 52 adds an unpaid-time-off note", () => {
    const r = convertPay(toCents(30), "hourly", { weeksPerYear: 48 });
    expect(r.notes.join(" ")).toMatch(/unpaid time off/i);
  });
});

describe("applyRaise", () => {
  it("percentage raise", () => {
    const r = applyRaise(toCents(50000), "annual", { percent: 4 });
    expect(fromCents(r.newAnnualCents)).toBe(52000);
    expect(fromCents(r.increaseCents)).toBe(2000);
    expect(r.increasePercent).toBe(4);
  });
  it("flat raise on an hourly rate", () => {
    const r = applyRaise(toCents(20), "hourly", { flatAnnualCents: toCents(2080) });
    // +$2080/yr on $41,600 base
    expect(fromCents(r.oldAnnualCents)).toBe(41600);
    expect(fromCents(r.newAnnualCents)).toBe(43680);
    expect(fromCents(r.newPerFrequency.hourly)).toBe(21);
  });
});

describe("realHourlyRate", () => {
  it("salaried worker's real hourly exceeds salary/2080 once PTO is removed", () => {
    const r = realHourlyRate({
      annualCents: toCents(104000),
      ptoDaysPerYear: 15,
      holidayDaysPerYear: 10,
    });
    expect(fromCents(r.nominalHourlyCents)).toBe(50); // 104000/2080
    expect(r.workedHoursPerYear).toBe(2080 - 25 * 8);
    expect(fromCents(r.realHourlyCents)).toBeGreaterThan(50);
  });
  it("no PTO -> real == nominal", () => {
    const r = realHourlyRate({ annualCents: toCents(52000) });
    expect(r.realHourlyCents).toBe(r.nominalHourlyCents);
  });
});
