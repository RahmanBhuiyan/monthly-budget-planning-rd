---
adr: 0001
title: SQLite for the prototype, MySQL for production
status: Accepted
date: 2026-04-14
deciders: [project owner]
---

# ADR 0001: SQLite for the prototype, MySQL for production

## Status
Accepted

## Context
The Smart Expense & Budget Tracker stores user accounts, monthly incomes, monthly budgets, and individual expenses. All financial values are `DECIMAL(10,2)`. The data shape is small (4 tables), strictly relational, and per-user owned via foreign keys.

We need a database for two distinct phases:
1. **Prototype phase** — single developer, zero users, frequent schema iteration, must run with no external services.
2. **Production phase** — real users, real money, durability matters, concurrent writes possible, schema migrations must be controlled.

The technology stack documents (`Documents/Reference/TechnologyStack.md`) called out MySQL as "the database" without distinguishing the two phases — leaving the prototype unable to run without a MySQL install.

## Decision
Use **SQLite** for the prototype and **MySQL 8.x** for production. Both targeted via Flask-SQLAlchemy ORM, no raw SQL. Switching is a `DATABASE_URL` env-var change.

## Alternatives considered

| Option | Pros | Cons | Why not |
|--------|------|------|---------|
| MySQL for both phases | One DB to learn; production parity from day 1 | Every contributor needs MySQL installed and running locally; raises onboarding cost | Onboarding friction is a much bigger v1 risk than DB-dialect drift |
| PostgreSQL for both phases | Strongest type system; great `Numeric` support; mature | Same install-cost as MySQL; team has no prior Postgres ops experience | No reason to pick over MySQL given existing familiarity |
| SQLite for both phases | No install; trivial backups (it's a file) | No real concurrent-write story; some scaling ceiling; no point-in-time recovery without external tooling | Acceptable for personal-use accounts only; not for the multi-user production target |
| Document store (MongoDB, etc.) | Schema-less feels easier in early iteration | Financial data is fundamentally relational and benefits from `DECIMAL`; transactions are a hard requirement; ORM ecosystem is weaker | Wrong tool for the job |

## Consequences

**Positive:**
- A new contributor can clone, `pip install -r requirements.txt`, `python app.py`, and have a working DB in under 5 minutes — no external service.
- Tests can target SQLite in-memory (`sqlite:///:memory:`) for fast, isolated per-test databases — see `Documents/Engineering/Backend/TestingGuide.md` §3.
- Production gets the durability and concurrent-write story we actually need.
- Both DBs are supported by SQLAlchemy with the same model definitions.

**Negative:**
- **Dialect drift risk.** SQLite is permissive about `VARCHAR(N)` length, `NUMERIC` precision, and date types. MySQL is strict. Code that "works" on SQLite can fail on MySQL. Mitigated by: type-mapping table in `Documents/Reference/DatabaseDesign.md` §7 and the cutover plan in `Documents/DevOps/MigrationPlan.md` §3.
- **No `db.create_all()` works on prod.** The first MySQL deploy needs the migration tool in place — see ADR-0004 (TBD) on Flask-Migrate.
- **Two backup strategies.** SQLite needs file-level backup; MySQL needs `mysqldump` or binlog. DevOps has to document both.

**Neutral:**
- Money values: both engines store `DECIMAL(10,2)` correctly when the migration emits the right type. The known precision leak (`Documents/Reference/SRS.md` §6.5) is at the API boundary, not the DB.

## Triggers for revisit
- If the prototype ever has real production-bound users on SQLite (we should never let it, but if pressure mounts).
- If MySQL becomes operationally too expensive for our scale and Postgres or a managed service starts looking better — write a superseding ADR with the cost analysis.
- If we ever genuinely need a feature only one engine supports (full-text search, geo, JSON-path queries).

## References
- `Documents/Reference/TechnologyStack.md` §"Database"
- `Documents/Reference/DatabaseDesign.md` §1, §7
- `Documents/DevOps/MigrationPlan.md` (the cutover procedure)
