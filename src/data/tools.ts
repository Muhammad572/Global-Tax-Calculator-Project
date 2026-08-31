/**
 * The MVP tool registry. One entry per indexable calculator page. Drives the
 * hub, nav mega-menu, related-tools blocks, sitemap, and internal-link graph.
 *
 * `related` is a *deliberate* short list (per phase-a-report A5.4), not "all
 * other tools".
 */

export type ClusterId = "work-hours" | "overtime" | "pay-salary" | "paycheck";

export interface ClusterMeta {
  id: ClusterId;
  label: string;
  blurb: string;
}

export const CLUSTERS: ClusterMeta[] = [
  { id: "work-hours", label: "Work Hours", blurb: "Turn clock times and shifts into hours worked." },
  { id: "overtime", label: "Overtime", blurb: "Split regular and overtime hours and pay." },
  { id: "pay-salary", label: "Pay & Salary", blurb: "Convert between hourly, weekly, and annual pay." },
  { id: "paycheck", label: "Paycheck", blurb: "Estimate withholding and take-home pay (US, 2026)." },
];

export interface ToolMeta {
  slug: string;
  title: string; // H1 / nav label
  metaTitle: string; // <title> without the brand suffix
  description: string; // meta description
  cluster: ClusterId;
  priority: "P1" | "P2" | "P3" | "P4";
  /** One sentence shown on the hub card and mega-menu. */
  summary: string;
  /** Slugs of deliberately-chosen related tools. */
  related: string[];
  /** Matching guide slug, if any. */
  guide?: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "time-card-calculator",
    title: "Time Card Calculator",
    metaTitle: "Time Card Calculator with Breaks & Overtime",
    description:
      "Free weekly time card calculator. Enter start and end times for each day, subtract lunch and breaks, handle overnight shifts, and get total hours, overtime, and gross pay.",
    cluster: "work-hours",
    priority: "P1",
    summary: "A full weekly timesheet: daily start/end times, breaks, overnight shifts, overtime, and gross pay.",
    related: ["hours-worked-calculator", "overtime-calculator", "time-clock-calculator", "paycheck-calculator"],
    guide: "how-time-cards-work",
  },
  {
    slug: "hours-worked-calculator",
    title: "Hours Worked Calculator",
    metaTitle: "Hours Worked Calculator — Time Between Two Times",
    description:
      "Work out how many hours you worked between two times. Subtract an unpaid break, handle shifts past midnight, and see the result in hours and minutes or decimal hours.",
    cluster: "work-hours",
    priority: "P1",
    summary: "The quick one: how many hours between a start and end time, minus a break.",
    related: ["time-card-calculator", "time-calculator", "decimal-hours-calculator", "working-hours-calculator"],
    guide: "how-to-calculate-hours-worked",
  },
  {
    slug: "overtime-calculator",
    title: "Overtime Calculator",
    metaTitle: "Overtime Calculator — Time and a Half & Double Time",
    description:
      "Calculate overtime pay from your hourly rate and hours worked. Choose an overtime rule (US 40h, California daily, Ontario 44h, UK, Australia) or set your own threshold and multiplier.",
    cluster: "overtime",
    priority: "P1",
    summary: "Regular vs overtime hours and pay, with selectable jurisdiction rules or a custom threshold.",
    related: ["time-card-calculator", "hourly-pay-calculator", "paycheck-calculator", "hours-worked-calculator"],
    guide: "how-to-calculate-overtime-pay",
  },
  {
    slug: "time-clock-calculator",
    title: "Time Clock Calculator",
    metaTitle: "Time Clock Calculator — Clock In / Clock Out Hours",
    description:
      "Convert clock in and clock out times into total hours and decimal hours for payroll. Supports multiple punches, lunch deductions, and overnight shifts.",
    cluster: "work-hours",
    priority: "P2",
    summary: "Clock in/out punches to decimal payroll hours.",
    related: ["time-card-calculator", "decimal-hours-calculator", "hours-worked-calculator", "overtime-calculator"],
    guide: "how-time-cards-work",
  },
  {
    slug: "working-hours-calculator",
    title: "Working Hours Calculator",
    metaTitle: "Working Hours Calculator — Weekly, Monthly & Yearly",
    description:
      "Work out working hours per week, month, and year from your schedule. Adjust for paid time off and public holidays, and see full-time-equivalent (FTE).",
    cluster: "work-hours",
    priority: "P2",
    summary: "Schedule-level: hours per week / month / year, PTO adjustment, and FTE.",
    related: ["hours-worked-calculator", "salary-to-hourly-calculator", "time-card-calculator"],
    guide: "how-many-work-hours-in-a-year",
  },
  {
    slug: "time-calculator",
    title: "Time Calculator",
    metaTitle: "Time Calculator — Add & Subtract Hours and Minutes",
    description:
      "Add and subtract hours, minutes, and seconds. Get a running total in hours:minutes, decimal hours, or total minutes.",
    cluster: "work-hours",
    priority: "P2",
    summary: "Pure time arithmetic: add and subtract hours, minutes, and seconds.",
    related: ["hours-worked-calculator", "decimal-hours-calculator", "time-card-calculator"],
  },
  {
    slug: "decimal-hours-calculator",
    title: "Decimal Hours Calculator",
    metaTitle: "Decimal Hours Calculator — Minutes to Decimal for Payroll",
    description:
      "Convert hours and minutes to decimal hours for payroll, and decimal hours back to hours and minutes. Includes a minutes-to-decimal conversion chart.",
    cluster: "work-hours",
    priority: "P2",
    summary: "Minutes ↔ decimal hours, with a conversion chart.",
    related: ["time-clock-calculator", "hours-worked-calculator", "time-calculator"],
    guide: "how-to-calculate-hours-worked",
  },
  {
    slug: "salary-to-hourly-calculator",
    title: "Salary to Hourly Calculator",
    metaTitle: "Salary to Hourly Calculator — Convert Annual Pay",
    description:
      "Convert an annual salary to an hourly rate (and back), plus weekly, biweekly, semi-monthly, and monthly. Adjust hours per week and unpaid weeks off, and see your real hourly rate after PTO.",
    cluster: "pay-salary",
    priority: "P3",
    summary: "Annual ↔ hourly ↔ every pay frequency, with schedule and PTO adjustments.",
    related: ["hourly-pay-calculator", "working-hours-calculator", "paycheck-calculator", "take-home-pay-calculator"],
    guide: "salary-vs-hourly-pay",
  },
  {
    slug: "hourly-pay-calculator",
    title: "Hourly Pay Calculator",
    metaTitle: "Hourly Pay Calculator — Weekly, Biweekly & Monthly",
    description:
      "Turn an hourly rate and hours worked into pay by week, biweekly period, month, and year. Add overtime and see the breakdown.",
    cluster: "pay-salary",
    priority: "P3",
    summary: "Hourly rate + hours → pay per week, period, month, and year, with overtime.",
    related: ["salary-to-hourly-calculator", "overtime-calculator", "paycheck-calculator", "time-card-calculator"],
    guide: "salary-vs-hourly-pay",
  },
  {
    slug: "paycheck-calculator",
    title: "Paycheck Calculator",
    metaTitle: "Paycheck Calculator 2026 — Estimate Your Take-Home Pay",
    description:
      "Estimate your paycheck after federal tax, Social Security, Medicare, and state income tax withholding. 2026 rates. Supported states: CA, NY, IL, PA, and the no-income-tax states.",
    cluster: "paycheck",
    priority: "P4",
    summary: "Gross pay → federal + FICA + state withholding → net pay, for one pay period (US, 2026).",
    related: ["take-home-pay-calculator", "hourly-pay-calculator", "salary-to-hourly-calculator", "overtime-calculator"],
    guide: "gross-pay-vs-take-home-pay",
  },
  {
    slug: "take-home-pay-calculator",
    title: "Take-Home Pay Calculator",
    metaTitle: "Take-Home Pay Calculator 2026 — Salary After Tax",
    description:
      "Enter an annual salary and see your estimated take-home pay per year, month, and paycheck after 2026 federal tax, FICA, and state income tax withholding.",
    cluster: "paycheck",
    priority: "P4",
    summary: "Annual salary → estimated yearly, monthly, and per-paycheck take-home (US, 2026).",
    related: ["paycheck-calculator", "salary-to-hourly-calculator", "hourly-pay-calculator"],
    guide: "gross-pay-vs-take-home-pay",
  },
];

export const TOOLS_BY_SLUG: Record<string, ToolMeta> = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
);

export function toolsInCluster(cluster: ClusterId): ToolMeta[] {
  return TOOLS.filter((t) => t.cluster === cluster);
}

export function relatedTools(slug: string): ToolMeta[] {
  const t = TOOLS_BY_SLUG[slug];
  if (!t) return [];
  return t.related.map((s) => TOOLS_BY_SLUG[s]).filter((x): x is ToolMeta => Boolean(x));
}
