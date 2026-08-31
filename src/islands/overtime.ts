import {
  computeOvertimePay,
  computeOvertimeSplit,
  formatMoney,
  OVERTIME_RULES,
  toCents,
  type OvertimeConfig,
  type OvertimeJurisdictionId,
} from "@tinytools/calc";
import {
  formValues,
  hydrateFromUrl,
  maybe,
  must,
  num,
  onLiveInput,
  renderErrors,
  renderResult,
  type ResultRow,
  track,
  wireActions,
  writeUrl,
} from "./_shared";

const URL_KEYS = ["rate", "jur", "total", "thresh", "mult", "mode", "reg", "ot"];

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  const customFields = maybe(root, "[data-custom-fields]");
  const totalField = maybe(root, "[data-total-field]");
  const splitFields = maybe(root, "[data-split-fields]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);
  syncVisibility();

  function syncVisibility(): void {
    const v = formValues(form);
    const isCustom = v.jur === "custom";
    if (customFields) customFields.hidden = !isCustom;
    const mode = v.mode || "total";
    if (totalField) totalField.hidden = mode !== "total";
    if (splitFields) splitFields.hidden = mode !== "split";

    // Reflect the preset's threshold/multiplier into the (read-only unless custom) inputs.
    const rule = OVERTIME_RULES[(v.jur || "us-flsa") as OvertimeJurisdictionId] ?? OVERTIME_RULES["us-flsa"];
    const weekly = rule.tiers.find((t) => t.basis === "weekly") ?? rule.tiers[0];
    const threshEl = form.elements.namedItem("thresh") as HTMLInputElement | null;
    const multEl = form.elements.namedItem("mult") as HTMLInputElement | null;
    if (threshEl && !isCustom && weekly) threshEl.value = String(weekly.thresholdHours);
    if (multEl && !isCustom && weekly) multEl.value = String(weekly.multiplier);
    if (threshEl) threshEl.readOnly = !isCustom;
    if (multEl) multEl.readOnly = !isCustom;
  }

  function calculate(): void {
    syncVisibility();
    const v = formValues(form);
    const issues: string[] = [];

    const rate = num(v.rate, NaN);
    if (v.rate?.trim() === "" || !Number.isFinite(rate)) issues.push("Enter your hourly rate.");
    else if (rate < 0) issues.push("Hourly rate cannot be negative.");

    const jurisdiction = (v.jur || "us-flsa") as OvertimeJurisdictionId;
    const mode = v.mode || "total";

    const config: OvertimeConfig = { jurisdiction };
    if (jurisdiction === "custom") {
      config.weeklyThresholdHours = num(v.thresh, 40);
      config.multiplier = num(v.mult, 1.5);
    }

    let regMin: number;
    let otMin: number;
    let dtMin = 0;
    let multiplier: number;
    let doubleMultiplier = 2;
    let totalHours: number;

    if (mode === "split") {
      const reg = num(v.reg, NaN);
      const ot = num(v.ot, NaN);
      if (!Number.isFinite(reg) || reg < 0) issues.push("Enter your regular hours.");
      if (!Number.isFinite(ot) || ot < 0) issues.push("Enter your overtime hours.");
      regMin = Math.max(0, (reg || 0) * 60);
      otMin = Math.max(0, (ot || 0) * 60);
      totalHours = (reg || 0) + (ot || 0);
      const rule = OVERTIME_RULES[jurisdiction] ?? OVERTIME_RULES["us-flsa"];
      multiplier = jurisdiction === "custom" ? num(v.mult, 1.5) : rule.tiers.find((t) => t.basis === "weekly")?.multiplier ?? 1.5;
    } else {
      const total = num(v.total, NaN);
      if (!Number.isFinite(total) || total < 0) issues.push("Enter the total hours you worked.");
      totalHours = total || 0;
      const split = computeOvertimeSplit(Math.max(0, totalHours * 60), config);
      regMin = split.regularMinutes;
      otMin = split.overtimeMinutes;
      dtMin = split.doubleTimeMinutes;
      multiplier = split.multiplier;
      doubleMultiplier = split.doubleMultiplier;
    }

    renderErrors(errors, issues);
    if (issues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const pay = computeOvertimePay({
      regularMinutes: regMin,
      overtimeMinutes: otMin,
      doubleTimeMinutes: dtMin,
      hourlyRateCents: toCents(rate),
      multiplier,
      doubleMultiplier,
    });

    const rows: ResultRow[] = [
      { label: `Regular hours (${pay.regularHours.toFixed(2)})`, value: formatMoney(pay.regularPayCents), emphasis: "muted" },
      {
        label: `Overtime hours (${pay.overtimeHours.toFixed(2)} × ${multiplier} = ${formatMoney(pay.overtimeRateCents)}/h)`,
        value: formatMoney(pay.overtimePayCents),
        emphasis: "muted",
      },
    ];
    if (dtMin > 0) {
      rows.push({
        label: `Double-time hours (${pay.doubleTimeHours.toFixed(2)} × ${doubleMultiplier})`,
        value: formatMoney(pay.doubleTimePayCents),
        emphasis: "muted",
      });
    }
    rows.push({ label: "Total gross pay", value: formatMoney(pay.grossPayCents), emphasis: "positive" });

    const rule = OVERTIME_RULES[jurisdiction] ?? OVERTIME_RULES["us-flsa"];
    renderResult(result, {
      headline: { label: `Gross pay for ${totalHours.toFixed(2)} hours`, value: formatMoney(pay.grossPayCents) },
      rows,
      notes: [`${rule.label}: ${rule.summary}`, rule.legalNote],
    });
    if (resultActions) resultActions.hidden = false;

    shareText = `${totalHours.toFixed(2)} hours at ${formatMoney(toCents(rate))}/h = ${formatMoney(pay.grossPayCents)} gross (${pay.overtimeHours.toFixed(2)}h overtime) — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "overtime-calculator", jurisdiction, mode });
  }

  wireActions(root, () => shareText || `Overtime — ${location.href}`);
  onLiveInput(form, calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      errors.hidden = true;
      if (resultActions) resultActions.hidden = true;
      history.replaceState(null, "", location.pathname);
      syncVisibility();
    }, 0);
  });

  if (form.dataset.hydrated === "1") calculate();
}
