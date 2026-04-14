# DevOps / SRE — workspace

This folder holds **operational** artifacts: setup, deployment, infrastructure, runbooks, SLOs. Anything about *running* the system rather than building it.

## What's here today

| File | Purpose |
|------|---------|
| `SetupAndDeployment.md` | First-run guide (local + production sketch) |
| `MigrationPlan.md` | SQLite → MySQL + Flask-Migrate adoption |
| `ReleaseRunbook.md` | Step-by-step release procedure |
| `SLOs.md` | Service Level Objectives + error budget policy |

## Suggested files (create as needed)
- `monitoring.md` — what we observe, how, where alerts go
- `backup-procedure.md` — backup cadence, retention, restore drill
- `on-call-schedule.md` — current rotation
- `infrastructure-inventory.md` — what's running where, with credentials owners
- `cost-tracking-{YYYY-Q}.md` — quarterly cloud spend review

## Boundary
- *How we deploy* → here
- *What we deploy* → tickets in `Documents/Project/`
- *Why we deploy a particular way* → `Documents/Engineering/Architecture/ADR/`
- *Security implications of how we deploy* → `Documents/Security/`
