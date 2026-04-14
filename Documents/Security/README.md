# Security — workspace

This folder holds **security and compliance** artifacts: threat model, incident response, compliance posture. The discipline that says "no" until proven otherwise.

## What's here today

| File | Purpose |
|------|---------|
| `SecurityAndThreatModel.md` | STRIDE-light per surface, weakness catalog |
| `IncidentResponse.md` | Procedure for production incidents |
| `Compliance.md` | Compliance posture (today: none claimed) |

## Suggested files (create as needed)
- `dependency-audit-{YYYY-Q}.md` — quarterly review of npm/pip CVEs
- `pen-test-{YYYY-MM-DD}.md` — pen-test reports if/when commissioned
- `breach-postmortem-{date}.md` — incident-specific reports (template lives in `IncidentResponse.md`)
- `vendor-list.md` — third-party services with data access + their DPAs

## Boundary
- *Security architecture & threats* → `SecurityAndThreatModel.md`
- *What to do when something breaks* → `IncidentResponse.md`
- *What we promise users about their data* → `Compliance.md`
- *Code-level security standards* (no eval, no innerHTML) → `Documents/Process/CodeStandardAndGuide.md` §3.5
