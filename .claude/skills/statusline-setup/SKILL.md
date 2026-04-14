# Statusline Setup — Smart Expense & Budget Tracker

A two-row statusline tailored for this project's SDLC workflow. Adapted from [fotoflo/claude-skills](https://github.com/fotoflo/claude-skills/tree/main/statusline-setup).

## What you see

**Row 1 — project context**
```
~/project/monthly-budget-planning-rd  (feature/audit-deep-read)  [opus]  session-name  #BUG-1  [BIZ-QC ✓]
```

| Element | Meaning |
|---------|---------|
| `~/project/...` (green) | Current working directory |
| `(branch)` (cyan) | Git branch — **turns RED with `⚠ protected`** if you're on `master` or `main` (CLAUDE.md Rule 3 visual warning) |
| `[opus]` (yellow) | Model in use (opus / sonnet / haiku) |
| `session-name` (white) | Current Claude Code session |
| `#BUG-1` (magenta) | Ticket id auto-extracted from branch name (`feature/BUG-1-*` → `BUG-1`) |
| `[BIZ-QC ✓]` (green) or `[BIZ-QC NEEDED]` (bold red) | Appears when the diff vs `master` touches one of the 4 protected files (`backend/routes/{budget,reports,expenses}.py` or `backend/models.py`). Green if the latest commit body contains `[BIZ-QC-NEEDED]`; red if it doesn't (CLAUDE.md Rule 2 enforcement signal) |

**Row 2 — session usage and rate limits**
```
ctx:78%  tok:12.4k  +145/-23   │   5hr:62% reset 4pm · 7d:48% reset thu 9am
```

| Element | Meaning |
|---------|---------|
| `ctx:N%` | Context window remaining (color: green ≥60%, yellow ≥30%, red <30%) |
| `tok:Nk` | Total input + output tokens this session |
| `+N/-N` | Lines added / removed this session |
| `│` (dim) | Visual separator |
| `5hr:N%` / `7d:N%` | Rate-limit windows showing **remaining** percentage with reset time |

## Files

- `.claude/skills/statusline-setup/statusline-command.sh` — the script (executable, POSIX shell)
- `.claude/skills/statusline-setup/SKILL.md` — this doc
- `.claude/settings.json` — references the script via `statusLine.command`

## Installation

Already wired up on this branch. To install on a fresh clone:

1. Make the script executable:
   ```bash
   chmod +x .claude/skills/statusline-setup/statusline-command.sh
   ```
2. Confirm `.claude/settings.json` has the `statusLine` block (added on this branch).
3. Smoke test:
   ```bash
   echo '{"workspace":{"current_dir":"'$(pwd)'"},"model":{"id":"claude-opus-4-6"}}' \
     | sh .claude/skills/statusline-setup/statusline-command.sh
   ```
   You should see the colored two-row output.
4. Open Claude Code in this project — the statusline appears at the bottom.

## Requirements

- `jq` — JSON parsing
- `git` — branch + diff detection
- `awk` — number formatting
- `date` (GNU `date -d` or BSD `date -r`) — rate-limit reset formatting
- POSIX `sh`

All of these are present on macOS and standard Linux. On a minimal container, install `jq` first.

## Customizing

The script is project-local (lives in this repo's `.claude/`). Changes to it are tracked alongside code, so the team sees the same statusline.

To add a new signal (e.g., a "tests passing" indicator):
1. Add the detection logic in the "Extract from JSON" section.
2. Append it to `row1` in the "Row 1" assembly section.
3. Re-test with the smoke command above.

Keep it fast — the script runs on **every** prompt. Anything that takes >100 ms makes the editor feel laggy.

## Removing

```bash
# Delete the statusLine block from .claude/settings.json
# Delete the script:
rm .claude/statusline-command.sh .claude/SKILL.md
```
