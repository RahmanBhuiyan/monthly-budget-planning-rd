---
adr: 0000
title: ADR Template
status: Template
date: YYYY-MM-DD
deciders: [name1, name2]
---

# ADR 0000: ADR Template

> Copy this file as `NNNN-short-slug.md` for each new decision. Fill in every section. Delete this admonition after copying.

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-NNNN

## Context
What is the problem we are trying to solve? What are the forces at play (technical, business, team)? Be specific — vague context produces vague decisions.

State what we know AND what we don't know. If a key fact is uncertain, name it.

## Decision
The choice we made, in one or two sentences. Direct, unambiguous.

## Alternatives considered
At least two. For each: what it is, why it was tempting, why we didn't pick it.

| Option | Pros | Cons | Why not |
|--------|------|------|---------|
| Option A | … | … | … |
| Option B | … | … | … |

If only one option was considered, this isn't really a decision — don't write the ADR.

## Consequences
- **Positive:** what gets easier or unblocked.
- **Negative:** what gets harder or constrained. Be honest — every decision has costs.
- **Neutral:** consequences that aren't clearly good or bad but are worth flagging for future readers.

## Triggers for revisit
What conditions would make us re-examine this decision? Examples:
- "If we ever support multi-tenant accounts, this assumption breaks."
- "If the user count exceeds 10k, the chosen approach won't scale."
- "If we change billing models, this needs to be reconsidered."

When one of these triggers fires, write a new ADR that explicitly supersedes this one.

## References
- Links to relevant code, docs, external articles.
- Tickets that drove the decision.
- Other ADRs this depends on or relates to.
