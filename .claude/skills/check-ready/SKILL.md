---
description: Walk Documents/Process/DefinitionOfReady.md against a ticket and report READY or NOT READY with specific gaps.
allowed-tools: Read, Grep, Bash
argument-hint: "<TICKET-ID>   e.g. /check-ready BUG-1"
---

You are running the Definition of Ready check for ticket **$1**.

## Procedure

1. Read `Documents/Process/DefinitionOfReady.md` for the current authoritative checklist.
2. Read `Documents/Project/ticket-inventory.md` and find the row for ticket **$1**.
3. Determine the ticket type from its prefix (`BUG-` → bug, `FEAT-` → feature, `TEST-` → chore, `INFRA-` → chore, `DOCS-` → docs).
4. Walk the **universal checklist** from DefinitionOfReady.md §"Universal checklist" against what's actually in the ticket inventory row.
5. Walk the **per-type checklist** for the ticket's type.
6. For any item that depends on info not in `ticket-inventory.md` (e.g., "out-of-scope listed" — the inventory is one-line per ticket), state explicitly that this needs to be added before the ticket is Ready.

## Output format

```
## DefinitionOfReady check — ticket $1

### Universal checklist
- [✓/✗] Title is short imperative — <copied title>
- [✓/✗] Type assigned — <type>
- [✓/✗] Severity assigned — <severity>
- [✓/✗] Acceptance criteria written
- [✓/✗] Out-of-scope explicitly listed
- [✓/✗] Owner assigned
- [✓/✗] Branch name decided
- [✓/✗] Effort estimate
- [✓/✗] No unanswered questions

### Per-type checklist (<type>)
- [✓/✗] <each item>

### Verdict
READY  | NOT READY because: <specific gaps>

### To make Ready
1. <action>
2. <action>
```

If the ticket id doesn't exist in `ticket-inventory.md`, output: `NOT FOUND — ticket $1 is not in Documents/Project/ticket-inventory.md. Add it first.`
