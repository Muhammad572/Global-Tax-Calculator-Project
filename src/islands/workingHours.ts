import {
  annualWorkingHours,
  businessDaysInYear,
  fullTimeEquivalent,
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

const URL_KEYS = ["hpw", "dpw", "wpy", "pto", "hol", "year", "ft"];

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function calculate(): void {
    const v = formValues(form);
    const hpw = num(v.hpw, 40);
    const issues: string[] = [];
    if (hpw <= 0) issues.push("Enter your hours per week (a number above 0).");

    renderErrors(errors, issues);
    if (issues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const dpw = Math.min(7, Math.max(1, num(v.dpw, 5)));
    const wpy = Math.min(53, Math.max(1, num(v.wpy, 52)));
    const pto = Math.max(0, num(v.pto, 0));
    const hol = Math.max(0, num(v.hol, 0));
    const year = Math.round(num(v.year, new Date().getUTCFullYear()));
    const ftHours = Math.max(1, num(v.ft, 40));

    const a = annualWorkingHours({
      hoursPerWeek: hpw,
      weeksPerYear: wpy,
      ptoDaysPerYear: pto,
      holidayDaysPerYear: hol,
      hoursPerWorkday: hpw / dpw,
    });
    const bd = businessDaysInYear(year);
    const fte = fullTimeEquivalent(hpw, ftHours);

    const rows: ResultRow[] = [
      { label: "Hours per week", value: hpw.toFixed(2) },
      { label: "Hours per month (average)", value: a.scheduledHoursPerMonth.toFixed(1) },
      { label: "Scheduled hours per year", value: a.scheduledHoursPerYear.toLocaleString() },
    ];
    if (a.ptoHoursPerYear > 0) {
      rows.push({ label: `Time off (${pto} PTO + ${hol} holidays)`, value: `−${a.ptoHoursPerYear.toLocaleString()} h`, emphasis: "muted" });
      rows.push({ label: "Actual working hours per year", value: a.workedHoursPerYear.toLocaleString(), emphasis: "positive" });
    }
    rows.push({ label: `Business days in ${year} (Mon–Fri)`, value: String(bd), emphasis: "muted" });
    rows.push({ label: `Full-time equivalent (vs ${ftHours} h/week)`, value: fte.fte.toFixed(2), emphasis: "muted" });

    renderResult(result, {
      headline: { label: "Working hours per year", value: (a.ptoHoursPerYear > 0 ? a.workedHoursPerYear : a.scheduledHoursPerYear).toLocaleString() + " h" },
      rows,
      notes: a.notes,
    });
    if (resultActions) resultActions.hidden = false;
    shareText = `${hpw} h/week = ${a.scheduledHoursPerYear.toLocaleString()} h/year (${(a.ptoHoursPerYear > 0 ? a.workedHoursPerYear : a.scheduledHoursPerYear).toLocaleString()} after time off) — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "working-hours-calculator" });
  }

  wireActions(root, () => shareText || `Working hours — ${location.href}`);
  onLiveInput(form, calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      errors.hidden = true;
      if (resultActions) resultActions.hidden = true;
      history.replaceState(null, "", location.pathname);
    }, 0);
  });

  // Sensible default result on first load (no user input needed).
  calculate();
}
