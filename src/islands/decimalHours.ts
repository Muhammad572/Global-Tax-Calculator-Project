import { formatDuration, minutesToDecimalHours, parseDurationToMinutes } from "@tinytools/calc";
import { hydrateFromUrl, maybe, must, onLiveInput, renderResult, track, wireActions, writeUrl } from "./_shared";

const URL_KEYS = ["single"];

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  const bulk = maybe<HTMLTextAreaElement>(root, "[name='bulk']");
  const bulkOut = maybe<HTMLElement>(root, "[data-bulk-out]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function calcSingle(): void {
    const single = (form.elements.namedItem("single") as HTMLInputElement)?.value.trim() ?? "";
    if (single === "") {
      result.hidden = true;
      errors.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }
    const minutes = parseDurationToMinutes(single);
    if (minutes === null) {
      errors.hidden = false;
      errors.innerHTML = `<p class="result__error-title">Couldn't read that</p><p>Enter a time like <code>7:45</code>, <code>7h 45m</code>, or a decimal like <code>7.75</code>.</p>`;
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      return;
    }
    errors.hidden = true;
    const decimal = minutesToDecimalHours(minutes, 4);
    renderResult(result, {
      headline: { label: "Decimal hours", value: decimal.toFixed(2) },
      rows: [
        { label: "Decimal hours (2 dp)", value: decimal.toFixed(2), emphasis: "total" },
        { label: "Decimal hours (4 dp)", value: decimal.toFixed(4), emphasis: "muted" },
        { label: "Hours and minutes", value: formatDuration(minutes, { style: "hm" }), emphasis: "muted" },
        { label: "Clock format", value: formatDuration(minutes, { style: "clock" }), emphasis: "muted" },
        { label: "Total minutes", value: String(minutes), emphasis: "muted" },
      ],
      notes: ["Tip: divide the minutes by 60. 45 ÷ 60 = 0.75, so 7:45 is 7.75 — not 7.45."],
    });
    if (resultActions) resultActions.hidden = false;
    shareText = `${single} = ${decimal.toFixed(2)} decimal hours — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "decimal-hours-calculator", mode: "single" });
  }

  function calcBulk(): void {
    if (!bulk || !bulkOut) return;
    const lines = bulk.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      bulkOut.hidden = true;
      bulkOut.innerHTML = "";
      return;
    }
    let totalMin = 0;
    let bad = 0;
    const rowsHtml = lines
      .map((line) => {
        const min = parseDurationToMinutes(line);
        if (min === null) {
          bad++;
          return `<tr><td>${esc(line)}</td><td class="tabular">—</td></tr>`;
        }
        totalMin += min;
        return `<tr><td>${esc(line)}</td><td class="tabular">${minutesToDecimalHours(min).toFixed(2)}</td></tr>`;
      })
      .join("");
    bulkOut.hidden = false;
    bulkOut.innerHTML = `
      <table class="bulk-table">
        <thead><tr><th>Entry</th><th>Decimal</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot><tr><th>Total</th><th class="tabular">${minutesToDecimalHours(totalMin).toFixed(2)} (${formatDuration(totalMin, { style: "clock" })})</th></tr></tfoot>
      </table>
      ${bad > 0 ? `<p class="field__hint">${bad} line${bad === 1 ? "" : "s"} couldn't be read and ${bad === 1 ? "was" : "were"} skipped.</p>` : ""}`;
    track("calc_run", { tool: "decimal-hours-calculator", mode: "bulk", lines: lines.length });
  }

  function esc(s: string): string {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  }

  wireActions(root, () => shareText || `Decimal hours — ${location.href}`);
  onLiveInput(form, () => {
    calcSingle();
    calcBulk();
  });
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      errors.hidden = true;
      if (bulkOut) bulkOut.hidden = true;
      if (resultActions) resultActions.hidden = true;
      history.replaceState(null, "", location.pathname);
    }, 0);
  });

  if (form.dataset.hydrated === "1") calcSingle();
}
