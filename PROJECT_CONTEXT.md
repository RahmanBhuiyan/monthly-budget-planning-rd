# Smart Expense & Budget Tracker — Complete Project Context
> Upload this file to Claude at the start of every session.

## What This Project Is
A personal finance management web app that helps users track daily expenses, set monthly budgets, and analyze spending patterns. Currently in **prototype phase**.

**Repo**: github.com/RahmanBhuiyan/Monthly_Bugdet_Planing_R-D
**Stack**: React.js · Python Flask · SQLite (prototype) / MySQL (production) · SQLAlchemy ORM
**Team**: 1 developer + Claude Code

## Scale (Prototype Target)
- 5 API route files (auth, income, budget, expenses, reports)
- 4 database models (User, Income, Budget, Expense)
- 10 frontend pages (from wireframe)
- 1 service file (Axios API client)

## Modules

| Module | Key Files | Business Logic |
|--------|-----------|----------------|
| Auth | `routes/auth.py` | JWT login/signup, password hashing |
| Income | `routes/income.py` | Set/get monthly income per user per month |
| Budget | `routes/budget.py` | Set spending limit + savings goal per month |
| Expenses | `routes/expenses.py` | CRUD daily expenses with category + note |
| Reports | `routes/reports.py` | Monthly summary, category breakdown, alerts |
| Dashboard | `pages/Dashboard.js` | Real-time: income, spent, remaining |
| Analysis | `pages/MonthlyAnalysis.js` | Bar chart by category, top area, avg daily |
| Alerts | `pages/BudgetAlerts.js` | Warning at 80% budget, critical at 100% |

## Database Schema

### Users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| username | VARCHAR(80) | Unique |
| email | VARCHAR(120) | Unique |
| password_hash | VARCHAR(256) | Werkzeug hashed |
| created_at | DATETIME | UTC |

### Incomes
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | → Users.id |
| amount | DECIMAL(10,2) | Monthly income |
| month | INTEGER | 1-12 |
| year | INTEGER | e.g. 2026 |

### Budgets
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | → Users.id |
| amount | DECIMAL(10,2) | Spending limit |
| savings_goal | DECIMAL(10,2) | Target savings |
| month | INTEGER | 1-12 |
| year | INTEGER | e.g. 2026 |

### Expenses
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | → Users.id |
| amount | DECIMAL(10,2) | Expense amount |
| category | VARCHAR(50) | Food, Travel, Bills, Shopping |
| note | VARCHAR(200) | Optional description |
| date | DATE | UTC date |
| created_at | DATETIME | UTC |

## API Endpoints (All prefixed `/api/v1/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/income` | Set monthly income |
| GET | `/income?month=&year=` | Get income for month |
| POST | `/budget` | Set monthly budget + savings goal |
| GET | `/budget?month=&year=` | Get budget for month |
| POST | `/expenses` | Add new expense |
| GET | `/expenses?month=&year=` | List expenses for month |
| DELETE | `/expenses/<id>` | Delete an expense |
| GET | `/reports/summary?month=&year=` | Monthly summary |
| GET | `/reports/categories?month=&year=` | Spending by category |
| GET | `/reports/alerts?month=&year=` | Budget alerts |

## Frontend Pages (from wireframe)

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | Welcome | `/` | Landing with "Get Started" |
| 2 | Login | `/login` | Authentication |
| 3 | Signup | `/signup` | Registration |
| 4 | Income Setup | `/setup/income` | Enter monthly income |
| 5 | Budget Setup | `/setup/budget` | Set budget + savings goal |
| 6 | Dashboard | `/dashboard` | Income, spent, remaining overview |
| 7 | Add Expense | `/expenses/add` | Log expense with amount, category, note |
| 8 | Expense List | `/expenses` | View expenses grouped by date |
| 9 | Categories | `/categories` | Expenses grouped by category |
| 10 | Monthly Analysis | `/analysis` | Bar chart, top area, avg daily spend |
| 11 | Budget Alerts | `/alerts` | Warnings and suggestions |
| 12 | Monthly Summary | `/summary` | End-of-month report |

## Critical Business Logic

| Logic | Formula | Protected? |
|-------|---------|------------|
| Budget remaining | `remaining = budget_amount - SUM(expenses)` | YES |
| Savings achieved | `saved = income - SUM(expenses)` | YES |
| Budget usage % | `usage = (SUM(expenses) / budget_amount) * 100` | YES |
| Alert threshold | Warning at 80%, Critical at 100% | YES |
| Top spending area | `MAX(SUM(expenses) GROUP BY category)` | YES |
| Avg daily spending | `SUM(expenses) / days_in_month` | YES |

## Governance Rules
See `CLAUDE.md` for the 8 rules. Key ones for this project:
- All financial amounts as DECIMAL(10,2) — no floats
- UTC timestamps everywhere
- JWT auth on all endpoints except signup/login
- Input validation on frontend AND backend
- No raw SQL — SQLAlchemy ORM only

## Session Start Protocol
1. Check git branch: `git branch --show-current` — must NOT be `main`
2. Read this file for project context
3. State: "Working on: [task]. Reading: [files]."
4. Read files before modifying them

## Session End Protocol
1. Run tests if available
2. Commit with format: `type(scope): description`
3. No uncommitted changes left
