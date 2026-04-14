# Ticket Inventory

> Living list. Update in place — don't append "DONE" history (that's what `git log` is for). One-line per ticket; deeper context lives in `Documents/Reference/SRS.md` §6.

**Legend:** `OPEN` · `IN PROGRESS` · `BLOCKED` · `DONE` (delete after one sprint).
**Severity:** `HIGH` · `MED` · `LOW`. **Tag** `[BIZ-QC-NEEDED]` when the fix touches protected business logic (`CLAUDE.md §2`).

---

## v1 blockers (must close before any production deploy)

| ID | Title | Severity | Status | Branch | Notes |
|----|-------|----------|--------|--------|-------|
| BUG-1 | `savings_goal` reset to 0 when omitted from POST `/budget` | HIGH | OPEN | — | `routes/budget.py:26` · `[BIZ-QC-NEEDED]` · `SRS §6.1` |
| BUG-2 | Hardcoded dev secret fallbacks in `app.py` | HIGH | OPEN | — | `app.py:16,19` · fail-fast in non-dev · `SRS §6.2` |
| BUG-3 | Frontend port mismatch (CRA defaults to 3000, CORS expects 7575) | HIGH | OPEN | — | `frontend/package.json` start script · `SRS §6.11` |
| BUG-4 | `app.run(debug=True)` hardcoded — Werkzeug debugger is RCE | HIGH | OPEN | — | `app.py:49` · gate behind env · `SecurityAndThreatModel SEC-8` |
| BUG-5 | `date.fromisoformat()` no try/except → 500 on bad input | MED | OPEN | — | `routes/expenses.py:33` · `SRS §6.3` |
| BUG-6 | No password / email format validation | MED | OPEN | — | `routes/auth.py` · `SRS §6.7` · `SecurityAndThreatModel SEC-3,4` |
| TEST-1 | Add backend test baseline (pytest + financial formulas) | HIGH | OPEN | — | `Engineering/Backend/TestingGuide.md` · prerequisite for `[BIZ-QC-NEEDED]` confidence |
| TEST-2 | Add frontend test baseline (Jest + page render smoke) | HIGH | OPEN | — | `Engineering/Frontend/TestingGuide.md` |
| INFRA-1 | Introduce Flask-Migrate, drop `db.create_all()` | MED | OPEN | — | `MigrationPlan.md` Step 1 · prerequisite for any prod schema change |

## Bugs (non-blocker)

| ID | Title | Severity | Status | Branch | Notes |
|----|-------|----------|--------|--------|-------|
| BUG-7 | Login timing attack reveals which emails exist | LOW–MED | OPEN | — | `routes/auth.py:40` · `SRS §6.6` |
| BUG-8 | `Numeric → float` precision leak at API boundary | MED | OPEN | — | `models.py to_dict()` + `routes/reports.py _get_total_spent` · `SRS §6.5` · `[BIZ-QC-NEEDED]` |
| BUG-9 | Categories endpoint has no `ORDER BY` | LOW | OPEN | — | `routes/reports.py:91` · `SRS §6.4` |
| BUG-10 | `BudgetAlerts` uses `key={i}` (anti-pattern) | LOW | OPEN | — | `frontend/src/pages/BudgetAlerts.js:45` |
| BUG-11 | ExpenseList delete failure swallowed silently (only console.error) | LOW | OPEN | — | `frontend/src/pages/ExpenseList.js:37` · UX, not data |
| BUG-12 | `BottomNav` uses `<div onClick>` (a11y, no keyboard nav) | LOW | OPEN | — | `frontend/src/components/BottomNav.js` · `Engineering/Frontend/ComponentsGuide.md` |

## Features (post-v1 candidates)

| ID | Title | Severity | Status | Branch | Notes |
|----|-------|----------|--------|--------|-------|
| FEAT-1 | Historical month/year selector on Dashboard + Summary | LOW | OPEN | — | `SRS §6.12` |
| FEAT-2 | Either wire `savings_goal` into reports OR remove the column | LOW | OPEN | — | `SRS §6.8` · `[BIZ-QC-NEEDED]` if wired in |
| FEAT-3 | Parameterize Axios base URL via `REACT_APP_API_BASE_URL` | MED | OPEN | — | Deployment-blocker · `SetupAndDeployment.md §4` |
| FEAT-4 | Make CORS allow-list configurable via env var | LOW | OPEN | — | `SecurityAndThreatModel SEC-9` |
| FEAT-5 | Add response interceptor for global 401 → logout | LOW | OPEN | — | `Engineering/Frontend/Architecture.md §6` · removes ~12 duplicates |
| FEAT-6 | Add `<Route path="*" element={<NotFound />} />` catch-all | LOW | OPEN | — | `frontend/src/App.js` |
| FEAT-7 | Move JWT from localStorage to httpOnly cookie + CSRF | MED | OPEN | — | `SecurityAndThreatModel SEC-7` · large change |
| FEAT-8 | Add rate limiting + lockout on `/auth/*` | MED | OPEN | — | `SecurityAndThreatModel SEC-5` |
| FEAT-9 | Pagination on `GET /expenses` | LOW | OPEN | — | `SecurityAndThreatModel SEC-6` |
| FEAT-10 | Migrate prod from SQLite to MySQL | MED | OPEN | — | `MigrationPlan.md` Step 2 (prereq: INFRA-1) |
| FEAT-11 | Custom categories (replace hardcoded `VALID_CATEGORIES`) | MED | OPEN | — | New `categories` table + endpoint |
| FEAT-12 | Structured logging on auth + financial mutations | MED | OPEN | — | `SecurityAndThreatModel §7` |
| FEAT-13 | Create `.env.example` for backend | LOW | OPEN | — | `SetupAndDeployment.md §4` |

## Docs cleanup

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| DOCS-1 | Resolve PROJECT_CONTEXT.md root→Documents move | OPEN | Pre-existing untracked move with audit edits inside; needs author decision |
| DOCS-2 | Decide on the 6 missing per-app docs (`backend/GEMINI.md`, `frontend/GEMINI.md` references) | OPEN | `SRS §6.13` · fold into top-level Documents/ + remove references is recommended |

---

## Workflow

- One ticket → one branch (`CLAUDE.md §6`). Branch name: `bugfix/BUG-1-savings-goal-reset`.
- Commits include the ticket id in the body.
- When a ticket is `DONE`, leave it here for one sprint (so retros can reference it), then delete.
- Add new tickets at the end of the right table; keep IDs sequential per prefix.
