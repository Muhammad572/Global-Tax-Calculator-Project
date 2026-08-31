# @tinytools/calc

The calculation engine behind the TinyTools work-hours and pay calculators.

## Principles

- **Deterministic** — every export is `(input) => output`. No `Date.now()` in the
  math (callers pass the tax year / "now"), no I/O, no network, **no AI**.
- **Integer cents** for all money (`money.ts`); **whole minutes** for time.
- **Itemized results** — functions return the intermediate steps, not just a
  number, so the UI can render a "how this was calculated" breakdown from the
  same object.
- **Errors, not guesses** — bad user input produces a `CalcIssue` the UI shows
  inline. An unsupported tax jurisdiction returns `{ supported: false, reason }`,
  never a fabricated figure.

## Modules

| Module | Purpose | Powers |
|---|---|---|
| `money` | integer-cents math, rounding, currency formatting | everything |
| `time` | parse/format time-of-day, durations, decimal hours, add/subtract | Time Calculator, Decimal Hours |
| `timecard` | multi-day rows, breaks, overnight shifts, weekly totals, gross pay | Time Card, Hours Worked, Time Clock |
| `overtime` | jurisdiction presets (US-FLSA/CA/Ontario/UK/AU), weekly + daily multi-tier split, pay | Overtime Calculator |
| `payConversion` | frequency conversion, raises, PTO-adjusted real hourly | Salary↔Hourly, Hourly Pay |
| `workingHours` | annual hours, business days, FTE | Working Hours Calculator |
| `paycheck` | federal + FICA + state withholding → net pay estimate (2026, ~13 states) | Paycheck, Take-Home Pay |

See [`CHANGELOG.md`](./CHANGELOG.md) for tax-data sources and provenance.

## Develop

```bash
npm test            # vitest, from repo root or this package
npm run typecheck   # tsc --noEmit, strict
```
