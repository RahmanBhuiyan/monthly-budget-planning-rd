# Project Manager — workspace

This directory holds **project execution** artifacts: ticket inventory, sprint plans, status reports, risk register, retro notes. Anything about *how* and *when* the work gets done.

> Boundary: things about *what* to build and *why* live in `../productManager/`. Things about *how* the system works live in `../SRS.md` and the rest of `Documents/`.

## Conventions
- One file per artifact. Use kebab-case names: `sprint-2026-04.md`, `risk-register.md`, `retro-2026-04-30.md`.
- Date-stamped artifacts use `YYYY-MM-DD`.
- Status documents are living — update them in place, don't duplicate.

## Suggested files (create as needed)
| File | Purpose |
|------|---------|
| `ticket-inventory.md` | Open tickets, owners, status. Mirrored from issue tracker if one exists. |
| `sprint-{YYYY-MM}.md` | One per sprint: goals, scope, in/out, demo plan. |
| `risk-register.md` | Known risks with likelihood × impact and mitigation. |
| `retro-{YYYY-MM-DD}.md` | What worked, what didn't, what changes for next sprint. |
| `release-notes.md` | Public-facing changelog per release. |

## Status seed (delete once the real artifacts exist)
- **Phase:** prototype
- **Active branch focus:** `feature/audit-deep-read` (post-deep-read documentation pass)
- **Open known gaps:** see `../SRS.md` §6 (12 items, mix of HIGH/MED/LOW)
- **Top risks:**
  1. No tests — financial formulas are unverified (HIGH).
  2. `savings_goal` reset bug causes silent data loss (HIGH).
  3. Hardcoded dev secrets in `app.py` (HIGH if deployed as-is).
