---
description: Walk Documents/Process/DefinitionOfDone.md against the current branch. Run before opening a PR. Reports DONE or NOT DONE with specific gaps.
allowed-tools: Read, Grep, Bash, Glob
---

You are running the Definition of Done check for the current branch.

## Procedure

1. Read `Documents/Process/DefinitionOfDone.md` for the authoritative checklist.
2. Identify the current branch and ticket id:
   - !`git branch --show-current`
   - Extract the ticket id from the branch name (`feature/<ID>-...` → ID).
3. Get the diff vs master:
   - !`git diff master...HEAD --stat`
   - !`git diff master...HEAD --name-only`
4. Walk the **universal checklist** from `DefinitionOfDone.md`:
   - **Code merged?** No, you are pre-merge — skip.
   - **All acceptance criteria pass?** Cross-reference against the ticket's "Acceptance criteria" in `Documents/Project/ticket-inventory.md`. Note any not yet verified.
   - **Tests added or updated?** Run `git diff master...HEAD --name-only | grep -E '(test_|\\.test\\.)'` — if no test files touched and the diff isn't docs-only, FLAG.
   - **Test suite green?** Run `pytest` (backend) and `npm test -- --watchAll=false` (frontend) if those commands exist.
   - **Lint clean?** Run lint commands if configured.
   - **Docs updated in same PR?** For each changed source file, check whether the corresponding doc was updated:
     - Changed `backend/routes/*.py` → check `Documents/Reference/ApiReference.md` and `Documents/Engineering/Backend/RoutesGuide.md` mtimes/diff.
     - Changed `backend/models.py` → check `Documents/Reference/DatabaseDesign.md` and `Documents/Engineering/Backend/ModelsGuide.md`.
     - Any change → check `Documents/Project/ticket-inventory.md` was updated to flip status.
     - Any test added → check `Documents/QA/TestingChecklist.md` row was checked off.
   - **Commit format?** Run `git log master..HEAD --pretty=%B` and verify each commit follows `type(scope): description` per `Documents/Process/GitWorkFlow.md` §4.
   - **`[BIZ-QC-NEEDED]` flag?** If the diff touches `backend/routes/budget.py`, `routes/reports.py`, `routes/expenses.py`, or `models.py`, every commit body in this branch must contain `[BIZ-QC-NEEDED]`.
   - **No `// TODO` or `# FIXME` without ticket id?** Run `git diff master...HEAD | grep -E '^\\+.*(TODO|FIXME)'` and check each one references a ticket.
   - **No new dependency without RACI W5?** Check if `requirements.txt` or `package.json` was modified.
   - **No secrets?** Check for likely-secret patterns in the diff.
5. Walk the **per-type checklist** based on the ticket type.

## Output format

```
## DefinitionOfDone check — branch <branch>, ticket <id>

### Universal checklist
- [✓/✗/skip] <each item with status>

### Per-type checklist (<type>)
- [✓/✗] <each item>

### Verdict
DONE — open the PR  |  NOT DONE because: <specific gaps>

### To make Done
1. <action>
2. <action>
```

A FLAG (✗ on any required item) blocks DONE. The user/engineer addresses each FLAG before opening the PR.
