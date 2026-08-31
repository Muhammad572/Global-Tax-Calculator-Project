# @tinytools/calc — changelog & tax-data provenance

The engine version and the tax-table data version move independently. Any change
to a tax table is recorded here with its source and effective date so results
stay auditable.

## Engine

### 0.1.0 — Phase B
- `money`, `time`, `overtime`, `timecard`, `payConversion`, `workingHours`,
  `paycheck` modules. Deterministic, UI-independent, no AI, no network.

## Tax data

### 2026 — loaded Phase B3 (build date 2026-08-31)

| Jurisdiction | Method | Source | Notes |
|---|---|---|---|
| US federal income tax | Percentage Method for Automated Payroll Systems (Pub 15-T Worksheet 1A), annual | IRS Publication 15-T (for use in 2026) | Standard + Step-2-checkbox schedules for MFJ / Single / HoH. Cross-checked: 0% band + Step-2-unchecked add ($8,600 / $12,900) = 2026 standard deduction ($16,100 / $24,150 / $32,200). Models 2020+ W-4 only. |
| FICA | Statutory rates | SSA 2026 wage base; IRC §3101/§3121; IRS Additional Medicare Tax | Social Security 6.2% up to $184,500; Medicare 1.45% uncapped; Additional Medicare 0.9% on wages over $200,000 (withheld regardless of filing status). |
| CA income tax | Method B — Exact Calculation, annual | California EDD DE 44, "California Withholding Schedules for 2026" | Tables 1 (low income exemption), 3 (standard deduction), 4 (exemption allowance credit, $168.30/allowance annual), 5/6/7 (Single / Married / HoH rate tables). Verified against the EDD's own worked Example F ($57,000 married, 4 allowances → $86.00/yr). CA SDI (1.3%, uncapped) is available but not auto-applied by the paycheck orchestrator yet. |
| NY income tax | Method II — Exact Calculation, annual | NY Publication NYS-50-T-NYS (1/26) | Annual Tax Rate Schedule (Single, Married) + Table A combined deduction/exemption allowance ($7,400 / $7,950 base + $1,000/exemption). NYC and Yonkers resident taxes not included. |
| PA income tax | Flat | PA Department of Revenue | 3.07%, no allowances, no standard deduction. Philadelphia wage tax not included. |
| IL income tax | Flat + exemption | IL Booklet IL-700-T (2026) | 4.95%; 2026 personal exemption allowance $2,925. |
| No wage income tax | — | State statutes | AK, FL, NH (wages), NV, SD, TN, TX, WA, WY → $0 state withholding. |

**Not yet supported (paycheck / take-home):** all other US states; all US local
taxes; Canada, United Kingdom, Australia; any tax year other than 2026. The
engine returns `{ supported: false, reason }` for these — it never fabricates a
number.

**Scope of the estimate:** federal + state income tax *withholding* (percentage
method), Social Security, Medicare + Additional Medicare, and user-entered
pre-/post-tax deductions. It does **not** model tax-return liability, credits,
SUI/SDI (beyond noted), garnishments, or multi-job YTD wage-base tracking.
