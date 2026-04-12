# CLAUDE.md — Project Constitution
> This file is the law. Claude must follow every rule below without exception.

## Project
**Smart Expense & Budget Tracker** — Personal finance management system.
**Stack**: React.js · Python Flask · SQLite (prototype) / MySQL (production) · SQLAlchemy ORM

---

## 1. Read Before Write
Before changing any file, read it + every model/service it touches.
State: "Reading: [files]. Business logic found: [summary]."

## 2. Protected Business Logic
NEVER modify without `[BIZ-QC-NEEDED]` flag in commit body:
- Budget calculation logic (`remaining = income - total_spent`)
- Savings goal computation (`saved = income - budget_limit`)
- Overspending alert thresholds (80%, 100% budget usage)
- Monthly summary aggregation (total spent, saved, highest category)
- Any financial amount computation involving `DECIMAL(10,2)` fields

## 3. Protected Branches
- `main` → production-ready only, no direct commits
- Work on: `feature/{id}-{desc}` · `bugfix/{id}-{desc}` · `hotfix/{id}-{desc}`

## 4. Never Rename Legacy Files
- Do NOT rename any existing files in `Documents/` folder
- Do NOT rename `GEMINI.md` files (they are project reference docs)

## 5. Bug Fix ≠ Refactor
Fix only what the ticket says. Extra change = new ticket.
Do not "improve" surrounding code while fixing a bug.

## 6. One Ticket Per Branch
`feature/{id}` fixes `{id}` only. New issue found = new branch.

## 7. No Direct DB Access in Views/Templates
All database access through Flask routes → SQLAlchemy models.
No raw SQL strings — use ORM exclusively (per GEMINI.md).

## 8. If Unsure → Escalate, Don't Guess
Uncertain about business logic? Ask the user.
Wrong guess on financial calculations costs more than delay.

---

## Engineering Standards (from GEMINI.md)

### Backend (Flask)
- PEP 8 style
- All endpoints prefixed with `/api/v1/`
- Plural nouns for resources (`/api/v1/expenses`)
- JSON responses with proper HTTP status codes
- Error format: `{ "error": "Message", "code": 400 }`
- JWT-based authentication
- Secrets in `.env` files — never hardcoded

### Frontend (React)
- Functional components with Hooks (`useState`, `useEffect`)
- Axios for all API calls
- Local component state preferred over global state
- Recharts for financial data visualization

### Data Integrity
- Currency: `DECIMAL(10, 2)` — no floating-point for money
- Timestamps: UTC for all stored dates

---

## Git Governance

### Branch Naming
```
feature/{id}-{short-desc}
bugfix/{id}-{short-desc}
hotfix/{id}-{short-desc}
```

### Commit Format
```
type(scope): description

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

**Types**: feat, fix, hotfix, refactor, test, docs, chore, style, perf
**Scopes**: auth, income, budget, expenses, dashboard, reports, alerts, summary, api, ui

---

## Session Protocol

### Start
1. Check git branch — must NOT be on `main`
2. Read `PROJECT_CONTEXT.md` for project context
3. State: "Working on: [task]. Reading: [files]."

### End
1. Run tests if available
2. Lint check
3. Commit with proper format
4. No uncommitted changes left
