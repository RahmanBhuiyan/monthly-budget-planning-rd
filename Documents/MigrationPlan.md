# Migration Plan: SQLite → MySQL + Schema Versioning

> Two related problems are bundled here because they have to be solved together: getting off SQLite, and getting onto a real migration tool. Doing one without the other paints us into a corner.

## 1. The current state
- **DB:** SQLite (`backend/expense_tracker.db`), created at startup by `db.create_all()` in `app.py`.
- **Schema management:** none. `db.create_all()` is idempotent for *new* tables but does **nothing** when an existing table needs an altered column. Drop-and-recreate is the only path today.
- **Migration tool:** none. Flask-Migrate is referenced in `GEMINI.md` as "planned" but is not installed (`SRS.md §6.10`).

This is fine for a single-developer prototype with disposable data. It becomes irreversible the moment a real user creates a row that matters.

## 2. The two-step migration

### Step 1 — introduce Flask-Migrate (still on SQLite)
Goal: stop relying on `db.create_all()`. Get every future schema change into a tracked, reversible migration.

1. Add to `requirements.txt`:
   ```
   Flask-Migrate==4.0.5
   ```
2. Wire it into `app.py`:
   ```python
   from flask_migrate import Migrate
   migrate = Migrate(app, db)
   ```
3. Initialize:
   ```bash
   cd backend
   flask db init                 # creates migrations/ folder — commit it
   flask db migrate -m "baseline schema"
   flask db upgrade
   ```
4. Replace `db.create_all()` in `app.py` with nothing. The startup code no longer touches the schema.
5. From now on, every model change goes through `flask db migrate -m "..."` + `flask db upgrade`. Migrations land in PRs alongside the model change, not after.

**Acceptance:** new dev clones run `flask db upgrade` once and have a current schema. Existing data on the prototype DB survives untouched (the baseline migration matches the current shape).

**Risks:**
- The first auto-generated migration may differ from what `db.create_all()` produced. Inspect it carefully, especially for any `DECIMAL(10,2)` columns — autogen has historically emitted `NUMERIC` without precision.
- `flask db migrate` is autogen; it doesn't catch every change. Always read the generated file before committing.

### Step 2 — switch to MySQL (production)
Goal: run prod on MySQL while keeping SQLite available for local dev.

1. Add the driver to `requirements.txt`:
   ```
   PyMySQL==1.1.0
   cryptography>=42      # required by PyMySQL for some auth plugins
   ```
2. Provision MySQL 8.x; create a database (`smart_expense`) and a user with full privileges on it.
3. Set `DATABASE_URL` in the prod environment:
   ```
   DATABASE_URL=mysql+pymysql://smart_expense_app:<password>@<host>:3306/smart_expense?charset=utf8mb4
   ```
4. Run the existing migrations on the empty MySQL DB:
   ```bash
   flask db upgrade
   ```
5. Smoke-test: signup, login, add expense, fetch reports. If anything 500s, the migration likely chose the wrong type — see §3.

**Type sanity-check** — Step 1's autogen baseline will be applied to MySQL for the first time here. Confirm in the MySQL console:
```sql
SHOW CREATE TABLE incomes;
SHOW CREATE TABLE budgets;
SHOW CREATE TABLE expenses;
```
Every money column must be `DECIMAL(10,2)` (NOT `FLOAT`, NOT `DOUBLE`, NOT `NUMERIC` without precision).

## 3. Type-mapping risks

| SQLAlchemy type | SQLite stored as | MySQL stored as | Risk |
|----------------|------------------|-----------------|------|
| `Numeric(10,2)` | `NUMERIC` (text-ish, no enforcement) | `DECIMAL(10,2)` ✓ | None if the migration is correct |
| `DateTime` (UTC) | `TIMESTAMP` (string) | `DATETIME` | Beware MySQL `TIMESTAMP` auto-update; we want `DATETIME` |
| `String(80)` | `VARCHAR(80)` (no enforcement) | `VARCHAR(80)` ✓ | SQLite ignores length; MySQL enforces — pre-existing too-long values will fail to migrate |
| `Boolean` | `INTEGER 0/1` | `TINYINT(1)` ✓ | None |

If any of those silently changes shape during autogen, money or timestamps could lose precision. **Treat the first MySQL migration as `[BIZ-QC-NEEDED]`** (`CLAUDE.md §2`).

## 4. Data migration (only if prototype data must survive)
For a real prototype-to-prod cutover with data:

1. Freeze writes on the prototype.
2. Dump SQLite to SQL: `sqlite3 expense_tracker.db .dump > dump.sql`.
3. Manually rewrite (or sed) the dialect differences:
   - Strip SQLite-specific `BEGIN TRANSACTION;` / `COMMIT;` if needed.
   - Replace `AUTOINCREMENT` with MySQL's `AUTO_INCREMENT`.
   - Quote identifiers with backticks if any clash with reserved words.
4. `mysql -u smart_expense_app -p smart_expense < cleaned_dump.sql`.
5. Verify row counts match between source and target for every table.

For a fresh start (no data carried over), skip §4 entirely — just point the env var at MySQL and run migrations.

## 5. Rollback plan
- **Step 1 rollback:** `flask db downgrade base`, restore the previous `app.py` with `db.create_all()`. The DB itself is unchanged because the baseline migration matches it.
- **Step 2 rollback:** point `DATABASE_URL` back at SQLite. The prod data on MySQL stays where it is — you'll just be operating on the older SQLite snapshot. Acceptable only if you haven't taken real user writes yet.

## 6. CI considerations (when CI exists)
- Backend tests should run against SQLite in-memory (fast, isolated).
- One CI job per release should run the full test suite against MySQL using the actual production migrations, to catch dialect drift early.

## 7. What this plan deliberately does NOT do
- Move secrets out of the codebase (covered by `Documents/SecurityAndThreatModel.md`).
- Add connection pooling / read replicas (premature; revisit when QPS demands it).
- Introduce ORM-level multi-tenancy (the schema already keys everything by `user_id`; sufficient for v1).
