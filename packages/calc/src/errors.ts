/**
 * Typed calculation errors. The engine never throws for *expected* bad input
 * (empty fields, out-of-range values, unparseable times) — it returns a result
 * whose `errors` array holds `CalcIssue`s the UI renders inline next to the
 * offending field. `CalcError` is thrown only for programmer misuse.
 */

export type CalcIssueCode =
  | "REQUIRED"
  | "NOT_A_NUMBER"
  | "OUT_OF_RANGE"
  | "UNPARSEABLE_TIME"
  | "END_BEFORE_START"
  | "NEGATIVE"
  | "BREAK_EXCEEDS_SHIFT"
  | "INCONSISTENT_INPUT"
  | "UNSUPPORTED_JURISDICTION";

export interface CalcIssue {
  code: CalcIssueCode;
  /** Machine key for the field this issue belongs to (e.g. `"days.2.end"`). */
  field?: string;
  /** Human-readable, UI-ready message. */
  message: string;
}

export function issue(code: CalcIssueCode, message: string, field?: string): CalcIssue {
  return field === undefined ? { code, message } : { code, message, field };
}

/** Thrown only for misuse of the API (bad enum, impossible config). Not for user input. */
export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalcError";
  }
}
