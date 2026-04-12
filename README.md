<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Tests-14%20Passed-brightgreen?style=for-the-badge" alt="Tests" />
</p>

<h1 align="center">Smart Expense & Budget Tracker</h1>

<p align="center">
  <strong>A personal finance management web app to track daily expenses, set monthly budgets, and analyze spending patterns.</strong>
</p>

<p align="center">
  <em>Built with React.js + Python Flask + SQLite | Responsive Design (Mobile + Desktop)</em>
</p>

---

## How It Works

The app follows a simple **6-step user journey** from onboarding to monthly review:

```
  Welcome        Sign Up        Set Income      Set Budget
 ┌─────────┐   ┌─────────┐   ┌─────────┐    ┌─────────┐
 │         │   │         │   │  Step 1  │    │  Step 2  │
 │  Smart  │   │ Create  │   │         │    │  Budget  │
 │ Expense │──>│ Account │──>│ Monthly │───>│  Limit + │
 │ Tracker │   │         │   │ Income  │    │ Savings  │
 │         │   │ Email + │   │  $500   │    │  Goal    │
 │[Get     │   │ Password│   │         │    │          │
 │Started] │   │         │   │ [Save]  │    │  [Save]  │
 └─────────┘   └─────────┘   └─────────┘    └────┬─────┘
                                                  │
                    ┌─────────────────────────────┘
                    v
              ┌──────────┐
              │Dashboard │
              │──────────│
              │Income    │     Add Expense       Expense List
              │  $500    │   ┌─────────┐       ┌──────────────┐
              │Budget    │   │  Step 3  │       │ Today        │
              │Remaining │   │         │       │  Lunch  -$15 │
              │  $320    │──>│ Amount  │──────>│  Bus    -$3  │
              │Total     │   │ Category│       │ Yesterday    │
              │Spent     │   │ Note    │       │  Coffee -$4  │
              │  $180    │   │         │       │  Phone  -$10 │
              │          │   │ [Save]  │       │              │
              │[Add New] │   └─────────┘       └──────────────┘
              └────┬─────┘
                   │
     ┌─────────────┼──────────────┐
     v             v              v
┌─────────┐  ┌──────────┐  ┌──────────┐
│Category │  │ Monthly  │  │ Budget   │
│  View   │  │ Analysis │  │ Alerts   │
│─────────│  │──────────│  │──────────│
│Food $75 │  │ ▓▓▓▓     │  │ Warning  │
│Travel$30│  │ ▓▓       │  │ You used │
│Bills $40│  │ ▓▓▓      │  │ 80% of   │
│Shop  $35│  │ ▓▓▓      │  │ budget!  │
│         │  │          │  │          │
│         │  │Top: Food │  │Suggestion│
│         │  │Avg: $6/d │  │Reduce    │
│         │  │          │  │shopping  │
└─────────┘  └──────────┘  └──────────┘
                   │
                   v
            ┌──────────┐
            │ Monthly  │
            │ Summary  │
            │──────────│
            │Income    │
            │  $500    │
            │Spent     │
            │  $380    │
            │Saved     │
            │  $120    │
            │Highest   │
            │  Food    │
            │          │
            │[Logout]  │
            └──────────┘
```

---

## User Flow — Step by Step

### 1. Welcome Screen
> Dark gradient landing page with feature highlights

```
┌──────────────────────────────────────────┐
│                                          │
│              ( $ )                       │
│                                          │
│       Smart Expense                      │
│       & Budget Tracker                   │
│                                          │
│  Take control of your finances.          │
│                                          │
│  ┌─ $ ── Track Expenses ────────────┐   │
│  │       Log daily spending          │   │
│  └───────────────────────────────────┘   │
│  ┌─ ✓ ── Stay Within Budget ────────┐   │
│  │       Set monthly limits          │   │
│  └───────────────────────────────────┘   │
│  ┌─ # ── Monthly Analysis ──────────┐   │
│  │       Charts and insights         │   │
│  └───────────────────────────────────┘   │
│  ┌─ ! ── Smart Alerts ──────────────┐   │
│  │       Overspending warnings       │   │
│  └───────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │         Get Started               │   │
│  └──────────────────────────────────┘   │
│                                          │
│     Free to use. No credit card.         │
└──────────────────────────────────────────┘
```

### 2. Sign Up / Login
> Clean white card on dark background

```
┌──────────────────────────────────────────┐
│                                          │
│              ┌──────────┐                │
│              │   ( $ )   │               │
│              │           │               │
│              │  Welcome  │               │
│              │   Back    │               │
│              │           │               │
│              │ Email:    │               │
│              │ [........]│               │
│              │           │               │
│              │ Password: │               │
│              │ [........]│               │
│              │           │               │
│              │ [Log In]  │               │
│              │           │               │
│              │ No acct?  │               │
│              │ Sign Up   │               │
│              └──────────┘                │
│                                          │
└──────────────────────────────────────────┘
```

### 3. Dashboard (Desktop View)
> Cards in grid layout with sidebar navigation

```
┌────────┬─────────────────────────────────────────┐
│Sidebar │  Dashboard                              │
│────────│  Overview of this month                 │
│        │                                         │
│  Home  │  ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  Add   │  │ Income   │ │ Budget   │ │ Total   ││
│  Report│  │ $500.00  │ │Remaining │ │ Spent   ││
│  Profile│ │          │ │ $320.00  │ │ $180.00 ││
│        │  └──────────┘ └──────────┘ └─────────┘│
│ ────── │                                         │
│  More  │  ┌─────────────┐ ┌────────────────┐   │
│        │  │Add New      │ │View All        │   │
│Expenses│  │Expense      │ │Expenses        │   │
│Category│  └─────────────┘ └────────────────┘   │
│ Alerts │                                         │
│ Income │                                         │
└────────┴─────────────────────────────────────────┘
```

### 4. Monthly Analysis (Desktop View)
> Bar chart + summary cards

```
┌────────┬─────────────────────────────────────────┐
│Sidebar │  Monthly Analysis                       │
│────────│  Spending trends                        │
│        │                                         │
│  Home  │  ┌─────────────────────────────────┐   │
│  Add   │  │  Spending by Category            │   │
│  Report│  │                                   │   │
│  Profile│ │   ██                              │   │
│        │  │   ██  ██       ██                 │   │
│ ────── │  │   ██  ██  ██   ██                 │   │
│  More  │  │   ██  ██  ██   ██                 │   │
│        │  │  Food Trvl Bill Shop              │   │
│Expenses│  └─────────────────────────────────┘   │
│Category│                                         │
│ Alerts │  ┌──────────────┐ ┌────────────────┐   │
│ Income │  │Top Spending  │ │ Avg Daily      │   │
│        │  │ Food         │ │ $6.00          │   │
│        │  └──────────────┘ └────────────────┘   │
└────────┴─────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| **User Authentication** | Secure signup/login with JWT tokens and password hashing |
| **Monthly Income Setup** | Set your monthly income to track against |
| **Budget Planning** | Define spending limits and savings goals |
| **Daily Expense Logging** | Record expenses with amount, category, date, and notes |
| **4 Categories** | Food, Travel, Bills, Shopping |
| **Real-time Dashboard** | See income, spent, and remaining at a glance |
| **Expense List** | View all expenses grouped by date, with delete option |
| **Category Breakdown** | See how much you spend in each category |
| **Monthly Analysis** | Bar chart visualization of spending patterns |
| **Budget Alerts** | Warning at 80% usage, critical alert at 100% |
| **Monthly Summary** | End-of-month report with income, spent, saved, top category |
| **Responsive Design** | Mobile bottom nav + Desktop sidebar layout |

---

## Tech Stack

```
Frontend                    Backend                     Database
┌─────────────────┐        ┌─────────────────┐        ┌──────────────┐
│  React.js 19    │        │  Python Flask    │        │  SQLite      │
│  React Router 7 │  API   │  Flask-SQLAlchemy│  ORM   │  (prototype) │
│  Axios          │───────>│  Flask-JWT       │───────>│              │
│  Recharts       │  JSON  │  Flask-CORS      │        │  MySQL       │
│  React Icons    │        │  Werkzeug        │        │  (production)│
└─────────────────┘        └─────────────────┘        └──────────────┘
     Port 7575                  Port 7576
```

---

## Project Structure

```
smart-expense-tracker/
│
├── CLAUDE.md                    # Governance rules (8 rules)
├── PROJECT_CONTEXT.md           # Full project context
├── .gitignore                   # Git ignore rules
│
├── Documents/
│   ├── ProjectOverview.md       # Feature specs & roadmap
│   └── TechnologyStack.md       # Tech decisions & best practices
│
├── backend/
│   ├── app.py                   # Flask app + config + blueprints
│   ├── models.py                # SQLAlchemy models (User, Income, Budget, Expense)
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Secrets (not in git)
│   └── routes/
│       ├── auth.py              # POST /signup, /login
│       ├── income.py            # POST/GET /income
│       ├── budget.py            # POST/GET /budget
│       ├── expenses.py          # POST/GET/DELETE /expenses
│       └── reports.py           # GET /summary, /categories, /alerts
│
└── frontend/
    ├── package.json             # React dependencies
    ├── public/
    │   └── index.html           # HTML entry point
    └── src/
        ├── App.js               # Router + layout
        ├── App.css              # All styles (mobile + desktop responsive)
        ├── index.js             # React entry point
        ├── components/
        │   └── BottomNav.js     # Mobile bottom nav + Desktop sidebar
        ├── services/
        │   └── api.js           # Axios API client (all endpoints)
        └── pages/
            ├── Welcome.js       # Landing page
            ├── Login.js         # Login form
            ├── Signup.js        # Registration form
            ├── IncomeSetup.js   # Step 1: Set income
            ├── BudgetSetup.js   # Step 2: Set budget
            ├── Dashboard.js     # Main dashboard
            ├── AddExpense.js    # Step 3: Log expense
            ├── ExpenseList.js   # View expenses by date
            ├── Categories.js    # View by category
            ├── MonthlyAnalysis.js # Charts + insights
            ├── BudgetAlerts.js  # Spending warnings
            └── MonthlySummary.js # End-of-month report
```

---

## API Endpoints

All endpoints prefixed with `/api/v1/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | No | Register new user |
| `POST` | `/auth/login` | No | Login, returns JWT |
| `POST` | `/income` | JWT | Set monthly income |
| `GET` | `/income?month=&year=` | JWT | Get income for month |
| `POST` | `/budget` | JWT | Set budget + savings goal |
| `GET` | `/budget?month=&year=` | JWT | Get budget for month |
| `POST` | `/expenses` | JWT | Add new expense |
| `GET` | `/expenses?month=&year=` | JWT | List expenses for month |
| `DELETE` | `/expenses/:id` | JWT | Delete expense |
| `GET` | `/reports/summary?month=&year=` | JWT | Monthly summary |
| `GET` | `/reports/categories?month=&year=` | JWT | Category breakdown |
| `GET` | `/reports/alerts?month=&year=` | JWT | Budget alerts |

---

## Database Schema

```
┌──────────────┐       ┌──────────────┐
│    Users     │       │   Incomes    │
│──────────────│       │──────────────│
│ id       PK  │───┐   │ id       PK  │
│ username     │   │   │ user_id  FK  │──┐
│ email        │   │   │ amount DEC   │  │
│ password_hash│   ├──>│ month        │  │
│ created_at   │   │   │ year         │  │
└──────────────┘   │   └──────────────┘  │
                   │                      │
                   │   ┌──────────────┐  │
                   │   │   Budgets    │  │
                   │   │──────────────│  │
                   │   │ id       PK  │  │
                   ├──>│ user_id  FK  │──┤
                   │   │ amount DEC   │  │
                   │   │ savings_goal │  │
                   │   │ month        │  │
                   │   │ year         │  │
                   │   └──────────────┘  │
                   │                      │
                   │   ┌──────────────┐  │
                   │   │  Expenses    │  │
                   │   │──────────────│  │
                   │   │ id       PK  │  │
                   └──>│ user_id  FK  │──┘
                       │ amount DEC   │
                       │ category     │
                       │ note         │
                       │ date         │
                       │ created_at   │
                       └──────────────┘

DEC = DECIMAL(10,2) — no floating-point for money
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 8+

### 1. Clone the repo

```bash
git clone https://github.com/RahmanBhuiyan/monthly-budget-planning-rd.git
cd monthly-budget-planning-rd
```

### 2. Set up Backend

```bash
cd backend
python -m venv venv

# Windows
source venv/Scripts/activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DATABASE_URL=sqlite:///expense_tracker.db
FLASK_ENV=development
FLASK_DEBUG=1
```

Start the backend:

```bash
python app.py
```

Backend runs on `http://localhost:7576`

### 3. Set up Frontend

```bash
cd frontend
npm install
```

Start the frontend:

```bash
# Windows (if folder has special characters)
node node_modules/react-scripts/bin/react-scripts.js start

# Mac/Linux
PORT=7575 npm start
```

Frontend runs on `http://localhost:7575`

### 4. Open in browser

```
http://localhost:7575
```

---

## Responsive Design

The app adapts to both mobile and desktop screens:

```
Mobile (< 768px)                    Desktop (>= 768px)
┌────────────────┐                  ┌────────┬──────────────────────┐
│   Dashboard    │                  │Sidebar │   Dashboard          │
│                │                  │        │                      │
│ ┌────────────┐ │                  │  Home  │ ┌──────┐ ┌──────┐  │
│ │ Income     │ │                  │  Add   │ │Income│ │Budget│  │
│ │ $500       │ │                  │  Report│ │ $500 │ │ $320 │  │
│ └────────────┘ │                  │  Profile│└──────┘ └──────┘  │
│ ┌────────────┐ │                  │        │                      │
│ │ Budget     │ │                  │ ────── │ ┌──────┐            │
│ │ $320       │ │                  │Expenses│ │Spent │            │
│ └────────────┘ │                  │Category│ │ $180 │            │
│ ┌────────────┐ │                  │ Alerts │ └──────┘            │
│ │ Spent      │ │                  │ Income │                      │
│ │ $180       │ │                  │        │ [Add New] [View All] │
│ └────────────┘ │                  └────────┴──────────────────────┘
│                │
│  [Add New]     │
│  [View All]    │
│                │
│ Home Add Rpt Me│
└────────────────┘
```

---

## Testing

All 14 integration tests pass:

```
[PASS] Signup
[PASS] Login
[PASS] Set income = $500
[PASS] Get income
[PASS] Set budget = $400, savings = $100
[PASS] Get budget
[PASS] Added 9 expenses
[PASS] Get expenses (9 items)
[PASS] Summary: spent=$222.0, saved=$278.0, remaining=$178.0
[PASS] Categories: Food=$104.0, Travel=$33.0, Bills=$50.0, Shopping=$35.0
[PASS] Alert: success - 56% usage, $178.00 remaining
[PASS] Delete expense
[PASS] Verified deletion (8 items left)
[PASS] Duplicate signup rejected
[PASS] Wrong login rejected
[PASS] Invalid category rejected
```

---

## Roadmap

### Phase 1 (Current — Prototype)
- [x] User authentication (JWT)
- [x] Monthly income setup
- [x] Budget + savings goal
- [x] Daily expense logging
- [x] Dashboard with real-time data
- [x] Category breakdown
- [x] Bar chart analysis (Recharts)
- [x] Budget alerts (80% / 100%)
- [x] Monthly summary report
- [x] Responsive design (mobile + desktop)

### Phase 2 (Planned)
- [ ] Switch to MySQL for production
- [ ] Export data as PDF / CSV
- [ ] Dark mode
- [ ] Receipt scanning (OCR)
- [ ] Multi-currency support
- [ ] Push notifications / reminders

---

## Governance

This project follows the **claude-code-project-guide** framework:

- **CLAUDE.md** — 8 governance rules enforced during development
- **PROJECT_CONTEXT.md** — Complete project context for AI-assisted development
- **Protected business logic** — All financial calculations flagged with `[BIZ-QC-NEEDED]`

See [claude-code-project-guide](https://github.com/RahmanBhuiyan/claude-code-project-guide) for the full framework.

---

## Author

**Rahman Bhuiyan** — [@RahmanBhuiyan](https://github.com/RahmanBhuiyan)

---

<p align="center">
  <sub>Built with Claude Code</sub>
</p>
