/** F6: independent inspection of representative paycheck calculations. */
import { computePaycheck, fromCents, toCents } from "../packages/calc/src/index.ts";

const money = (c) => "$" + fromCents(c).toLocaleString("en-US", { minimumFractionDigits: 2 });

function show(label, input, expectNotes) {
  const r = computePaycheck(input);
  console.log(`\n### ${label}`);
  console.log(`  supported: ${r.supported}${r.reason ? "  reason: " + r.reason : ""}`);
  console.log(`  gross/period: ${money(r.grossPerPeriodCents)}  taxable: ${money(r.taxablePerPeriodCents)}`);
  console.log(`  federal: ${money(r.federal.withholdingPerPeriodCents)}/period  (annual ${money(r.federal.withholdingAnnualCents)})  [${r.federal.supported ? "ok" : "N/A: " + r.federal.reason}]`);
  for (const l of r.fica.lines) console.log(`  fica: ${l.label} = ${money(l.amountCents)}`);
  console.log(`  state: ${r.state.supported ? money(r.state.withholdingPerPeriodCents) + "/period" : "NOT SUPPORTED: " + r.state.reason}`);
  console.log(`  NET/period: ${money(r.netPerPeriodCents)}   effective rate: ${(r.effectiveRate * 100).toFixed(2)}%`);
  if (expectNotes) console.log(`  expect: ${expectNotes}`);
}

show("Single, $2,500 biweekly, Texas (no state tax)", {
  grossPerPeriodCents: toCents(2500), payFrequency: "biweekly", filingStatus: "single", taxYear: 2026, state: "TX",
}, "SS 2500*.062=$155.00; Medicare 2500*.0145=$36.25; fed via annualised $65,000");

show("Single, $60,000/yr as annual, Texas", {
  grossPerPeriodCents: toCents(60000), payFrequency: "annual", filingStatus: "single", taxYear: 2026, state: "TX",
}, "federal annual should be ~$5,020 (hand calc: 1240 + 12% of (51400-19900))");

show("MFJ, $52,000/yr annual, Pennsylvania", {
  grossPerPeriodCents: toCents(52000), payFrequency: "annual", filingStatus: "mfj", taxYear: 2026, state: "PA",
}, "PA flat 3.07% of 52000 = $1,596.40/yr");

show("MFJ, $57,000/yr, California, 4 allowances, monthly", {
  grossPerPeriodCents: toCents(4750), payFrequency: "monthly", filingStatus: "mfj", taxYear: 2026, state: "CA", stateAllowances: 4,
}, "CA EDD DE 44 Example F: annual state withholding $86.00 -> ~$7.17/month");

show("Single, $300,000/yr annual, New York", {
  grossPerPeriodCents: toCents(300000), payFrequency: "annual", filingStatus: "single", taxYear: 2026, state: "NY",
}, "SS capped at 184500*.062=$11,439; Additional Medicare on 100k over 200k = $900");

show("Single, $2,500 biweekly, Ohio (unsupported state)", {
  grossPerPeriodCents: toCents(2500), payFrequency: "biweekly", filingStatus: "single", taxYear: 2026, state: "other",
}, "state NOT SUPPORTED; federal + FICA still computed; net > 0");

show("Single, $2,500 biweekly, CA, tax year 2027 (unsupported year)", {
  grossPerPeriodCents: toCents(2500), payFrequency: "biweekly", filingStatus: "single", taxYear: 2027, state: "CA",
}, "everything NOT SUPPORTED; nothing fabricated");

show("Single, $0, Texas (zero income)", {
  grossPerPeriodCents: 0, payFrequency: "biweekly", filingStatus: "single", taxYear: 2026, state: "TX",
}, "all zero, no crash");
