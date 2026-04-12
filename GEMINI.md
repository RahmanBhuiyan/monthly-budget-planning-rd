# Smart Expense & Budget Tracker - Project Mandates

This document defines the core standards and architectural rules for the Smart Expense & Budget Tracker project. All development must adhere to these guidelines.

## 🏗 Architecture Overview
- **Monorepo Structure:** 
  - `backend/`: Python Flask REST API.
  - `frontend/`: React.js SPA.
  - `Documents/`: Project documentation and design specs.
- **Database:** MySQL for relational data storage (Users, Budgets, Expenses).
- **Communication:** Standard REST API using JSON payloads and HTTP status codes.

## 🛠 Engineering Standards

### 1. Security & Configuration
- **Environment Variables:** All sensitive data (Database credentials, JWT secrets, API keys) MUST be stored in `.env` files.
- **Secrets Protection:** Never hardcode secrets. Ensure `.env` and `venv/` are in `.gitignore`.
- **Validation:** Sanitize all user inputs on both the Frontend (UI feedback) and Backend (SQL injection prevention).

### 2. Backend (Flask)
- **Style:** Follow PEP 8 guidelines.
- **ORM:** Use `Flask-SQLAlchemy` for all database interactions. Avoid raw SQL strings.
- **Authentication:** Use JWT-based authentication for securing endpoints.
- **Error Handling:** Return consistent JSON error objects: `{ "error": "Message", "code": 400 }`.

### 3. Frontend (React)
- **Components:** Prefer Functional Components with Hooks (`useState`, `useEffect`).
- **Data Fetching:** Use `Axios` for all API calls.
- **State Management:** Use local component state where possible; avoid unnecessary global state overhead.
- **Visualization:** Use `Chart.js` or `Recharts` for financial data representation.

### 4. Data Integrity
- **Currency:** Store all financial amounts as `DECIMAL(10, 2)` in MySQL to avoid floating-point errors.
- **Timestamps:** Use UTC for all stored dates and times.

## 🔄 Workflow & Research
- **Requirements First:** Before starting any feature, consult `Documents/SRS.md` to ensure all functional and non-functional requirements are met.
- **Git Protocol:** All commits and branching must strictly follow `Documents/GitWorkFlow.md`.
- **Coding Standards:** Adhere to the language-agnostic rules in `Documents/CodeStandardAndGuide.md` and `Documents/CodeCommunityStandard.md`.
- **Project Management:** Refer to `Documents/projectManager/` and `Documents/productManager/` for roadmap and milestone alignment.
- **Contextual Awareness:** Read `Documents/ProjectOverview.md` and `Documents/TechnologyStack.md` to ensure alignment with the product vision.
