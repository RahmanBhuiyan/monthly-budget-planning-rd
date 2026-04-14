---
description: End-of-session wrap-up. Updates docs, runs lint/tests, builds productivity report, and commits — all aligned with Documents/Process/DefinitionOfDone.md. Use as the last step before opening a PR.
allowed-tools: Bash, Read, Edit, Glob, Grep, Write
---

You are wrapping up the current session. The endpoint is a clean working tree, a green test run, updated docs, and a properly formatted commit (or sequence of commits).

## Phase 0 — context

1. Identify the branch and ticket id:
   ```
   git branch --show-current
   ```
2. Identify the session's actual changes (NOT git history alone — git may have prior in-flight work):
   ```
   git status --short
   git diff master...HEAD --stat
   ```
3. Re-read `Documents/Process/DefinitionOfDone.md` for the authoritative checklist.

## Phase 1 — parallel work (run as separate Agent invocations or sequential, your call)

### A. Update affected docs
Per `DefinitionOfDone.md` §"Universal" item "Docs updated in same PR." For each changed source file, check whether the corresponding doc exists and is current:

| Source file pattern | Doc to check |
|--------------------|--------------|
| `backend/routes/*.py` | `Documents/Reference/ApiReference.md`, `Documents/Engineering/Backend/RoutesGuide.md` |
| `backend/models.py` | `Documents/Reference/DatabaseDesign.md`, `Documents/Engineering/Backend/ModelsGuide.md` |
| `backend/app.py` | `Documents/Engineering/Backend/Architecture.md`, `Documents/DevOps/SetupAndDeployment.md` |
| `frontend/src/pages/*.js` | `Documents/Engineering/Frontend/PagesGuide.md` |
| `frontend/src/components/*.js` | `Documents/Engineering/Frontend/ComponentsGuide.md` |
| `frontend/src/services/api.js` | `Documents/Reference/ApiReference.md`, `Documents/Engineering/Frontend/Architecture.md` §6 |
| `frontend/src/App.css` | `Documents/Engineering/Frontend/StylingGuide.md` |
| any test added | `Documents/QA/TestingChecklist.md` (check off the row, change `❌` to `✅` or `🐛` if pinning) |

If a source file changed but its doc didn't, **update the doc in this same commit** — no follow-up PRs (DoD universal item).

### B. Bug-fix retro doc (conditional)
If the branch is `bugfix/*` or `hotfix/*`, append a short root-cause note to `Documents/Project/ticket-inventory.md` row's notes column. If the bug merits a post-mortem (SEV-1 or 4h+ resolve time), create `Documents/Project/retro-{date}-{slug}.md` per `Documents/Security/IncidentResponse.md` Step 7.

### C. Lint
- Backend: `cd backend && python -m flake8` (or `black --check .` if configured). Fix only the issues in files this session touched — no speculative lint cleanups (`CLAUDE.md` Rule 5).
- Frontend: `cd frontend && npm run lint` if available; otherwise skip with a note.

### D. Tests
- Backend: `cd backend && pytest` (skip if no tests yet).
- Frontend: `cd frontend && npm test -- --watchAll=false` (skip if no tests yet).
- If any test fails, **stop and fix** before continuing. A failing test is a `must:` block on DONE.
- Report coverage if the suite produces it.

### E. Ticket status
Update `Documents/Project/ticket-inventory.md`: change the ticket's `Status` column from `IN PROGRESS` to `DONE` (or `BLOCKED` with reason if the work paused).

## Phase 2 — Definition of Done check

Run the full DoD checklist (or invoke `/check-done` if it exists). Report any unmet items.

If anything is unmet:
- **Fix it** if it's in scope (lint, doc updates, status flips).
- **Surface to the user** if it requires a decision (failing test, missing acceptance criterion).

## Phase 3 — commit

Invoke the `commit` command (or apply its procedure inline). The commit body should include a short productivity summary:

```
type(scope): title

Body.

Session summary:
- Files changed: N
- Tests added: N
- Docs updated: N
- Tickets closed: <ID>

[BIZ-QC-NEEDED]   ← if applicable
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

## Phase 4 — report

Output a short table to the user:

```
## Session wrap-up — <branch>

| Phase | Result |
|-------|--------|
| Docs updated | <list of files> |
| Lint | clean / N issues fixed |
| Tests | N passed, N failed |
| Ticket(s) closed | <IDs> |
| Commits | <count, with hashes> |

Definition of Done: PASS / FAIL (gaps: ...)
Next step: open PR  /  fix <gap>  /  ask user about <decision>
```

## Hard rules
- **Never** force-push, amend pushed commits, or skip hooks.
- **Never** stage changes that aren't yours (predate the session).
- If `pytest` or `npm test` fails, stop. Do not commit a broken tree.
- Do not push unless the user explicitly asks.
