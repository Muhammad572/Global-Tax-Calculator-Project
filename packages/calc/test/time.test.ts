import { describe, expect, it } from "vitest";
import {
  accumulateDuration,
  decimalHoursToMinutes,
  formatDuration,
  formatTimeOfDay,
  minutesToDecimalHours,
  parseTimeOfDay,
  roundMinutes,
  spanMinutes,
} from "../src/time.js";

describe("parseTimeOfDay", () => {
  it.each([
    ["9", 540],
    ["9:30", 570],
    ["09:30", 570],
    ["9:30 AM", 570],
    ["9:30am", 570],
    ["9.30pm", 21 * 60 + 30],
    ["0930", 570],
    ["1745", 17 * 60 + 45],
    ["17:45", 17 * 60 + 45],
    ["12am", 0],
    ["12:00 AM", 0],
    ["12pm", 720],
    ["12:00 PM", 720],
    ["24:00", 0],
    ["2400", 0],
    ["11:59 PM", 23 * 60 + 59],
  ])("parses %s -> %i", (input, expected) => {
    const r = parseTimeOfDay(input);
    expect(r.ok && r.minutes).toBe(expected);
  });

  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["nope", "format"],
    ["25:00", "range"],
    ["9:75", "range"],
    ["13:00 PM", "range"],
    ["0:00 AM", "range"],
  ])("rejects %s -> %s", (input, reason) => {
    const r = parseTimeOfDay(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(reason);
  });
});

describe("formatTimeOfDay", () => {
  it("12h and 24h", () => {
    expect(formatTimeOfDay(540)).toBe("9:00 AM");
    expect(formatTimeOfDay(21 * 60 + 5)).toBe("9:05 PM");
    expect(formatTimeOfDay(0)).toBe("12:00 AM");
    expect(formatTimeOfDay(720)).toBe("12:00 PM");
    expect(formatTimeOfDay(540, { clock: "24h" })).toBe("09:00");
    expect(formatTimeOfDay(1425, { clock: "24h" })).toBe("23:45");
  });
  it("normalizes out-of-range / rounds", () => {
    expect(formatTimeOfDay(1440)).toBe("12:00 AM");
    expect(formatTimeOfDay(-60)).toBe("11:00 PM");
    expect(formatTimeOfDay(540.6)).toBe("9:01 AM");
  });
});

describe("formatDuration", () => {
  it.each([
    [450, "hm", "7h 30m"],
    [60, "hm", "1h"],
    [30, "hm", "30m"],
    [0, "hm", "0m"],
    [-90, "hm", "-1h 30m"],
    [450, "clock", "7:30"],
    [450, "decimal", "7.50"],
    [455, "decimal", "7.58"],
    [450, "hm-long", "7 hours 30 minutes"],
    [60, "hm-long", "1 hour"],
    [1, "hm-long", "1 minute"],
    [0, "hm-long", "0 minutes"],
  ])("%i as %s -> %s", (min, style, expected) => {
    expect(formatDuration(min, { style: style as never })).toBe(expected);
  });
});

describe("decimal hours", () => {
  it("minutesToDecimalHours", () => {
    expect(minutesToDecimalHours(450)).toBe(7.5);
    expect(minutesToDecimalHours(455)).toBe(7.58);
    expect(minutesToDecimalHours(465, 4)).toBe(7.75);
  });
  it("decimalHoursToMinutes", () => {
    expect(decimalHoursToMinutes(7.75)).toBe(465);
    expect(decimalHoursToMinutes(7.5)).toBe(450);
  });
});

describe("spanMinutes", () => {
  it("same-day span", () => {
    expect(spanMinutes(540, 1020)).toEqual({ minutes: 480, crossedMidnight: false });
  });
  it("overnight span rolls to next day", () => {
    expect(spanMinutes(22 * 60, 6 * 60)).toEqual({ minutes: 480, crossedMidnight: true });
  });
  it("equal times -> zero, not 24h", () => {
    expect(spanMinutes(540, 540)).toEqual({ minutes: 0, crossedMidnight: false });
  });
  it("no-overnight mode returns 0 when end <= start", () => {
    expect(spanMinutes(600, 300, { allowOvernight: false })).toEqual({ minutes: 0, crossedMidnight: false });
  });
});

describe("roundMinutes", () => {
  it("rounds to increment", () => {
    expect(roundMinutes(68, 15)).toBe(75);
    expect(roundMinutes(67, 15)).toBe(60);
    expect(roundMinutes(64, 6)).toBe(66);
    expect(roundMinutes(64, 1)).toBe(64);
  });
});

describe("accumulateDuration", () => {
  it("adds and subtracts time terms", () => {
    const r = accumulateDuration([
      { op: "+", hours: 8, minutes: 30 },
      { op: "+", hours: 1, minutes: 45 },
      { op: "-", minutes: 15 },
    ]);
    expect(r.totalMinutes).toBe(8 * 60 + 30 + 105 - 15);
    expect(r.totalSeconds).toBe(r.totalMinutes * 60);
  });
  it("can go negative", () => {
    expect(accumulateDuration([{ op: "-", hours: 2 }]).totalMinutes).toBe(-120);
  });
});
