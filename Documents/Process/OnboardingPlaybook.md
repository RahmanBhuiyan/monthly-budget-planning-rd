# Onboarding Playbook

> Day 1 to Month 1 for a new contributor. The goal is "first useful PR by end of week 1, comfortable in the codebase by end of month 1." Read this once on day 1; refer back as needed.

## Day 1 — orient

**Morning (read, do not code):**
- [ ] `CLAUDE.md` (project root) — the 8 rules. These are not suggestions.
- [ ] `Documents/Reference/PROJECT_CONTEXT.md` — what we're building, in 5 minutes.
- [ ] `Documents/Reference/ProjectOverview.md` — why we're building it.
- [ ] `Documents/Reference/TechnologyStack.md` — exact versions.
- [ ] `Documents/Process/CodeCommunityStandard.md` — how we work together.

**Afternoon (set up, then run):**
- [ ] `Documents/DevOps/SetupAndDeployment.md` — clone, install, run locally.
- [ ] Confirm: backend on `http://localhost:7576`, frontend on `http://localhost:7575`. **Note port 7575**, not 3000 (`SetupAndDeployment.md` §3).
- [ ] Sign up, set income, set budget, add an expense, view the dashboard. End-to-end.
- [ ] Skim `Documents/Reference/SRS.md` §6 to know what's broken vs intentional.

**End of day 1 you should be able to answer:**
- What does this app do, in one sentence?
- Why is the frontend on port 7575 specifically?
- What are the 4 expense categories?
- Which file has the protected business logic formulas?

## Week 1 — build

**Day 2 — depth in your area**

If you're **Backend**:
- [ ] `Documents/Engineering/Backend/Architecture.md`
- [ ] `Documents/Engineering/Backend/RoutesGuide.md`
- [ ] `Documents/Engineering/Backend/ModelsGuide.md`
- [ ] `Documents/Reference/DatabaseDesign.md`
- [ ] `Documents/Reference/ApiReference.md`

If you're **Frontend**:
- [ ] `Documents/Engineering/Frontend/Architecture.md`
- [ ] `Documents/Engineering/Frontend/PagesGuide.md`
- [ ] `Documents/Engineering/Frontend/ComponentsGuide.md`
- [ ] `Documents/Engineering/Frontend/StylingGuide.md`
- [ ] `Documents/Reference/ApiReference.md` (you consume it)

If you're **QA**:
- [ ] `Documents/QA/TestingStrategy.md`
- [ ] `Documents/QA/TestingChecklist.md`
- [ ] Both `Engineering/Backend/TestingGuide.md` and `Engineering/Frontend/TestingGuide.md`

If you're **DevOps**:
- [ ] `Documents/DevOps/SetupAndDeployment.md`
- [ ] `Documents/DevOps/MigrationPlan.md`
- [ ] `Documents/DevOps/ReleaseRunbook.md`
- [ ] `Documents/DevOps/SLOs.md`
- [ ] `Documents/Security/SecurityAndThreatModel.md`
- [ ] `Documents/Security/IncidentResponse.md`

If you're **Product/Design**:
- [ ] `Documents/Product/roadmap.md`
- [ ] `Documents/Reference/ProjectOverview.md`
- [ ] `docs/app-flow.svg` and `docs/mobile-flow.svg`
- [ ] `Documents/Design/` (TBD — currently a placeholder workspace)

**Day 3 — process**
- [ ] `Documents/Process/GitWorkFlow.md` — branches, commits, `[BIZ-QC-NEEDED]`.
- [ ] `Documents/Process/DefinitionOfReady.md` and `DefinitionOfDone.md` — when work starts and ends.
- [ ] `Documents/Process/CodeStandardAndGuide.md` — coding conventions.
- [ ] `Documents/Process/RACI.md` — who's accountable for what.

**Day 4 — first PR**
- [ ] Pick a `LOW` severity ticket from `Documents/Project/ticket-inventory.md` (good first issues: BUG-9 categories ORDER BY, BUG-10 key={i}, FEAT-13 .env.example).
- [ ] Branch per `GitWorkFlow.md`.
- [ ] Implement, write the test, update affected docs.
- [ ] Open the PR using the template; tag a reviewer.
- [ ] Address review; merge.

**Day 5 — read what others did**
- [ ] `git log --oneline -20` and read each commit message.
- [ ] Pick one commit you don't fully understand and read the diff. Ask questions in chat.

## Month 1 — own

By end of month 1 you should have:
- [ ] Closed at least 3 tickets across different severity levels.
- [ ] Made at least one PR that touched a `[BIZ-QC-NEEDED]` formula (with the proper review).
- [ ] Updated at least one doc as a side effect of code work (drift catch).
- [ ] Reviewed at least one other PR using the criteria from `CodeCommunityStandard.md` §2.2.
- [ ] Identified one process improvement and either fixed it or filed a `chore/` ticket for it.

## Working with Claude Code

Claude is on the team. Treat it as a junior contributor:
- Claude commits include the `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` trailer.
- Review Claude's PRs to the same standard as a human's.
- Claude **never holds Accountability** in `RACI.md` — a human always signs off, especially on `[BIZ-QC-NEEDED]` work.
- When delegating to Claude, write the prompt with the same care as a ticket body. "Improve the dashboard" is no more useful for Claude than for a human (`DefinitionOfReady.md`).

## Common newbie mistakes (avoid these)

| Mistake | Why it bites you |
|---------|------------------|
| Committing directly to `master` | `CLAUDE.md §3` violation; PR gets reverted |
| Bundling "while I was here" cleanups into a feature PR | `CLAUDE.md §5` violation; reviewer asks you to split |
| Running frontend on port 3000 ("npm start" works fine!") | CORS errors on every API call; `SetupAndDeployment.md` §3 |
| Calling `to_dict().amount` arithmetic in tests | It's `float` (precision leak `SRS §6.5`); you'll get flaky comparisons |
| Forgetting `[BIZ-QC-NEEDED]` on a budget calc fix | PR blocked at review; redo the commit |
| Updating docs in a "follow-up PR" | Drift; `DefinitionOfDone.md` requires it in the same PR |
| Adding a new npm/pip dependency without RACI W5 | License + CVE issues land later |

## Mentorship

For the first month, every PR you open requests review from the person who onboarded you (in addition to the normal reviewer). This catches process drift early. After month 1, drop to normal reviewer assignment.

## Feedback loop

At end of week 1 and end of month 1, write a one-paragraph note in `Documents/Project/onboarding-feedback.md` (create it if missing): what was confusing, what was missing, what would have saved you time. The next person to onboard reads your notes — pay it forward.
