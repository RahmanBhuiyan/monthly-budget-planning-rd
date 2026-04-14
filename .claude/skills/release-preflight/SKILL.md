---
description: Run the pre-flight checklist from Documents/DevOps/ReleaseRunbook.md before cutting a release. Reports PASS or BLOCKED with specific reasons.
allowed-tools: Read, Grep, Bash, Glob
argument-hint: "<VERSION>   e.g. /release-preflight v0.2.0"
---

You are running the release pre-flight check for **$1**.

## Procedure

1. Read `Documents/DevOps/ReleaseRunbook.md` §"Pre-flight checklist" for the authoritative list.
2. Verify each item against the actual repo state.

### Item-by-item

| Check | How |
|-------|-----|
| Every release ticket DONE | Read `Documents/Project/ticket-inventory.md`. Find any tickets tagged for **$1** (or in the current sprint per `Documents/Project/sprint-*.md`). Confirm each has `Status: DONE`. |
| `master` is green | !`git log -1 --oneline master` to confirm latest commit. Run `pytest` (backend) and `npm test -- --watchAll=false` (frontend). Both must exit 0. |
| No `🐛` bug-pinning tests still failing for DONE bugs | Read `Documents/QA/TestingChecklist.md`. For every row marked `🐛`, look up the corresponding bug ticket. If the bug is `DONE` but the test is still `🐛` (not `✅`), FLAG — the fix didn't un-pin its test. |
| All `[BIZ-QC-NEEDED]` PRs have product-owner sign-off | !`git log master..release/$1 --grep '\\[BIZ-QC-NEEDED\\]' --pretty=%H` (or main..release/* if release branch doesn't exist yet). For each commit, the message body must include a sign-off note. |
| DB schema matches prod | If a migration was added since the last release, confirm it is in `backend/migrations/` (Flask-Migrate). |
| Release notes written | Read `Documents/Project/release-notes.md` — check for an entry for **$1**. |
| On-call notified | Confirm in conversation; this check cannot be automated yet (no on-call tool — see `Documents/Security/IncidentResponse.md` "On-call rotation" TBD). |

## Output format

```
## release-preflight — $1

### Pre-flight items
- [✓/✗] Every ticket DONE — <summary>
- [✓/✗] master green — <test results>
- [✓/✗] No failing 🐛 tests for DONE bugs
- [✓/✗] [BIZ-QC-NEEDED] sign-offs present
- [✓/✗] DB schema in sync
- [✓/✗] Release notes drafted
- [✓/✗] On-call notified — <note: manual check>

### Verdict
PASS — proceed to ReleaseRunbook Step 1 (cut release branch)
BLOCKED because: <specific reasons>

### To unblock
1. <action>
2. <action>
```

If BLOCKED, the release does NOT happen. Per `ReleaseRunbook.md`: "If any of those is false, the release is blocked. Go back, fix, re-run the checklist."
