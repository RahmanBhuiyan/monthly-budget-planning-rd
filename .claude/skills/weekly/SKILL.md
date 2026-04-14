---
description: Generate a weekly summary of commits on master — categorized highlights, statistics, and draft email/standup notes. Useful for sprint retros and release notes.
allowed-tools: Bash, Read
argument-hint: "[days]   default: 7   e.g. /weekly 14"
---

You are generating a weekly summary of recent work on `master`.

## Procedure

### Step 1 — gather the data

```bash
days="${1:-7}"
since="$(date -d "$days days ago" +%Y-%m-%d 2>/dev/null || date -v-${days}d +%Y-%m-%d)"

# Commits in the window (skip merge commits)
git log master --no-merges --since="$since" --pretty=format:'%h|%s|%an|%ad' --date=short

# Stats: line changes
git log master --no-merges --since="$since" --shortstat --pretty=format:'%h|%s'

# File touch counts
git log master --no-merges --since="$since" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10
```

If `master` has no recent activity (single-developer prototype today), fall back to `feature/audit-deep-read` or whatever the active long-lived branch is. Note this in the output.

### Step 2 — categorize commits

Bucket each commit by its `type(scope):` prefix per `Documents/Process/GitWorkFlow.md` §4:

| Bucket | Types |
|--------|-------|
| **Features** | `feat` |
| **Fixes** | `fix`, `hotfix` |
| **Refactor / Perf** | `refactor`, `perf` |
| **Infrastructure** | `chore`, `build` |
| **Docs / Tests** | `docs`, `test` |
| **Style** | `style` |

Skip merges and trivial style-only commits unless that's the bulk of the week.

### Step 3 — pick highlights

5–8 most notable items. Group related commits into a single bullet (e.g., "added 4 ADRs" not 4 bullets). Prioritize:
- Closed tickets from `Documents/Project/ticket-inventory.md` (especially HIGH severity).
- New features that change user-visible behavior.
- `[BIZ-QC-NEEDED]` changes to protected logic.
- Releases (commits tagged or with `release/*` branches).
- Documentation milestones (a whole new doc area, not edits).

Skip:
- Lockfile bumps.
- Lint-only fixes.
- Pure typo corrections.

### Step 4 — output

```markdown
## Weekly summary — <since-date> to <today> (<days> days)

**At a glance:** N commits · +X / −Y lines · M tickets closed · T contributors

### Highlights
1. <one-line punchy bullet — what shipped, not how>
2. ...
(5–8 items)

### By category
- **Features (N):** <comma list of titles>
- **Fixes (N):** <comma list>
- **Infrastructure (N):** <comma list>
- **Docs / Tests (N):** <comma list>
- **Refactor (N):** <comma list>

### Hot files (most-touched this week)
- `<path>` (N commits)
- ...
(top 5)

### Tickets closed
- BUG-N <title>
- FEAT-N <title>
- ...

### Tickets still open from last week
- <list with current status>

---

### Draft standup / founder-update copy

Hey team —

Quick rundown of what shipped this week:
- <conversational bullet, first person>
- <conversational bullet>
- <conversational bullet>

Next week we're focused on <ticket / theme>.
```

## Style notes for the draft copy
- First person ("we shipped X"), not third person ("X was shipped").
- Punchy, conversational. The draft is for a human to lightly edit, not to be sent verbatim.
- "What shipped" matters more than "how it works."
- Group: don't list 5 commits to the same feature; mention the feature once.
- Skip blow-by-blow process improvements unless they unlocked something visible.

## Hard rules
- Never invent commits or tickets that aren't in `git log` / `ticket-inventory.md`.
- If the window has zero activity, say so plainly — don't pad.
- Don't include commit hashes in the draft email copy (too noisy for a non-developer reader).
