---
description: Create or update an architecture doc/ADR. Follows the project's existing structure under Documents/Engineering/Architecture/ and the ADR template.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "<topic>   e.g. /arch-doc rate-limiting"
---

You are creating or updating architecture documentation for **$1**.

## Procedure

1. **Audit existing docs** to prevent redundancy:
   - List `Documents/Engineering/Architecture/` and `Documents/Engineering/Architecture/ADR/`.
   - Grep `Documents/` recursively for the topic name (`grep -ri "$1" Documents/`).
   - Read `Documents/Reference/SRS.md`, `DatabaseDesign.md`, `ApiReference.md` for any prior coverage.
2. **Decide doc type:**
   - **ADR** if this is a *decision* (we picked X over Y, future readers need to know why).
   - **Architecture overview** if this is a *system view* (how a feature works end-to-end).
   - **Update existing** if a doc already covers most of it — add a section, don't duplicate.
3. **Examine actual source code** before writing — never document from assumption. Read every file you'll reference.
4. **Write or update** the doc:
   - **For an ADR:** copy `Documents/Engineering/Architecture/ADR/0000-template.md` to `NNNN-<slug>.md` (next sequential number). Fill every section. Status: Proposed if unsure, Accepted if already in code.
   - **For an architecture overview:** create at `Documents/Engineering/Architecture/<topic>.md`. Sections: title + one-line summary, data flow, key components, environment/config, tables for endpoints/schema, ≤150 lines.
5. **Update the index** if you created a new ADR — append a row to `Documents/Engineering/Architecture/README.md` "What's here today" table.
6. **Cross-link.** If the new doc affects existing docs (e.g., a new ADR supersedes an older one, or an architecture overview is referenced from `SRS.md`), update those docs' references.
7. **Don't update `CLAUDE.md`** unless the doc creates a new top-level concern — `CLAUDE.md` should stay tight.

## Writing principles

- Target the new contributor reading on day 1.
- Lead with *what* and *why*; implementation detail later.
- Tables for systematic info (endpoints, env vars, severity tiers).
- Split large topics into multiple docs rather than one mega-doc.
- Prose under code blocks: explain *what changed and why*, not *what the code does*.

## Output

After writing, output:
1. The path of the file you created or updated.
2. A 3-line summary of what's in it.
3. Any cross-references that need updating in other docs.
