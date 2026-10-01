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
      "Free weekly time card calculator: enter daily start and end times, subtract breaks, handle overnight shifts, and get total hours, overtime, and gross pay.",
    cluster: "work-hours",
    priority: "P1",
    summary: "A full weekly timesheet: daily start/end times, breaks, overnight shifts, overtime, and gross pay.",
    related: ["hours-worked-calculator", "overtime-calculator", "time-clock-calculator", "paycheck-calculator"],
    guide: "how-time-cards-work",
  },
  {
    slug: "hours-worked-calculator",
    title: "Hours Worked Calculator",
    metaTitle: "Hours Worked Calculator — Shifts, Weekly & Yearly Hours",
    description:
      "Hours worked between two times, minus breaks, including overnight and split shifts — plus working hours per week, month and year from your schedule.",
    cluster: "work-hours",
    priority: "P1",
    summary: "Hours between a start and end time minus breaks, plus hours per week, month and year from a schedule.",
    related: ["time-card-calculator", "time-calculator", "decimal-hours-calculator", "salary-to-hourly-calculator"],
    guide: "how-to-calculate-hours-worked",
  },
  {
    slug: "overtime-calculator",
    title: "Overtime Calculator",
    metaTitle: "Overtime Calculator — Time and a Half & Double Time",
    description:
      "Calculate overtime pay from your hourly rate and hours. Pick a rule (US 40h, California daily, Ontario 44h, UK, Australia) or set your own threshold.",
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
      "Convert salary to hourly pay, or hourly to annual salary, plus weekly, biweekly and monthly amounts. Adjust hours and PTO to see your real hourly rate.",
    cluster: "pay-salary",
    priority: "P3",
    summary: "Annual ↔ hourly ↔ every pay frequency, with schedule and PTO adjustments.",
    related: ["hourly-pay-calculator", "hours-worked-calculator", "paycheck-calculator"],
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
    metaTitle: "Paycheck Calculator 2026 — Take-Home Pay After Tax",
    description:
      "Estimate take-home pay per paycheck, month and year after 2026 federal tax, FICA and state withholding, from a paycheck, hourly rate or annual salary.",
    cluster: "paycheck",
    priority: "P4",
    summary: "Paycheck, hourly rate or annual salary → federal + FICA + state withholding → take-home (US, 2026).",
    related: ["hourly-pay-calculator", "salary-to-hourly-calculator", "overtime-calculator", "time-card-calculator"],
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
