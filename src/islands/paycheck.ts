import {
  computeOvertimePay,
  computePaycheck,
  formatMoney,
  toCents,
  type PayFrequency,
  type PaycheckInput,
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
  track,
  wireActions,
  writeUrl,
} from "./_shared";
import { deductionRows, filingStatus, stateCode, unsupportedNote } from "./_paycheck";

const URL_KEYS = ["mode", "gross", "rate", "reghrs", "othrs", "otmult", "freq", "filing", "state", "step2", "dep", "extra", "pretax"];
const FREQ_LABEL: Record<string, string> = {
  weekly: "week",
  biweekly: "2 weeks",
  semimonthly: "half-month",
  monthly: "month",
};

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  const hourlyFields = maybe(root, "[data-hourly-fields]");
  const salaryFields = maybe(root, "[data-salary-fields]");
  const notice = maybe(root, "[data-notice]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);
  syncMode();

  function syncMode(): void {
    const mode = (formValues(form).mode || "salary");
    if (hourlyFields) hourlyFields.hidden = mode !== "hourly";
    if (salaryFields) salaryFields.hidden = mode !== "salary";
  }

  function calculate(): void {
    syncMode();
    const v = formValues(form);
    const mode = v.mode || "salary";
    const freq = (v.freq || "biweekly") as PayFrequency;
    const issues: string[] = [];

    let grossPerPeriodCents = 0;
    if (mode === "hourly") {
      const rate = num(v.rate, NaN);
      const regHrs = num(v.reghrs, NaN);
      const otHrs = Math.max(0, num(v.othrs, 0));
      const otMult = Math.max(1, num(v.otmult, 1.5));
      if (v.rate?.trim() === "" || !Number.isFinite(rate) || rate < 0) issues.push("Enter your hourly rate.");
      if (v.reghrs?.trim() === "" || !Number.isFinite(regHrs) || regHrs < 0) issues.push("Enter the regular hours in this pay period.");
      if (!issues.length) {
        const pay = computeOvertimePay({
          regularMinutes: regHrs * 60,
          overtimeMinutes: otHrs * 60,
          hourlyRateCents: toCents(rate),
          multiplier: otMult,
        });
        grossPerPeriodCents = pay.grossPayCents;
      }
    } else {
      const gross = num(v.gross, NaN);
      if (v.gross?.trim() === "" || !Number.isFinite(gross) || gross < 0) issues.push("Enter your gross pay for one pay period.");
      grossPerPeriodCents = toCents(gross || 0);
    }

    renderErrors(errors, issues);
    if (issues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const st = stateCode(v.state);
    const input: PaycheckInput = {
      grossPerPeriodCents,
      payFrequency: freq,
      filingStatus: filingStatus(v.filing),
      taxYear: 2026,
      state: st,
      w4Step2Checkbox: v.step2 === "on" || v.step2 === "1",
      w4DependentsAnnualCents: toCents(Math.max(0, num(v.dep, 0))),
      w4ExtraPerPeriodCents: toCents(Math.max(0, num(v.extra, 0))),
      preTaxPerPeriodCents: toCents(Math.max(0, num(v.pretax, 0))),
    };
    const r = computePaycheck(input);

    const unit = FREQ_LABEL[freq] ?? "pay period";
    const rows = deductionRows(r, { scale: (c) => c, state: st });

    const note = unsupportedNote(r);
    if (notice) {
      if (note) {
        notice.hidden = false;
        notice.innerHTML = `<p><strong>Heads up.</strong> ${note}</p><p>You can still work out your gross pay and overtime with the <a href="/calculators/time-card-calculator/">Time Card</a>, <a href="/calculators/overtime-calculator/">Overtime</a>, and <a href="/calculators/hourly-pay-calculator/">Hourly Pay</a> calculators.</p>`;
      } else {
        notice.hidden = true;
      }
    }

    renderResult(result, {
      headline: { label: `Estimated take-home pay per ${unit}`, value: formatMoney(r.netPerPeriodCents) },
      rows,
      notes: [`Effective withholding rate: ${(r.effectiveRate * 100).toFixed(1)}% of gross.`, ...r.disclaimers],
    });
    if (resultActions) resultActions.hidden = false;
    shareText = `Estimated take-home: ${formatMoney(r.netPerPeriodCents)} per ${unit} on ${formatMoney(grossPerPeriodCents)} gross — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "paycheck-calculator", mode, state: st, filing: input.filingStatus, supported: r.supported });
  }

  wireActions(root, () => shareText || `Paycheck estimate — ${location.href}`);
  onLiveInput(form, calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      errors.hidden = true;
      if (resultActions) resultActions.hidden = true;
      if (notice) notice.hidden = true;
      history.replaceState(null, "", location.pathname);
      syncMode();
    }, 0);
  });

  if (form.dataset.hydrated === "1") calculate();
}
