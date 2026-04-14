# Technology Stack

This document outlines the core technologies used in the development of the **Smart Expense & Budget Tracker**.

## 🖥️ Frontend
- **Framework:** [React 19.2.5](https://reactjs.org/) (Create React App, JavaScript — not TypeScript)
- **Reasoning:** Component-based architecture, hooks-driven state, large ecosystem.
- **Dev port:** `7575` (must be set explicitly: `PORT=7575 npm start` — the backend's CORS allow-list is hardcoded to `http://localhost:7575`).
- **Key Libraries:**
  - `react-router-dom` v7 — routing
  - `axios` — API client (base URL `http://localhost:7576/api/v1`, request interceptor injects JWT from `localStorage`)
  - `recharts` — bar charts for monthly analysis (Chart.js was considered, Recharts was chosen)
  - `react-icons` — icon set

## ⚙️ Backend
- **Framework:** [Python Flask 3.1.1](https://flask.palletsprojects.com/)
- **Reasoning:** Lightweight, blueprint-based routing fits a small API surface.
- **Dev port:** `7576`.
- **Key Extensions:**
  - `Flask-SQLAlchemy` 3.1.1 — ORM (raw SQL is forbidden by `GEMINI.md`)
  - `Flask-JWT-Extended` 4.7.1 — JWT auth (24h expiry, identity stored as `str(user.id)`)
  - `Flask-CORS` 5.0.1 — CORS (hardcoded to `http://localhost:7575`)
  - `Werkzeug` 3.1.3 — password hashing
  - `python-dotenv` 1.1.0 — `.env` loading

## 🗄️ Database
- **Prototype:** [SQLite](https://www.sqlite.org/) — `expense_tracker.db` auto-created on first run via `db.create_all()`.
- **Production target:** [MySQL](https://www.mysql.com/).
- **Reasoning:** SQLite keeps the prototype zero-config; MySQL is the production target for durability and concurrent writes.
- **Tables (actual, see `backend/models.py`):**
  - `users` (id, username UNIQUE, email UNIQUE, password_hash, created_at)
  - `incomes` (id, user_id FK, amount `DECIMAL(10,2)`, month, year — UNIQUE on (user_id, month, year))
  - `budgets` (id, user_id FK, amount `DECIMAL(10,2)`, savings_goal `DECIMAL(10,2)`, month, year — UNIQUE on (user_id, month, year))
  - `expenses` (id, user_id FK, amount `DECIMAL(10,2)`, category, note, date, created_at)

## 🔧 Tools & Others
- **Version Control:** Git & GitHub. Branch naming `feature|bugfix|hotfix/{id}-{desc}` (see `CLAUDE.md`).
- **API Testing:** Postman / curl.
- **Environment Management:** `venv` (Python) / `npm` (Node.js).
- **Migrations:** None yet (no Flask-Migrate installed despite `GEMINI.md` calling it "planned").
- **Tests:** None yet (frontend has `@testing-library/*` deps installed but zero test files; backend has no test framework set up).

## 🏗️ Technical Best Practices: Do's and Don'ts

### ✅ What to Do
- **Use Environment Variables:** Store database credentials and secret keys in `.env` files.
- **Follow RESTful Principles:** Design clean and predictable API endpoints in Flask.
- **Implement Error Handling:** Use standard HTTP status codes (200, 400, 404, 500) for API responses.
- **Component Reusability:** Build reusable React components (Buttons, Inputs, Cards) for a consistent UI.
- **Index Database Tables:** Use indexes on `UserID` and `Date` columns in MySQL for faster queries.

### ❌ What Not to Do
- **Hardcode Secrets:** Never put API keys or database passwords directly in the source code.
- **Direct DOM Manipulation:** Avoid using `document.getElementById` in React; use state and props.
- **Global State Overuse:** Don't put everything in a global store if a local component state is enough.
- **Unoptimized SQL Queries:** Avoid `SELECT *` if you only need specific columns; it improves performance.
- **Commit Large Binaries:** Don't commit large datasets or local environment folders (`node_modules`, `venv`) to Git.
