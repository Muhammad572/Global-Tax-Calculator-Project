import {
  computeSingleSpan,
  formatDuration,
  formatMoney,
  minutesToDecimalHours,
} from "@tinytools/calc";
import {
  formValues,
  hydrateFromUrl,
  maybe,
  must,
  onLiveInput,
  renderErrors,
  renderResult,
  type ResultRow,
  track,
  wireActions,
  writeUrl,
} from "./_shared";

const SESSIONS = ["1", "2", "3"];
const URL_KEYS = ["rate", ...SESSIONS.flatMap((s) => [`s${s}s`, `s${s}e`, `s${s}b`])];

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

    const spans = SESSIONS.map((s) => ({
      start: (v[`s${s}s`] ?? "").trim(),
      end: (v[`s${s}e`] ?? "").trim(),
      brk: v[`s${s}b`] ?? "",
    })).filter((x) => x.start !== "" || x.end !== "");

    if (spans.length === 0) {
      renderErrors(errors, []);
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    let totalMinutes = 0;
    let payCents = 0;
    let anyOvernight = false;
    const allIssues: string[] = [];
    const rows: ResultRow[] = [];

    spans.forEach((sp, i) => {
      const r = computeSingleSpan({
        start: sp.start,
        end: sp.end,
        unpaidBreakMinutes: sp.brk,
        ...(hasRate ? { hourlyRate: v.rate } : {}),
      });
      const blocking = r.issues.filter(
        (issue) => issue.code === "REQUIRED" || issue.code === "UNPARSEABLE_TIME" || issue.code === "NOT_A_NUMBER",
      );
      allIssues.push(...blocking.map((b) => b.message.replace(/^Day 1:/, `Session ${i + 1}:`)));
      if (blocking.length) return;
      totalMinutes += r.workedMinutes;
      if (r.payCents != null) payCents += r.payCents;
      if (r.crossedMidnight) anyOvernight = true;
      if (spans.length > 1) {
        rows.push({
          label: `Session ${i + 1}${r.crossedMidnight ? " (overnight)" : ""}`,
          value: `${formatDuration(r.workedMinutes, { style: "hm" })} · ${minutesToDecimalHours(r.workedMinutes).toFixed(2)}`,
          emphasis: "muted",
        });
      }
    });

    renderErrors(errors, allIssues);
    if (allIssues.length) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      return;
    }

    const decimal = minutesToDecimalHours(totalMinutes);
    rows.push({ label: "Total time worked", value: formatDuration(totalMinutes, { style: "hm" }), emphasis: "total" });
    rows.push({ label: "In decimal hours", value: decimal.toFixed(2), emphasis: "muted" });
    rows.push({ label: "In minutes", value: String(totalMinutes), emphasis: "muted" });
    if (hasRate && payCents > 0) {
      rows.push({ label: "Estimated pay", value: formatMoney(payCents), emphasis: "positive" });
    }

    const notes: string[] = [];
    if (anyOvernight) notes.push("A shift ending earlier than it starts is counted as running past midnight.");
    notes.push("This is elapsed working time only. For overtime and a weekly total, use the Time Card Calculator.");

    renderResult(result, {
      headline: hasRate && payCents > 0
        ? { label: "Hours worked", value: `${decimal.toFixed(2)} h` }
        : { label: "Hours worked", value: `${formatDuration(totalMinutes, { style: "hm" })}` },
      rows,
      notes,
    });
    if (resultActions) resultActions.hidden = false;

    shareText =
      hasRate && payCents > 0
        ? `Hours worked: ${decimal.toFixed(2)} (${formatDuration(totalMinutes, { style: "hm" })}), pay ${formatMoney(payCents)} — ${location.href}`
        : `Hours worked: ${formatDuration(totalMinutes, { style: "hm" })} (${decimal.toFixed(2)}) — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "hours-worked-calculator", sessions: spans.length, has_pay: hasRate });
  }

  wireActions(root, () => shareText || `Hours worked — ${location.href}`);
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
