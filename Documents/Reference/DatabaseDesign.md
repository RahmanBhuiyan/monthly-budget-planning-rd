# Database Design

> Authoritative reference for the schema. The source of truth is `backend/models.py` — when this doc and the code disagree, the code wins and this doc is wrong (file a `docs/` ticket).

## 1. Engine

| Environment | Engine | Driver | Notes |
|-------------|--------|--------|-------|
| Prototype / dev | SQLite | builtin (`sqlite3`) | File at `backend/expense_tracker.db`, auto-created via `db.create_all()` |
| Production (target) | MySQL 8.x | PyMySQL (`mysql+pymysql://`) | See `Documents/DevOps/MigrationPlan.md` for the cutover plan |

The same SQLAlchemy models target both engines. Any place this matters (type-mapping, charsets) is called out below.

## 2. Entity-Relationship overview

```
┌─────────────┐         1     N    ┌──────────────┐
│   users     │◄────────────────── │   incomes    │   (UNIQUE user_id, month, year)
│             │                    └──────────────┘
│ id PK       │         1     N    ┌──────────────┐
│ username UK │◄────────────────── │   budgets    │   (UNIQUE user_id, month, year)
│ email UK    │                    └──────────────┘
│ ...         │         1     N    ┌──────────────┐
└─────────────┘◄────────────────── │   expenses   │
                                   └──────────────┘
```

Every domain table has a single owning `user_id`. Multi-user sharing is out of scope for v1 (see `Documents/Reference/SRS.md` §2).

## 3. Tables

### 3.1 `users`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PK, autoincrement | |
| `username` | VARCHAR(80) | NOT NULL, UNIQUE | |
| `email` | VARCHAR(120) | NOT NULL, UNIQUE | No format validation today (`SRS.md §6.7`) |
| `password_hash` | VARCHAR(256) | **nullable** | Werkzeug PBKDF2-SHA256. NULL only for users who signed up via Google and never set a password (`POST /auth/google`). |
| `google_id` | VARCHAR(100) | nullable, UNIQUE | Google subject (`sub`) claim from a verified Google ID token. NULL for email/password users. Never returned by `User.to_dict()` — server-side only. |
| `created_at` | DATETIME | NOT NULL, default `utcnow()` | UTC |

**Relationships:** `incomes`, `budgets`, `expenses` declared on the User model with `backref='user'` (see `Documents/Engineering/Engineering/Backend/ModelsGuide.md`).

### 3.2 `incomes`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PK, autoincrement | |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` | |
| `amount` | DECIMAL(10,2) | NOT NULL | **Must remain DECIMAL** — never convert to FLOAT |
| `month` | INTEGER | NOT NULL | 1..12 (no DB-level check; route validation TBD) |
| `year` | INTEGER | NOT NULL | full Gregorian year |
| `created_at` | DATETIME | nullable today | should be NOT NULL UTC (consistency gap) |

**Unique constraint:** `(user_id, month, year)` — prevents duplicate income rows per period. Backed by `UniqueConstraint('user_id', 'month', 'year')` in `models.py`.

### 3.3 `budgets`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PK, autoincrement | |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` | |
| `amount` | DECIMAL(10,2) | NOT NULL | spending limit |
| `savings_goal` | DECIMAL(10,2) | NOT NULL, default `0` | **Stored but never read** — dead feature today (`SRS.md §6.8`) |
| `month` | INTEGER | NOT NULL | 1..12 |
| `year` | INTEGER | NOT NULL | |
| `created_at` | DATETIME | nullable today | same gap as `incomes` |

**Unique constraint:** `(user_id, month, year)`.

**Known bug:** `routes/budget.py` upsert calls `data.get('savings_goal', 0)`, so any POST that omits the field zeros the stored value. See `SRS.md §6.1`.

### 3.4 `expenses`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PK, autoincrement | |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` | |
| `amount` | DECIMAL(10,2) | NOT NULL | |
| `category` | VARCHAR(50) | NOT NULL | constrained to `Food | Travel | Bills | Shopping` at the route layer (`VALID_CATEGORIES`) — **no DB-level CHECK** |
| `note` | VARCHAR(200) | nullable | max-200 enforced by MySQL, ignored by SQLite |
| `date` | DATE | NOT NULL | the *expense* date, not creation date |
| `created_at` | DATETIME | NOT NULL, default `utcnow()` | UTC |

No unique constraint — the same user can log multiple expenses on the same date in the same category.

## 4. Indexes

### 4.1 Today (implicit)
| Index | Source | What it serves |
|-------|--------|----------------|
| `users(id)` PK | engine | by-id lookup |
| `users(username)` UNIQUE | model | signup uniqueness check |
| `users(email)` UNIQUE | model | login lookup, signup uniqueness, Google account-linking lookup |
| `users(google_id)` UNIQUE | model | Google login lookup (`POST /auth/google`); nullable so non-Google users do not consume index slots |
| `incomes(user_id, month, year)` UNIQUE | model | upsert lookup, GET by month |
| `budgets(user_id, month, year)` UNIQUE | model | upsert lookup, GET by month |
| `expenses(id)` PK | engine | DELETE by id |

### 4.2 Missing / recommended
| Index | Why |
|-------|-----|
| `expenses(user_id, date)` | `GET /expenses?month=&year=` filters by user + date range; today's plan is full scan within user (acceptable for v1, slow at scale) |
| `expenses(user_id, category)` | `/reports/categories` GROUPs by category; no covering index today |
| `incomes(user_id)`, `budgets(user_id)` | Already covered by the composite UNIQUE; no separate index needed |

Add these as a single `feature/db-perf-indexes` ticket once expense volume justifies it (rough threshold: any user with >5k expenses).

## 5. Money handling

- **Storage:** `DECIMAL(10,2)` everywhere. Range `-99,999,999.99` to `99,999,999.99`. Adequate for personal-finance scale; will need re-evaluation if the app ever supports business accounts.
- **In Python:** SQLAlchemy returns `decimal.Decimal`. Do arithmetic in `Decimal`; never coerce to `float` mid-calculation.
- **At the API boundary:** `to_dict()` currently casts to `float` — this is a known violation of `NFR-1`. See `SRS.md §6.5` and `Documents/Engineering/Engineering/Backend/ModelsGuide.md`.

## 6. Date and time handling

- **`expenses.date`** is the date the expense occurred (no time, no timezone).
- **All `created_at` fields** are UTC `DATETIME`. Frontend renders in local time but the database speaks UTC.
- **Month/year columns** are integers, not dates. They key the `(user_id, month, year)` uniqueness — using a real `DATE` instead would be cleaner but would break the unique-constraint shape.

## 7. Type-mapping reference (SQLite vs MySQL)

| SQLAlchemy declaration | SQLite stored as | MySQL stored as | Risk |
|------------------------|------------------|-----------------|------|
| `Numeric(10, 2)` | `NUMERIC` (textual, no enforcement) | `DECIMAL(10,2)` ✓ | Low — but verify the migration emits `DECIMAL(10,2)` not `NUMERIC` |
| `String(N)` | `VARCHAR(N)` (length not enforced) | `VARCHAR(N)` enforced | Pre-existing too-long values fail to migrate |
| `DateTime` | `TIMESTAMP` text | `DATETIME` | Avoid MySQL `TIMESTAMP` (auto-updates); we want `DATETIME` |
| `Date` | text `YYYY-MM-DD` | `DATE` | Low |
| `Integer` | `INTEGER` | `INT(11)` | Low |
| `Boolean` | `INTEGER 0/1` | `TINYINT(1)` | Low |

See `Documents/DevOps/MigrationPlan.md` §3 for the full type-sanity-check procedure.

## 8. Query patterns (where the rows are read)

| Endpoint | Query shape | Notes |
|----------|------------|-------|
| `POST /auth/login` | `User.query.filter_by(email=…).first()` | Uses unique index. Rejects rows where `password_hash IS NULL` (Google-only accounts). |
| `POST /auth/google` | `User.query.filter_by(google_id=…).first()` then optional fallback `filter_by(email=…)` | Two unique-index hits worst case (Google lookup, then email-link lookup) |
| `POST /income` (upsert) | `Income.query.filter_by(user_id, month, year).first()` | Uses composite unique |
| `GET /expenses?month=&year=` | `Expense.query.filter(user_id=…, extract('month', date)=…, extract('year', date)=…).order_by(date.desc())` | No covering index — full per-user scan |
| `GET /reports/summary` | `SUM(amount)` on filtered expenses | Aggregates across the same per-user scan |
| `GET /reports/categories` | `category, SUM(amount)`, `GROUP BY category` | No `ORDER BY` clause today (order is undefined) |
| `GET /reports/alerts` | reuses summary aggregates | |

## 9. Concurrency and integrity concerns

- **Upsert race (`income`, `budget`):** the current pattern is `SELECT` → conditional `INSERT` / `UPDATE` outside a transaction. Two simultaneous POSTs from the same user in the same month can collide on the unique constraint and raise `IntegrityError` (currently unhandled — surfaces as 500). Fix: wrap in a transaction and catch `IntegrityError` for retry.
- **Optimistic deletes:** the frontend's `ExpenseList` removes from local state before confirming the API call (`SRS.md` background). On failure, no rollback.
- **No row-level locking** is used. Acceptable at v1 scale.

## 10. Backups and retention (placeholder)

| Topic | Status |
|-------|--------|
| Backups | None defined for prod (no prod yet) |
| Retention | None defined |
| PII / GDPR | Not in scope for v1; revisit before launch — see `Documents/Security/SecurityAndThreatModel.md` §9 |
| Right-to-delete | Cascade delete on `users.id` would drop all of a user's data; relationships are not currently set to `cascade='delete-orphan'` — verify before relying on it |

## 11. Schema change procedure (forward reference)

Until `Documents/DevOps/MigrationPlan.md` §"Step 1" is done, **the only safe schema change is adding a new table.** Altering an existing column is not supported without manual SQL or a destructive `db.drop_all()` + `create_all()`. Plan accordingly.

After Flask-Migrate is in place: every model change ships with `flask db migrate -m "..."` + `flask db upgrade` in the same PR.

## 12. ER diagram (text)

```
users (1) ─────┬───── (N) incomes
               ├───── (N) budgets
               └───── (N) expenses

UNIQUE (incomes.user_id, month, year)
UNIQUE (budgets.user_id, month, year)
```

For a rendered diagram, use any DBML/dbdiagram.io tool with this seed:

```dbml
Table users {
  id integer [pk, increment]
  username varchar(80) [unique, not null]
  email varchar(120) [unique, not null]
  password_hash varchar(256)
  google_id varchar(100) [unique]
  created_at datetime [not null]
}
Table incomes {
  id integer [pk, increment]
  user_id integer [ref: > users.id, not null]
  amount decimal(10,2) [not null]
  month integer [not null]
  year integer [not null]
  Indexes { (user_id, month, year) [unique] }
}
Table budgets {
  id integer [pk, increment]
  user_id integer [ref: > users.id, not null]
  amount decimal(10,2) [not null]
  savings_goal decimal(10,2) [not null, default: 0]
  month integer [not null]
  year integer [not null]
  Indexes { (user_id, month, year) [unique] }
}
Table expenses {
  id integer [pk, increment]
  user_id integer [ref: > users.id, not null]
  amount decimal(10,2) [not null]
  category varchar(50) [not null]
  note varchar(200)
  date date [not null]
  created_at datetime [not null]
}
```
