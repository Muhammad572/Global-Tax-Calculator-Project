import {
  convertPay,
  formatMoney,
  PAY_FREQUENCY_LABELS,
  realHourlyRate,
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

const URL_KEYS = ["amount", "dir", "hpw", "wpy", "pto", "hol", "amount2", "amount3"];
const TABLE_FREQS: PayFrequency[] = ["hourly", "weekly", "biweekly", "semimonthly", "monthly", "annual"];

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  const compareOut = maybe<HTMLElement>(root, "[data-compare-out]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function annualFrom(amount: number, dir: string, hpw: number, wpy: number): number {
    const from: PayFrequency = dir === "hourly-to-salary" ? "hourly" : "annual";
    return convertPay(toCents(amount), from, { hoursPerWeek: hpw, weeksPerYear: wpy }).annualCents;
  }

  function calculate(): void {
    const v = formValues(form);
    const amount = num(v.amount, NaN);
    const dir = v.dir || "salary-to-hourly";
    const hpw = Math.max(0.1, num(v.hpw, 40));
    const wpy = Math.min(53, Math.max(1, num(v.wpy, 52)));
    const pto = Math.max(0, num(v.pto, 0));
    const hol = Math.max(0, num(v.hol, 0));

    const issues: string[] = [];
    if (v.amount?.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      issues.push(dir === "hourly-to-salary" ? "Enter an hourly rate." : "Enter an annual salary.");
    }
    renderErrors(errors, issues);
    if (issues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      if (compareOut) compareOut.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const annualCents = annualFrom(amount, dir, hpw, wpy);
    const conv = convertPay(annualCents, "annual", { hoursPerWeek: hpw, weeksPerYear: wpy });
    const real = realHourlyRate({
      annualCents,
      hoursPerWeek: hpw,
      weeksPerYear: wpy,
      ptoDaysPerYear: pto,
      holidayDaysPerYear: hol,
      hoursPerWorkday: hpw / 5,
    });

    const rows: ResultRow[] = TABLE_FREQS.map((f) => ({
      label: PAY_FREQUENCY_LABELS[f],
      value: formatMoney(conv.perFrequency[f]),
      emphasis: f === (dir === "hourly-to-salary" ? "annual" : "hourly") ? ("total" as const) : ("muted" as const),
    }));

    if (pto > 0 || hol > 0) {
      rows.push({
        label: `Effective hourly rate after ${pto + hol} days off`,
        value: formatMoney(real.realHourlyCents),
        emphasis: "positive",
        note: `You are paid for ${real.paidHoursPerYear.toLocaleString()} hours but work ${real.workedHoursPerYear.toLocaleString()}, so each worked hour is worth more.`,
      });
    }

    const headlineFreq: PayFrequency = dir === "hourly-to-salary" ? "annual" : "hourly";
    renderResult(result, {
      headline: {
        label: dir === "hourly-to-salary" ? "Equivalent annual salary" : "Equivalent hourly rate",
        value: formatMoney(conv.perFrequency[headlineFreq]),
      },
      rows,
      notes: conv.notes,
    });
    if (resultActions) resultActions.hidden = false;

    renderCompare(v, dir, hpw, wpy);

    shareText = `${formatMoney(toCents(amount))} ${dir === "hourly-to-salary" ? "/hour" : "/year"} = ${formatMoney(
      conv.perFrequency[headlineFreq],
    )} ${dir === "hourly-to-salary" ? "/year" : "/hour"} — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "salary-to-hourly-calculator", dir });
  }

  function renderCompare(v: Record<string, string>, dir: string, hpw: number, wpy: number): void {
    if (!compareOut) return;
    const amounts = [v.amount, v.amount2, v.amount3]
      .map((x) => num(x ?? "", NaN))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (amounts.length < 2) {
      compareOut.hidden = true;
      compareOut.innerHTML = "";
      return;
    }
    const unitIn = dir === "hourly-to-salary" ? "/hr" : "/yr";
    const rowsHtml = amounts
      .map((a) => {
        const annual = annualFrom(a, dir, hpw, wpy);
        const c = convertPay(annual, "annual", { hoursPerWeek: hpw, weeksPerYear: wpy });
        return `<tr><td>${formatMoney(toCents(a))}${unitIn}</td><td class="tabular">${formatMoney(c.perFrequency.hourly)}</td><td class="tabular">${formatMoney(c.perFrequency.monthly)}</td><td class="tabular">${formatMoney(c.perFrequency.annual)}</td></tr>`;
      })
      .join("");
    compareOut.hidden = false;
    compareOut.innerHTML = `<h3>Side by side</h3><table class="bulk-table"><thead><tr><th>Entered</th><th>Hourly</th><th>Monthly</th><th>Annual</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
  }

  wireActions(root, () => shareText || `Salary to hourly — ${location.href}`);
  onLiveInput(form, calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      errors.hidden = true;
      if (resultActions) resultActions.hidden = true;
      if (compareOut) compareOut.hidden = true;
      history.replaceState(null, "", location.pathname);
    }, 0);
  });

  if (form.dataset.hydrated === "1") calculate();
}
