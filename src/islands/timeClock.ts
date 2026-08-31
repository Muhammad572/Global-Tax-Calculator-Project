import { computeSingleSpan, formatDuration, formatMoney, minutesToDecimalHours, toCents } from "@tinytools/calc";
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

const ROWS = 12;
const URL_KEYS = ["rate", "brk", ...Array.from({ length: ROWS }, (_, i) => [`in${i}`, `out${i}`]).flat()];

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function calculate(): void {
    const v = formValues(form);
    const hasRate = (v.rate ?? "").trim() !== "";
    const perPairBreak = Math.max(0, num(v.brk, 0));

    const pairs: { in: string; out: string }[] = [];
    for (let i = 0; i < ROWS; i++) {
      const inV = (v[`in${i}`] ?? "").trim();
      const outV = (v[`out${i}`] ?? "").trim();
      if (inV !== "" || outV !== "") pairs.push({ in: inV, out: outV });
    }

    if (pairs.length === 0) {
      renderErrors(errors, []);
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const issues: string[] = [];
    const rows: ResultRow[] = [];
    let totalMinutes = 0;

    pairs.forEach((p, i) => {
      const r = computeSingleSpan({
        start: p.in,
        end: p.out,
        unpaidBreakMinutes: perPairBreak,
      });
      const blocking = r.issues.filter(
        (x) => x.code === "REQUIRED" || x.code === "UNPARSEABLE_TIME",
      );
      if (blocking.length) {
        issues.push(...blocking.map((b) => b.message.replace(/^Day 1:/, `Punch ${i + 1}:`)));
        return;
      }
      totalMinutes += r.workedMinutes;
      rows.push({
        label: `Punch ${i + 1}${r.crossedMidnight ? " (overnight)" : ""}`,
        value: `${minutesToDecimalHours(r.workedMinutes).toFixed(2)} h · ${formatDuration(r.workedMinutes, { style: "clock" })}`,
        emphasis: "muted",
      });
    });

    renderErrors(errors, issues);
    if (issues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      return;
    }

    const decimal = minutesToDecimalHours(totalMinutes);
    rows.push({ label: "Total (decimal hours)", value: decimal.toFixed(2), emphasis: "total" });
    rows.push({ label: "Total (hours:minutes)", value: formatDuration(totalMinutes, { style: "clock" }), emphasis: "muted" });

    let headline = { label: "Total payroll hours", value: `${decimal.toFixed(2)} h` };
    if (hasRate) {
      const payCents = toCents(num(v.rate, 0) * decimal);
      rows.push({ label: `Estimated pay (${formatMoney(toCents(num(v.rate, 0)))}/h × ${decimal.toFixed(2)})`, value: formatMoney(payCents), emphasis: "positive" });
      headline = { label: "Estimated pay", value: formatMoney(payCents) };
    }

    renderResult(result, {
      headline,
      rows,
      notes: [
        perPairBreak > 0 ? `A ${perPairBreak}-minute unpaid break was deducted from each punch pair.` : "No break deduction applied.",
        "This tool totals punch pairs into decimal payroll hours. For weekly overtime and gross pay by day of week, use the Time Card Calculator.",
      ],
    });
    if (resultActions) resultActions.hidden = false;
    shareText = `${pairs.length} punch pairs = ${decimal.toFixed(2)} payroll hours — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "time-clock-calculator", pairs: pairs.length, has_pay: hasRate });
  }

  wireActions(root, () => shareText || `Time clock — ${location.href}`);
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
