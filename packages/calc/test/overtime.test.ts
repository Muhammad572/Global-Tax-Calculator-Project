import { describe, expect, it } from "vitest";
import {
  OVERTIME_RULES,
  computeOvertimePay,
  computeOvertimeSplit,
} from "../src/overtime.js";

const H = 60;

describe("computeOvertimeSplit — weekly rules", () => {
  it("FLSA: 45h week -> 40 reg + 5 OT", () => {
    const s = computeOvertimeSplit(45 * H, { jurisdiction: "us-flsa" });
    expect(s.regularMinutes).toBe(40 * H);
    expect(s.overtimeMinutes).toBe(5 * H);
    expect(s.doubleTimeMinutes).toBe(0);
    expect(s.multiplier).toBe(1.5);
  });

  it("FLSA: exactly 40h -> no OT", () => {
    const s = computeOvertimeSplit(40 * H, { jurisdiction: "us-flsa" });
    expect(s.overtimeMinutes).toBe(0);
    expect(s.regularMinutes).toBe(40 * H);
  });

  it("FLSA: under 40h -> all regular", () => {
    const s = computeOvertimeSplit(32 * H, { jurisdiction: "us-flsa" });
    expect(s.regularMinutes).toBe(32 * H);
    expect(s.overtimeMinutes).toBe(0);
  });

  it("Ontario: threshold is 44h not 40h", () => {
    const s = computeOvertimeSplit(46 * H, { jurisdiction: "ca-on" });
    expect(s.regularMinutes).toBe(44 * H);
    expect(s.overtimeMinutes).toBe(2 * H);
    expect(s.weeklyThresholdHours).toBe(44);
  });

  it("UK: default preset is contractual 40h / 1.5x with a legal note", () => {
    expect(OVERTIME_RULES.uk.legalNote).toMatch(/does not require/i);
    const s = computeOvertimeSplit(42 * H, { jurisdiction: "uk" });
    expect(s.overtimeMinutes).toBe(2 * H);
  });

  it("Australia: 1.5x for first 3 OT hours then 2x", () => {
    const s = computeOvertimeSplit(43 * H, { jurisdiction: "au" });
    expect(s.regularMinutes).toBe(38 * H);
    // 38..41 = 3h at 1.5x, 41..43 = 2h at 2x
    expect(s.overtimeMinutes).toBe(3 * H);
    expect(s.doubleTimeMinutes).toBe(2 * H);
  });

  it("custom: honours overrides", () => {
    const s = computeOvertimeSplit(50 * H, {
      jurisdiction: "custom",
      weeklyThresholdHours: 35,
      multiplier: 2,
    });
    expect(s.regularMinutes).toBe(35 * H);
    expect(s.overtimeMinutes).toBe(15 * H);
    expect(s.multiplier).toBe(2);
  });

  it("unknown jurisdiction falls back to FLSA", () => {
    // deliberately bad cast
    const s = computeOvertimeSplit(45 * H, { jurisdiction: "zz" as never });
    expect(s.weeklyThresholdHours).toBe(40);
    expect(s.overtimeMinutes).toBe(5 * H);
  });
});

describe("computeOvertimeSplit — California daily rules", () => {
  it("9h and 9h days in a 40h-week -> 2h daily OT even though weekly < 40", () => {
    const daily = [9 * H, 9 * H, 8 * H, 8 * H]; // 34h total
    const s = computeOvertimeSplit(34 * H, { jurisdiction: "us-ca" }, daily);
    expect(s.overtimeMinutes).toBe(2 * H);
    expect(s.regularMinutes).toBe(32 * H);
  });

  it("13h day -> 8 reg + 4 OT + 1 double time", () => {
    const s = computeOvertimeSplit(13 * H, { jurisdiction: "us-ca" }, [13 * H]);
    expect(s.regularMinutes).toBe(8 * H);
    expect(s.overtimeMinutes).toBe(4 * H);
    expect(s.doubleTimeMinutes).toBe(1 * H);
  });

  it("CA without per-day data adds a note and applies only weekly", () => {
    const s = computeOvertimeSplit(42 * H, { jurisdiction: "us-ca" });
    expect(s.overtimeMinutes).toBe(2 * H);
    expect(s.notes.join(" ")).toMatch(/no per-day hours/i);
  });
});

describe("computeOvertimePay", () => {
  it("time and a half on 5 OT hours at $20", () => {
    const p = computeOvertimePay({
      regularMinutes: 40 * H,
      overtimeMinutes: 5 * H,
      hourlyRateCents: 2000,
      multiplier: 1.5,
    });
    expect(p.regularPayCents).toBe(80000); // 40 * $20
    expect(p.overtimeRateCents).toBe(3000); // $30
    expect(p.overtimePayCents).toBe(15000); // 5 * $30
    expect(p.grossPayCents).toBe(95000);
  });

  it("includes double time", () => {
    const p = computeOvertimePay({
      regularMinutes: 8 * H,
      overtimeMinutes: 4 * H,
      doubleTimeMinutes: 1 * H,
      hourlyRateCents: 3000,
      multiplier: 1.5,
      doubleMultiplier: 2,
    });
    expect(p.regularPayCents).toBe(24000);
    expect(p.overtimePayCents).toBe(18000); // 4 * $45
    expect(p.doubleTimePayCents).toBe(6000); // 1 * $60
    expect(p.grossPayCents).toBe(48000);
  });

  it("zero rate -> zero pay", () => {
    const p = computeOvertimePay({ regularMinutes: 2400, overtimeMinutes: 0, hourlyRateCents: 0, multiplier: 1.5 });
    expect(p.grossPayCents).toBe(0);
  });
});
