# Code Community Standard

This document covers contribution norms, communication expectations, and the boundaries of acceptable behavior on the project. It is short on purpose — the team is currently 1 developer + Claude Code, and the rules will grow with the team.

## 1. Contribution flow
1. Pick or open a ticket. Every change is tied to a ticket id (see `GitWorkFlow.md` §2).
2. Branch off `master`. Never commit directly to `master`.
3. Read every file you'll touch and the models/services it imports (`CLAUDE.md` §1).
4. Make the change. Stay strictly within the ticket's scope (`CLAUDE.md` §5).
5. Run lint, format, and tests locally.
6. Open a PR with the template described in `GitWorkFlow.md` §6.
7. Address review comments; do not merge your own PR without an approving review.

## 2. Review expectations

### 2.1 As an author
- PRs ≤ ~400 lines of diff where possible. Bigger changes get split or get extra reviewer attention.
- Self-review the diff before requesting review.
- Tag `[BIZ-QC-NEEDED]` if you touched any of the protected business logic listed in `CLAUDE.md` §2.
- Respond to review comments within one working day. "I disagree" is a valid response — explain why.

### 2.2 As a reviewer
- Read the linked ticket first; verify the PR addresses what the ticket asks for and nothing else.
- For `[BIZ-QC-NEEDED]` PRs: re-derive each affected formula by hand and compare to `Documents/Reference/PROJECT_CONTEXT.md` §"Critical Business Logic".
- Distinguish blocking from non-blocking comments. Use prefixes:
  - `nit:` — style preference, not blocking
  - `q:` — question, may or may not block
  - `must:` — change required before merge
- Approve when blocking concerns are resolved, not when every nit is addressed.

## 3. Working with Claude Code
- Claude is a contributor, not an authority. Treat its output the same way you'd treat a junior engineer's PR — review it, push back on assumptions, and verify financial formulas by hand.
- Claude commits must include the `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` trailer.
- Claude must respect `CLAUDE.md` rules. If it appears to violate one, the PR gets `must:` comments before merge.
- Do not let Claude amend or force-push to shared branches without explicit operator approval.

## 4. Communication norms
- Asynchronous-first. Comments on the PR are the source of truth; chat decisions get summarized into the PR.
- Be specific. "This is wrong" is not a review comment; "this rounds the wrong direction on negative balances — see SRS §6.5" is.
- Default to writing things down. If a decision affects future work, capture it in the relevant `Documents/` file or a memory note.
- English for all code, comments, commit messages, and documentation.

## 5. Disagreements
- Technical disagreement: discuss on the PR. If it's still unresolved after one round, escalate to a sync conversation; capture the outcome back in the PR description.
- Process disagreement (a `CLAUDE.md` rule feels wrong for the situation): open a separate PR proposing the rule change. Don't bypass the rule on the side.
- Business logic disagreement: stop and ask the user. `CLAUDE.md` §8 — wrong guess on financial calculations costs more than delay.

## 6. Code of conduct
- Be respectful. Critique the code, not the author.
- No personal attacks, harassment, discrimination, or sexualized content in any project artifact (commits, PRs, issues, comments, docs).
- Confidentiality: do not share user data, credentials, or internal financial calculations outside the project.
- Violations are handled by the project owner. Repeated violations result in revoked write access.

## 7. Onboarding checklist for new contributors
1. Read `CLAUDE.md`, `GEMINI.md`, and `Documents/Reference/PROJECT_CONTEXT.md` end-to-end.
2. Read `Documents/Reference/SRS.md` for what the system does today and what it must do.
3. Read `Documents/Process/CodeStandardAndGuide.md` for style.
4. Read this file (`CodeCommunityStandard.md`) and `Documents/Process/GitWorkFlow.md`.
5. Skim `Documents/Reference/TechnologyStack.md` for exact versions.
6. Run the project locally (see project root `README.md`) and confirm the dashboard renders.
7. Pick a `bugfix/` ticket from `Documents/Reference/SRS.md` §6 ("Known Gaps") for the first PR.
