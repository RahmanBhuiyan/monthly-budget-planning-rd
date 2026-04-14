# Engineering Architecture — workspace

This folder holds **architectural artifacts**: the system view, decision records, and any cross-stack diagrams. Per-stack details (Backend or Frontend internals) live in `../Backend/` and `../Frontend/` respectively.

## What's here today

| File / folder | Purpose |
|---------------|---------|
| `ADR/` | Architecture Decision Records — one file per significant choice |

## Suggested files (create as needed)
- `system-overview.md` — single-page rendering of the whole system (FE ↔ BE ↔ DB ↔ external)
- `data-flow.md` — how a single user action propagates through the stack
- `tech-radar.md` — current vs. wanted vs. avoided technologies
- `boundaries.md` — what's deliberately *not* in the system (anti-features)

## ADRs — what and why
An **Architecture Decision Record** captures *one* decision: the context that forced it, the choice we made, the alternatives considered, and the consequences.

ADRs are **immutable**. If a decision is reversed, write a new ADR that supersedes the old one — never edit an accepted ADR. The history is the value.

Status values:
- **Proposed** — drafted, not yet accepted
- **Accepted** — current state
- **Deprecated** — no longer the recommended choice but still in effect
- **Superseded by ADR-NNNN** — replaced; the new ADR explains why

## File naming
`NNNN-short-slug.md` where NNNN is a zero-padded sequence (`0001`, `0002`, …). Use `ADR/0000-template.md` as the starting point.

## When to write an ADR
Write one when:
- The decision will outlive the current contributor's involvement.
- A future reader would reasonably ask "why did we do it this way?"
- The decision was a real choice (multiple viable options were considered).
- Reversing the decision later would be costly.

Don't write one for:
- Trivial style choices ("we use 4-space indents") — that's `Process/CodeStandardAndGuide.md`.
- Self-evident decisions ("we use Flask because the SRS says Flask") — circular.
- Implementation details that change every quarter — too volatile.

## Boundary
- *Why we made a choice* → ADR
- *How we implement it* → relevant guide under `Engineering/Backend/` or `Engineering/Frontend/`
- *What we'd do differently* → new ADR that supersedes the old one
