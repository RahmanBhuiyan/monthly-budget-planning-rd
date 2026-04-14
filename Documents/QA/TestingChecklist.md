# Testing Checklist

> One row per planned test. Update the **Status** column as tests are written. This is the implementation tracker for `feature/test-suite-baseline`. Strategy lives in `TestingStrategy.md`; setup/sample code in `Engineering/Backend/TestingGuide.md` and `Engineering/Frontend/TestingGuide.md`.

**Status legend:** `❌` not started · `🚧` in progress · `✅` passing · `⏸️` blocked (note why) · `🐛` pinning a known bug (must fail until bug is fixed)

---

## Backend — Unit (`tests/unit/`)

### Protected business logic — `[BIZ-QC-NEEDED]` to change
| # | Test | Status | Notes |
|---|------|--------|-------|
| U-01 | `saved` positive case | ❌ | sample in `Engineering/Backend/TestingGuide.md §4` |
| U-02 | `saved` negative case (overspent) | ❌ | sample shown |
| U-03 | `saved` with no income (0 default) | ❌ | sample shown |
| U-04 | `budget_remaining` zero at exact budget | ❌ | sample shown |
| U-05 | `budget_remaining` negative when overspent | ❌ | |
| U-06 | `budget_remaining` with no budget set (0 default) | ❌ | |
| U-07 | `usage_percent` zero when budget=0 (no division by zero) | ❌ | |
| U-08 | `usage_percent` boundary at 0%, 79.9%, 80%, 99.9%, 100%, 100.1% | ❌ | parametrize |
| U-09 | Alert threshold boundaries (parametrized 6 cases) | ❌ | sample shown — covers warning/critical/success transitions |
| U-10 | Warning + suggestion both fire at exactly 80% | ❌ | sample shown |
| U-11 | Critical + suggestion both fire at exactly 100% | ❌ | |
| U-12 | Only `info` fires when no budget set | ❌ | |
| U-13 | `highest_category` returns `'N/A'` when no expenses | ❌ | sample shown |
| U-14 | `highest_category` picks the max | ❌ | sample shown |
| U-15 | `highest_category` tie-breaking (deterministic) | ❌ | document the chosen rule first |
| U-16 | `avg_daily` for 31-day month | ❌ | parametrize covers this |
| U-17 | `avg_daily` for 30-day month | ❌ | parametrize |
| U-18 | `avg_daily` for February (28 days, non-leap) | ❌ | parametrize |
| U-19 | `avg_daily` for February (29 days, leap year) | ❌ | parametrize — 2024 |
| U-20 | `avg_daily` returns 0.0 when total_spent=0 | ❌ | |

### Models
| # | Test | Status | Notes |
|---|------|--------|-------|
| U-21 | `User.set_password` + `check_password` round-trip | ❌ | |
| U-22 | `User.to_dict` excludes `password_hash` | ❌ | regression-critical |
| U-23 | All model `to_dict()` shapes (User, Income, Budget, Expense) | ❌ | one assertion each |

---

## Backend — Integration (`tests/integration/`)

### `routes/auth.py`
| # | Test | Status | Notes |
|---|------|--------|-------|
| I-01 | POST /signup happy path → 201 + token | ❌ | |
| I-02 | POST /signup missing field → 400 | ❌ | |
| I-03 | POST /signup duplicate username → 409 | ❌ | |
| I-04 | POST /signup duplicate email → 409 | ❌ | |
| I-05 | POST /login valid credentials → 200 + token | ❌ | |
| I-06 | POST /login wrong password → 401 | ❌ | |
| I-07 | POST /login unknown email → 401 | ❌ | |
| I-08 | POST /login missing field → 400 | ❌ | |
| I-08a | POST /login on Google-only account (`password_hash IS NULL`) → 401 | ❌ | regression for `routes/auth.py:45` short-circuit |
| I-08b | POST /auth/google missing `credential` → 400 | ❌ | |
| I-08c | POST /auth/google invalid credential (mocked `verify_oauth2_token` raises `ValueError`) → 401 | ❌ | mock `google.oauth2.id_token.verify_oauth2_token` |
| I-08d | POST /auth/google new user creates row with `password_hash=NULL`, `google_id=sub` | ❌ | |
| I-08e | POST /auth/google with email matching existing email/password user links the Google ID (no duplicate row) | ❌ | account-linking flow |
| I-08f | POST /auth/google username collision suffixes correctly (`name`, `name1`, `name2`) | ❌ | parametrize 3 collisions |
| I-08g | POST /auth/google never returns `google_id` in response `user` object | ❌ | regression-critical (privacy boundary) |

### `routes/income.py`
| # | Test | Status | Notes |
|---|------|--------|-------|
| I-09 | POST /income happy path → 200 | ❌ | |
| I-10 | POST /income re-submit overwrites (upsert) | ❌ | |
| I-11 | POST /income missing field → 400 | ❌ | |
| I-12 | POST /income negative amount → 400 | ❌ | |
| I-13 | GET /income existing month → 200 with row | ❌ | |
| I-14 | GET /income missing month → 200 with `null` | ❌ | |

### `routes/budget.py`
| # | Test | Status | Notes |
|---|------|--------|-------|
| I-15 | POST /budget happy path → 200 | ❌ | |
| I-16 | POST /budget with `savings_goal` → stored | ❌ | |
| I-17 | 🐛 POST /budget without `savings_goal` MUST preserve existing value | ❌ | pins `BUG-1` (`SRS §6.1`) — fails today |
| I-18 | POST /budget missing field → 400 | ❌ | |
| I-19 | POST /budget negative amount → 400 | ❌ | |
| I-20 | GET /budget existing month → 200 with row | ❌ | |
| I-21 | GET /budget missing month → 200 with `null` | ❌ | |

### `routes/expenses.py`
| # | Test | Status | Notes |
|---|------|--------|-------|
| I-22 | POST /expenses happy path → 201 | ❌ | |
| I-23 | POST /expenses default date = today | ❌ | |
| I-24 | POST /expenses missing amount → 400 | ❌ | |
| I-25 | POST /expenses negative amount → 400 | ❌ | sample shown |
| I-26 | POST /expenses invalid category → 400 | ❌ | sample shown |
| I-27 | 🐛 POST /expenses malformed date → 400 (currently 500) | ❌ | pins `BUG-5` (`SRS §6.3`) — fails today |
| I-28 | GET /expenses sorted by date desc | ❌ | |
| I-29 | GET /expenses filtered by month + year | ❌ | |
| I-30 | DELETE /expenses owned → 200 | ❌ | |
| I-31 | DELETE /expenses not owned → 404 (no leak) | ❌ | sample shown |
| I-32 | DELETE /expenses non-existent → 404 | ❌ | |

### `routes/reports.py`
| # | Test | Status | Notes |
|---|------|--------|-------|
| I-33 | GET /summary happy path returns full envelope | ❌ | shape match |
| I-34 | GET /summary with no income/budget rows → 0.0 defaults | ❌ | guard regression for old AttributeError claim |
| I-35 | GET /categories sorted (once `ORDER BY` is added — `BUG-9`) | ❌ | until then assert set-equality, not order |
| I-36 | GET /alerts no-budget case → `[info]` | ❌ | |
| I-37 | GET /alerts <80% case → `[success]` | ❌ | |
| I-38 | GET /alerts 80–99% case → `[warning, suggestion]` | ❌ | |
| I-39 | GET /alerts ≥100% case → `[critical, suggestion]` | ❌ | |
| I-40 | GET /alerts top-level fields (usage_percent, total_spent, budget_amount) present | ❌ | |

### Cross-cutting authorization
| # | Test | Status | Notes |
|---|------|--------|-------|
| I-41 | Any protected endpoint without JWT → 401 | ❌ | sample shown — parametrize across endpoints |
| I-42 | User A reads only their own income | ❌ | |
| I-43 | User A reads only their own budget | ❌ | |
| I-44 | User A reads only their own expenses | ❌ | |
| I-45 | User A reports endpoints exclude User B's data | ❌ | |

---

## Frontend — Page render smoke (`src/pages/__tests__/`)
| # | Test | Status | Notes |
|---|------|--------|-------|
| F-01 | Welcome renders | ❌ | sample pattern in `Engineering/Frontend/TestingGuide.md §7` |
| F-02 | Login renders | ❌ | covered in §5 sample |
| F-03 | Signup renders | ❌ | |
| F-04 | IncomeSetup renders | ❌ | |
| F-05 | BudgetSetup renders | ❌ | |
| F-06 | Dashboard renders with summary | ❌ | sample shown |
| F-07 | AddExpense renders with category dropdown | ❌ | |
| F-08 | ExpenseList renders grouped by date | ❌ | |
| F-09 | Categories renders cards | ❌ | |
| F-10 | MonthlyAnalysis renders chart | ❌ | |
| F-11 | BudgetAlerts renders alert items | ❌ | |
| F-12 | MonthlySummary renders summary cards | ❌ | |

## Frontend — Critical interactions
| # | Test | Status | Notes |
|---|------|--------|-------|
| F-13 | Login submit success stores token + redirects | ❌ | sample shown |
| F-13a | GoogleLoginButton renders on Login and Signup pages | ❌ | mock `window.google.accounts.id` |
| F-13b | GoogleLoginButton callback success stores token + redirects | ❌ | mock `api.googleLogin` resolved |
| F-13c | GoogleLoginButton callback failure shows error, no token stored | ❌ | mock `api.googleLogin` rejected with 401 |
| F-14 | Login submit 401 shows error, no token stored | ❌ | sample shown |
| F-15 | Signup submit success → onboarding flow | ❌ | |
| F-16 | Signup submit 409 shows error | ❌ | |
| F-17 | IncomeSetup submit → /setup/budget | ❌ | |
| F-18 | BudgetSetup submit → /dashboard | ❌ | |
| F-19 | AddExpense submit clears form, navigates | ❌ | |
| F-20 | ExpenseList delete success removes item | ❌ | sample shown |
| F-21 | ExpenseList delete failure leaves item visible (current behavior) | ❌ | sample shown — pins `BUG-11` UX gap |
| F-22 | MonthlySummary logout clears localStorage | ❌ | |
| F-23 | Dashboard 401 → logout-redirect | ❌ | sample shown |

## Frontend — Routing & shell
| # | Test | Status | Notes |
|---|------|--------|-------|
| F-24 | App routes smoke (each path renders without crashing) | ❌ | sample for 3 unauth routes shown |
| F-25 | BottomNav highlights active route | ❌ | |

---

## Coverage gates (CI, when added)

| Area | Target |
|------|--------|
| Backend `routes/` | ≥80% line |
| Backend `models.py` | ≥80% line |
| Frontend `src/pages/` | ≥70% line |
| Frontend `src/services/` | ≥70% line |
| Backend `app.py` | no gate (config code) |
| Frontend `App.js` / `index.js` | no gate (config code) |

## Bug-pinning tests

These tests **must fail today**. They become passing as their corresponding bug is fixed:
- I-17 → `BUG-1` (`savings_goal` reset)
- I-27 → `BUG-5` (date parsing 500)

Fixing a bug without un-pinning its test is a `must:` review block.

## Notes for execution

- All work happens on `feature/test-suite-baseline` branch (one ticket per branch — `CLAUDE.md §6`).
- Tag any test that touches one of the 6 protected formulas with `@pytest.mark.protected` (custom marker — register in `pytest.ini`).
- Update this file as you go; commit checklist updates alongside the test code.
