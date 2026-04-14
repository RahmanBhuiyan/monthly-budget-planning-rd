# Release Runbook

> Step-by-step procedure for cutting and deploying a release. Owned by DevOps; consumed by Engineering and QA per `Documents/Process/RACI.md` W7.
>
> **Today this is aspirational** — the project has never been deployed. This runbook captures the *intended* procedure so the first release follows a written plan rather than improvisation.

## Pre-flight checklist
A release CANNOT be cut unless ALL of these are true:

- [ ] Every ticket in the release has `Status: DONE` in `Documents/Project/ticket-inventory.md`.
- [ ] `master` is green: `pytest` and `npm test` pass on the head commit.
- [ ] No `🐛` bug-pinning tests are still failing for bugs marked DONE in this release (means the fix didn't actually un-pin the test).
- [ ] All `[BIZ-QC-NEEDED]` PRs in this release have product-owner sign-off in their PR descriptions.
- [ ] Database schema matches what's deployed in prod (no untracked migrations).
- [ ] `Documents/Reference/SRS.md` §6 has been re-checked — any gaps that this release closes are removed.
- [ ] `Documents/Project/release-notes.md` has the user-facing summary written.
- [ ] On-call engineer notified of the release window.

If any of those is false, the release is blocked. Go back, fix, re-run the checklist.

## Release procedure

### Step 1 — cut release branch (DevOps)
```bash
git checkout master
git pull --ff-only origin master
git checkout -b release/v0.X.0
git push -u origin release/v0.X.0
```
Tag candidate name in `release-notes.md`.

### Step 2 — staging deploy (DevOps)
```bash
# backend
ssh staging
cd /opt/smart-expense-tracker/backend
git fetch && git checkout release/v0.X.0
source venv/bin/activate
pip install -r requirements.txt
flask db upgrade           # once Flask-Migrate exists (INFRA-1)
sudo systemctl restart smart-expense-backend

# frontend
cd /opt/smart-expense-tracker/frontend
git fetch && git checkout release/v0.X.0
npm ci
npm run build
sudo systemctl reload nginx     # serves the new build/
```

### Step 3 — staging smoke test (QA)
The minimum scenario, end-to-end, on staging:

1. Sign up a fresh user.
2. Set monthly income.
3. Set monthly budget with savings_goal.
4. Add 3 expenses across 3 different categories.
5. Open dashboard — verify income, total spent, budget remaining match.
6. Open expense list — verify all 3 expenses appear, sorted by date desc.
7. Open categories — verify the breakdown.
8. Open analysis — verify the chart renders.
9. Open alerts — verify the alert composition matches the spend level.
10. Open summary — verify saved/spent/highest match.
11. Delete one expense — verify it disappears AND the dashboard updates.
12. Log out — verify you're back at `/` and `localStorage` is clear.

If any step fails: **abort the release**. Fix on a `bugfix/` branch, merge to `master`, re-cut release.

If all steps pass, QA approves in the release-notes PR.

### Step 4 — production deploy (DevOps)
**Only proceed if Step 3 passed and the on-call engineer is online.**

```bash
ssh production
# Same procedure as Step 2.
```

Production deploys do **not** run on Friday afternoon, weekends, or holidays. A deploy you can't fix at 3 AM is a deploy that shouldn't ship.

### Step 5 — production smoke test (QA + DevOps)
Run a subset of Step 3 against production using a designated test account:
1. Log in as the test account.
2. Add an expense (use a unique note like "smoke-test-{date}").
3. Check the dashboard reflects it.
4. Delete the smoke-test expense.

Anything unexpected → see "Rollback" below.

### Step 6 — finalize
- [ ] Tag the release: `git tag -a v0.X.0 -m "Release v0.X.0" && git push origin v0.X.0`.
- [ ] Merge release branch back to `master` (typically a fast-forward).
- [ ] Move `Documents/Project/release-notes.md` entry from "draft" to "released".
- [ ] Notify `RACI.md` W7 "I" cells.
- [ ] Update on-call schedule for the post-release watch window (next 24 hours).

## Rollback

If production smoke test fails OR an alert fires within the post-release window:

### Option A — code rollback (fast)
```bash
ssh production
cd /opt/smart-expense-tracker/backend
git checkout v0.(X-1).0
sudo systemctl restart smart-expense-backend
# same for frontend
```
Acceptable when: no DB migration was applied in this release, or the migration is forward-compatible with the previous code.

### Option B — code + DB rollback (slow, risky)
```bash
flask db downgrade -1     # back out one migration
git checkout v0.(X-1).0
# restart services
```
Only when: the migration is genuinely reversible AND no prod data depends on the new schema yet.

### Option C — restore from backup (last resort)
Documented in `Documents/Security/IncidentResponse.md`. Use only when A and B can't get you back to a working state. Triggers an automatic post-mortem.

## Communication template

Send this to `RACI.md` W7 "I" cells when each phase completes.

```
[release v0.X.0] staging deploy complete — smoke test in progress
[release v0.X.0] staging smoke test PASSED — proceeding to prod deploy
[release v0.X.0] prod deploy complete — smoke test in progress
[release v0.X.0] prod smoke test PASSED — release shipped, post-release watch for 24h
[release v0.X.0] ❌ ABORT — <reason>, on call: <person>
```

## Post-mortem trigger

Any of these requires a post-mortem in `Documents/Project/retro-{date}-{slug}.md`:
- Release was aborted at any step.
- Rollback was used (any option).
- An issue was discovered in prod within the 24h watch window.
- The release took longer than 2× its time estimate.

Post-mortem template lives in `Documents/Project/README.md`.

## What this runbook does NOT cover (yet)
- CI/CD automation (today everything is manual).
- Blue/green or canary deploys.
- Database backup procedure (open question: where? how often? RTO/RPO).
- Multi-region considerations (single-region today).

These are tickets in their own right. File them under DevOps when prioritized.
