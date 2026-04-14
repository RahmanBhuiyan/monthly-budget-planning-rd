# Git Workflow

## 1. Default branch
`master`. Treated as production-ready. **No direct commits.** All work goes through a feature/bugfix/hotfix branch.

## 2. Branch naming
```
feature/{id}-{short-desc}
bugfix/{id}-{short-desc}
hotfix/{id}-{short-desc}
```
- `{id}` — short ticket id (issue number, JIRA key, or ad-hoc tag like `audit-deep-read`).
- `{short-desc}` — kebab-case, ≤4 words.
- Avoid shell-special characters (`&`, `$`, spaces, `#`).

**Examples:**
- `feature/123-csv-export`
- `bugfix/456-savings-goal-reset`
- `hotfix/789-cors-port-mismatch`

## 3. One ticket per branch
A `feature/{id}` branch fixes only `{id}`. If you find a second issue, open a second branch for it. Do **not** bundle "while I was here" cleanups into an unrelated branch (CLAUDE.md §5, §6).

## 4. Commit message format
```
type(scope): description

<optional body — explain *why*, not *what*>

[BIZ-QC-NEEDED]   # only if touching protected business logic (CLAUDE.md §2)
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

### Allowed types
`feat`, `fix`, `hotfix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`

### Allowed scopes
`auth`, `income`, `budget`, `expenses`, `dashboard`, `reports`, `alerts`, `summary`, `api`, `ui`, `infra`

### Examples
```
fix(budget): preserve savings_goal when omitted from POST

The upsert previously zero-set savings_goal on any payload that didn't
include the field, causing silent data loss.

[BIZ-QC-NEEDED]
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

```
docs(context): correct page count and add port gotcha
```

## 5. `[BIZ-QC-NEEDED]` flag
Required in the commit body whenever a change touches:
- Budget calculation (`remaining = income - total_spent`)
- Savings goal computation (`saved = income - budget_limit`)
- Overspending alert thresholds (80%, 100%)
- Monthly summary aggregation
- Anything involving `DECIMAL(10,2)` financial fields

The flag signals the reviewer must verify the formula by hand against `Documents/PROJECT_CONTEXT.md` §"Critical Business Logic".

## 6. Pull request workflow
1. Push your branch: `git push -u origin feature/{id}-{desc}`
2. Open a PR targeting `master`.
3. PR title mirrors the commit type/scope: `fix(budget): preserve savings_goal when omitted`.
4. PR description must include:
   - Link to the ticket
   - **Summary** (1–3 bullets)
   - **Test plan** (checklist of how you verified)
   - `[BIZ-QC-NEEDED]` callout if applicable
5. At least one approving review before merge.
6. Squash-merge by default (keeps `master` linear). Use a merge commit only if the branch's commit history is meaningful and you want to preserve it.
7. Delete the branch after merge.

## 7. Hotfix flow
For production-down issues only:
1. Branch from `master` as `hotfix/{id}-{desc}`.
2. Fix, test, open PR.
3. Same review requirement — speed does not waive `[BIZ-QC-NEEDED]` review.
4. Merge, then ensure the fix flows into any active long-lived branches.

## 8. Forbidden actions
- `git push --force` to `master`.
- `git rebase` / `git commit --amend` on commits that are already pushed and shared.
- Skipping hooks (`--no-verify`) without explicit reviewer approval.
- Committing `.env`, `*.db`, `*.sqlite3`, `node_modules/`, `venv/`, or anything matching `.gitignore`.

## 9. Conflict resolution
- Rebase your branch on the latest `master` before opening a PR (`git fetch && git rebase origin/master`).
- Resolve conflicts locally; never bypass them with `git checkout --theirs/--ours` blindly on financial code.
- If the conflict is in `models.py`, `routes/budget.py`, `routes/reports.py`, or `routes/expenses.py`, treat the resolution itself as `[BIZ-QC-NEEDED]`.
