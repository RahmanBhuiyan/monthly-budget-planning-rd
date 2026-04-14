# Definition of Ready

> A ticket is **Ready** when an engineer can pick it up and start coding without going back to ask "what do you mean by X?". This is the contract from Product/PM → Engineering. Hand-off is not just dropping a ticket in a backlog.
>
> Companion to `Documents/Process/DefinitionOfDone.md` (the contract from Engineering → QA → Release).

## Universal checklist (all tickets)

A ticket is **Ready** when ALL of these are true. If any is missing, the ticket goes back to the requester.

- [ ] **Title** is a short imperative sentence ("Add CSV export to summary page", not "Export").
- [ ] **Type** assigned: `feature` / `bug` / `chore` / `refactor` / `docs`.
- [ ] **Severity** assigned: `HIGH` / `MED` / `LOW`. (Severity ≠ priority; severity is impact, priority is order.)
- [ ] **Acceptance criteria** written as testable bullets ("when X, then Y"), not as a vague description.
- [ ] **Out-of-scope** explicitly listed if there's any ambiguity ("not changing the alert thresholds in this ticket").
- [ ] **Owner** assigned (one person, accountable per `Documents/Process/RACI.md`).
- [ ] **Branch name** decided per `Documents/Process/GitWorkFlow.md` §2.
- [ ] **Effort estimate**: T-shirt size (S / M / L / XL). XL must be split before it's Ready.
- [ ] No unanswered questions in the ticket comments.

## Plus, by ticket type

### Feature ticket
- [ ] **User story** in "As a [role], I want [thing], so that [outcome]" form.
- [ ] **Mockup or wireframe link** if there's any UI surface (today: link to `Documents/Design/` — TBD).
- [ ] **API contract** drafted if a new endpoint or response shape is involved (update `Documents/Reference/ApiReference.md` in the same PR or in a precursor).
- [ ] **DB schema impact** noted if any (must come with a migration plan — see `Documents/DevOps/MigrationPlan.md`).
- [ ] If user-facing: **copy** is finalized (button labels, error messages). No "TBD" copy lands in production.

### Bug ticket
- [ ] **Steps to reproduce**: numbered, deterministic.
- [ ] **Expected** vs **Actual** behavior, both written down.
- [ ] **Source reference**: file:line where the bug lives, if known.
- [ ] **Regression test** plan: which test will pin this bug (if a `🐛` row exists in `Documents/QA/TestingChecklist.md`, link to it).
- [ ] **Severity rationale**: why HIGH/MED/LOW (data loss? UX papercut? security?).

### `[BIZ-QC-NEEDED]` ticket (anything touching protected business logic — `CLAUDE.md §2`)
On top of the feature/bug checklist:
- [ ] **Product owner sign-off** on the formula change (per `RACI.md` W3).
- [ ] **Before/after** of the formula written into the ticket body.
- [ ] **Test coverage** plan: which tests in `Documents/QA/TestingChecklist.md` are affected (U-01..U-20 for the protected formulas).
- [ ] **Reviewer assigned** in advance (the `[BIZ-QC-NEEDED]` reviewer cannot be the author).

### Chore / refactor ticket
- [ ] **Justification**: why now? What's the cost of waiting?
- [ ] **Scope boundary**: a refactor with no boundary becomes a rewrite — write it down.
- [ ] **Behavior is preserved** is an explicit assertion. If behavior changes, this is not a refactor — re-classify.

### Docs ticket
- [ ] **Reader** identified ("written for a new contributor on day 1" / "for the on-call DevOps engineer").
- [ ] **Where it lives** decided (which folder per the SDLC layout).

## Anti-patterns

These look Ready but aren't:

- "Improve the dashboard" — not testable; reject until criteria are written.
- "Same as #123 but for budgets" — link rot waiting to happen; copy the actual criteria.
- "Estimate: TBD" — XL until proven otherwise; an unestimated ticket blocks sprint planning.
- "Discuss with [person] first" — that person hasn't been C-consulted yet; not Ready.

## Workflow

1. Author drafts the ticket in `Documents/Project/ticket-inventory.md` with `Status: OPEN` and as many fields as they can.
2. Author runs the checklist above. Anything missing → fix or annotate why it's intentionally absent.
3. Author requests Ready-review from the relevant `A` per `RACI.md`.
4. The accountable role marks it Ready (or returns it with a list of gaps).
5. Engineer pulls a Ready ticket, branches per `GitWorkFlow.md`, marks it `Status: IN PROGRESS`.

## Rejection language (use this, not "no")

When sending a ticket back as Not Ready, use: **"Not Ready because: [specific gap]. To make Ready: [specific action]."** "Not Ready" without a remediation path is just a complaint.
