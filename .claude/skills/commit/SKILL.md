---
description: Stage relevant files and create a commit following Documents/Process/GitWorkFlow.md format. Auto-detects [BIZ-QC-NEEDED] requirement and prompts for sign-off note when applicable.
allowed-tools: Bash, Read, Grep
---

You are creating a commit for the current branch's work.

## Pre-flight (read CLAUDE.md governance)

Before doing anything:
- Run `git branch --show-current`. If the branch is `master` or `main`, **stop** — the PreToolUse hook will block the commit anyway. Branch off first.
- Run `git status` and `git diff` to see what's changed.
- Run `git log --oneline -5` to see recent commit message style.

## Stage selectively

Per `Documents/Process/CodeCommunityStandard.md` and `CLAUDE.md` "Forbidden by default":
- **Never** `git add -A` or `git add .` — they sweep up unrelated changes.
- Stage files **by name**, only those that belong to this commit.
- **Never stage**: `.env`, `*.db`, `*.sqlite3`, anything matching `.gitignore`.
- If you see uncommitted changes that are NOT yours (predate the session), leave them. Surface them to the user instead.

## Detect protected-logic changes

If the diff touches any of:
- `backend/routes/budget.py`
- `backend/routes/reports.py`
- `backend/routes/expenses.py`
- `backend/models.py`

…this is a `[BIZ-QC-NEEDED]` change per `CLAUDE.md` Rule 2. The commit body MUST include `[BIZ-QC-NEEDED]` AND should reference product-owner sign-off (`Documents/Process/RACI.md` W3). If sign-off is absent, prompt the user before committing.

## Build the commit message

Format from `Documents/Process/GitWorkFlow.md` §4:

```
type(scope): short imperative title

<body — explain the *why*, not the *what*. Bullet points OK.>

[BIZ-QC-NEEDED]   ← only if the diff touches protected files
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

**Allowed types:** `feat`, `fix`, `hotfix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`
**Allowed scopes:** `auth`, `income`, `budget`, `expenses`, `dashboard`, `reports`, `alerts`, `summary`, `api`, `ui`, `infra`, `governance`

Pick the type from what the diff actually does:
- New feature → `feat`
- Bug fix → `fix` (or `hotfix` if production-down)
- Refactor with no behavior change → `refactor`
- Test additions → `test`
- Doc-only → `docs`
- Tooling, dependencies, infra → `chore`

## Forbidden

- `git push --force` (any branch)
- `git commit --no-verify`
- `git commit --amend` on commits that have been pushed
- Skipping pre-commit hooks
- Pushing without explicit user request

## Commit

Use a HEREDOC so the message format survives shell quoting:

```bash
git commit -m "$(cat <<'EOF'
type(scope): title

Body explaining why.

[BIZ-QC-NEEDED]
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

After commit, run `git status` to confirm a clean tree (or surface what's intentionally left).

## Push

**Do not push** unless the user explicitly asks. Even then, never to `master` directly — push the current feature branch.
