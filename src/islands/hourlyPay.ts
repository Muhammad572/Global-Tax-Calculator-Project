import {
  computeOvertimePay,
  convertPay,
  formatMoney,
  PAY_FREQUENCY_LABELS,
  toCents,
  type PayFrequency,
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

const URL_KEYS = ["rate", "hpw", "ot", "mult", "wpy", "period"];
const PROJ: PayFrequency[] = ["weekly", "biweekly", "semimonthly", "monthly", "annual"];

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function calculate(): void {
    const v = formValues(form);
    const rate = num(v.rate, NaN);
    const hpw = num(v.hpw, NaN);
    const otHours = Math.max(0, num(v.ot, 0));
    const mult = Math.max(1, num(v.mult, 1.5));
    const wpy = Math.min(53, Math.max(1, num(v.wpy, 52)));
    const period = (v.period || "weekly") as PayFrequency;

    const issues: string[] = [];
    if (v.rate?.trim() === "" || !Number.isFinite(rate) || rate < 0) issues.push("Enter your hourly rate.");
    if (v.hpw?.trim() === "" || !Number.isFinite(hpw) || hpw < 0) issues.push("Enter your regular hours per week.");
    renderErrors(errors, issues);
    if (issues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const rateCents = toCents(rate);
    const weekly = computeOvertimePay({
      regularMinutes: hpw * 60,
      overtimeMinutes: otHours * 60,
      hourlyRateCents: rateCents,
      multiplier: mult,
    });
    const weeklyGrossCents = weekly.grossPayCents;
    const totalWeeklyHours = hpw + otHours;
    const blendedCents = totalWeeklyHours > 0 ? Math.round(weeklyGrossCents / totalWeeklyHours) : rateCents;

    // Projections: treat the weekly gross as a weekly amount, annualise over wpy.
    const conv = convertPay(Math.round(weeklyGrossCents * wpy), "annual", { hoursPerWeek: hpw, weeksPerYear: wpy });
    const projRows: ResultRow[] = PROJ.map((f) => ({
      label: PAY_FREQUENCY_LABELS[f],
      value: formatMoney(f === "weekly" ? weeklyGrossCents : conv.perFrequency[f]),
      emphasis: f === period || (period === "hourly" && f === "weekly") ? ("total" as const) : ("muted" as const),
    }));

    const rows: ResultRow[] = [
      { label: `Regular pay (${hpw} h × ${formatMoney(rateCents)})`, value: formatMoney(weekly.regularPayCents), emphasis: "muted" },
    ];
    if (otHours > 0) {
      rows.push({
        label: `Overtime pay (${otHours} h × ${formatMoney(weekly.overtimeRateCents)})`,
        value: formatMoney(weekly.overtimePayCents),
        emphasis: "muted",
      });
      rows.push({ label: "Blended hourly rate", value: formatMoney(blendedCents), emphasis: "muted", note: `Total gross ÷ ${totalWeeklyHours} hours.` });
    }
    rows.push({ label: "Gross pay per week", value: formatMoney(weeklyGrossCents), emphasis: "positive" });
    rows.push(...projRows.filter((r) => r.label !== "Weekly"));

    if (otHours > 0) {
      const noOt = computeOvertimePay({ regularMinutes: hpw * 60, overtimeMinutes: 0, hourlyRateCents: rateCents, multiplier: mult });
      rows.push({
        label: "Overtime adds (per week / per year)",
        value: `${formatMoney(weeklyGrossCents - noOt.grossPayCents)} / ${formatMoney((weeklyGrossCents - noOt.grossPayCents) * wpy)}`,
        emphasis: "warn",
      });
    }

    const headlineVal =
      period === "weekly"
        ? formatMoney(weeklyGrossCents)
        : formatMoney(conv.perFrequency[period] ?? weeklyGrossCents);
    renderResult(result, {
      headline: { label: `Gross pay — ${PAY_FREQUENCY_LABELS[period] ?? "weekly"}`, value: headlineVal },
      rows,
      notes: [
        `Based on ${hpw} regular hours${otHours ? ` + ${otHours} overtime hours` : ""} per week, ${wpy} weeks a year.`,
        "This is gross pay, before tax and deductions. For take-home pay use the Paycheck Calculator.",
      ],
    });
    if (resultActions) resultActions.hidden = false;
    shareText = `${formatMoney(rateCents)}/h × ${totalWeeklyHours} h/week = ${formatMoney(weeklyGrossCents)}/week (${formatMoney(conv.perFrequency.annual)}/year) — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "hourly-pay-calculator", has_ot: otHours > 0, period });
  }

  wireActions(root, () => shareText || `Hourly pay — ${location.href}`);
  onLiveInput(form, calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      errors.hidden = true;
      if (resultActions) resultActions.hidden = true;
      history.replaceState(null, "", location.pathname);
    }, 0);
  });

  if (form.dataset.hydrated === "1") calculate();
}
