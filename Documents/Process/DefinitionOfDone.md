# Definition of Done

> A ticket is **Done** when the work can ship without anyone needing to come back to it. This is the contract from Engineering → QA → Release. "Code merged" is *not* Done.
>
> Companion to `Documents/Process/DefinitionOfReady.md` (PM → Eng contract).

## Universal checklist (all merged work)

A ticket is **Done** when ALL of these are true:

- [ ] **Code merged to `master`** via PR with at least one approving review.
- [ ] **All acceptance criteria** from the ticket pass (manually verified or by automated test).
- [ ] **Tests added or updated**: at minimum, one regression test for any bug; new code paths covered to the targets in `Documents/QA/TestingStrategy.md` §1.
- [ ] **Test suite green** — `pytest` and `npm test` both pass on the merge commit. (Once tests exist; today this is aspirational — see `Documents/Project/ticket-inventory.md` TEST-1, TEST-2.)
- [ ] **Lint clean** — no new flake8/eslint warnings introduced.
- [ ] **Docs updated** — every doc affected by the change is current. Common updates:
    - `Documents/Reference/SRS.md` if behavior changed
    - `Documents/Reference/ApiReference.md` if endpoint contract changed
    - `Documents/Reference/DatabaseDesign.md` if schema changed
    - `Documents/Project/ticket-inventory.md` status flipped to `DONE`
    - `Documents/QA/TestingChecklist.md` row checked off
    - Per-team guides under `Engineering/Backend/` or `Engineering/Frontend/` if implementation patterns changed
- [ ] **Commit message** follows `Documents/Process/GitWorkFlow.md` §4 format. Includes `[BIZ-QC-NEEDED]` if applicable.
- [ ] **Branch deleted** after merge.
- [ ] **No `// TODO` or `# FIXME`** added without an accompanying ticket id.
- [ ] **No new dependency** without going through `Documents/Process/RACI.md` W5.
- [ ] **Secrets / credentials** not in source — `.env` updates documented in `Documents/DevOps/SetupAndDeployment.md`.

## Plus, by ticket type

### Feature ticket
- [ ] **End-to-end manual test** of the user story (the "As a … I want … so that …") completed and noted in the PR description.
- [ ] **UI copy** matches the agreed text (no "TBD" labels in production).
- [ ] **Accessibility check** — keyboard nav works, screen reader announces interactive elements (per `Documents/Engineering/Frontend/StylingGuide.md` §9).
- [ ] **Responsive** — verified on mobile (≤480px) and desktop (≥768px) breakpoints.
- [ ] **Error states** designed and implemented (loading, empty, error — not just the happy path).
- [ ] **Analytics / logging** added if the feature is non-trivial (see `Documents/Security/SecurityAndThreatModel.md` §7).

### Bug ticket
- [ ] **Root cause** described in the PR body, not just the symptom.
- [ ] **Regression test** added — and that test demonstrably failed against the unfixed code (verified with `git stash` or by writing the test first).
- [ ] **Bug ID** marked `DONE` in `Documents/Project/ticket-inventory.md`.
- [ ] **`SRS.md` §6 entry** removed or updated if the bug was listed there.
- [ ] **Related bugs scanned** — was this an instance of a class of issue? If yes, file new tickets.

### `[BIZ-QC-NEEDED]` ticket
On top of the feature/bug checklist:
- [ ] **Reviewer hand-derived** the affected formula and confirmed the new behavior against the table in `Documents/Reference/PROJECT_CONTEXT.md` §"Critical Business Logic".
- [ ] **Test marked `@pytest.mark.protected`** if it covers one of the 6 formulas (`Documents/Engineering/Backend/TestingGuide.md` §10).
- [ ] **Product owner sign-off** captured in the PR (text or approval).

### Schema-change ticket
- [ ] **Migration written**, named, and applied locally (per `Documents/DevOps/MigrationPlan.md` §"Step 1").
- [ ] **Migration is reversible** (or rollback procedure documented in PR body).
- [ ] **`Documents/Reference/DatabaseDesign.md`** updated to reflect new tables/columns/indexes.
- [ ] **Type-check on MySQL** done if migrating prod (per `MigrationPlan.md` §3).

### Refactor ticket
- [ ] **No behavior change** verified by tests passing without modification.
- [ ] **Diff stays inside the declared scope** — anything outside it is reverted or split into a follow-up ticket.
- [ ] **No new APIs** introduced. (Refactors don't add features.)

### Release ticket
- [ ] **Smoke test** per `Documents/DevOps/ReleaseRunbook.md` passed.
- [ ] **Release notes** written and added to `Documents/Project/release-notes.md`.
- [ ] **Roll-back plan** verified (you've actually run the rollback steps in staging).
- [ ] **On-call notified** (`Documents/Security/IncidentResponse.md` rotation).

## Negative criteria — Done is NOT:
- "It works on my machine."
- "Tests pass except for these unrelated ones I'll fix later."
- "I'll update the docs in a follow-up PR."
- "It compiles."
- "The PR is approved" (approval ≠ merged ≠ verified ≠ Done).

## Workflow

1. Engineer self-checks against this list before opening review.
2. Reviewer ticks the checklist as part of review (uses `must:` for missing items per `Documents/Process/CodeCommunityStandard.md` §2.2).
3. After merge, the engineer flips the ticket status to `DONE` in `Documents/Project/ticket-inventory.md` and updates `Documents/QA/TestingChecklist.md` if applicable.
4. The ticket stays in `DONE` for one sprint (so retros can reference it), then is removed.

## Why the bar is high
A loose Definition of Done leaks work into the future. Every "I'll do it later" becomes someone else's surprise. The cost of being strict here is paid by the author once; the cost of being loose is paid by every future contributor forever.
