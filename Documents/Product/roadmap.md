# Roadmap

> Living document. Quarterly horizon. Tickets referenced here live in `Documents/Project/ticket-inventory.md`. When priorities shift, edit in place — don't append revision history (use `git log`).

**Today:** prototype phase. Code works end-to-end on localhost; not yet shipped, no real users, no tests, ~13 known gaps catalogued in `Documents/Reference/SRS.md` §6.

---

## Phase 1 — v1 launch readiness (the must-fix list)

**Goal:** make the prototype safe to put in front of a real user with their real money. Nothing here is optional.

| Theme | Tickets | Why |
|-------|---------|-----|
| **Test baseline** | TEST-1, TEST-2 | Without tests, no `[BIZ-QC-NEEDED]` change can be verified. Everything else depends on this. |
| **Data integrity** | BUG-1 (`savings_goal` reset) | Silent data loss = trust-killer. Tag `[BIZ-QC-NEEDED]`. |
| **Secret hygiene** | BUG-2 (hardcoded fallbacks), BUG-4 (`debug=True`) | Either one alone is "do not deploy" material. |
| **Onboarding friction** | BUG-3 (port mismatch), FEAT-13 (`.env.example`) | If a new dev can't run the app in 10 minutes, the project dies on the second contributor. |
| **Input validation** | BUG-5 (date parse 500), BUG-6 (no email/password validation) | 500s erode trust in the API; weak passwords erode trust in the data. |
| **Schema management** | INFRA-1 (Flask-Migrate) | Required before any prod deploy — without it, a single column rename is a destructive event. |

**Phase 1 done = ready to ship to a closed beta of users you personally know.**

## Phase 2 — production hardening

**Goal:** ready for users you *don't* personally know. This is everything between "it works on my machine" and "it works for strangers in production."

| Theme | Tickets | Notes |
|-------|---------|-------|
| **Database migration** | FEAT-10 (SQLite → MySQL) | Requires INFRA-1 done. See `Documents/DevOps/MigrationPlan.md`. |
| **Configurable infra** | FEAT-3 (Axios base URL env), FEAT-4 (CORS env) | Can't deploy to a non-localhost domain without these. |
| **Auth surface hardening** | FEAT-8 (rate limiting), BUG-7 (timing attack) | Brute-force protection + email enumeration fix. |
| **Logging** | FEAT-12 (structured logging) | If a financial calculation goes wrong in production, you need a trail. |
| **UX gaps** | BUG-10 (key=index), BUG-11 (silent delete failure), FEAT-5 (global 401 interceptor), FEAT-6 (catch-all route) | Polish the rough edges users notice within five minutes. |
| **Precision** | BUG-8 (Numeric→float at boundary) | NFR-1 violation — fix as part of phase 2's "we mean it about money" pass. Tag `[BIZ-QC-NEEDED]`. |

## Phase 3 — useful

**Goal:** features users will actually ask for once they've used the v1 product for a month.

| Theme | Tickets | Notes |
|-------|---------|-------|
| **Historical views** | FEAT-1 (month/year selector) | Currently you can only see *this* month. Limit becomes obvious in week 5. |
| **Customization** | FEAT-11 (custom categories) | The 4 hardcoded categories don't fit everyone. Requires new table + migration. |
| **Pagination & scale** | FEAT-9 | When a power user has 5k expenses, the current "fetch all for the month" stops feeling instant. |
| **Accessibility** | BUG-12 (BottomNav semantic HTML) + a broader a11y pass | Not just compliance — keyboard nav makes power users faster. |

## Phase 4 — differentiators

Speculative. Don't build any of these without a user actually asking. Ordered by likely demand based on `Documents/Reference/ProjectOverview.md` §7.

| Feature | One-line case |
|---------|---------------|
| CSV / PDF export | "I want to give this to my accountant." |
| Smart reminders / push notifications | "I want to be told to log my coffee at 8 AM." |
| Receipt scanning (OCR) | "I want to point my camera at a receipt and have it logged." |
| Multi-currency | "I want to track expenses in two currencies on the same account." |
| Dark mode | "I want my eyes to not hurt at 11 PM." |
| Multi-user / shared accounts | "I want to share a budget with my partner." — biggest scope expansion of the lot |
| Mobile native app | Currently responsive web is enough. Revisit only if PWA isn't sufficient. |

## Architectural decisions still to be made

These don't fit in any phase but block planning if left unanswered. Park here until decided, then move into the relevant phase.

| Decision | Driver | Owner |
|----------|--------|-------|
| Move JWT from localStorage to httpOnly cookie? (FEAT-7) | XSS risk vs. API ergonomics | TBD — needs explicit decision-record in this folder |
| Compliance posture (GDPR? other?) | Where users live | TBD |
| Hosting target (single VPS? container? PaaS?) | Operational comfort | TBD |
| Backup cadence + retention | Production target | After hosting decided |

## Cadence and review

- Re-read this doc at the start of each sprint.
- Phase boundaries are not dates — they're predicates ("Phase 1 is done when…"). Don't promise dates here; promise them in `projectManager/sprint-{date}.md`.
- When a ticket moves status, update `projectManager/ticket-inventory.md` (the per-ticket source of truth), not this file.
- This doc is read by stakeholders — keep the language plain and the priorities defensible.
