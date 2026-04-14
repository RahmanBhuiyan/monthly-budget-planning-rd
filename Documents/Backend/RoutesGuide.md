# Routes Guide

> Per-blueprint walkthrough. Wire-format details (request/response JSON) are in `Documents/Backend/ApiReference.md` — this doc covers *how each route is implemented*, what to be careful of, and where the bugs live.

## Common patterns

### Identity handling
JWT identity is stored as `str(user.id)` (Flask-JWT-Extended requires a string subject). Every protected route reads it as:
```python
user_id = int(get_jwt_identity())
```
Never trust the JWT to tell you anything else about the user — query the DB if you need their email, username, etc.

### Validation
Each route validates the JSON body manually:
```python
data = request.get_json() or {}
if not data.get('amount') or float(data['amount']) <= 0:
    return jsonify({'error': 'amount must be positive', 'code': 400}), 400
```
**Risk:** `float(data['amount'])` raises `TypeError`/`ValueError` on bad input — currently surfaces as 500. A shared `_to_positive_decimal()` helper would centralize this; not yet a ticket.

### Upsert pattern (`income`, `budget`)
```python
existing = Model.query.filter_by(user_id=…, month=…, year=…).first()
if existing:
    existing.amount = …
else:
    db.session.add(Model(...))
db.session.commit()
```
Race condition: two simultaneous POSTs can both pass the `existing is None` check and then collide on the unique constraint. Fix is to wrap in a transaction with retry on `IntegrityError`. See `Documents/DatabaseDesign.md` §9.

---

## `routes/auth.py` — `/api/v1/auth`

### `POST /signup`
Validates `username`, `email`, `password` are present. Checks uniqueness (two queries), hashes the password with Werkzeug, creates the user, commits, returns a fresh JWT.

**Watch-outs:**
- Two separate uniqueness queries (`username` then `email`) means three round-trips total. Acceptable; not a hot path.
- No try/except on `db.session.commit()`. Race-condition between the uniqueness check and the insert can produce 500.
- No password complexity / email format validation (`SRS.md §6.7`).

### `POST /login`
Looks up the user by email, verifies password hash, returns JWT.

**The timing-attack bug (`SRS.md §6.6`):**
```python
user = User.query.filter_by(email=email).first()
if not user or not user.check_password(password):
    return ..., 401
```
The `or` short-circuits — if `user` is `None`, no hash is computed. The response time tells the attacker whether the email exists. Fix: always run a hash comparison (with a constant dummy hash if `user is None`) before deciding the response.

---

## `routes/income.py` — `/api/v1/income`

### `POST /` (upsert)
Validates `amount > 0`, `month`, `year`. Upserts the `(user_id, month, year)` row.

**Watch-outs:**
- No range check on `month` (1–12) or `year` (e.g., 2000–2100). Accepts month=99.
- `float(data['amount'])` validation but storage is `Numeric(10,2)` — fine for the comparison, but the principle "no float on money" should hold. Compare with `Decimal(str(data['amount'])) > 0` in future.
- Race condition (see "Common patterns" above).

### `GET /?month=&year=`
Returns the income row or `{income: null}` (REST-inconsistent — should be 404 — but client code currently depends on `null`).

---

## `routes/budget.py` — `/api/v1/budget`

### `POST /` (upsert)
Same shape as income, plus optional `savings_goal`.

**The savings_goal reset bug (`SRS.md §6.1`):**
```python
existing.savings_goal = data.get('savings_goal', 0)
```
On any POST that omits `savings_goal`, the stored value is overwritten with 0. This silently destroys data the user already entered.

**Fix sketch:**
```python
if 'savings_goal' in data:
    existing.savings_goal = data['savings_goal']
```
Tag the commit `[BIZ-QC-NEEDED]` — `savings_goal` is on the protected-logic list (`CLAUDE.md §2`).

### `GET /?month=&year=`
Returns the budget row or `{budget: null}` — same convention as income.

---

## `routes/expenses.py` — `/api/v1/expenses`

### `VALID_CATEGORIES` constant
```python
VALID_CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping']
```
Lives at module top. Hardcoded — to make categories user-configurable would require a new table and migration (out of scope for v1).

### `POST /` — create
Validates `amount > 0`, `category in VALID_CATEGORIES`, parses `date`.

**The date-parsing bug (`SRS.md §6.3`):**
```python
expense_date = data.get('date', date.today().isoformat())
expense.date = date.fromisoformat(expense_date)
```
`fromisoformat` raises `ValueError` on bad input → 500 instead of 400. Wrap in `try/except`.

### `GET /?month=&year=`
Filters by `user_id` + `extract('month', date) = month` + `extract('year', date) = year`. Orders by `date` desc.

**Watch-outs:**
- No pagination — a user with thousands of rows in one month gets all of them. Add `limit/offset` once it matters.
- No covering index — runs a full scan within the user's expenses (see `DatabaseDesign.md §4.2`).

### `DELETE /<id>`
Filters by `user_id` + `id`. Deletes the row.

**Watch-outs:**
- Returns 404 for both "not found" and "not yours" — intentional (avoids leaking expense ID existence). Do not change without security review.
- Optimistic delete on the frontend has no rollback (`SRS.md` background, frontend issue).

---

## `routes/reports.py` — `/api/v1/reports`

### Helpers (module-level)

`_get_month_year(request)` — pulls `month` and `year` from the query string. Returns ints (or None if absent).

`_get_total_spent(user_id, month, year)` — aggregates `SUM(amount)` for the user's expenses in the period. Returns a Python `float` (`float(result) if result else 0.0`).
> Note: returning `float` mid-pipeline contributes to the precision-leak issue (`SRS.md §6.5`). The right fix is to keep things in `Decimal` until serialization.

### `GET /summary`
Returns income, budget, total_spent, saved, budget_remaining, highest_category, avg_daily_spending.

The handler guards every `budget.amount` and `income.amount` access with `if budget else 0.0` / `if income else 0.0`. There is no None-crash in the current code (an earlier audit claim of an AttributeError here was wrong).

The handler does coerce `Numeric` to `float` on every read (`float(income.amount)`, `float(budget.amount)`, `float(result)` inside `_get_total_spent`). Both `saved` and `budget_remaining` therefore inherit float arithmetic — a `[BIZ-QC-NEEDED]` cleanup that's part of the broader `to_dict()` precision fix (`SRS.md §6.5`).

### `GET /categories`
Returns `[{category, total}]` grouped by category.

**Watch-out:** no `ORDER BY` — order is engine-defined. Frontend currently doesn't depend on order, but tests should not assume it.

### `GET /alerts`
Generates alerts based on usage_percent.

| Threshold | Type |
|-----------|------|
| < 50% | success |
| 50% – 79.9% | info |
| ≥ 80% | warning **and** suggestion (both fire) |
| ≥ 100% | critical (in addition to warning + suggestion) |

The "suggestion" + "warning" double-fire at 80% is intentional. Any change to the thresholds is `[BIZ-QC-NEEDED]`.

---

## Cross-cutting gaps (recap)

| Issue | File | SRS ref |
|-------|------|---------|
| Hardcoded dev secrets | `app.py` | §6.2 |
| Login timing attack | `auth.py` | §6.6 |
| `savings_goal` reset | `budget.py` | §6.1 |
| Date parsing 500 | `expenses.py` | §6.3 |
| `to_dict()` + `_get_total_spent` precision leak (Numeric → float) | `models.py`, `reports.py` | §6.5 |
| No tests | everywhere | §6.9 |

Each maps to a separate `bugfix/` ticket per `CLAUDE.md §6` (one ticket per branch).
