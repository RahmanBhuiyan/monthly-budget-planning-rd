# Claude Skills — Smart Expense & Budget Tracker

Project-local skills, one folder per skill, each with a `SKILL.md` describing what it does. Layout follows [fotoflo/claude-skills](https://github.com/fotoflo/claude-skills/tree/main).

Three categories:

## End-of-session and shipping
| Skill | Purpose |
|-------|---------|
| [`done`](./done/SKILL.md) | Comprehensive session wrap-up: doc updates, lint, tests, ticket status, productivity report, commit. Aligned with `Documents/Process/DefinitionOfDone.md`. |
| [`commit`](./commit/SKILL.md) | Stage selectively + build conventional commit per `Documents/Process/GitWorkFlow.md`. Auto-detects `[BIZ-QC-NEEDED]` based on touched files. |
| [`check-ready`](./check-ready/SKILL.md) | Walk `Documents/Process/DefinitionOfReady.md` against a ticket. Reports READY or NOT READY with specific gaps. |
| [`check-done`](./check-done/SKILL.md) | Walk `Documents/Process/DefinitionOfDone.md` against the current branch. Faster than `done` — read-only check, no execution. |
| [`release-preflight`](./release-preflight/SKILL.md) | Walk `Documents/DevOps/ReleaseRunbook.md` pre-flight checklist before cutting a release. |

## Documentation
| Skill | Purpose |
|-------|---------|
| [`arch-doc`](./arch-doc/SKILL.md) | Create or update an architecture doc / ADR following the project's existing structure under `Documents/Engineering/Architecture/`. |
| [`update-docs`](./update-docs/SKILL.md) | Read recent code changes and resync the affected docs. Documents the *current* state, not history. |

## Code quality
| Skill | Purpose |
|-------|---------|
| [`lint-fix`](./lint-fix/SKILL.md) | Run flake8/black on backend and ESLint on frontend. Scoped to files in the current diff only — no speculative refactors (CLAUDE.md Rule 5). |

## Reporting
| Skill | Purpose |
|-------|---------|
| [`weekly`](./weekly/SKILL.md) | Generate a weekly summary of commits — categorized highlights, statistics, draft standup/founder-update copy. Useful for sprint retros. |

## Display
| Skill | Purpose |
|-------|---------|
| [`statusline-setup`](./statusline-setup/SKILL.md) | Two-row Claude Code statusline with project-specific signals: protected-branch warning, ticket id, `[BIZ-QC]` indicator. |

---

## Skills vs slash commands vs subagents

This project uses three Claude Code primitives. Each lives in a different folder:

| Primitive | Location | Invocation | Use for |
|-----------|----------|------------|---------|
| **Skill** | `.claude/skills/<name>/SKILL.md` | `Skill` tool, or auto-trigger | Procedural workflows that span multiple steps |
| **Subagent** | `.claude/agents/<name>.md` | `Agent` tool with `subagent_type` | Specialized review / focused investigations |
| **Hook** | `.claude/hooks/*.{py,sh}` | Auto-triggered by harness events | Hard enforcement (block, modify, log) |

Skills here are the **how**. Subagents are the **specialized reviewer**. Hooks are the **mechanical guards**.

## Subagents

Live in `../agents/`:
- [`biz-qc-reviewer`](../agents/biz-qc-reviewer.md) — re-derives the 6 protected formulas from `Documents/Reference/PROJECT_CONTEXT.md` and verifies any diff touching protected files.
- [`scope-checker`](../agents/scope-checker.md) — compares the branch diff against the ticket's declared scope, flags drift (CLAUDE.md Rules 5 & 6).

## Hooks

Live in `../hooks/`:
- `check-branch.py` — refuses `git commit` on `master` or `main` (CLAUDE.md Rule 3 hard guard).

## Skill conventions (this project)

- Each skill is a folder named in kebab-case (`arch-doc`, not `arch_doc` or `archDoc`).
- Each folder contains a `SKILL.md` with frontmatter (`description`, `allowed-tools`, `argument-hint`).
- Supporting files (scripts, templates) live next to the SKILL.md in the same folder.
- The skill's *behavior* is described in prose in SKILL.md; the harness binds it.
- Skills should be read by a human first to understand what they do — they're documentation as much as configuration.

## Adding a new skill

1. `mkdir .claude/skills/<name>/`
2. `touch .claude/skills/<name>/SKILL.md` with frontmatter:
   ```yaml
   ---
   description: One sentence explaining when to use this skill.
   allowed-tools: Bash, Read, Edit
   argument-hint: "<arg>   e.g. /name foo"   # optional
   ---
   ```
3. Write the procedure in markdown.
4. Add a row to the table in this README.
5. Test it by invoking with the `Skill` tool.
