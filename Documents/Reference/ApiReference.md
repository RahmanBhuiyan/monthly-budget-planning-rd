# API Reference

All endpoints are prefixed `/api/v1`. JSON in, JSON out. Errors use the shape `{"error": "...", "code": <http_status>}`.

**Base URL (dev):** `http://localhost:7576/api/v1`
**Auth:** `Authorization: Bearer <jwt>` on every endpoint except `/auth/signup`, `/auth/login`, and `/auth/google`. JWT TTL is 24 hours.

## Conventions
- Money values: stored as `DECIMAL(10,2)`; currently serialized as JSON `number` (precision-leak — see `SRS.md §6.5`).
- Dates: ISO-8601 (`YYYY-MM-DD`). Timestamps are UTC ISO-8601.
- `month` is `1..12`; `year` is the full Gregorian year (e.g. `2026`).
- POSTs on `/income` and `/budget` are upserts keyed by `(user_id, month, year)`.

---

## Auth

### POST /auth/signup
**Body**
```json
{ "username": "alice", "email": "alice@example.com", "password": "hunter2" }
```
**201**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "username": "alice", "email": "alice@example.com", "created_at": "2026-04-14T12:00:00Z" }
}
```
**400** missing field. **409** username or email already taken.

### POST /auth/login
**Body**
```json
{ "email": "alice@example.com", "password": "hunter2" }
```
**200** same shape as signup. **400** missing field. **401** bad credentials.

> Login also rejects (401) any account whose `password_hash` is `NULL` — i.e. a user who signed up via Google and never set a password. Such users must use `POST /auth/google`.

### POST /auth/google
Sign in or sign up with a Google ID token (returned by Google Identity Services on the frontend).

**Body**
```json
{ "credential": "<google-id-token-JWT>" }
```

The backend verifies the credential server-side via `google.oauth2.id_token.verify_oauth2_token(...)` against the configured `GOOGLE_CLIENT_ID` env var. **The frontend's claim is never trusted** — only the verified `sub` and `email` claims from Google are used.

**200** — same response shape as `/auth/login` (`{ message, token, user }`). One of three flows runs:
1. **Existing Google user** (`users.google_id == sub`) → log in.
2. **Email match** (`users.email == email`, no `google_id`) → link the Google ID to the existing account, then log in.
3. **New user** → create row with `username` derived from Google `name` (collision-suffixed `name1`, `name2`, …), `email`, `google_id`. `password_hash` stays `NULL`.

**400** missing `credential`. **401** invalid / expired Google token, wrong audience, or signature failure.

> The response `user` object never exposes `google_id` (kept server-side — `User.to_dict()` excludes it).
> Setup: `GOOGLE_CLIENT_ID` must be set on the backend (`Documents/DevOps/SetupAndDeployment.md §4`). The frontend's client ID is hardcoded in `frontend/src/components/GoogleLoginButton.js` (gap — should move to env).

---

## Income

### POST /income
Upsert the income row for the given month/year.
**Body**
```json
{ "amount": 5000.00, "month": 4, "year": 2026 }
```
**200**
```json
{ "income": { "id": 7, "amount": 5000.00, "month": 4, "year": 2026 } }
```
**400** non-positive amount, missing field, invalid month/year.

### GET /income?month=&year=
**200** when the row exists:
```json
{ "income": { "id": 7, "amount": 5000.00, "month": 4, "year": 2026 } }
```
**200** when the row does not exist:
```json
{ "income": null }
```
> Returning `null` with 200 instead of 404 is a known REST inconsistency.

---

## Budget

### POST /budget
Upsert the budget row for the given month/year.
**Body**
```json
{ "amount": 4000.00, "savings_goal": 500.00, "month": 4, "year": 2026 }
```
`savings_goal` is optional. **Warning:** omitting it currently resets the stored value to 0 (`SRS.md §6.1`).

**200**
```json
{ "budget": { "id": 11, "amount": 4000.00, "savings_goal": 500.00, "month": 4, "year": 2026 } }
```
**400** non-positive amount, missing required field.

### GET /budget?month=&year=
**200** when the row exists:
```json
{ "budget": { "id": 11, "amount": 4000.00, "savings_goal": 500.00, "month": 4, "year": 2026 } }
```
**200** when the row does not exist:
```json
{ "budget": null }
```

---

## Expenses

### POST /expenses
**Body**
```json
{ "amount": 15.50, "category": "Food", "note": "Lunch", "date": "2026-04-14" }
```
- `category` ∈ `{Food, Travel, Bills, Shopping}` (the constant `VALID_CATEGORIES` in `routes/expenses.py`).
- `date` defaults to today (UTC).
- `note` optional, ≤200 chars.

**201**
```json
{
  "expense": {
    "id": 42, "amount": 15.50, "category": "Food", "note": "Lunch",
    "date": "2026-04-14", "created_at": "2026-04-14T17:30:05Z"
  }
}
```
**400** non-positive amount, invalid category, malformed date.
> Currently, a malformed `date` returns 500 instead of 400 (`SRS.md §6.3`).

### GET /expenses?month=&year=
**200**
```json
{
  "expenses": [
    { "id": 42, "amount": 15.50, "category": "Food", "note": "Lunch", "date": "2026-04-14", "created_at": "2026-04-14T17:30:05Z" },
    { "id": 41, "amount": 3.00,  "category": "Travel", "note": "Bus", "date": "2026-04-14", "created_at": "2026-04-14T08:14:00Z" }
  ]
}
```
Sorted by `date` desc.

### DELETE /expenses/{id}
**200**
```json
{ "message": "Expense deleted" }
```
**404** when the expense doesn't exist OR belongs to another user (no information leak).

---

## Reports

### GET /reports/summary?month=&year=
**200**
```json
{
  "summary": {
    "income": 5000.00,
    "budget": 4000.00,
    "total_spent": 1850.25,
    "saved": 3149.75,
    "budget_remaining": 2149.75,
    "highest_category": "Food",
    "avg_daily_spending": 61.68,
    "month": 4,
    "year": 2026
  }
}
```
- `saved = income - total_spent`
- `budget_remaining = budget - total_spent`
- `avg_daily_spending` rounds to 2 decimals.
- `highest_category` is `"N/A"` when no expenses exist.
- When the income or budget row is missing, `income`/`budget` are `0.0` (NOT `null`) — the handler defaults via `float(income.amount) if income else 0.0`.

### GET /reports/categories?month=&year=
**200**
```json
{
  "categories": [
    { "category": "Food", "total": 850.00 },
    { "category": "Bills", "total": 600.25 },
    { "category": "Travel", "total": 250.00 },
    { "category": "Shopping", "total": 150.00 }
  ]
}
```
> No explicit `ORDER BY` in the query today — order is undefined (`SRS.md` background).

### GET /reports/alerts?month=&year=
**200** (warning + suggestion case at 82% usage with expenses present)
```json
{
  "alerts": [
    { "type": "warning",    "message": "You have used 82% of your budget. $700.00 remaining." },
    { "type": "suggestion", "message": "Reduce Shopping expenses this week — it is your highest spending area at $1200.00." }
  ],
  "usage_percent": 82.5,
  "total_spent": 3300.00,
  "budget_amount": 4000.00
}
```

**Alert composition rules (current behavior):**
| Condition | Alerts emitted |
|-----------|---------------|
| No budget set for the month | `[info]` (single message asking the user to set a budget) |
| `usage_percent < 80` | `[success]` |
| `80 <= usage_percent < 100` | `[warning]` + (`suggestion` if any expenses exist) |
| `usage_percent >= 100` | `[critical]` + (`suggestion` if any expenses exist) |

Top-level fields (`usage_percent`, `total_spent`, `budget_amount`) are siblings of `alerts`. `usage_percent` is `0` and `budget_amount` is `0` when no budget exists.

---

## Error format
Every non-2xx response uses:
```json
{ "error": "Human-readable message", "code": 400 }
```
HTTP status code matches `code`.

| Status | When |
|--------|------|
| 400 | Validation (missing field, non-positive amount, bad category, bad date) |
| 401 | Missing or invalid JWT, bad login credentials |
| 403 | Reserved for future ownership-explicit responses (currently 404 is used to avoid leaking existence) |
| 404 | Resource not found OR not owned by caller (DELETE /expenses/{id}) |
| 409 | Unique constraint violation (signup with taken username/email) |
| 500 | Unhandled exception (treat as a bug to fix) |
