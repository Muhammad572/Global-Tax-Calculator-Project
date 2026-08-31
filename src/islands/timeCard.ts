import {
  computeTimeCard,
  formatDuration,
  formatMoney,
  minutesToDecimalHours,
  OVERTIME_RULES,
  type OvertimeJurisdictionId,
  type TimeCardDayInput,
} from "@tinytools/calc";
import {
  formValues,
  hydrateFromUrl,
  must,
  num,
  onLiveInput,
  renderErrors,
  renderResult,
  type ResultRow,
  track,
  wireActions,
  writeUrl,
  maybe,
} from "./_shared";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const URL_KEYS = [
  "rate",
  "jur",
  "round",
  ...DAYS.flatMap((d) => [`${d}s`, `${d}e`, `${d}b`]),
];

export function init(root: HTMLElement): void {
  const form = must<HTMLFormElement>(root, "form");
  const result = must(root, "[data-result]");
  const errors = must(root, "[data-errors]");
  const resultActions = maybe(root, "[data-result-actions]");
  let shareText = "";

  hydrateFromUrl(form, URL_KEYS);

  function calculate(): void {
    const v = formValues(form);
    const days: TimeCardDayInput[] = DAYS.map((d) => ({
      label: d,
      start: v[`${d}s`] ?? "",
      end: v[`${d}e`] ?? "",
      unpaidBreakMinutes: v[`${d}b`] ?? "",
    }));

    const jurisdiction = (v.jur || "us-flsa") as OvertimeJurisdictionId;
    const rule = OVERTIME_RULES[jurisdiction] ?? OVERTIME_RULES["us-flsa"];
    const hasRate = (v.rate ?? "").trim() !== "";

    const res = computeTimeCard(days, {
      ...(hasRate ? { hourlyRate: v.rate } : {}),
      overtime: { jurisdiction },
      roundToMinutes: num(v.round, 0),
    });

    const blocking = res.issues.filter(
      (i) => i.code === "REQUIRED" || i.code === "UNPARSEABLE_TIME" || i.code === "NOT_A_NUMBER",
    );
    renderErrors(errors, blocking.map((i) => i.message));

    const activeDays = res.days.filter((d) => !d.skipped);
    if (activeDays.length === 0 && blocking.length === 0) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      writeUrl(form, URL_KEYS);
      return;
    }
    if (blocking.length > 0) {
      result.hidden = true;
      if (resultActions) resultActions.hidden = true;
      return;
    }

    const rows: ResultRow[] = activeDays.map((d) => ({
      label: `${d.label}${d.crossedMidnight ? " (overnight)" : ""}`,
      value: `${formatDuration(d.workedMinutes, { style: "hm" })} · ${minutesToDecimalHours(d.workedMinutes).toFixed(2)}`,
      emphasis: "muted",
    }));

    rows.push({
      label: "Weekly total",
      value: `${formatDuration(res.totalWorkedMinutes, { style: "hm" })} · ${res.totalWorkedHours.toFixed(2)} h`,
      emphasis: "total" as const,
    });
    if (res.overtimeMinutes > 0 || res.doubleTimeMinutes > 0) {
      rows.push({ label: "Regular hours", value: res.regularHours.toFixed(2), emphasis: "muted" as const });
      rows.push({ label: "Overtime hours", value: res.overtimeHours.toFixed(2), emphasis: "muted" as const });
      if (res.doubleTimeMinutes > 0) {
        rows.push({ label: "Double-time hours (×2)", value: res.doubleTimeHours.toFixed(2), emphasis: "muted" as const });
      }
    }

    let headline: { label: string; value: string } | undefined;
    if (res.grossPayCents != null) {
      if (res.regularPayCents != null) rows.push({ label: "Regular pay", value: formatMoney(res.regularPayCents), emphasis: "muted" as const });
      if (res.overtimePayCents) rows.push({ label: "Overtime pay", value: formatMoney(res.overtimePayCents), emphasis: "muted" as const });
      if (res.doubleTimePayCents) rows.push({ label: "Double-time pay", value: formatMoney(res.doubleTimePayCents), emphasis: "muted" as const });
      rows.push({ label: "Estimated gross pay", value: formatMoney(res.grossPayCents), emphasis: "positive" as const });
      headline = { label: "Estimated gross pay for the week", value: formatMoney(res.grossPayCents) };
    } else {
      headline = { label: "Total hours worked this week", value: `${res.totalWorkedHours.toFixed(2)} h` };
    }

    const notes = [...res.overtimeNotes];
    notes.push(`${rule.label}: ${rule.summary}`);
    notes.push("Presets are calculation conveniences, not legal advice — see the methodology below.");

    renderResult(result, { headline, rows, notes });
    if (resultActions) resultActions.hidden = false;

    shareText = buildShareText(res.totalWorkedHours, res.grossPayCents);
    writeUrl(form, URL_KEYS);
    track("calc_run", { tool: "time-card-calculator", jurisdiction, has_pay: res.grossPayCents != null });
  }

  function buildShareText(hours: number, grossCents: number | null): string {
    const base = `Time card total: ${hours.toFixed(2)} hours`;
    return grossCents != null ? `${base}, estimated gross pay ${formatMoney(grossCents)} — ${location.href}` : `${base} — ${location.href}`;
  }

  wireActions(root, () => shareText || `Time card — ${location.href}`);
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
