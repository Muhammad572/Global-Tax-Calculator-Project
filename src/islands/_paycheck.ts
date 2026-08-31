/** Shared helpers for the Paycheck and Take-Home islands. */
import {
  FILING_STATUS_LABELS,
  STATE_LABELS,
  SUPPORTED_STATES,
  formatMoney,
  type FilingStatus,
  type PaycheckResult,
  type StateCode,
} from "@tinytools/calc";
import type { ResultRow } from "./_shared";

export const FILING_OPTIONS = (Object.keys(FILING_STATUS_LABELS) as FilingStatus[]).map((k) => ({
  value: k,
  label: FILING_STATUS_LABELS[k],
}));

const NO_TAX: StateCode[] = ["TX", "FL", "WA", "TN", "NV", "SD", "WY", "AK", "NH"];

/** Grouped options for the state <select>. */
export function stateOptionGroups(): { label: string; options: { value: string; label: string }[] }[] {
  const progressive = SUPPORTED_STATES.filter((c) => !NO_TAX.includes(c));
  return [
    { label: "— none —", options: [{ value: "none", label: "Select your state" }] },
    { label: "State income tax (2026 tables)", options: progressive.map((c) => ({ value: c, label: STATE_LABELS[c] })) },
    { label: "No state income tax on wages", options: NO_TAX.map((c) => ({ value: c, label: STATE_LABELS[c] })) },
    { label: "Other", options: [{ value: "other", label: STATE_LABELS.other }] },
  ];
}

export function filingStatus(v: string | undefined): FilingStatus {
  return (["single", "mfj", "hoh", "mfs"].includes(v ?? "") ? v : "single") as FilingStatus;
}

export function stateCode(v: string | undefined): StateCode {
  return (v && v in STATE_LABELS ? v : "none") as StateCode;
}

/**
 * Build the gross -> take-home deduction stack from an engine result.
 * `scale` converts a per-period cents figure to the display period (identity for
 * the Paycheck tool; ×periods for the Take-Home annual column, etc.).
 */
export function deductionRows(
  r: PaycheckResult,
  opts: { scale: (cents: number) => number; state: StateCode },
): ResultRow[] {
  const { scale, state } = opts;
  const rows: ResultRow[] = [
    { label: "Gross pay", value: formatMoney(scale(r.grossPerPeriodCents)), emphasis: "muted" },
  ];
  if (r.preTaxPerPeriodCents > 0) {
    rows.push({ label: "Pre-tax deductions (401k / HSA / §125)", value: `−${formatMoney(scale(r.preTaxPerPeriodCents))}`, emphasis: "muted" });
  }
  if (r.federal.supported) {
    rows.push({ label: "Federal income tax withholding", value: `−${formatMoney(scale(r.federal.withholdingPerPeriodCents))}`, emphasis: "muted" });
  }
  for (const line of r.fica.lines) {
    rows.push({ label: line.label, value: `−${formatMoney(scale(line.amountCents))}`, emphasis: "muted" });
  }
  if (r.state.supported && r.state.withholdingPerPeriodCents > 0) {
    rows.push({ label: `${STATE_LABELS[state] ?? "State"} income tax withholding`, value: `−${formatMoney(scale(r.state.withholdingPerPeriodCents))}`, emphasis: "muted" });
  } else if (r.state.supported && NO_TAX.includes(state)) {
    rows.push({ label: `${STATE_LABELS[state]} — no state income tax`, value: formatMoney(0), emphasis: "muted" });
  }
  if (r.postTaxPerPeriodCents > 0) {
    rows.push({ label: "Post-tax deductions", value: `−${formatMoney(scale(r.postTaxPerPeriodCents))}`, emphasis: "muted" });
  }
  rows.push({ label: "Take-home pay", value: formatMoney(scale(r.netPerPeriodCents)), emphasis: "positive" });
  return rows;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/**
 * The message for an unsupported jurisdiction/year. Escaped for defence in depth
 * even though the engine only ever produces literal strings + numbers here.
 */
export function unsupportedNote(r: PaycheckResult): string | null {
  if (r.supported) return null;
  return escapeHtml(r.reason ?? "This selection isn't fully supported yet.");
}
