---
description: Read recent code changes and update the affected docs under Documents/. Documents the *current* state, not history. Use after a feature lands or when docs have drifted.
allowed-tools: Bash, Read, Edit, Glob, Grep, Write
argument-hint: "[since-ref]   default: master   e.g. /update-docs HEAD~5"
---

You are syncing documentation with the current code state. Read the *code* (not just the diff) and update the docs that describe it.

## Procedure

### Step 1 — gather changes

```bash
since="${1:-master}"
git log "$since"..HEAD --oneline
git diff "$since"..HEAD --name-only
```

Skip trivial changes (typos, formatting, lockfile bumps with no behavior change).

### Step 2 — identify affected doc areas

Map changed files to the docs that describe them. Use this table (mirrors `/done` Phase 1A):

| Source area changed | Docs to read + possibly update |
|--------------------|-------------------------------|
| `backend/routes/auth.py` | `Documents/Reference/ApiReference.md` §"Auth", `Engineering/Backend/RoutesGuide.md` §`auth.py` |
| `backend/routes/income.py` | ApiReference §"Income", RoutesGuide §`income.py` |
| `backend/routes/budget.py` | ApiReference §"Budget", RoutesGuide §`budget.py` |
| `backend/routes/expenses.py` | ApiReference §"Expenses", RoutesGuide §`expenses.py` |
| `backend/routes/reports.py` | ApiReference §"Reports", RoutesGuide §`reports.py` |
| `backend/models.py` | `Reference/DatabaseDesign.md`, `Engineering/Backend/ModelsGuide.md` |
| `backend/app.py` | `Engineering/Backend/Architecture.md`, `DevOps/SetupAndDeployment.md` (env vars) |
| `frontend/src/pages/<Name>.js` | `Engineering/Frontend/PagesGuide.md` §<Name> |
| `frontend/src/components/<Name>.js` | `Engineering/Frontend/ComponentsGuide.md` |
| `frontend/src/services/api.js` | `Reference/ApiReference.md` (consumer-side notes), `Engineering/Frontend/Architecture.md` §6 |
| `frontend/src/App.css` | `Engineering/Frontend/StylingGuide.md` |
| `frontend/src/App.js` | `Engineering/Frontend/Architecture.md` §3, §4 |
| `requirements.txt` / `package.json` | `Reference/TechnologyStack.md`, `DevOps/SetupAndDeployment.md` |
| Schema migration in `backend/migrations/` | `Reference/DatabaseDesign.md`, `DevOps/MigrationPlan.md` |

### Step 3 — read the current code

For each affected source file, **read the current file**, not the diff. Documentation describes what the code *is*, not what it *was*. Verify any claim in the existing doc against the current code before deciding what needs updating.

### Step 4 — update docs

For each doc that has drift:
- **Edit** the affected sections to match the current code.
- **Add** new subsections if a new feature appeared (route, page, model, component).
- **Remove** sections that describe code that no longer exists.
- **Cross-link** if the change creates a new reference (e.g., a new endpoint should be referenced from `SRS.md` if it changes a functional requirement).

Style:
- Reference existing patterns and language in the doc — don't rewrite for style preference.
- Tables for systematic info (endpoints, fields, severity tiers).
- Doc the *current* state, not "this used to be X, now it's Y" (git log is for history).
- Keep each doc concise — split into a new doc rather than ballooning past ~300 lines.

### Step 5 — register new docs

If you created a new doc:
- Add a row to the relevant department's `README.md` "What's here today" table.
- If it's an architecture doc, add to `Documents/Engineering/Architecture/README.md`.
- If it's an ADR, add to the ADR/ folder (sequential number) and reference from related places.
- **Don't update `CLAUDE.md`** unless the new doc is a top-level concern. CLAUDE.md should stay tight.

### Step 6 — flag what you did NOT update

Some changes may need docs you cannot fully judge (e.g., a UX flow that requires `Documents/Design/UserJourney.md` which doesn't exist yet). Surface these to the user as a follow-up list rather than guessing.

## Output

```
## update-docs — since <ref>

### Changed source areas
- <file>: <one-line description>

### Docs updated
- <doc path>: <what changed>

### Docs created
- <doc path>: <purpose>

### Drift surfaced (no action taken)
- <area>: <why a human decision is needed>

### Skipped (trivial)
- <count> files, mostly <category>
```

## Hard rules
- Read the current code, not the diff.
- Never invent behavior — if a doc claim contradicts the code, the code wins; the doc is wrong, fix the doc.
- Never delete a doc just because nothing changed in it — confirm it still describes current behavior.
- One commit for the doc update (typically follows the code commit).
