import { describe, expect, it } from "vitest";
import {
  formatMoney,
  fromCents,
  multiplyCents,
  roundHalfUp,
  sumCents,
  toCents,
} from "../src/money.js";

describe("money", () => {
  it("toCents rounds half away from zero", () => {
    expect(toCents(12.34)).toBe(1234);
    expect(toCents(12.345)).toBe(1235);
    expect(toCents(-5.5)).toBe(-550);
    expect(toCents(-0.01)).toBe(-1);
    expect(toCents(0)).toBe(0);
  });

  it("toCents handles non-finite input", () => {
    expect(toCents(Number.NaN)).toBe(0);
    expect(toCents(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("fromCents is the inverse for whole cents", () => {
    expect(fromCents(1234)).toBe(12.34);
    expect(fromCents(0)).toBe(0);
    expect(fromCents(-505)).toBe(-5.05);
  });

  it("avoids float drift that dollars math would introduce", () => {
    // 0.1 + 0.2 !== 0.3 in float; in cents it is exact.
    expect(sumCents([toCents(0.1), toCents(0.2)])).toBe(toCents(0.3));
  });

  it("multiplyCents applies a real factor and rounds", () => {
    expect(multiplyCents(2000, 1.5)).toBe(3000);
    expect(multiplyCents(1733, 40)).toBe(69320);
    expect(multiplyCents(2000, 0)).toBe(0);
    expect(multiplyCents(2000, Number.NaN)).toBe(0);
  });

  it("roundHalfUp", () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(-2.5)).toBe(-3);
    expect(roundHalfUp(2.4)).toBe(2);
  });

  it("formatMoney", () => {
    expect(formatMoney(123456)).toBe("$1,234.56");
    expect(formatMoney(100000, { trimZeroCents: true })).toBe("$1,000");
    expect(formatMoney(-2500)).toBe("-$25.00");
    expect(formatMoney(50000, { currency: "GBP", locale: "en-GB" })).toBe("£500.00");
  });
});
