import {
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
  type ResultRow,
  track,
  wireActions,
  writeUrl,
} from "./_shared";
import { deductionRows, filingStatus, stateCode, unsupportedNote } from "./_paycheck";

const URL_KEYS = ["salary", "filing", "state", "step2", "pretax", "freq"];
const PERIODS: Record<string, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  const notice = maybe(root, "[data-notice]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function calculate(): void {
    const v = formValues(form);
    const salary = num(v.salary, NaN);
    const issues: string[] = [];
    if (v.salary?.trim() === "" || !Number.isFinite(salary) || salary < 0) issues.push("Enter your annual salary.");
    renderErrors(errors, issues);
    if (issues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const freq = (v.freq || "biweekly") as PayFrequency;
    const periods = PERIODS[freq] ?? 26;
    const st = stateCode(v.state);
    const annualPretax = Math.max(0, num(v.pretax, 0));

    const input: PaycheckInput = {
      grossPerPeriodCents: toCents(salary / periods),
      payFrequency: freq,
      filingStatus: filingStatus(v.filing),
      taxYear: 2026,
      state: st,
      w4Step2Checkbox: v.step2 === "on" || v.step2 === "1",
      preTaxPerPeriodCents: toCents(annualPretax / periods),
    };
    const r = computePaycheck(input);

    const netAnnual = r.netPerPeriodCents * periods;
    const netMonthly = Math.round(netAnnual / 12);

    const note = unsupportedNote(r);
    if (notice) {
      if (note) {
        notice.hidden = false;
        notice.innerHTML = `<p><strong>Heads up.</strong> ${note}</p><p>Canada, the UK, and Australia aren't supported for take-home tax yet. You can still convert pay and work out hours with the <a href="/calculators/salary-to-hourly-calculator/">Salary to Hourly</a> and <a href="/calculators/working-hours-calculator/">Working Hours</a> calculators.</p>`;
      } else {
        notice.hidden = true;
      }
    }

    // Annual breakdown reuses the per-period stack scaled up to a year.
    const annualRows = deductionRows(r, { scale: (c) => c * periods, state: st });

    const summary: ResultRow[] = [
      { label: "Take-home per year", value: formatMoney(netAnnual), emphasis: "total" },
      { label: "Take-home per month", value: formatMoney(netMonthly), emphasis: "positive" },
      { label: `Take-home per paycheck (${freq})`, value: formatMoney(r.netPerPeriodCents), emphasis: "positive" },
      { label: "Effective withholding rate", value: `${(r.effectiveRate * 100).toFixed(1)}%`, emphasis: "muted" },
    ];

    renderResult(result, {
      headline: { label: "Estimated annual take-home pay", value: formatMoney(netAnnual) },
      rows: [...summary, { label: "— annual breakdown —", value: "", emphasis: "muted" }, ...annualRows],
      notes: r.disclaimers,
    });
    if (resultActions) resultActions.hidden = false;
    shareText = `${formatMoney(toCents(salary))}/year is about ${formatMoney(netAnnual)} take-home (${formatMoney(netMonthly)}/month) — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "take-home-pay-calculator", state: st, filing: input.filingStatus, supported: r.supported });
  }

  wireActions(root, () => shareText || `Take-home pay — ${location.href}`);
  onLiveInput(form, calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      errors.hidden = true;
      if (resultActions) resultActions.hidden = true;
      if (notice) notice.hidden = true;
      history.replaceState(null, "", location.pathname);
    }, 0);
  });

  if (form.dataset.hydrated === "1") calculate();
}
