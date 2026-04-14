# Software Requirements Specification — Smart Expense & Budget Tracker

> Status: prototype phase. This document tracks what the system **does today** and what it **must do** before being considered v1. Anything in §6 (gaps) is a planned change, not current behavior.

## 1. Purpose
A personal finance web app that lets a single user log daily expenses against a self-set monthly income and budget, then visualizes spending and warns about overspending.

## 2. Scope
- **In scope (v1):** authentication, monthly income setup, monthly budget setup with optional savings goal, expense CRUD across 4 fixed categories, dashboard, category breakdown, monthly bar-chart analysis, threshold-based alerts, end-of-month summary.
- **Out of scope (v1):** multi-user sharing, multi-currency, receipt OCR, push notifications, dark mode, PDF/CSV export, mobile app (responsive web only).

## 3. Definitions
- **Month context:** every income/budget record is keyed by `(user_id, month, year)` and is unique on that triple.
- **Categories (fixed v1):** Food, Travel, Bills, Shopping. Backed by the constant `VALID_CATEGORIES` in `backend/routes/expenses.py`.
- **Money:** all amounts stored as `DECIMAL(10,2)`. Frontend reads as JSON number — see §6.5 for the precision-leak gap.

## 4. Functional Requirements

### 4.1 Authentication
| ID | Requirement |
|----|-------------|
| FR-A1 | A new user can sign up with `username`, `email`, `password`. Username and email must be unique. |
| FR-A2 | A returning user can log in with `email` + `password` and receive a JWT (24-hour expiry). |
| FR-A3 | All non-auth endpoints require `Authorization: Bearer <jwt>`. |
| FR-A4 | The frontend stores the JWT in `localStorage` and attaches it via Axios request interceptor. |

### 4.2 Monthly Income
| ID | Requirement |
|----|-------------|
| FR-I1 | A user can set their monthly income for a given `(month, year)`. Re-submitting overwrites. |
| FR-I2 | Income must be a positive number. |
| FR-I3 | A user can fetch their income for any `(month, year)`; absence returns `{income: null}`. |

### 4.3 Monthly Budget
| ID | Requirement |
|----|-------------|
| FR-B1 | A user can set a budget `amount` and an optional `savings_goal` for `(month, year)`. |
| FR-B2 | Budget amount must be positive. |
| FR-B3 | Re-submitting overwrites — including `savings_goal`, which resets to 0 if omitted (see §6.1 — known bug). |

### 4.4 Expenses
| ID | Requirement |
|----|-------------|
| FR-E1 | A user can add an expense: `amount` (positive), `category` (in VALID_CATEGORIES), `date` (ISO date, defaults to today), `note` (optional, ≤200 chars). |
| FR-E2 | A user can list expenses for `(month, year)`, sorted by date descending. |
| FR-E3 | A user can delete one of their own expenses by id. |
| FR-E4 | A user cannot read or delete another user's expenses (enforced by `user_id` filter). |

### 4.5 Reports
| ID | Requirement |
|----|-------------|
| FR-R1 | `/reports/summary` returns `income`, `budget`, `total_spent`, `saved`, `budget_remaining`, `highest_category`, `avg_daily_spending` for `(month, year)`. |
| FR-R2 | `/reports/categories` returns `[{category, total}]` for `(month, year)`. |
| FR-R3 | `/reports/alerts` returns alert objects with `type ∈ {info, success, warning, critical, suggestion}` based on usage thresholds. |
| FR-R4 | Alert thresholds: warning ≥80% budget usage; critical ≥100%; a "suggestion" also fires at ≥80%. |

### 4.6 Frontend Pages (12)
Welcome, Login, Signup, IncomeSetup, BudgetSetup, Dashboard, AddExpense, ExpenseList, Categories, MonthlyAnalysis, BudgetAlerts, MonthlySummary. Routes documented in `Documents/Reference/PROJECT_CONTEXT.md`.

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | All money values stored as `DECIMAL(10,2)` — no floating-point arithmetic on financial values in the database. |
| NFR-2 | All timestamps stored as UTC. |
| NFR-3 | All API endpoints prefixed `/api/v1/` and use plural nouns. |
| NFR-4 | Errors returned as `{"error": "Message", "code": <http_status>}`. |
| NFR-5 | Frontend served on port `7575`; backend on `7576`. CORS allow-list is `http://localhost:7575` only. |
| NFR-6 | Secrets (`SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`) come from `.env`; hardcoded fallbacks in `app.py` are dev-only and a v1 blocker (see §6.2). |
| NFR-7 | Backend follows PEP 8; frontend uses functional React components + hooks. |
| NFR-8 | No raw SQL — all DB access goes through Flask-SQLAlchemy ORM. |

## 6. Known Gaps and v1 Blockers
The audit on `feature/audit-deep-read` surfaced these. Each is a v1 blocker unless noted.

### 6.1 `savings_goal` reset bug (HIGH — data loss)
`routes/budget.py` upsert calls `data.get('savings_goal', 0)`, so any POST that omits the field zeros the stored goal. Fix: either require it explicitly or only update when the key is present.

### 6.2 Hardcoded dev secret fallbacks (HIGH — security)
`backend/app.py` falls back to `'dev-secret'` and `'jwt-dev-secret'` when env vars are missing. Should fail-fast in non-dev environments.

### 6.3 Date parsing crashes the API (MED — input validation)
`routes/expenses.py:33` — `date.fromisoformat(expense_date)` has no try/except, so a malformed date returns 500 instead of 400.

### 6.4 Reports `categories` query has no `ORDER BY` (LOW — UX consistency)
`routes/reports.py` `category_breakdown()` returns rows in engine-defined order. Frontend currently doesn't depend on it but tests must not assume an order either. Add `.order_by(func.sum(...).desc())` for stability.

### 6.5 `Numeric` → `float` precision leak (MED — NFR-1 violation)
Every model's `to_dict()` casts `Numeric(10,2)` to `float` at the API boundary, defeating the `DECIMAL` storage guarantee. Plus `routes/reports.py` `_get_total_spent()` returns a `float` directly. Fix is twofold: keep values as `Decimal` through the pipeline, and serialize as string (or via a custom JSON encoder).

### 6.6 Auth timing attack (LOW — security)
`routes/auth.py` login short-circuits the password check when the user isn't found, leaking email existence via timing. Always run the hash comparison.

### 6.7 No password / email format validation (MED — input validation)
Backend accepts any non-empty strings. Need minimum password length and email format check.

### 6.8 `savings_goal` is dead code (LOW — feature gap)
Stored on the Budget model but never read by any calculation. Either wire it into reports or remove.

### 6.9 No tests anywhere (HIGH — process gap)
Frontend has `@testing-library/*` installed but no test files. Backend has no test framework. v1 must include at least smoke tests for the financial calculations.

### 6.10 Flask-Migrate not installed (MED — schema management)
`db.create_all()` is used at startup. Once production data exists, schema drift becomes irreversible without migrations.

### 6.11 Frontend port mismatch (HIGH — onboarding friction)
CRA defaults to 3000; backend CORS expects 7575. `package.json` has no `PORT=7575` override. Fix: add `"start": "PORT=7575 react-scripts start"`.

### 6.12 No historical month selector (LOW — UX)
Dashboard and Summary hardcode `new Date()`. Users cannot view past months.

### 6.13 More referenced-but-missing docs in `backend/GEMINI.md` and `frontend/GEMINI.md` (LOW — docs drift)
On top of the missing root-level Documents/ files (already addressed on this branch), the per-app GEMINI files reference six more files that don't exist:
- `backend/Documents/testCase.md`
- `backend/Documents/task.md`
- `frontend/Documents/BrandGuideline.md`
- `frontend/Documents/UserJourney.md`
- `frontend/Documents/task.md`
- `frontend/Documents/testCase.md`
Decide either to create them under each app dir, or fold their concerns into the top-level Documents/ files (`TestingStrategy.md`, `projectManager/`, `Engineering/Frontend/StylingGuide.md`, etc.) and remove the references from the GEMINI files. Recommended: fold + remove (less doc surface to maintain).

## 7. References
- `CLAUDE.md` — project constitution (8 rules, branch naming, commit format)
- `GEMINI.md` — engineering standards
- `Documents/Reference/PROJECT_CONTEXT.md` — schema, routes, modules at a glance
- `Documents/Reference/TechnologyStack.md` — exact versions and library choices
- `Documents/Process/GitWorkFlow.md` — branching and commit workflow
- `Documents/Process/CodeStandardAndGuide.md` — coding standards
