import { describe, expect, it } from "vitest";
import { computeSingleSpan, computeTimeCard } from "../src/timecard.js";

describe("computeTimeCard — single day", () => {
  it("9:00 AM to 5:30 PM with 30 min lunch -> 8.0 h", () => {
    const r = computeTimeCard([{ start: "9:00 AM", end: "5:30 PM", unpaidBreakMinutes: 30 }]);
    expect(r.totalWorkedMinutes).toBe(480);
    expect(r.totalWorkedHours).toBe(8);
    expect(r.hasBlockingIssue).toBe(false);
    expect(r.days[0]?.crossedMidnight).toBe(false);
  });

  it("overnight shift 10:00 PM to 6:00 AM -> 8 h, crossedMidnight", () => {
    const r = computeTimeCard([{ start: "10:00 PM", end: "6:00 AM" }]);
    expect(r.totalWorkedMinutes).toBe(480);
    expect(r.days[0]?.crossedMidnight).toBe(true);
  });

  it("empty day is skipped, not an error", () => {
    const r = computeTimeCard([{ start: "", end: "" }, { start: "9", end: "17" }]);
    expect(r.days[0]?.skipped).toBe(true);
    expect(r.totalWorkedHours).toBe(8);
    expect(r.hasBlockingIssue).toBe(false);
  });

  it("half-filled day is a blocking issue", () => {
    const r = computeTimeCard([{ start: "9:00 AM", end: "" }]);
    expect(r.hasBlockingIssue).toBe(true);
    expect(r.issues.some((i) => i.code === "REQUIRED" && i.field === "days.0.end")).toBe(true);
  });

  it("unparseable time is a blocking issue", () => {
    const r = computeTimeCard([{ start: "banana", end: "5pm" }]);
    expect(r.hasBlockingIssue).toBe(true);
    expect(r.issues[0]?.code).toBe("UNPARSEABLE_TIME");
  });

  it("break longer than shift flags BREAK_EXCEEDS_SHIFT", () => {
    const r = computeTimeCard([{ start: "9:00", end: "9:20", unpaidBreakMinutes: 30 }]);
    expect(r.issues.some((i) => i.code === "BREAK_EXCEEDS_SHIFT")).toBe(true);
  });

  it("negative break flags NEGATIVE and is treated as 0", () => {
    const r = computeTimeCard([{ start: "9:00", end: "17:00", unpaidBreakMinutes: -15 }]);
    expect(r.issues.some((i) => i.code === "NEGATIVE")).toBe(true);
    expect(r.totalWorkedMinutes).toBe(480);
  });

  it("same start and end time flags INCONSISTENT_INPUT", () => {
    const r = computeTimeCard([{ start: "9:00", end: "9:00" }]);
    expect(r.issues.some((i) => i.code === "INCONSISTENT_INPUT")).toBe(true);
  });

  it("rounds worked minutes to the configured increment", () => {
    const r = computeTimeCard([{ start: "9:00", end: "5:07 PM" }], { roundToMinutes: 15 });
    // 8h07 -> 487 min -> nearest 15 = 480
    expect(r.totalWorkedMinutes).toBe(480);
  });
});

describe("computeTimeCard — week with overtime and pay", () => {
  it("five 9h days = 45h -> 40 reg + 5 OT, gross at $20 FLSA", () => {
    const days = Array.from({ length: 5 }, () => ({ start: "8:00 AM", end: "5:00 PM" }));
    const r = computeTimeCard(days, { hourlyRate: 20, overtime: { jurisdiction: "us-flsa" } });
    expect(r.totalWorkedHours).toBe(45);
    expect(r.regularHours).toBe(40);
    expect(r.overtimeHours).toBe(5);
    expect(r.regularPayCents).toBe(80000);
    expect(r.overtimePayCents).toBe(15000);
    expect(r.grossPayCents).toBe(95000);
  });

  it("California daily OT: one 10h day in an otherwise 32h week still yields OT", () => {
    const days = [
      { start: "8:00 AM", end: "6:00 PM" }, // 10h
      { start: "9:00 AM", end: "5:00 PM" }, // 8h
      { start: "9:00 AM", end: "5:00 PM" }, // 8h
      { start: "9:00 AM", end: "1:00 PM" }, // 4h
    ]; // 30h total, weekly < 40
    const r = computeTimeCard(days, { hourlyRate: 30, overtime: { jurisdiction: "us-ca" } });
    expect(r.overtimeHours).toBe(2);
    expect(r.regularHours).toBe(28);
  });

  it("bad hourly rate is reported and pay is null", () => {
    const r = computeTimeCard([{ start: "9", end: "17" }], { hourlyRate: "abc" });
    expect(r.issues.some((i) => i.code === "NOT_A_NUMBER" && i.field === "hourlyRate")).toBe(true);
    expect(r.grossPayCents).toBeNull();
  });

  it("no rate -> hours only, pay fields null", () => {
    const r = computeTimeCard([{ start: "9", end: "17" }]);
    expect(r.totalWorkedHours).toBe(8);
    expect(r.grossPayCents).toBeNull();
    expect(r.hourlyRateCents).toBeNull();
  });
});

describe("computeSingleSpan", () => {
  it("quick span with break and rate", () => {
    const r = computeSingleSpan({ start: "9:00 AM", end: "5:30 PM", unpaidBreakMinutes: 30, hourlyRate: 25 });
    expect(r.workedHours).toBe(8);
    expect(r.payCents).toBe(20000);
    expect(r.crossedMidnight).toBe(false);
  });
  it("overnight span", () => {
    const r = computeSingleSpan({ start: "11:00 PM", end: "7:00 AM" });
    expect(r.workedHours).toBe(8);
    expect(r.crossedMidnight).toBe(true);
    expect(r.payCents).toBeNull();
  });
});
