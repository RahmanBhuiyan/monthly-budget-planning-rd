# Service Level Objectives (SLOs)

> What "working" means, expressed as measurable targets. These are the contract from DevOps → Product on user-facing reliability.
>
> **Today there is no production deployment** — these SLOs are *targets for v1*, not measurements of current behavior. Once observability exists (`Documents/Project/ticket-inventory.md` FEAT-12), populate the actual numbers.

## Why SLOs matter

Without an SLO, every incident is "the site is broken." With an SLO:
- Engineering knows when to drop everything for an incident vs. when to file a normal bug ticket.
- Product knows the cost of accepting a feature that risks reliability.
- DevOps has a target to design backups, monitoring, and capacity around.

## Service indicators

| Indicator | What it measures | How |
|-----------|------------------|-----|
| **API availability** | % of `/api/v1/*` requests that return 2xx or 4xx (5xx counts against) | Reverse proxy access logs |
| **API latency p50 / p95** | request duration from the user's perspective | Same logs, percentile aggregation |
| **Frontend availability** | static asset 200s | Same logs |
| **Auth success rate** | % of valid `POST /auth/login` that succeed | App logs (post-FEAT-12) |
| **Background job success** | % of scheduled jobs that complete (none today) | TBD |

## v1 SLO targets

| SLO | Target | Rationale |
|-----|--------|-----------|
| API availability | ≥ 99.5% over a rolling 30-day window | Single-region prototype; one nine of the "four nines" is the realistic ceiling |
| API latency p95 | ≤ 500 ms for read endpoints, ≤ 1000 ms for writes | Money math is fast; the slowest piece is JWT verification + ORM round-trip |
| Frontend availability | ≥ 99.9% | Static assets behind nginx — should be near-perfect |
| Auth success rate | ≥ 95% (excluding genuine bad-credential rejections) | Anything below this means infra is failing logins |
| Time-to-detect critical incident | ≤ 10 minutes | Bound by alerting cadence, not by checking dashboards |
| Time-to-mitigate critical incident | ≤ 60 minutes | Rollback per `Documents/DevOps/ReleaseRunbook.md` "Option A" |

**99.5% availability = ~3.6 hours of downtime per month.** That's the error budget.

## Error budget policy

If the API drops below 99.5% over the rolling 30-day window:
1. **Non-essential feature work pauses.** All Engineering effort goes into reliability tickets (`bugfix/` and `hotfix/`).
2. **Releases are blocked** until availability returns above 99.5%.
3. A **post-mortem** is required for the incident(s) that consumed the budget.

If availability is comfortably above 99.5% (say, 99.8%+):
- Ship more aggressively. The error budget exists *to be spent* — not spending it is leaving improvements on the table.

## Severity tiers (used by `Documents/Security/IncidentResponse.md`)

| Tier | Definition | Response time |
|------|------------|---------------|
| **SEV-1** | Site is down OR data integrity at risk OR active security breach | Page on-call immediately; mitigate within 60 min |
| **SEV-2** | Significant feature broken for many users; no data integrity issue | Page during business hours; fix within 1 business day |
| **SEV-3** | Bug affecting some users; workaround exists | File ticket, normal priority |
| **SEV-4** | Cosmetic, papercut | File ticket, scheduled work |

## What we deliberately do NOT track (yet)

- **Mean time to recovery (MTTR)** — too few incidents to be statistically meaningful at v1 scale.
- **Apdex** — useful but redundant with p95 latency for our request mix.
- **Customer-reported incident count** — no support channel formalized yet.

Add these once we have ≥6 months of production data.

## Measurement plan

| Source | How collected | Where stored |
|--------|---------------|--------------|
| nginx access logs | tail + structured parse | TBD (file rotation today; ship to log aggregator post-FEAT-12) |
| Flask app logs | `app.logger` | TBD — see `Documents/Security/SecurityAndThreatModel.md` §7 |
| DB slow query log | MySQL slow log when available | TBD |
| Synthetic uptime check | Cron job hitting `/api/v1/auth/login` with bad credentials, expecting 400 | TBD |

## Review cadence

- **Monthly:** review the previous 30-day SLO report. Adjust targets if reality has diverged predictably (either tightening or loosening).
- **After each SEV-1/SEV-2 incident:** re-evaluate whether the target was appropriate.
- **At each release:** if the release introduces a slow path, update the latency SLO with the new expectation.

## Open questions for v1

- Do we publish SLOs externally? (Not required at this scale; defer.)
- Do we have a status page? (Probably yes once we have non-friend users; statuspage.io or self-hosted Cachet.)
- Who's the on-call? (See `IncidentResponse.md` rotation — currently undefined.)
