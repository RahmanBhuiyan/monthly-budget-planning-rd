# CLAUDE.md — Project Constitution
> This file is the law. Claude (and every other contributor) must follow every rule below without exception.
> Updated 2026-04-14 to reflect the SDLC documentation restructure on `feature/audit-deep-read`.

## Project
**Smart Expense & Budget Tracker** — Personal finance management system.
**Stack**: React 19 · Python Flask 3.1.1 · SQLite (prototype) / MySQL (production target) · Flask-SQLAlchemy ORM · Flask-JWT-Extended · Recharts.
**Ports**: backend `7576`, frontend `7575` (CORS hardcoded — see `Documents/DevOps/SetupAndDeployment.md` §3).
**Default branch**: `master`.

---

## The 8 Rules

### 1. Read Before Write
Before changing any file, read it + every model/service it imports.
At session start, state: "Working on: [task]. Reading: [files]. Business logic touched: [summary or 'none']."

### 2. Protected Business Logic
NEVER modify without `[BIZ-QC-NEEDED]` flag in the commit body. The protected formulas (full list in `Documents/Reference/PROJECT_CONTEXT.md` §"Critical Business Logic"):
- `budget_remaining = budget_amount - SUM(expenses)`
- `saved = income - SUM(expenses)`
- `usage_percent = SUM(expenses) / budget_amount × 100`
- Alert thresholds: warning ≥80%, critical ≥100%, suggestion at ≥80%
- `highest_category = MAX(SUM(expenses) GROUP BY category)`
- `avg_daily_spending = SUM(expenses) / days_in_month`
- Anything involving `DECIMAL(10,2)` financial fields

For any `[BIZ-QC-NEEDED]` change: get product-owner sign-off **before** implementation per `Documents/Process/RACI.md` W3.

### 3. Protected Branches
- `master` is production-ready only — **no direct commits, no force-push.**
- Work on: `feature/{id}-{desc}` · `bugfix/{id}-{desc}` · `hotfix/{id}-{desc}` (see `Documents/Process/GitWorkFlow.md` §2).

### 4. Never Rename Legacy Files
- Do NOT rename any existing file under `Documents/` (the SDLC restructure on `feature/audit-deep-read` is the one exception — and is now baseline).
- Do NOT rename `GEMINI.md` files (root, `backend/`, `frontend/`).
- The `Documents/Reference/PROJECT_CONTEXT.md` file is the project's authoritative session primer.

### 5. Bug Fix ≠ Refactor
Fix only what the ticket says. Extra change = new ticket. Do not "improve" surrounding code while fixing a bug. Reviewer must reject any out-of-scope changes (`Documents/Process/CodeCommunityStandard.md` §2.2).

### 6. One Ticket Per Branch
`feature/{id}` fixes `{id}` only. New issue found = new branch + new ticket in `Documents/Project/ticket-inventory.md`.

### 7. No Raw SQL — ORM Only
All database access goes through Flask routes → SQLAlchemy models. No raw SQL strings. No direct DB access from views/templates. (Per `GEMINI.md` and `Documents/Engineering/Backend/Architecture.md`.)

### 8. If Unsure → Escalate, Don't Guess
Uncertain about business logic? Ask the user. Wrong guess on financial calculations costs more than delay.

---

## Session Protocol

### Start
1. **Check git branch** — must NOT be `master`. If it is, branch off per Rule 3.
2. **Read `Documents/Reference/PROJECT_CONTEXT.md`** for project context.
3. **State**: "Working on: [task]. Reading: [files]."
4. If the task is non-trivial: read the relevant department guide first (`Documents/Engineering/Backend/`, `Documents/Engineering/Frontend/`, `Documents/QA/`, etc.).
5. If the task touches a protected formula (Rule 2): also read `Documents/Reference/PROJECT_CONTEXT.md` §"Critical Business Logic" and confirm `[BIZ-QC-NEEDED]` workflow per `Documents/Process/RACI.md` W3.

### During work
- Apply `Documents/Process/DefinitionOfReady.md` to confirm the ticket is actually pickup-ready.
- Apply `Documents/Process/CodeStandardAndGuide.md` for style.
- For new features: write/update the relevant test rows in `Documents/QA/TestingChecklist.md` as you go.

### End (Definition of Done — full version in `Documents/Process/DefinitionOfDone.md`)
1. **All acceptance criteria pass** — ticket-listed criteria, not the engineer's interpretation.
2. **Tests added or updated** — new code paths covered to `Documents/QA/TestingStrategy.md` targets.
3. **Test suite green** — `pytest` and `npm test` pass on the merge commit (once tests exist; today aspirational).
4. **Docs updated in the same PR**, no "follow-up PR later":
   - `Documents/Reference/SRS.md` if behavior changed
   - `Documents/Reference/ApiReference.md` if endpoint contract changed
   - `Documents/Reference/DatabaseDesign.md` if schema changed
   - `Documents/Project/ticket-inventory.md` status flipped to `DONE`
   - `Documents/QA/TestingChecklist.md` row checked off
   - Per-team guides under `Documents/Engineering/` if implementation patterns changed
5. **Commit format** per `Documents/Process/GitWorkFlow.md` §4 (with `[BIZ-QC-NEEDED]` if applicable).
6. **No uncommitted changes** left in the working tree.
7. **Branch deleted** after merge.

---

## Engineering Standards (pointer)

The full standards live in dedicated docs. Do not duplicate them here.

| Concern | Authoritative doc |
|---------|-------------------|
| Backend code style + patterns | `Documents/Process/CodeStandardAndGuide.md` §1 + `Documents/Engineering/Backend/Architecture.md` |
| Frontend code style + patterns | `Documents/Process/CodeStandardAndGuide.md` §2 + `Documents/Engineering/Frontend/Architecture.md` |
| API contract format | `Documents/Reference/ApiReference.md` |
| Database conventions | `Documents/Reference/DatabaseDesign.md` |
| Money handling (`DECIMAL(10,2)`, no `float` math) | `Documents/Process/CodeStandardAndGuide.md` §1.6 + `Documents/Engineering/Backend/ModelsGuide.md` §3 |
| Timestamps (UTC) | `Documents/Reference/DatabaseDesign.md` §6 |
| Auth (JWT, 24h) | `Documents/Engineering/Backend/Architecture.md` §6 |
| Security posture + threats | `Documents/Security/SecurityAndThreatModel.md` |
| Testing strategy + checklist | `Documents/QA/TestingStrategy.md` + `Documents/QA/TestingChecklist.md` |
| Deployment + release procedure | `Documents/DevOps/SetupAndDeployment.md` + `Documents/DevOps/ReleaseRunbook.md` |
| Schema migration | `Documents/DevOps/MigrationPlan.md` |
| Incident response | `Documents/Security/IncidentResponse.md` |
| Cross-functional ownership | `Documents/Process/RACI.md` |
| Architecture decisions (ADRs) | `Documents/Engineering/Architecture/ADR/` |

---

## Documentation Map

`Documents/` is organized by SDLC department. Look for:

- **`Reference/`** — what to read to understand the system (PROJECT_CONTEXT, SRS, ApiReference, DatabaseDesign, ProjectOverview, TechnologyStack)
- **`Process/`** — how teams hand off work (GitWorkFlow, CodeStandard, CodeCommunity, RACI, DoR, DoD, Onboarding)
- **`Product/`** — *what* and *why* to build (roadmap, personas)
- **`Project/`** — execution tracking (ticket-inventory, sprints, retros)
- **`Engineering/`** — `Backend/`, `Frontend/`, `Architecture/` (with `ADR/`)
- **`QA/`** — testing strategy + per-test checklist
- **`DevOps/`** — setup, deployment, runbooks, SLOs, migration
- **`Security/`** — threat model, incident response, compliance
- **`Design/`** — placeholder (no designer yet)

---

## Working with Claude Code specifically

- Claude is a contributor, not an authority. Treat its PRs the same as a human's.
- Claude commits include: `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`.
- Claude **never holds Accountability** in `Documents/Process/RACI.md` — a human always signs off, especially on `[BIZ-QC-NEEDED]` work.
- Claude must respect every rule above. Suspected violation = `must:` block at review.
- When delegating to Claude, write the prompt with the same care as a ticket per `Documents/Process/DefinitionOfReady.md`. "Improve the dashboard" is not a Ready ticket whether the executor is human or AI.

---

## Forbidden by default (require explicit human approval)
- Force-pushing to `master` or any shared branch.
- Skipping git hooks (`--no-verify`, `--no-gpg-sign`).
- Amending or rewriting commits that are already pushed.
- Adding a new npm or pip dependency without going through `Documents/Process/RACI.md` W5.
- Touching `.env`, `*.db`, `*.sqlite3`, or anything matching `.gitignore`.
- Deploying to production without the `Documents/DevOps/ReleaseRunbook.md` pre-flight checklist passing.
- Committing changes to one of the protected formulas (Rule 2) without `[BIZ-QC-NEEDED]` + product owner sign-off.
