import { accumulateDuration, formatDuration, type TimeOp } from "@tinytools/calc";
import {
  formValues,
  hydrateFromUrl,
  maybe,
  must,
  num,
  onLiveInput,
  renderResult,
  type ResultRow,
  track,
  wireActions,
  writeUrl,
} from "./_shared";

const ROWS = 6;
const URL_KEYS = Array.from({ length: ROWS }, (_, i) => [`op${i}`, `h${i}`, `m${i}`, `s${i}`]).flat();

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const resultActions = maybe(root, "[data-result-actions]");
  const showSeconds = maybe<HTMLInputElement>(root, "[name='sec']");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function calculate(): void {
    const v = formValues(form);
    const terms: { op: TimeOp; hours: number; minutes: number; seconds: number }[] = [];
    for (let i = 0; i < ROWS; i++) {
      const h = num(v[`h${i}`], 0);
      const m = num(v[`m${i}`], 0);
      const s = num(v[`s${i}`], 0);
      if (h === 0 && m === 0 && s === 0) continue;
      terms.push({ op: (v[`op${i}`] === "-" ? "-" : "+") as TimeOp, hours: h, minutes: m, seconds: s });
    }

    if (terms.length === 0) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }

    const { totalSeconds, totalMinutes } = accumulateDuration(terms);
    const sign = totalSeconds < 0 ? "−" : "";
    const abs = Math.abs(totalSeconds);
    const hh = Math.floor(abs / 3600);
    const mm = Math.floor((abs % 3600) / 60);
    const ss = abs % 60;
    const withSeconds = showSeconds?.checked ?? true;
    const clock = withSeconds
      ? `${sign}${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
      : `${sign}${hh}:${String(mm).padStart(2, "0")}`;

    const rows: ResultRow[] = [
      { label: "Hours : minutes" + (withSeconds ? " : seconds" : ""), value: clock, emphasis: "total" },
      { label: "Decimal hours", value: (totalSeconds / 3600).toFixed(4).replace(/0+$/, "").replace(/\.$/, ""), emphasis: "muted" },
      { label: "Total minutes", value: (totalMinutes).toFixed(2).replace(/\.00$/, ""), emphasis: "muted" },
      { label: "Total seconds", value: String(totalSeconds), emphasis: "muted" },
    ];

    renderResult(result, {
      headline: { label: "Result", value: `${clock}` },
      rows,
      notes: totalSeconds < 0 ? ["The result is negative — the subtracted time is larger than the added time."] : [],
    });
    if (resultActions) resultActions.hidden = false;
    shareText = `Time result: ${formatDuration(totalMinutes, { style: "hm" })} (${clock}) — ${location.href}`;
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "time-calculator", terms: terms.length });
  }

  wireActions(root, () => shareText || `Time calculator — ${location.href}`);
  onLiveInput(form, calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      history.replaceState(null, "", location.pathname);
    }, 0);
  });

  if (form.dataset.hydrated === "1") calculate();
}
