---
description: Run the project's linters (backend flake8/black, frontend ESLint) and fix violations only on files touched in the current session — no speculative refactors per CLAUDE.md Rule 5.
allowed-tools: Bash, Read, Edit, Glob, Grep
---

You are running the lint pass for the current session.

## Scope discipline (CLAUDE.md Rule 5)

**Only fix lint issues in files this session touched.** Do not "while I'm here" the rest of the codebase. The diff vs `master` is your scope:

```bash
git diff master...HEAD --name-only
```

Anything outside that list is out of scope, even if it has lint errors. File a separate `chore(lint): cleanup <area>` ticket for those.

## Backend (Python / Flask)

Project standards from `Documents/Process/CodeStandardAndGuide.md` §1:
- PEP 8, 4-space indent, max line length 100.
- Format with `black` (line length 100) — *if installed*.
- Lint with `flake8` — *if installed*.

Procedure:

```bash
cd backend
source venv/bin/activate 2>/dev/null

# Get the touched python files in scope
files=$(git diff master...HEAD --name-only -- '*.py' | grep -v 'tests/' || true)

# Format
if command -v black >/dev/null; then
  black --line-length 100 $files
fi

# Lint
if command -v flake8 >/dev/null; then
  flake8 --max-line-length 100 $files
fi
```

**If `flake8` / `black` are not installed**, output a note:
> "Lint tooling not installed — see `Documents/Project/ticket-inventory.md` (open a chore ticket: `chore(infra): add backend lint deps`)."

For each violation:
- `E501` (line too long): break at logical points, not mid-expression.
- `F401` (unused import): remove. If the import has a side effect, add `# noqa: F401` with a one-line reason.
- `E712` (comparison to True/False): use `if x:` not `if x == True:`.
- `E722` (bare except): catch a specific exception. Bare `except:` is forbidden in financial code.
- Anything else: read the rule in the `flake8` docs and fix per the spirit, not the letter.

## Frontend (React)

Project standards from `Documents/Process/CodeStandardAndGuide.md` §2:
- Prettier defaults; ESLint with `react-app` + `react-app/jest` presets (already in `package.json`).
- Functional components with hooks; no class components.

Procedure:

```bash
cd frontend
files=$(git diff master...HEAD --name-only -- 'src/**/*.js' 'src/**/*.jsx' 'src/**/*.css')

# CRA exposes lint via:
npm run lint -- $files 2>&1 || true
# If that's not configured, fall back to:
npx eslint $files 2>&1 || true
```

For each violation:
- `react-hooks/exhaustive-deps`: add the missing dep OR explain in a comment why it's intentional. Don't `// eslint-disable` without a reason.
- `no-unused-vars`: remove (or rename to `_var` if intentionally kept).
- `react/jsx-key`: replace `key={i}` with a stable id (this is `BUG-10` in `ticket-inventory.md`).
- `no-console`: remove debug `console.log`. `console.error` for genuine error reporting is OK if intentional.
- Hooks rules violations: never disable — fix the structure.

## What you do NOT do

- **No reformatting of files outside the diff.** Out-of-scope is out-of-scope.
- **No introducing a new linter** (e.g., adding `prettier` if it isn't already configured). That's a chore ticket.
- **No `eslint-disable-next-line` to suppress a rule** without a comment justifying it — that's just hiding the problem.
- **No commit.** Lint fixes go into the same commit as the work that prompted them — handled by `/done` or `/commit`.

## Output

Report:

```
## lint-fix — session scope

### Backend (N files in scope)
- Tooling: flake8 / black / not installed
- Issues found: N
- Issues fixed: N
- Issues remaining (out-of-scope or unsafe to auto-fix): N — list them

### Frontend (N files in scope)
- Tooling: eslint via npm run lint / npx eslint / not configured
- Issues found: N
- Issues fixed: N
- Issues remaining: N — list them

Next step: re-run /done OR address the remaining issues OR file chore tickets.
```
