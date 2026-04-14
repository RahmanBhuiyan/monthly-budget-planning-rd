# QA — workspace

This folder holds **Quality Assurance** artifacts: testing strategy, the per-test checklist, and (in the future) exploratory test charters and bug-bash notes. Per-team *implementation* guides for tests live with the team that owns the code (`Documents/Engineering/Backend/TestingGuide.md`, `Documents/Engineering/Frontend/TestingGuide.md`).

## What's here today

| File | Purpose |
|------|---------|
| `TestingStrategy.md` | The *what* — pyramid targets, must-test list |
| `TestingChecklist.md` | The *tracker* — every test row-by-row with status |

## Suggested files (create as needed)
- `exploratory-charters.md` — session-based exploratory testing prompts ("for 60 min, focus on…")
- `bug-bash-{date}.md` — notes from each bug-bash session
- `test-coverage-{YYYY-Q}.md` — quarterly coverage snapshot
- `flaky-tests.md` — known-flaky tests with quarantine status

## Boundary
- *Cross-functional* test policy → here (`TestingStrategy.md`)
- *Backend-specific* test setup → `Engineering/Backend/TestingGuide.md`
- *Frontend-specific* test setup → `Engineering/Frontend/TestingGuide.md`
