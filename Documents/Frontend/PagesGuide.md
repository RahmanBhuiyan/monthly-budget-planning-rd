# Pages Guide

> One entry per page. Each entry covers: purpose, route, state, API calls, navigation behavior, and known issues. For shared concerns (Axios setup, layout), see `Frontend/Architecture.md`.

| Page | Route | Auth | API calls |
|------|-------|------|-----------|
| Welcome | `/` | no | none |
| Login | `/login` | no | `login` |
| Signup | `/signup` | no | `signup` |
| IncomeSetup | `/setup/income` | yes | `setIncome` |
| BudgetSetup | `/setup/budget` | yes | `setBudget` |
| Dashboard | `/dashboard` | yes | `getMonthlySummary` |
| AddExpense | `/expenses/add` | yes | `addExpense` |
| ExpenseList | `/expenses` | yes | `getExpenses`, `deleteExpense` |
| Categories | `/categories` | yes | `getCategoryBreakdown` |
| MonthlyAnalysis | `/analysis` | yes | `getCategoryBreakdown`, `getMonthlySummary` |
| BudgetAlerts | `/alerts` | yes | `getBudgetAlerts` |
| MonthlySummary | `/summary` | yes | `getMonthlySummary` |

---

## Welcome (`/`)
**Purpose:** marketing landing + smart redirect.

**State:** none.

**Behavior on mount:**
- If `localStorage.getItem('token')` exists → `navigate('/dashboard')`.
- Else → render the marketing UI (icon, tagline, 4 features, "Get Started" → `/login`).

**Known issues:** none.

---

## Login (`/login`)
**Purpose:** authenticate an existing user.

**State:** `email`, `password`, `error`.

**On submit:**
1. `api.login({email, password})`.
2. On success: `localStorage.setItem('token', token)`, `localStorage.setItem('user', JSON.stringify(user))`, `navigate('/dashboard')`.
3. On 401: set `error` to "Invalid credentials".

**Known issues:**
- No loading state — submit button is clickable while in flight (double-submit risk).
- No frontend validation (email format, password length).
- Token in localStorage exposes JWT to XSS (`Documents/SecurityAndThreatModel.md` §3.3).

---

## Signup (`/signup`)
**Purpose:** create an account.

**State:** `username`, `email`, `password`, `error`.

**On submit:**
1. `api.signup({username, email, password})`.
2. On success: store token+user in localStorage, `navigate('/setup/income')` (onboarding flow).
3. On 409: show "username or email already taken".

**Known issues:**
- No password strength check.
- No password confirmation field — typos lock the user out until next signup attempt with a different email.
- No loading state.

---

## IncomeSetup (`/setup/income`)
**Purpose:** onboarding step 1 — set monthly income for the current month/year.

**State:** `amount`, `error`.

**On submit:**
1. Compute `month = new Date().getMonth() + 1`, `year = new Date().getFullYear()`.
2. `api.setIncome({amount, month, year})`.
3. On success: `navigate('/setup/budget')`.

**Known issues:**
- "Step 1" label is hardcoded — fine as long as the step is fixed.
- No max-value sanity check.
- Only sets income for the *current* month; no UI to set past or future months.

---

## BudgetSetup (`/setup/budget`)
**Purpose:** onboarding step 2 — set monthly budget + savings goal.

**State:** `amount`, `savingsGoal`, `error`.

**On submit:**
1. `api.setBudget({amount, savings_goal: parseFloat(savingsGoal) || 0, month, year})`.
2. On success: `navigate('/dashboard')`.

**Known issues:**
- `savings_goal` defaulting to 0 in the payload, combined with the backend reset bug (`SRS.md §6.1`), means re-submitting from this page wipes any externally-set savings goal. Fix lives on the backend.
- No validation that `savings_goal <= amount` (non-blocking — could be intentional).

---

## Dashboard (`/dashboard`)
**Purpose:** real-time month overview.

**State:** `summary`, `loading`.

**On mount:**
- `api.getMonthlySummary(month, year)` → set `summary`.
- 401 → logout-redirect.

**UI:**
- 3 cards: Income, Budget Remaining (green if ≥0, red if <0), Total Spent.
- Buttons: "Add New Expense" → `/expenses/add`, "View All Expenses" → `/expenses`.

**Known issues:**
- Non-401 errors silently swallowed.
- No refresh button — must navigate away and back (or hard reload) to refetch.
- `month`/`year` are computed inside the effect closure each render; stable enough but visually noisy. A `useMemo` would clean it up.

---

## AddExpense (`/expenses/add`)
**Purpose:** log a single expense.

**State:** `amount`, `category` (default `'Food'`), `note`, `date` (default today), `error`, `success`.

**Hardcoded:** `CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping']` (mirrors backend `VALID_CATEGORIES`).

**On submit:**
1. `api.addExpense({amount, category, note, date})`.
2. On success: clear form, set `success = "Expense added!"`, `setTimeout(() => navigate('/dashboard'), 800)`.

**Known issues:**
- 800ms navigate delay is arbitrary — user barely sees the success message.
- No loading state — multiple submits possible.
- Categories are duplicated between this file and the backend; if either changes, the other silently drifts.

---

## ExpenseList (`/expenses`)
**Purpose:** list all expenses for the current month, grouped by date.

**State:** `expenses`, `loading`.

**On mount:** `api.getExpenses(month, year)`.

**Date grouping logic:**
```js
const today     = todayString();
const yesterday = yesterdayString();
const label = dateStr === today
  ? 'Today'
  : dateStr === yesterday
    ? 'Yesterday'
    : formatHumanDate(dateStr);
```

**Delete behavior (API-first):**
1. `await api.deleteExpense(id)`.
2. On success: `setExpenses(expenses.filter(e => e.id !== id))` — remove from local state.
3. On error: `console.error('Failed to delete expense')` — **no user-visible feedback**. The expense stays on screen and the user has no idea why.

**Known issues:**
- Delete failure is silent (only `console.error`) — UX issue, not data loss.
- Date parsing uses `new Date(dateStr + 'T00:00:00')` — locally midnight, can be off-by-one in some TZ scenarios.
- No filter/sort UI.

---

## Categories (`/categories`)
**Purpose:** read-only category breakdown for the current month.

**State:** `categories`, `loading`.

**On mount:** `api.getCategoryBreakdown(month, year)`.

**UI:** grid of cards, one per category, showing the total.

**Known issues:**
- "Step 4" label in the page is misleading — this isn't part of the onboarding flow.
- Categories returned by the backend have no `ORDER BY` — display order is engine-defined.
- No percentage-of-total or comparison data shown.

---

## MonthlyAnalysis (`/analysis`)
**Purpose:** charts + insights for the month.

**State:** `categories`, `summary`, `loading`.

**On mount:** `Promise.all([getCategoryBreakdown, getMonthlySummary])`.

**UI:**
- Recharts `<BarChart>` of category totals.
- Cards: "Top Spending Area" (`summary.highest_category`), "Average Daily Spending" (`summary.avg_daily_spending`).
- Links to `/categories` and `/alerts`.

**Known issues:**
- No legend, no data labels on bars.
- Bar fill is a hardcoded hex (`#1a1a2e`) — should pull from a CSS variable.
- Y-axis lacks currency formatting.

---

## BudgetAlerts (`/alerts`)
**Purpose:** show backend-generated alerts.

**State:** `alerts`, `loading`.

**On mount:** `api.getBudgetAlerts(month, year)`.

**UI:** map alerts to `<div class={`alert alert-${type}`}>`.

**Known issues:**
- `key={i}` in the map — anti-pattern (unstable keys on re-render). Use `alert.id` once the backend returns one, or hash the message.
- No icon per alert type.
- No dismiss/clear UX.
- If backend ever returns an unknown `type`, the corresponding `.alert-<type>` CSS class doesn't exist and the alert renders unstyled.

---

## MonthlySummary (`/summary`)
**Purpose:** end-of-month report + minimal profile + logout.

**State:** `summary`, `loading`.

**On mount:** `api.getMonthlySummary(month, year)`.

**UI:**
- 4 cards: Income, Spent, Saved (green/red), Highest Expense.
- Reads `localStorage.getItem('user')` to render `username`.
- "Update Income / Budget" button → navigates to setup pages.
- "Log Out" button: `localStorage.clear()` → `navigate('/')`.

**Known issues:**
- Always shows the *current* month — no month/year picker.
- Logout has no confirmation dialog.
- Username display assumes `localStorage.user` is valid JSON; a corrupted entry crashes the page.
