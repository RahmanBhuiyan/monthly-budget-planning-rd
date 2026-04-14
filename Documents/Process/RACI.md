# RACI Matrix

> Who is **R**esponsible (does the work), **A**ccountable (single owner, signs off), **C**onsulted (gives input before), **I**nformed (told after) for each cross-functional workflow.
>
> Today the team is one developer + Claude Code. Most rows show one human in multiple cells — that's the truthful state. As the team grows, the *structure* of the table is what matters; the *names* in cells will change.

## Roles

| Code | Role | Today's owner |
|------|------|---------------|
| PM-PD | Product Manager | (single dev — wears this hat) |
| PM-PJ | Project Manager | (single dev) |
| TL | Tech Lead / Architect | (single dev) |
| BE | Backend engineer | (single dev) |
| FE | Frontend engineer | (single dev) |
| QA | Quality Assurance | (single dev) |
| DO | DevOps / SRE | (single dev) |
| SEC | Security | (single dev) |
| UX | Design / UX | — (not yet on the team) |
| AI | Claude Code (collaborator) | — |

## Workflows

### W1 — A new feature ticket
| Step | PM-PD | PM-PJ | TL | BE | FE | QA | DO | SEC | UX |
|------|-------|-------|----|----|----|----|----|-----|----|
| Define the user need | **A R** | I | C | I | I | I | I | I | C |
| Acceptance criteria + DoR | A | R | C | I | I | C | — | — | C |
| Technical design | C | I | **A R** | C | C | C | I | C | I |
| Implementation | I | I | C | **A R**¹ | **A R**¹ | I | I | I | C |
| Tests written | I | I | C | R | R | **A** | — | — | — |
| Code review | I | I | C | R | R | R | — | C | — |
| Deploy | I | I | I | R | R | R | **A** | I | — |
| Verify in prod | I | I | I | C | C | **A R** | C | I | — |

¹ BE accountable for backend portion, FE for frontend portion. If a ticket spans both, both are accountable for their slice.

### W2 — A bug fix
| Step | PM-PJ | TL | BE/FE | QA | DO |
|------|-------|----|----|----|----|
| Triage + severity | **A R** | C | C | C | I |
| Assign to branch | R | I | **A** | I | — |
| Fix + add regression test | I | C | **A R** | C | — |
| Verify fix | I | I | R | **A** | — |
| Deploy | I | I | R | C | **A** |

### W3 — A `[BIZ-QC-NEEDED]` change
Per `CLAUDE.md §2` — anything touching the 6 protected financial formulas.

| Step | PM-PD | TL | BE | QA | SEC |
|------|-------|----|----|----|-----|
| Propose change | C | **A R** | R | I | I |
| Sign off on the formula | **A** | R | C | C | I |
| Implementation + tests | I | C | **A R** | R | I |
| Code review (BIZ-QC) | C | **A** | R | R | I |
| Manual QA against the protected formula list | I | C | C | **A R** | I |

The PM-PD has accountability for sign-off because the formulas express product behavior. Tech leads can veto on technical grounds; only the product owner can change *what the formula says*.

### W4 — Production incident
Driven by `Documents/Security/IncidentResponse.md`.

| Step | DO | SEC | TL | BE/FE | PM-PD |
|------|----|----|----|----|-------|
| Page / detect | **A R** | C | I | I | I |
| Stabilize (rollback / mitigate) | **A R** | C | C | R | I |
| Root cause | C | C | **A R** | R | I |
| User communication | I | C | I | I | **A R** |
| Post-mortem | R | C | R | C | **A** |

### W5 — Adding a new dependency (npm or pip)
| Step | TL | BE/FE | SEC | DO |
|------|----|----|-----|----|
| Propose | I | **A R** | C | I |
| License + CVE check | C | R | **A** | I |
| Approve | **A** | C | R | I |
| Update lockfile + commit | I | **A R** | I | C |

### W6 — Schema change
| Step | TL | BE | DO | QA |
|------|----|----|----|----|
| Propose schema diff | C | **A R** | C | I |
| Migration written + tested | C | **A R** | C | R |
| Migration applied to staging | I | C | **A R** | R |
| Migration applied to prod | I | C | **A R** | C |
| Rollback plan documented | C | R | **A** | C |

### W7 — Release
| Step | PM-PJ | TL | BE/FE | QA | DO |
|------|-------|----|----|----|----|
| Cut release branch | R | C | C | I | **A** |
| Smoke tests pass | I | I | C | **A R** | C |
| Approve release | **A** | C | C | R | C |
| Deploy | I | I | C | C | **A R** |
| Release notes | **A R** | C | C | C | C |

## Conventions

- **Exactly one A per row.** If two roles share accountability, the workflow is wrong — split it.
- **A is also R unless explicitly delegated.** Most rows above show one cell as `A R`.
- **C means *before* the decision.** I means *after*. If you find yourself "informing" someone whose objection would change the decision, they should be C, not I.
- **Empty cell = not involved.** Don't fill cells just to feel inclusive.
- A role that's not on the team yet (`UX` today) still appears as a column so the structure is forward-compatible.

## How to use this with Claude Code

When Claude proposes a change, the relevant row's `A` is the human who must approve before merge. Claude itself never holds `A` — it can be `R` (does the work) or `C` (consulted on style/patterns), but accountability stays human.
