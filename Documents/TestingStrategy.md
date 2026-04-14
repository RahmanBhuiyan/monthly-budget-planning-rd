# Testing Strategy

> Today the project has **zero tests**. This document defines the target shape so the first PR that adds tests doesn't accidentally set the wrong precedent.

## 1. The pyramid (target ratios)

```
                  /\
                 /  \  E2E (Playwright)        ~5%   — single happy-path smoke per release
                /----\
               /      \  Integration            ~25% — Flask + real DB (SQLite in-memory)
              /--------\
             /          \  Unit                 ~70% — pure logic, no I/O
            /____________\
```

The shape matters more than the exact numbers. Slow-running tests (E2E, integration) are valuable but expensive; keep them rare and high-signal.

## 2. What MUST be tested before v1
The audit (`SRS.md §6.9`) calls testing a v1 blocker. The non-negotiable list:

### 2.1 Backend — financial formulas (`CLAUDE.md §2` protected logic)
For each formula in `Documents/PROJECT_CONTEXT.md` §"Critical Business Logic":

| Formula | Test angles |
|---------|-------------|
| `budget_remaining = budget - total_spent` | positive, zero, negative; budget None; expenses empty |
| `saved = income - total_spent` | positive, zero, negative; income None |
| `usage_percent = total_spent / budget * 100` | edges: 0%, 79.9%, 80%, 99.9%, 100%, 100.1%; budget=0 (must not divide) |
| Alert thresholds (warning ≥80%, critical ≥100%) | exact-edge cases on 80 and 100; ensure both `warning` and `suggestion` fire at ≥80% |
| `highest_category = MAX(SUM(amount) GROUP BY category)` | tie-breaking; no expenses (returns `'N/A'`) |
| `avg_daily = total_spent / days_in_month` | February (28/29), 30-day months, 31-day months |

### 2.2 Backend — input validation
| Surface | Cases |
|---------|-------|
| All POSTs | missing field → 400, wrong type → 400, negative amount → 400 |
| `POST /expenses` | invalid category → 400, malformed `date` → 400 (currently 500 — `SRS.md §6.3`) |
| `POST /budget` | omitting `savings_goal` MUST NOT zero existing value (currently does — `SRS.md §6.1`) |
| `POST /auth/signup` | duplicate username → 409, duplicate email → 409 |

### 2.3 Backend — authorization
| Test | Asserts |
|------|---------|
| GET/POST any protected endpoint without JWT | 401 |
| User A tries to DELETE user B's expense | 404 (existence not leaked) |
| User A reads `/income?month=&year=` for their own data | 200 with their data only |

### 2.4 Frontend — render smoke per page
For each of the 12 pages: render with mocked Axios, assert no crash and the page heading is present. Catches imports/router breakage.

### 2.5 Frontend — critical interactions
| Flow | Assertions |
|------|------------|
| Login submit | calls API once, stores token, redirects to dashboard |
| Add Expense submit | calls API once, clears form, navigates away |
| Delete Expense | optimistic remove, error path rolls back (currently doesn't — `SRS.md` background) |

## 3. What we do NOT test

- React Router internals, Axios internals, SQLAlchemy internals — trust the libraries.
- Generated `to_dict()` output structure — covered implicitly by integration tests.
- CSS layout. Use visual regression only if a real bug demands it.

## 4. Tooling

### Backend
- **Test runner:** `pytest` (add to `requirements-dev.txt`).
- **HTTP testing:** Flask's built-in `app.test_client()`.
- **DB isolation:** SQLite in-memory (`sqlite:///:memory:`) per test, recreated via `db.create_all()`.
- **Coverage:** `pytest-cov`. Target ≥80% on `routes/` and `models.py`. No coverage gate on `app.py`.

### Frontend
- **Test runner:** Jest (already in `react-scripts`).
- **Component testing:** `@testing-library/react` + `@testing-library/user-event` (already installed).
- **HTTP mocking:** `axios-mock-adapter` (to add) or hand-rolled mocks via `jest.mock('../services/api')`.
- **Coverage:** `npm test -- --coverage`. Target ≥70% on `src/pages/` and `src/services/`.

### E2E (deferred)
- **Tool:** Playwright when the time comes.
- **Scope:** one happy-path scenario per release: signup → set income → set budget → add expense → see dashboard reflect it.
- **Not for v1** — too expensive without CI; revisit when the team grows.

## 5. Test layout

```
backend/
  tests/
    conftest.py         # pytest fixtures: app, client, db, auth_headers
    unit/
      test_models.py
      test_business_logic.py    # the 6 protected formulas
    integration/
      test_auth.py
      test_income.py
      test_budget.py
      test_expenses.py
      test_reports.py

frontend/
  src/
    pages/
      __tests__/
        Dashboard.test.js
        AddExpense.test.js
        ...
    services/
      __tests__/
        api.test.js
```

## 6. Running tests

```bash
# Backend
cd backend
source venv/bin/activate
pytest                          # all
pytest tests/unit -k "savings"  # filtered
pytest --cov=. --cov-report=term-missing

# Frontend
cd frontend
npm test                        # watch mode
npm test -- --watchAll=false    # CI mode
npm test -- --coverage
```

## 7. CI integration (deferred but planned)
- Run both suites on every PR to `master`.
- Block merge if either suite fails or coverage drops below the targets in §4.
- No "skip CI" in commit messages without operator approval.

## 8. Test-naming convention
- Backend: `test_<unit>__<scenario>__<expected>` — e.g. `test_budget_remaining__zero_spent__equals_budget`.
- Frontend: `<Component> renders <thing>` / `<Component> calls <api> on <action>`.

The double-underscore in pytest names lets you grep by axis: `pytest -k "budget_remaining"` or `pytest -k "negative"`.

## 9. Mutation testing (later)
Once coverage is in place and stable, run `mutmut` on the financial formulas. Mutation testing catches the cases where coverage is high but assertions are weak — and that's exactly the failure mode you cannot afford on `[BIZ-QC-NEEDED]` code.
