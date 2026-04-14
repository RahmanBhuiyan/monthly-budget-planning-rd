# Incident Response Runbook

> Procedure for production incidents. Owned by Security and DevOps jointly per `Documents/Process/RACI.md` W4. Extends `Documents/Security/SecurityAndThreatModel.md` §8.
>
> **Today there is no production deployment and no on-call rotation** — this runbook is the procedure that will activate the first time a real user has a real problem. Read it before you need it.

## Severity definitions
See `Documents/DevOps/SLOs.md` "Severity tiers". Quick recap:
- **SEV-1**: site down, data at risk, active breach. Page now. Mitigate ≤ 60 min.
- **SEV-2**: significant feature broken. Business hours. Fix ≤ 1 day.
- **SEV-3**: bug with workaround. Normal ticket.
- **SEV-4**: cosmetic. Scheduled.

## On-call rotation
**TBD** — single dev today. As soon as a second person joins, define a rotation and link the schedule here.

Until then: any production incident is the project owner's problem, regardless of time.

## The procedure (SEV-1 and SEV-2)

### Step 1 — acknowledge (within 10 minutes)
- Page received → respond in the alert channel: `ack — investigating`.
- Open the incident channel (TBD — until then, a dated section in chat).
- Start a timeline log. Every action gets a timestamp. Memory is unreliable under stress.

### Step 2 — assess
| Question | How to answer |
|----------|--------------|
| What's broken? | Reproduce in a browser as a normal user |
| When did it start? | Check deploy history (`git log --oneline release/*`) and external alerting |
| How many users affected? | Server logs — count distinct user_ids hitting the broken endpoint |
| Is data integrity at risk? | If financial calculations or data writes are involved, assume YES until proven NO |

If data integrity is at risk → **SEV-1, regardless of user count.**

### Step 3 — stabilize (mitigate before fixing)
**Goal:** stop the bleeding. Root cause analysis comes later.

In rough order of preference:
1. **Roll back the most recent deploy** if the timeline points at it. See `Documents/DevOps/ReleaseRunbook.md` "Rollback".
2. **Disable the affected feature** if there's a feature flag (none today — open a ticket if you ever need one).
3. **Read-only mode** for the database if writes are the problem. (Procedure not yet documented — file a ticket the moment you need it.)
4. **Restore from backup** if data is corrupted. (Backup procedure: see `Documents/Reference/DatabaseDesign.md` §10 — TBD.)

Update the incident channel: `mitigated — root cause TBD`.

### Step 4 — communicate to users
PM-PD owns user comms (`RACI.md` W4). The format:

```
We're investigating an issue with [thing]. Some users may experience
[behavior]. We'll update at [time]. Sorry for the disruption.
```

Update at the promised time even if there's no news. Silence is worse than "still investigating."

For SEV-1 only: send a follow-up when resolved with what happened and what we're doing about it.

### Step 5 — root cause
With the fire out, find the root cause. The "5 whys" technique works:
- Why did `/reports/summary` return 500? → AttributeError on `budget.amount`.
- Why? → `budget` was None.
- Why? → User had no budget set for the month.
- Why didn't we catch this? → Test U-04 / I-34 (`Documents/QA/TestingChecklist.md`) was missing.
- Why? → No coverage gate at v1.

The deepest "why" is the one to fix.

### Step 6 — fix
- Open a `hotfix/` ticket per `Documents/Process/GitWorkFlow.md` §7.
- Add a regression test (`Documents/QA/TestingChecklist.md` row marked `🐛`).
- Follow the normal review process — speed does not waive `[BIZ-QC-NEEDED]` on financial code.

### Step 7 — post-mortem
Required for every SEV-1 and any SEV-2 that took longer than 4 hours to resolve. Template in `Documents/Project/README.md`. File at `Documents/Project/retro-{date}-incident-{slug}.md`.

The post-mortem is **blameless**. The question is "what about the system let this happen?", not "who screwed up?". A blameless post-mortem catches more issues because people are honest about contributing factors.

## Specific scenarios

### Scenario A — credential leak (e.g. `JWT_SECRET_KEY` ends up in git)
1. **Rotate** `JWT_SECRET_KEY` immediately. This invalidates every existing token (every user is logged out).
2. **Rotate** `SECRET_KEY` and `DATABASE_URL` credentials.
3. `git filter-repo` to remove the secret from history (cosmetic — assume it's already harvested).
4. Force-push the cleaned history (DESTRUCTIVE — only for credential leaks, only with explicit owner approval per `CLAUDE.md` "Git Safety Protocol").
5. Audit logs for any access using the leaked credential.
6. Post-mortem: how did the secret get committed? `.gitignore` insufficient? Pre-commit hook missing?

### Scenario B — database corruption
1. **Stop writes** — put the app in read-only mode (procedure TBD — open ticket if/when needed).
2. **Snapshot** the corrupted DB before doing anything else (`mysqldump > corrupted-{timestamp}.sql`).
3. **Identify scope** — query for affected rows.
4. **Restore from backup** to a parallel instance.
5. **Diff** old and new — decide what user data to merge forward and what to discard.
6. **Replay writes** that happened post-corruption from the app log if possible.
7. Resume writes only after smoke tests pass against the restored DB.

This procedure assumes backups exist. **Today they don't.** That gap is `Documents/Reference/DatabaseDesign.md` §10.

### Scenario C — deploy that breaks the dashboard
The most likely incident. Procedure:
1. `git log --oneline release/...` — identify the bad commit.
2. Roll back per `ReleaseRunbook.md` "Option A" (code-only rollback).
3. Most dashboard issues are frontend-only — rolling back nginx's serving directory takes seconds.
4. Open `bugfix/` ticket; fix in normal flow.

### Scenario D — auth being brute-forced
SEV-1 if the attacker is succeeding. Otherwise SEV-2.
1. Inspect `/auth/login` request rate by source IP.
2. Block at the reverse proxy (nginx `limit_req` or fail2ban) — 1 line of config, no app change.
3. File `feature/rate-limiting` (FEAT-8) if not already in flight.
4. Audit recent successful logins for impossible-travel patterns.

## Tools / contacts (TBD)

| What | Where | Status |
|------|-------|--------|
| Status page | — | not set up |
| PagerDuty / on-call tool | — | not set up |
| Log aggregator | — | not set up (FEAT-12) |
| Runbook automation | — | manual today |
| Backup location | — | not configured |
| Security contact | (project owner) | single point of failure |

Filling these in is itself a `feature/incident-tooling` ticket. Until then, every incident is more painful than it needs to be — accept the tax or pay it down.

## Drills

Once tooling exists, run a quarterly chaos drill:
- Pick a random scenario from the list above.
- Walk through the runbook with whoever's on call.
- Time the response. Compare to SLO targets in `Documents/DevOps/SLOs.md`.
- Update this document with anything that surprised you.

A runbook you've never practiced is fiction.
