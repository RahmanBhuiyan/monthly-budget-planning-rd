# Product Manager — workspace

This directory holds **product direction** artifacts: user personas, problem statements, feature priorities, roadmap, success metrics. Anything about *what* to build and *why*.

> Boundary: execution artifacts (sprints, status, risks) live in `../projectManager/`. Functional requirements live in `../SRS.md`. This folder is the upstream input that feeds those.

## Conventions
- Kebab-case filenames: `user-personas.md`, `roadmap-q3.md`, `metric-northstar.md`.
- Living documents (personas, roadmap, metrics) are updated in place.
- Decision records (one-time choices) use the format `decision-{YYYY-MM-DD}-{slug}.md`.

## Suggested files (create as needed)
| File | Purpose |
|------|---------|
| `user-personas.md` | Who we're building for; their goals, frustrations, context. |
| `problem-statement.md` | The core problem in one paragraph + supporting evidence. |
| `roadmap.md` | Quarter-by-quarter feature direction. |
| `metric-northstar.md` | The one metric that defines success; how it's measured. |
| `feature-priorities.md` | Ranked list of "next" — links into `../projectManager/ticket-inventory.md`. |
| `decision-{date}-{slug}.md` | One-off product decisions with context and tradeoffs. |

## Seed content (delete once real artifacts exist)

### Persona (placeholder)
**Solo earner tracking month-to-month spend.**
- Knows their monthly income but not where it goes.
- Logs expenses on mobile within 30 seconds of the transaction or not at all.
- Wants to be told "you're at 80%" before they overspend, not after.

### Problem statement (from `../ProjectOverview.md`)
People know their monthly income but don't track daily expenses. The result is overspending, loss of budget control, and unclear spending patterns. The Smart Expense & Budget Tracker addresses this by combining low-friction expense logging with category-level visibility and threshold alerts.

### Current roadmap (placeholder — confirm with stakeholder)
- **Now (prototype):** the 12 pages and 5 modules in `../SRS.md` §4.
- **v1 blockers:** all HIGH gaps in `../SRS.md` §6 — tests, savings_goal bug, secret hardening, port mismatch.
- **Next:** historical month selector, custom categories, CSV export.
- **Later:** receipt OCR, push notifications, multi-currency, dark mode (per `../ProjectOverview.md` §7 "Good-to-Have").

### North-star metric (placeholder)
**% of users who log at least one expense per day for 7 consecutive days.** Captures both adoption (logging at all) and habit formation (sustained use). Replace if the team picks something more measurable.
