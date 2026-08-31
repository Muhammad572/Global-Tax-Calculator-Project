import { describe, expect, it } from "vitest";
import {
  annualWorkingHours,
  businessDaysBetween,
  businessDaysInYear,
  fullTimeEquivalent,
  weeklyHoursFromShifts,
} from "../src/workingHours.js";

describe("annualWorkingHours", () => {
  it("standard full-time: 40h x 52wk = 2080", () => {
    const r = annualWorkingHours();
    expect(r.scheduledHoursPerYear).toBe(2080);
    expect(r.hoursPerWorkday).toBe(8);
    expect(r.workedHoursPerYear).toBe(2080);
  });
  it("subtracts PTO and holidays from worked hours", () => {
    const r = annualWorkingHours({ ptoDaysPerYear: 15, holidayDaysPerYear: 11 });
    expect(r.ptoHoursPerYear).toBe(26 * 8);
    expect(r.workedHoursPerYear).toBe(2080 - 208);
    expect(r.notes.join(" ")).toMatch(/26 days off/);
  });
  it("part-time 30h week", () => {
    const r = annualWorkingHours({ hoursPerWeek: 30 });
    expect(r.scheduledHoursPerYear).toBe(1560);
    expect(r.scheduledHoursPerMonth).toBe(130);
  });
});

describe("businessDays", () => {
  it("2025 has 261 Mon-Fri weekdays", () => {
    expect(businessDaysInYear(2025)).toBe(261);
  });
  it("2024 (leap, starts Monday) has 262", () => {
    expect(businessDaysInYear(2024)).toBe(262);
  });
  it("holidays on weekdays reduce the count", () => {
    // 2025-07-04 is a Friday
    expect(businessDaysInYear(2025, { holidays: ["2025-07-04"] })).toBe(260);
  });
  it("a holiday on a weekend does not reduce the count", () => {
    // 2025-11-29 is a Saturday
    expect(businessDaysInYear(2025, { holidays: ["2025-11-29"] })).toBe(261);
  });
  it("inclusive range", () => {
    // Mon 2025-06-02 .. Fri 2025-06-06 = 5
    expect(businessDaysBetween("2025-06-02", "2025-06-06")).toBe(5);
    // include the weekend either side -> still 5
    expect(businessDaysBetween("2025-05-31", "2025-06-08")).toBe(5);
  });
  it("reversed or invalid range -> 0", () => {
    expect(businessDaysBetween("2025-06-06", "2025-06-02")).toBe(0);
    expect(businessDaysBetween("nope", "2025-06-02")).toBe(0);
  });
  it("custom working week (Sun-Thu)", () => {
    expect(businessDaysBetween("2025-06-01", "2025-06-07", { workingWeekdays: [0, 1, 2, 3, 4] })).toBe(5);
  });
});

describe("fullTimeEquivalent", () => {
  it("30 of 40 hours = 0.75 FTE", () => {
    expect(fullTimeEquivalent(30).fte).toBe(0.75);
  });
  it("respects a custom full-time week", () => {
    expect(fullTimeEquivalent(37.5, 37.5).fte).toBe(1);
  });
});

describe("weeklyHoursFromShifts", () => {
  it("sums shift minutes into decimal hours", () => {
    expect(weeklyHoursFromShifts([480, 480, 450, 510, 240])).toBe(36);
  });
});
