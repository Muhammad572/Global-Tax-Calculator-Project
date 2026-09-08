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
  /** Slugs of closely related guides, shown in a cross-link block. */
  related?: string[];
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
    updated: "2026-09-07",
    targets: ["how to calculate hours worked", "how to calculate hours and minutes for payroll", "how to calculate hours worked on a time card"],
    supports: ["hours-worked-calculator", "time-card-calculator", "decimal-hours-calculator"],
    related: ["convert-minutes-to-decimal-hours", "time-clock-rounding-rules", "how-time-cards-work"],
    summary: "The manual method, decimal conversion, overnight shifts, and payroll rounding.",
  },
  {
    slug: "how-to-calculate-overtime-pay",
    title: "How to Calculate Overtime Pay",
    metaTitle: "How to Calculate Overtime Pay: Formula & Rules",
    description:
      "How overtime pay is calculated: the time-and-a-half formula, weekly vs daily thresholds, the regular rate for salaried and multi-rate workers, and how the rules differ in the US, Canada, the UK, and Australia.",
    updated: "2026-09-07",
    targets: ["how to calculate overtime pay", "how is overtime pay calculated", "what is time and a half", "overtime after 40 or 44 hours"],
    supports: ["overtime-calculator", "time-card-calculator", "hourly-pay-calculator"],
    related: ["what-is-double-time-pay", "exempt-vs-non-exempt-employees", "is-overtime-taxed-more"],
    summary: "The formula, the regular-rate rules, and thresholds by country.",
  },
  {
    slug: "how-time-cards-work",
    title: "How Time Cards Work",
    metaTitle: "How Time Cards Work: Filling One Out & Common Mistakes",
    description:
      "What a time card records, how to fill one out for a weekly or biweekly pay period, how employers round punch times, record-keeping requirements, and the errors that cost workers hours.",
    updated: "2026-09-07",
    targets: ["how time cards work", "how to fill out a time card", "how to calculate time card hours"],
    supports: ["time-card-calculator", "time-clock-calculator", "hours-worked-calculator"],
    related: ["time-clock-rounding-rules", "how-to-calculate-hours-worked", "what-is-a-pay-period"],
    summary: "What a time card records, how to fill it out, and how rounding works.",
  },
  {
    slug: "salary-vs-hourly-pay",
    title: "Salary vs Hourly Pay",
    metaTitle: "Salary vs Hourly Pay: Differences, Pros and Cons",
    description:
      "The real differences between salaried and hourly jobs: overtime eligibility and the exempt/non-exempt test, pay stability, benefits, and how to compare two offers on equal terms.",
    updated: "2026-09-07",
    targets: ["salary vs hourly pay", "hourly vs salary", "difference between salary and hourly"],
    supports: ["salary-to-hourly-calculator", "hourly-pay-calculator", "overtime-calculator"],
    related: ["exempt-vs-non-exempt-employees", "convert-hourly-wage-to-annual-salary", "gross-pay-vs-take-home-pay"],
    summary: "Overtime eligibility, benefits, stability, and comparing offers.",
  },
  {
    slug: "gross-pay-vs-take-home-pay",
    title: "Gross Pay vs Take-Home Pay",
    metaTitle: "Gross Pay vs Take-Home Pay: What's the Difference?",
    description:
      "Why your paycheck is smaller than your salary: every deduction explained — federal and state income tax withholding, Social Security, Medicare, and pre-tax benefits — and how to read a pay stub.",
    updated: "2026-09-07",
    targets: ["gross pay vs net pay", "gross pay vs take home pay", "why is my paycheck less than my salary"],
    supports: ["take-home-pay-calculator", "paycheck-calculator", "salary-to-hourly-calculator"],
    related: ["how-to-read-a-pay-stub", "what-are-fica-taxes", "biweekly-vs-semimonthly-pay"],
    summary: "Every paycheck deduction explained, and how to read a pay stub.",
  },
  {
    slug: "how-many-work-hours-in-a-year",
    title: "How Many Work Hours Are in a Year?",
    metaTitle: "How Many Work Hours Are in a Year? (2026 & 2027)",
    description:
      "A full-time work year is 2,080 hours, but the number of working days changes each year and paid time off reduces the hours you actually work. The breakdown, plus working days for 2026 and 2027.",
    updated: "2026-09-07",
    targets: ["how many work hours in a year", "how many working days in a year", "work hours in a year"],
    supports: ["working-hours-calculator", "salary-to-hourly-calculator"],
    related: ["what-is-full-time-equivalent", "convert-hourly-wage-to-annual-salary", "convert-minutes-to-decimal-hours"],
    summary: "The 2,080-hour standard, why years differ, and PTO-adjusted hours.",
  },

  // ---- Pay & paycheck ----------------------------------------------------
  {
    slug: "how-to-read-a-pay-stub",
    title: "How to Read a Pay Stub",
    metaTitle: "How to Read a Pay Stub: Every Line Explained",
    description:
      "A plain-English tour of a US pay stub: gross pay, the difference between current and year-to-date, pre-tax vs post-tax deductions, federal and state withholding, FICA, and how to check it is right.",
    updated: "2026-09-07",
    targets: ["how to read a pay stub", "pay stub explained", "what do the codes on my pay stub mean"],
    supports: ["paycheck-calculator", "take-home-pay-calculator", "hourly-pay-calculator"],
    related: ["gross-pay-vs-take-home-pay", "what-are-fica-taxes", "is-overtime-taxed-more"],
    summary: "Gross, net, YTD, pre-tax vs post-tax, and how to spot an error.",
  },
  {
    slug: "biweekly-vs-semimonthly-pay",
    title: "Biweekly vs Semimonthly Pay",
    metaTitle: "Biweekly vs Semimonthly Pay: 26 vs 24 Paychecks",
    description:
      "Biweekly pay means 26 paychecks a year (sometimes 27); semimonthly means 24 larger ones on fixed dates. How each affects your paycheck size, budgeting, benefit deductions, and overtime.",
    updated: "2026-09-07",
    targets: ["biweekly vs semimonthly", "how many paychecks in a year", "26 vs 24 pay periods", "semi monthly vs bi weekly"],
    supports: ["paycheck-calculator", "salary-to-hourly-calculator", "take-home-pay-calculator"],
    related: ["what-is-a-pay-period", "gross-pay-vs-take-home-pay", "convert-hourly-wage-to-annual-salary"],
    summary: "26 vs 24 paychecks, paycheck size, the 'extra' paycheck months, and benefits.",
  },
  {
    slug: "what-is-a-pay-period",
    title: "What Is a Pay Period?",
    metaTitle: "What Is a Pay Period? Types, Pay Dates & Examples",
    description:
      "A pay period is the stretch of time your paycheck covers. The four common types — weekly, biweekly, semimonthly, monthly — the lag between a pay period ending and payday, and why it matters for overtime.",
    updated: "2026-09-07",
    targets: ["what is a pay period", "pay period meaning", "types of pay periods", "pay period vs pay date"],
    supports: ["paycheck-calculator", "time-card-calculator", "salary-to-hourly-calculator"],
    related: ["biweekly-vs-semimonthly-pay", "how-time-cards-work", "how-to-calculate-overtime-pay"],
    summary: "The four types, the payday lag, and the workweek that governs overtime.",
  },
  {
    slug: "is-overtime-taxed-more",
    title: "Is Overtime Taxed More?",
    metaTitle: "Is Overtime Taxed More? How Overtime Withholding Works",
    description:
      "Overtime is not taxed at a higher rate, but a big paycheck can be over-withheld because payroll annualises it. How that works, why it evens out, and the temporary 2025–2028 federal overtime deduction.",
    updated: "2026-09-07",
    targets: ["is overtime taxed more", "why is overtime taxed so much", "does overtime get taxed higher", "no tax on overtime"],
    supports: ["overtime-calculator", "paycheck-calculator", "take-home-pay-calculator"],
    related: ["how-to-calculate-overtime-pay", "gross-pay-vs-take-home-pay", "how-to-read-a-pay-stub"],
    summary: "The withholding myth, why it evens out at tax time, and the new OT deduction.",
  },
  {
    slug: "what-are-fica-taxes",
    title: "What Are FICA Taxes?",
    metaTitle: "What Are FICA Taxes? Social Security & Medicare (2026)",
    description:
      "FICA is the Social Security and Medicare tax withheld from every US paycheck: 6.2% Social Security up to the $184,500 wage base for 2026, 1.45% Medicare with no cap, plus the 0.9% Additional Medicare Tax.",
    updated: "2026-09-07",
    targets: ["what is FICA", "what are FICA taxes", "FICA tax rate 2026", "social security and medicare tax"],
    supports: ["paycheck-calculator", "take-home-pay-calculator"],
    related: ["gross-pay-vs-take-home-pay", "how-to-read-a-pay-stub", "is-overtime-taxed-more"],
    summary: "The 6.2% + 1.45% split, the wage base, and the Additional Medicare Tax.",
  },

  // ---- Salary & conversions -------------------------------------------
  {
    slug: "convert-hourly-wage-to-annual-salary",
    title: "How to Convert an Hourly Wage to an Annual Salary",
    metaTitle: "Hourly to Salary: How to Convert Your Wage to a Year",
    description:
      "Multiply your hourly rate by hours per week and by 52 for a headline annual figure — then adjust for unpaid time off, overtime, and the difference between gross and take-home pay.",
    updated: "2026-09-07",
    targets: ["hourly to salary", "how much is 25 an hour annually", "convert hourly to yearly", "hourly wage to salary"],
    supports: ["salary-to-hourly-calculator", "hourly-pay-calculator", "working-hours-calculator"],
    related: ["how-many-work-hours-in-a-year", "salary-vs-hourly-pay", "gross-pay-vs-take-home-pay"],
    summary: "The × hours × 52 method, the 2,080 shortcut, and what it leaves out.",
  },
  {
    slug: "what-is-full-time-equivalent",
    title: "What Is a Full-Time Equivalent (FTE)?",
    metaTitle: "What Is Full-Time Equivalent (FTE)? How to Calculate It",
    description:
      "An FTE expresses a headcount as a share of a full-time schedule. Divide scheduled hours by full-time hours: two people at 20 hours each are 1.0 FTE. How to calculate it for a team and why employers use it.",
    updated: "2026-09-07",
    targets: ["what is FTE", "full time equivalent", "how to calculate FTE", "FTE meaning"],
    supports: ["working-hours-calculator", "salary-to-hourly-calculator"],
    related: ["how-many-work-hours-in-a-year", "convert-hourly-wage-to-annual-salary", "salary-vs-hourly-pay"],
    summary: "The definition, the formula, a worked team example, and common uses.",
  },
  {
    slug: "exempt-vs-non-exempt-employees",
    title: "Exempt vs Non-Exempt Employees",
    metaTitle: "Exempt vs Non-Exempt: Who Gets Overtime Under the FLSA",
    description:
      "Whether you get overtime depends on being non-exempt. The FLSA's three-part test — paid on a salary basis, above the salary threshold, and primarily performing exempt duties — plus common misclassification.",
    updated: "2026-09-07",
    targets: ["exempt vs non exempt", "am I exempt or non exempt", "who is entitled to overtime", "FLSA exemption test"],
    supports: ["overtime-calculator", "salary-to-hourly-calculator", "hourly-pay-calculator"],
    related: ["how-to-calculate-overtime-pay", "salary-vs-hourly-pay", "what-is-a-pay-period"],
    summary: "The three-part FLSA test, the salary threshold, and misclassification.",
  },

  // ---- Time & timekeeping ---------------------------------------------
  {
    slug: "convert-minutes-to-decimal-hours",
    title: "How to Convert Minutes to Decimal Hours",
    metaTitle: "Minutes to Decimal Hours: Conversion Method & Chart",
    description:
      "Payroll runs on decimal hours, not hours and minutes. Divide the minutes by 60: 30 minutes is 0.5, 15 minutes is 0.25, 10 minutes is 0.17. A full minute-by-minute conversion chart and worked examples.",
    updated: "2026-09-07",
    targets: ["minutes to decimal", "convert minutes to decimal hours", "payroll time conversion", "how to convert time to decimal"],
    supports: ["decimal-hours-calculator", "hours-worked-calculator", "time-clock-calculator"],
    related: ["how-to-calculate-hours-worked", "time-clock-rounding-rules", "how-time-cards-work"],
    summary: "Divide by 60, the rounding question, and a full conversion chart.",
  },
  {
    slug: "time-clock-rounding-rules",
    title: "Time Clock Rounding Rules",
    metaTitle: "Time Clock Rounding: The 7-Minute Rule Explained",
    description:
      "Employers may round punch times to 5, 6, or 15-minute increments, but only if the rounding is neutral over time and does not consistently favour the employer. The 7-minute rule, worked examples, and your rights.",
    updated: "2026-09-07",
    targets: ["time clock rounding", "7 minute rule", "15 minute rounding payroll", "is time clock rounding legal"],
    supports: ["time-clock-calculator", "time-card-calculator", "hours-worked-calculator"],
    related: ["how-time-cards-work", "convert-minutes-to-decimal-hours", "how-to-calculate-hours-worked"],
    summary: "The 7-minute rule, when rounding is legal, and how to check your total.",
  },
  {
    slug: "what-is-double-time-pay",
    title: "What Is Double-Time Pay?",
    metaTitle: "What Is Double Time? Rate, Rules & When It Applies",
    description:
      "Double time is twice your regular hourly rate. There is no federal double-time requirement in the US — it comes from state law like California's, from union contracts, or from employer policy. When it applies and how to calculate it.",
    updated: "2026-09-07",
    targets: ["what is double time", "double time pay", "double time and a half", "when do you get double time"],
    supports: ["overtime-calculator", "time-card-calculator", "hourly-pay-calculator"],
    related: ["how-to-calculate-overtime-pay", "exempt-vs-non-exempt-employees", "is-overtime-taxed-more"],
    summary: "The 2× rate, where the requirement comes from, and California's daily rule.",
  },
];

export const GUIDES_BY_SLUG: Record<string, GuideMeta> = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));
