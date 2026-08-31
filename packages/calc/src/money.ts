/**
 * Money math. All monetary values in the engine are integer **cents** to avoid
 * binary floating-point drift (0.1 + 0.2 !== 0.3). Convert at the UI boundary
 * only.
 */

export type Cents = number;

/** Round half away from zero — matches how payroll amounts are conventionally rounded. */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** Dollars (possibly fractional) -> integer cents. `$12.345` -> `1235`. */
export function toCents(dollars: number): Cents {
  if (!Number.isFinite(dollars)) return 0;
  return roundHalfUp(dollars * 100);
}

/** Integer cents -> dollars as a Number. `1235` -> `12.35`. */
export function fromCents(cents: Cents): number {
  return roundHalfUp(cents) / 100;
}

/**
 * Multiply a cents amount by a real-number factor (e.g. an hourly rate by hours,
 * or a rate by an overtime multiplier), returning integer cents.
 */
export function multiplyCents(cents: Cents, factor: number): Cents {
  if (!Number.isFinite(factor)) return 0;
  return roundHalfUp(cents * factor);
}

/** Sum a list of cents amounts. */
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((total, v) => total + roundHalfUp(v), 0);
}

export interface FormatMoneyOptions {
  /** ISO 4217 currency code. Default `"USD"`. */
  currency?: string;
  /** BCP-47 locale. Default `"en-US"`. */
  locale?: string;
  /** Omit the fractional part when it is `.00`. Default `false`. */
  trimZeroCents?: boolean;
}

/** Format integer cents as a localized currency string. */
export function formatMoney(cents: Cents, options: FormatMoneyOptions = {}): string {
  const { currency = "USD", locale = "en-US", trimZeroCents = false } = options;
  const amount = fromCents(cents);
  const fractionDigits = trimZeroCents && Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
}
