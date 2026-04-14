# Code Standards and Style Guide

This guide is binding for both the Flask backend and the React frontend. Where this document conflicts with `GEMINI.md`, `GEMINI.md` wins.

## 1. Backend (Python / Flask)

### 1.1 Style
- **PEP 8**, 4-space indent, max line length 100.
- Format with `black` (line length 100) and lint with `flake8` (configure both in `pyproject.toml` once added).
- Type hints encouraged on new functions; not retrofit-required.

### 1.2 File and module layout
```
backend/
  app.py                # factory, CORS, JWT, db.create_all()
  models.py             # SQLAlchemy models — money is DECIMAL(10,2)
  routes/
    __init__.py         # may host shared constants (e.g. VALID_CATEGORIES)
    auth.py
    income.py
    budget.py
    expenses.py
    reports.py
  requirements.txt
```
- One blueprint per `routes/*.py` file.
- Helper functions for routes (e.g. `_get_total_spent`) prefix with `_` and live in the same module.

### 1.3 Naming
- Modules / functions / variables: `snake_case`.
- Classes: `PascalCase`.
- Constants: `SCREAMING_SNAKE_CASE` (e.g. `VALID_CATEGORIES`).

### 1.4 Endpoints
- Prefix every blueprint with `/api/v1`.
- Resources are plural nouns: `/expenses`, `/budgets`, `/incomes`.
- HTTP semantics:
  - `GET` — read, no side effects.
  - `POST` — create OR upsert (current convention; document on the route).
  - `PUT` — full replace (not currently used).
  - `PATCH` — partial update (use this when fixing the `savings_goal` reset bug — SRS §6.1).
  - `DELETE` — remove.

### 1.5 Errors
Single shape, always:
```json
{ "error": "Human-readable message", "code": 400 }
```
HTTP status code matches `code`. Use 400 for validation, 401 for missing/invalid auth, 403 for ownership violations, 404 for not-found, 409 for uniqueness conflicts, 500 only for unexpected exceptions.

### 1.6 Money
- Stored as `DECIMAL(10,2)`.
- **Never** convert to `float` inside business logic. Use `decimal.Decimal` for arithmetic.
- The current `to_dict()` casts to `float` at the API boundary — this is a known violation (SRS §6.5). New code should serialize via string or a JSON encoder that preserves `Decimal`.

### 1.7 Database
- Flask-SQLAlchemy ORM only; **no raw SQL** (`CLAUDE.md §7`, `GEMINI.md`).
- Wrap multi-step writes in a transaction; rollback on exception.
- Upserts must handle `IntegrityError` (race conditions on the `(user_id, month, year)` unique constraint).

### 1.8 Auth
- Flask-JWT-Extended; `identity = str(user.id)`; 24-hour expiry.
- Decorate every protected endpoint with `@jwt_required()`.
- Always check `user_id` ownership inside the route — JWT identity proves *who* is asking, not *what* they own.

### 1.9 Logging and secrets
- No `print()` in committed code; use `app.logger`.
- All secrets via `os.environ`; document each in `.env.example` (to be created — SRS §6.2).

## 2. Frontend (React)

### 2.1 Style
- Prettier defaults, ESLint with `react-app` + `react-app/jest` presets (already in `package.json`).
- Single quotes for strings, semicolons on, 2-space indent.

### 2.2 Components
- **Functional components only.** No class components.
- Hooks: `useState`, `useEffect`, `useMemo`, `useCallback`. Reach for `useMemo`/`useCallback` only when there's a measurable reason — premature memoization is noise.
- One component per file. Filename matches the export: `Dashboard.js` exports `Dashboard`.
- Pages live in `src/pages/`, reusable widgets in `src/components/`.

### 2.3 State
- Local component state by default.
- No Redux / Zustand / Context for v1 — the app is small enough to lift state when needed.

### 2.4 API access
- All HTTP through `src/services/api.js` (Axios). No bare `fetch` calls.
- The Axios instance already injects the JWT from `localStorage` — do not duplicate that logic in components.
- **Add a response interceptor** for global 401 → logout (currently each page handles 401 by hand — duplication risk).

### 2.5 Naming
- Components / pages: `PascalCase` (`AddExpense.js`).
- Hooks: `useThing` (`useMonthYear.js`).
- Other modules / utilities: `camelCase.js`.
- CSS classes: `kebab-case` (existing convention in `App.css`).

### 2.6 Forms
- Controlled inputs (`value` + `onChange`).
- Disable the submit button while a request is in flight (currently missing on most forms — see SRS §4 gaps).
- Show user-visible errors; never `console.error()` only.

### 2.7 Charts
- Recharts is the chosen library (see `Documents/TechnologyStack.md`). Do **not** introduce Chart.js, Victory, or another competing chart library.

### 2.8 Routing
- React Router v7. Routes declared in `App.js`.
- Add a catch-all `<Route path="*" element={<NotFound />} />` (currently missing — silent black screen on bad URLs).
- Add route guards (planned — SRS gap).

## 3. Cross-cutting

### 3.1 Comments
- Default to no comments. Names should carry the meaning.
- Write a comment only when the *why* is non-obvious — a hidden constraint, a workaround, a legal/compliance reason. Never restate the code.
- Never write "TODO" without a ticket id.

### 3.2 Currency display
- Always two decimals on the UI: `$1,234.50` (not `$1234.5`).
- Use a single `formatCurrency()` utility (to be added in `src/utils/`); do not inline `toFixed(2)` in components.

### 3.3 Dates
- Backend stores UTC.
- Frontend renders in the user's local timezone but **never** parses with `new Date(dateStr)` — that's locale/TZ-unsafe. Use `new Date(dateStr + 'T00:00:00')` only when you genuinely want midnight-local; otherwise use a date library or treat dates as opaque strings.

### 3.4 Tests
- v1 must include at least: backend smoke tests for the 6 financial formulas (`Documents/PROJECT_CONTEXT.md` §"Critical Business Logic"); frontend smoke render tests for each page.
- Use `pytest` for backend; `@testing-library/react` for frontend (deps already installed).

### 3.5 Forbidden patterns
- `eval`, `exec` in Python; `dangerouslySetInnerHTML` in React.
- Storing secrets in source.
- Mutating React state directly (`state.x = y` — must use setter).
- `SELECT *` (use the ORM properly).
- `git commit --no-verify` without explicit approval.
