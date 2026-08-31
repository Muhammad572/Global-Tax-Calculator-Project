/**
 * Supporting guide registry. Each guide is search-intent driven, tied to at
 * least one calculator, and provides context the tool alone cannot (rules,
 * definitions, decisions, edge cases). Rejected topics are recorded in
 * planning/phase-a-report.md.
 */

export interface GuideMeta {
  slug: string;
  title: string; // H1
  metaTitle: string; // <title> without brand suffix
  description: string;
  updated: string; // ISO
  /** Primary search queries this guide targets (directional). */
  targets: string[];
  /** Tool slugs this guide supports / links to. */
  supports: string[];
  /** One-line summary for the guides index. */
  summary: string;
}

export const GUIDES: GuideMeta[] = [
  {
    slug: "how-to-calculate-hours-worked",
    title: "How to Calculate Hours Worked",
    metaTitle: "How to Calculate Hours Worked (with Examples)",
    description:
      "A step-by-step method for working out hours worked from clock times: subtracting breaks, converting to decimal hours for payroll, handling overnight shifts, and the rounding rules employers use.",
    updated: "2026-08-31",
    targets: ["how to calculate hours worked", "how to calculate hours and minutes for payroll", "how to calculate hours worked on a time card"],
    supports: ["hours-worked-calculator", "time-card-calculator", "decimal-hours-calculator"],
    summary: "The manual method, decimal conversion, overnight shifts, and payroll rounding.",
  },
  {
    slug: "how-to-calculate-overtime-pay",
    title: "How to Calculate Overtime Pay",
    metaTitle: "How to Calculate Overtime Pay: Formula & Rules",
    description:
      "How overtime pay is calculated: the time-and-a-half formula, weekly vs daily thresholds, the regular rate for salaried and multi-rate workers, and how the rules differ in the US, Canada, the UK, and Australia.",
    updated: "2026-08-31",
    targets: ["how to calculate overtime pay", "how is overtime pay calculated", "what is time and a half", "overtime after 40 or 44 hours"],
    supports: ["overtime-calculator", "time-card-calculator", "hourly-pay-calculator"],
    summary: "The formula, the regular-rate rules, and thresholds by country.",
  },
  {
    slug: "how-time-cards-work",
    title: "How Time Cards Work",
    metaTitle: "How Time Cards Work: Filling One Out & Common Mistakes",
    description:
      "What a time card records, how to fill one out for a weekly or biweekly pay period, how employers round punch times, record-keeping requirements, and the errors that cost workers hours.",
    updated: "2026-08-31",
    targets: ["how time cards work", "how to fill out a time card", "how to calculate time card hours"],
    supports: ["time-card-calculator", "time-clock-calculator", "hours-worked-calculator"],
    summary: "What a time card records, how to fill it out, and how rounding works.",
  },
  {
    slug: "salary-vs-hourly-pay",
    title: "Salary vs Hourly Pay",
    metaTitle: "Salary vs Hourly Pay: Differences, Pros and Cons",
    description:
      "The real differences between salaried and hourly jobs: overtime eligibility and the exempt/non-exempt test, pay stability, benefits, and how to compare two offers on equal terms.",
    updated: "2026-08-31",
    targets: ["salary vs hourly pay", "hourly vs salary", "difference between salary and hourly"],
    supports: ["salary-to-hourly-calculator", "hourly-pay-calculator", "overtime-calculator"],
    summary: "Overtime eligibility, benefits, stability, and comparing offers.",
  },
  {
    slug: "gross-pay-vs-take-home-pay",
    title: "Gross Pay vs Take-Home Pay",
    metaTitle: "Gross Pay vs Take-Home Pay: What's the Difference?",
    description:
      "Why your paycheck is smaller than your salary: every deduction explained — federal and state income tax withholding, Social Security, Medicare, and pre-tax benefits — and how to read a pay stub.",
    updated: "2026-08-31",
    targets: ["gross pay vs net pay", "gross pay vs take home pay", "why is my paycheck less than my salary"],
    supports: ["take-home-pay-calculator", "paycheck-calculator", "salary-to-hourly-calculator"],
    summary: "Every paycheck deduction explained, and how to read a pay stub.",
  },
  {
    slug: "how-many-work-hours-in-a-year",
    title: "How Many Work Hours Are in a Year?",
    metaTitle: "How Many Work Hours Are in a Year? (2026 & 2027)",
    description:
      "A full-time work year is 2,080 hours, but the number of working days changes each year and paid time off reduces the hours you actually work. The breakdown, plus working days for 2026 and 2027.",
    updated: "2026-08-31",
    targets: ["how many work hours in a year", "how many working days in a year", "work hours in a year"],
    supports: ["working-hours-calculator", "salary-to-hourly-calculator"],
    summary: "The 2,080-hour standard, why years differ, and PTO-adjusted hours.",
  },
];

export const GUIDES_BY_SLUG: Record<string, GuideMeta> = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));
