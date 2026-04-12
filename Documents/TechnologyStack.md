# Technology Stack

This document outlines the core technologies used in the development of the **Smart Expense & Budget Tracker**.

## 🖥️ Frontend
- **Framework:** [React.js](https://reactjs.org/)
- **Reasoning:** Provides a dynamic, component-based architecture for a smooth and responsive user experience across devices.
- **Key Libraries:**
  - `React Router` (for navigation)
  - `Axios` (for API communication)
  - `Chart.js` or `Recharts` (for financial data visualization)

## ⚙️ Backend
- **Framework:** [Python Flask](https://flask.palletsprojects.com/)
- **Reasoning:** A lightweight and flexible micro-framework that is ideal for building efficient RESTful APIs.
- **Key Extensions:**
  - `Flask-CORS` (to handle cross-origin requests from React)
  - `Flask-SQLAlchemy` (for database ORM)
  - `Flask-JWT-Extended` or `Werkzeug` (for secure user authentication)

## 🗄️ Database
- **System:** [MySQL](https://www.mysql.com/)
- **Reasoning:** A reliable and robust relational database management system (RDBMS) perfect for structured financial data, transaction history, and user accounts.
- **Key Tables (Proposed):**
  - `Users` (ID, Username, Email, PasswordHash)
  - `Incomes` (UserID, Amount, Date)
  - `Budgets` (UserID, Amount, SavingsGoal, Month)
  - `Expenses` (UserID, Amount, Category, Note, Date)

## 🔧 Tools & Others
- **Version Control:** Git & GitHub
- **API Testing:** Postman
- **Environment Management:** Virtualenv (Python) / NPM (Node.js)

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
