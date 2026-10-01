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
      "Step by step: work out hours worked from clock times, subtract breaks, convert to decimal hours for payroll, handle overnight shifts, and apply rounding.",
    updated: "2026-09-07",
    targets: ["how to calculate hours worked", "how to calculate hours and minutes for payroll", "how to calculate hours worked on a time card"],
    supports: ["hours-worked-calculator", "time-card-calculator", "decimal-hours-calculator"],
    related: ["convert-minutes-to-decimal-hours", "time-clock-rounding-rules", "how-time-cards-work", "overnight-shift-hours", "are-breaks-paid"],
    summary: "The manual method, decimal conversion, overnight shifts, and payroll rounding.",
  },
  {
    slug: "how-to-calculate-overtime-pay",
    title: "How to Calculate Overtime Pay",
    metaTitle: "How to Calculate Overtime Pay: Formula & Rules",
    description:
      "How overtime pay is calculated: the time-and-a-half formula, weekly vs daily thresholds, the regular rate, and rules in the US, Canada, UK and Australia.",
    updated: "2026-09-07",
    targets: ["how to calculate overtime pay", "how is overtime pay calculated", "what is time and a half", "overtime after 40 or 44 hours"],
    supports: ["overtime-calculator", "time-card-calculator", "hourly-pay-calculator"],
    related: ["what-is-double-time-pay", "exempt-vs-non-exempt-employees", "is-overtime-taxed-more", "california-overtime-rules", "ontario-overtime-rules", "uk-overtime-pay-rules", "overtime-with-two-pay-rates"],
    summary: "The formula, the regular-rate rules, and thresholds by country.",
  },
  {
    slug: "how-time-cards-work",
    title: "How Time Cards Work",
    metaTitle: "How Time Cards Work: Filling One Out & Common Mistakes",
    description:
      "What a time card records, how to fill one out for a weekly or biweekly pay period, how punch times are rounded, and the mistakes that cost workers hours.",
    updated: "2026-09-07",
    targets: ["how time cards work", "how to fill out a time card", "how to calculate time card hours"],
    supports: ["time-card-calculator", "time-clock-calculator", "hours-worked-calculator"],
    related: ["time-clock-rounding-rules", "how-to-calculate-hours-worked", "what-is-a-pay-period", "are-breaks-paid"],
    summary: "What a time card records, how to fill it out, and how rounding works.",
  },
  {
    slug: "salary-vs-hourly-pay",
    title: "Salary vs Hourly Pay",
    metaTitle: "Salary vs Hourly Pay: Differences, Pros and Cons",
    description:
      "Salary vs hourly pay compared: overtime eligibility and the exempt test, pay stability, benefits, and how to compare two job offers on equal terms.",
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
      "Why your paycheck is smaller than your salary: federal and state tax withholding, Social Security, Medicare, and pre-tax benefits explained.",
    updated: "2026-09-07",
    targets: ["gross pay vs net pay", "gross pay vs take home pay", "why is my paycheck less than my salary"],
    supports: ["paycheck-calculator", "salary-to-hourly-calculator", "hourly-pay-calculator"],
    related: ["how-to-read-a-pay-stub", "what-are-fica-taxes", "biweekly-vs-semimonthly-pay"],
    summary: "Every paycheck deduction explained, and how to read a pay stub.",
  },
  {
    slug: "how-many-work-hours-in-a-year",
    title: "How Many Work Hours Are in a Year?",
    metaTitle: "How Many Work Hours Are in a Year? (2026 & 2027)",
    description:
      "A full-time work year is 2,080 hours, but working days vary and paid time off cuts the hours you actually work. Breakdown plus 2026 and 2027 working days.",
    updated: "2026-09-07",
    targets: ["how many work hours in a year", "how many working days in a year", "work hours in a year"],
    supports: ["hours-worked-calculator", "salary-to-hourly-calculator"],
    related: ["what-is-full-time-equivalent", "convert-hourly-wage-to-annual-salary", "how-to-calculate-pto-accrual"],
    summary: "The 2,080-hour standard, why years differ, and PTO-adjusted hours.",
  },

  // ---- Pay & paycheck ----------------------------------------------------
  {
    slug: "how-to-read-a-pay-stub",
    title: "How to Read a Pay Stub",
    metaTitle: "How to Read a Pay Stub: Every Line Explained",
    description:
      "A plain-English tour of a US pay stub: gross vs net pay, current vs year-to-date, pre-tax and post-tax deductions, withholding, FICA, and how to check it.",
    updated: "2026-09-07",
    targets: ["how to read a pay stub", "pay stub explained", "what do the codes on my pay stub mean"],
    supports: ["paycheck-calculator", "hourly-pay-calculator"],
    related: ["gross-pay-vs-take-home-pay", "what-are-fica-taxes", "is-overtime-taxed-more"],
    summary: "Gross, net, YTD, pre-tax vs post-tax, and how to spot an error.",
  },
  {
    slug: "biweekly-vs-semimonthly-pay",
    title: "Biweekly vs Semimonthly Pay",
    metaTitle: "Biweekly vs Semimonthly Pay: 26 vs 24 Paychecks",
    description:
      "Biweekly pay is 26 paychecks a year (sometimes 27); semimonthly is 24 larger ones on fixed dates. How each affects paycheck size, budgeting and overtime.",
    updated: "2026-09-07",
    targets: ["biweekly vs semimonthly", "how many paychecks in a year", "26 vs 24 pay periods", "semi monthly vs bi weekly"],
    supports: ["paycheck-calculator", "salary-to-hourly-calculator"],
    related: ["what-is-a-pay-period", "gross-pay-vs-take-home-pay", "convert-hourly-wage-to-annual-salary", "27-pay-periods"],
    summary: "26 vs 24 paychecks, paycheck size, the 'extra' paycheck months, and benefits.",
  },
  {
    slug: "what-is-a-pay-period",
    title: "What Is a Pay Period?",
    metaTitle: "What Is a Pay Period? Types, Pay Dates & Examples",
    description:
      "A pay period is the time one paycheck covers. The four types — weekly, biweekly, semimonthly, monthly — the payday lag, and why it matters for overtime.",
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
      "Overtime isn't taxed at a higher rate, but a big paycheck can be over-withheld. Why it evens out at tax time, and the 2025–2028 overtime deduction.",
    updated: "2026-09-07",
    targets: ["is overtime taxed more", "why is overtime taxed so much", "does overtime get taxed higher", "no tax on overtime"],
    supports: ["overtime-calculator", "paycheck-calculator"],
    related: ["how-to-calculate-overtime-pay", "gross-pay-vs-take-home-pay", "how-to-read-a-pay-stub"],
    summary: "The withholding myth, why it evens out at tax time, and the new OT deduction.",
  },
  {
    slug: "what-are-fica-taxes",
    title: "What Are FICA Taxes?",
    metaTitle: "What Are FICA Taxes? Social Security & Medicare (2026)",
    description:
      "FICA is the Social Security and Medicare tax on every US paycheck: 6.2% up to the $184,500 2026 wage base, 1.45% Medicare, plus 0.9% Additional Medicare.",
    updated: "2026-09-07",
    targets: ["what is FICA", "what are FICA taxes", "FICA tax rate 2026", "social security and medicare tax"],
    supports: ["paycheck-calculator"],
    related: ["gross-pay-vs-take-home-pay", "how-to-read-a-pay-stub", "is-overtime-taxed-more"],
    summary: "The 6.2% + 1.45% split, the wage base, and the Additional Medicare Tax.",
  },

  // ---- Salary & conversions -------------------------------------------
  {
    slug: "convert-hourly-wage-to-annual-salary",
    title: "How to Convert an Hourly Wage to an Annual Salary",
    metaTitle: "Hourly to Salary: How to Convert Your Wage to a Year",
    description:
      "Multiply your hourly rate by hours per week and by 52 for the annual figure, then adjust for unpaid time off, overtime, and gross vs take-home pay.",
    updated: "2026-09-07",
    targets: ["hourly to salary", "how much is 25 an hour annually", "convert hourly to yearly", "hourly wage to salary"],
    supports: ["salary-to-hourly-calculator", "hourly-pay-calculator", "hours-worked-calculator"],
    related: ["how-many-work-hours-in-a-year", "salary-vs-hourly-pay", "gross-pay-vs-take-home-pay"],
    summary: "The × hours × 52 method, the 2,080 shortcut, and what it leaves out.",
  },
  {
    slug: "what-is-full-time-equivalent",
    title: "What Is a Full-Time Equivalent (FTE)?",
    metaTitle: "What Is Full-Time Equivalent (FTE)? How to Calculate It",
    description:
      "An FTE expresses headcount as a share of a full-time schedule: two people at 20 hours each are 1.0 FTE. How to calculate it for a team and why it matters.",
    updated: "2026-09-07",
    targets: ["what is FTE", "full time equivalent", "how to calculate FTE", "FTE meaning"],
    supports: ["hours-worked-calculator", "salary-to-hourly-calculator"],
    related: ["how-many-work-hours-in-a-year", "convert-hourly-wage-to-annual-salary", "salary-vs-hourly-pay"],
    summary: "The definition, the formula, a worked team example, and common uses.",
  },
  {
    slug: "exempt-vs-non-exempt-employees",
    title: "Exempt vs Non-Exempt Employees",
    metaTitle: "Exempt vs Non-Exempt: Who Gets Overtime Under the FLSA",
    description:
      "Overtime depends on being non-exempt. The FLSA three-part test — salary basis, salary threshold and exempt duties — plus common misclassification.",
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
      "Payroll uses decimal hours. Divide minutes by 60: 30 minutes is 0.5, 15 is 0.25, 10 is 0.17. A full minute-by-minute conversion chart and worked examples.",
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
      "Employers may round punches to 5, 6 or 15 minutes, but only if it is neutral over time. The 7-minute rule, worked examples, and what your rights are.",
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
      "Double time is 2× your regular rate. No US federal law requires it; it comes from state law like California's, union contracts or policy. When it applies.",
    updated: "2026-09-07",
    targets: ["what is double time", "double time pay", "double time and a half", "when do you get double time"],
    supports: ["overtime-calculator", "time-card-calculator", "hourly-pay-calculator"],
    related: ["how-to-calculate-overtime-pay", "california-overtime-rules", "exempt-vs-non-exempt-employees", "is-overtime-taxed-more"],
    summary: "The 2× rate, where the requirement comes from, and California's daily rule.",
  },
  // ---- Oct 2026: depth guides (rules by jurisdiction, edge cases) ----------
  {
    slug: "california-overtime-rules",
    title: "California Overtime Rules: Daily, Weekly and 7th-Day",
    metaTitle: "California Overtime Rules: Daily, Weekly & 7th Day",
    description:
      "California pays overtime after 8 hours a day and 40 a week, double time after 12, and special 7th-day rates. Rules, workday definition and a worked week.",
    updated: "2026-10-01",
    targets: ["california overtime rules", "california overtime laws", "california daily overtime", "7th day overtime california"],
    supports: ["overtime-calculator", "time-card-calculator"],
    related: ["what-is-double-time-pay", "how-to-calculate-overtime-pay", "split-shift-pay"],
    summary: "Daily and weekly overtime, double time, the 7th-day rule, and a worked week.",
  },
  {
    slug: "ontario-overtime-rules",
    title: "Ontario Overtime Rules: The 44-Hour Week Explained",
    metaTitle: "Ontario Overtime Rules: The 44-Hour Week Explained",
    description:
      "Ontario overtime starts after 44 hours a week at 1.5 times pay. How averaging agreements, banked time off, hour limits and manager exemptions work.",
    updated: "2026-10-01",
    targets: ["ontario overtime rules", "overtime after 44 hours ontario", "ontario overtime averaging agreement", "banked overtime ontario"],
    supports: ["overtime-calculator", "time-card-calculator"],
    related: ["how-to-calculate-overtime-pay", "are-breaks-paid", "uk-overtime-pay-rules"],
    summary: "The 44-hour threshold, averaging agreements, and banked time off.",
  },
  {
    slug: "uk-overtime-pay-rules",
    title: "UK Overtime Pay Rules: What Employers Must Pay",
    metaTitle: "UK Overtime Pay Rules: What Your Employer Must Pay",
    description:
      "There's no legal overtime rate in the UK, but pay can't fall below minimum wage. The 48-hour week, part-time overtime, TOIL and holiday pay explained.",
    updated: "2026-10-01",
    targets: ["uk overtime pay rules", "is overtime paid in the uk", "unpaid overtime uk minimum wage", "48 hour week uk"],
    supports: ["overtime-calculator", "hourly-pay-calculator"],
    related: ["how-to-calculate-overtime-pay", "are-breaks-paid", "how-to-calculate-pto-accrual"],
    summary: "Contractual overtime, the minimum-wage check, the 48-hour week, holiday pay.",
  },
  {
    slug: "overtime-with-two-pay-rates",
    title: "How to Calculate Overtime With Two Pay Rates",
    metaTitle: "Overtime With Two Pay Rates: Weighted Average Method",
    description:
      "Worked two jobs at different rates in one week? Overtime uses the weighted average regular rate. Step-by-step method, worked example and the alternative.",
    updated: "2026-10-01",
    targets: ["overtime with two different pay rates", "weighted average overtime", "blended overtime rate", "overtime two jobs same employer"],
    supports: ["overtime-calculator", "hourly-pay-calculator"],
    related: ["how-to-calculate-overtime-pay", "shift-differential-pay", "how-to-read-a-pay-stub"],
    summary: "The weighted-average regular rate, a worked example, and the agreement option.",
  },
  {
    slug: "shift-differential-pay",
    title: "What Is Shift Differential Pay?",
    metaTitle: "Shift Differential Pay: What It Is & How to Calculate It",
    description:
      "Shift differentials pay extra for nights, evenings and weekends. How to calculate them, why they raise your overtime rate, and a worked pay example.",
    updated: "2026-10-01",
    targets: ["shift differential pay", "what is shift differential", "night shift differential", "shift differential overtime"],
    supports: ["overtime-calculator", "hourly-pay-calculator", "paycheck-calculator"],
    related: ["overtime-with-two-pay-rates", "overnight-shift-hours", "how-to-calculate-overtime-pay"],
    summary: "Flat and percentage differentials, and how they change overtime pay.",
  },
  {
    slug: "overnight-shift-hours",
    title: "How to Calculate Hours for Overnight Shifts",
    metaTitle: "How to Calculate Overnight Shift Hours (Past Midnight)",
    description:
      "Calculate hours for shifts past midnight: the 24-hour method, which day and week the hours count in, and what happens when the clocks change overnight.",
    updated: "2026-10-01",
    targets: ["how to calculate overnight shift hours", "calculate hours past midnight", "night shift hours daylight saving", "overnight shift overtime"],
    supports: ["hours-worked-calculator", "time-card-calculator", "time-clock-calculator"],
    related: ["how-to-calculate-hours-worked", "shift-differential-pay", "california-overtime-rules"],
    summary: "The midnight method, workweek and workday splits, and daylight saving nights.",
  },
  {
    slug: "are-breaks-paid",
    title: "Are Breaks Paid? Lunch and Rest Break Rules",
    metaTitle: "Are Breaks Paid? Lunch & Rest Break Rules Explained",
    description:
      "Short breaks are usually paid; meal breaks usually aren't. Break rules in the US, California, Ontario, UK and Australia, and how breaks change your hours.",
    updated: "2026-10-01",
    targets: ["are breaks paid", "is lunch break paid", "paid rest breaks", "california meal and rest breaks"],
    supports: ["hours-worked-calculator", "time-card-calculator", "time-clock-calculator"],
    related: ["how-to-calculate-hours-worked", "how-time-cards-work", "split-shift-pay"],
    summary: "Paid vs unpaid breaks by country, California penalties, and auto-deducted lunches.",
  },
  {
    slug: "split-shift-pay",
    title: "Split Shift Pay: Hours and California's Premium",
    metaTitle: "Split Shift Pay: Hours, Rules & California Premium",
    description:
      "How to count hours on a split shift, what counts as one, and how California's split shift premium is calculated, with worked examples and break-even rates.",
    updated: "2026-10-01",
    targets: ["split shift pay", "split shift premium california", "what is a split shift", "split shift calculator"],
    supports: ["hours-worked-calculator", "time-card-calculator"],
    related: ["california-overtime-rules", "are-breaks-paid", "overnight-shift-hours"],
    summary: "Counting hours, what qualifies, and California's minimum-wage premium.",
  },
  {
    slug: "27-pay-periods",
    title: "27 Pay Periods: Years With an Extra Payday",
    metaTitle: "27 Pay Periods: Which Years Have an Extra Payday?",
    description:
      "Biweekly pay has 27 paydays about every 11 years. Which years by payday (2026–2036), what it means for salaried pay, deductions, and three-paycheck months.",
    updated: "2026-10-01",
    targets: ["27 pay periods", "27 pay periods 2026", "27 biweekly pay periods", "which years have 27 pay periods"],
    supports: ["paycheck-calculator", "salary-to-hourly-calculator"],
    related: ["biweekly-vs-semimonthly-pay", "what-is-a-pay-period", "gross-pay-vs-take-home-pay"],
    summary: "Which years have 27 paydays, and what it means for your salary.",
  },
  {
    slug: "how-to-calculate-pto-accrual",
    title: "How to Calculate PTO Accrual",
    metaTitle: "How to Calculate PTO Accrual (Rates, Examples & Rules)",
    description:
      "PTO accrual = annual PTO hours ÷ hours worked. Accrual rate tables, part-time examples, caps, and the leave rules in the US, UK, Ontario and Australia.",
    updated: "2026-10-01",
    targets: ["how to calculate pto accrual", "pto accrual rate", "pto per hour worked", "pto accrual calculator"],
    supports: ["hours-worked-calculator", "salary-to-hourly-calculator"],
    related: ["how-many-work-hours-in-a-year", "convert-hourly-wage-to-annual-salary", "what-is-full-time-equivalent"],
    summary: "Per-hour and per-period accrual, rate tables, caps, and legal minimums.",
  },
];

export const GUIDES_BY_SLUG: Record<string, GuideMeta> = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));
