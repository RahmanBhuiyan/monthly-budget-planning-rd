# Frontend Architecture

> Companion to `Documents/Frontend/PagesGuide.md`, `ComponentsGuide.md`, and `StylingGuide.md`. For the cross-cutting standards (functional components, ESLint, Prettier), see `Documents/CodeStandardAndGuide.md` §2.

## 1. Stack
- **Framework:** React 19.2.5 (CRA — Create React App, JavaScript not TypeScript)
- **Routing:** react-router-dom v7
- **HTTP:** Axios (request interceptor for JWT)
- **Charts:** Recharts (chosen over Chart.js — see `Documents/TechnologyStack.md`)
- **Icons:** react-icons (Heroicons set, `react-icons/hi`)
- **State:** local component state only — no Redux/Zustand/Context
- **Styling:** plain CSS in a single `App.css`
- **Dev port:** **7575** (must be set explicitly — `Documents/SetupAndDeployment.md` §3)

## 2. Folder layout
```
frontend/
  package.json
  package-lock.json
  GEMINI.md                # frontend governance
  public/
    index.html             # CRA HTML shell
  src/
    index.js               # ReactDOM.createRoot, StrictMode, mounts <App />
    App.js                 # router + conditional <BottomNav />
    App.css                # ALL global styles (no per-component CSS modules)
    services/
      api.js               # Axios instance + every API method
    components/
      BottomNav.js         # nav (sidebar on desktop, bottom bar on mobile)
    pages/
      Welcome.js
      Login.js
      Signup.js
      IncomeSetup.js
      BudgetSetup.js
      Dashboard.js
      AddExpense.js
      ExpenseList.js
      Categories.js
      MonthlyAnalysis.js
      BudgetAlerts.js
      MonthlySummary.js
```

## 3. Application bootstrap

### `src/index.js`
```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
StrictMode is on — be aware that effects run twice in development. Don't rely on side-effects firing only once.

No global error boundary. A render error anywhere in the tree blanks the page. Adding `<ErrorBoundary>` around `<App />` is a reasonable v1 polish ticket.

### `src/App.js`
```jsx
function App() {
  const location = useLocation();
  const hideNavOn = ['/', '/login', '/signup'];
  const showNav   = !hideNavOn.includes(location.pathname);

  return (
    <>
      <Routes>
        {/* 12 routes, see PagesGuide */}
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}
```

**Gaps:**
- No catch-all `<Route path="*" element={<NotFound />} />`. Bad URLs render an empty `<Routes>` (silently blank).
- No route guards. Pages handle 401 manually inside their `useEffect`. Should be either a `<RequireAuth>` wrapper or a global Axios response interceptor.

## 4. Routing

| # | Route | Page component | Auth required |
|---|-------|---------------|---------------|
| 1 | `/` | Welcome | no |
| 2 | `/login` | Login | no |
| 3 | `/signup` | Signup | no |
| 4 | `/setup/income` | IncomeSetup | yes |
| 5 | `/setup/budget` | BudgetSetup | yes |
| 6 | `/dashboard` | Dashboard | yes |
| 7 | `/expenses/add` | AddExpense | yes |
| 8 | `/expenses` | ExpenseList | yes |
| 9 | `/categories` | Categories | yes |
| 10 | `/analysis` | MonthlyAnalysis | yes |
| 11 | `/alerts` | BudgetAlerts | yes |
| 12 | `/summary` | MonthlySummary | yes |

"Auth required" today means "the page itself checks `localStorage.getItem('token')` and redirects on 401" — there is no router-level guard.

## 5. State management

**No global state library.** All state is local (`useState` inside the page). Trade-offs:
- ✓ Simple. No boilerplate. New contributors don't need to learn a state library.
- ✗ Each page re-fetches on mount. No cache. Switching `/dashboard` → `/expenses` → `/dashboard` triggers two summary fetches.
- ✗ Logout / login state is implicit (read from `localStorage`). No subscriber pattern — pages can't react to a logout that happened in another tab.

For v1 this is fine. If a user-list or shared-cache need appears, reach for React Context first; only escalate to Zustand/Redux if Context isn't enough.

## 6. The Axios client (`src/services/api.js`)

Single Axios instance with:
- `baseURL: 'http://localhost:7576/api/v1'` — **hardcoded**. Should read from `process.env.REACT_APP_API_BASE_URL` (gap, deployment-blocker).
- `Content-Type: application/json` default header.
- **Request interceptor:** reads JWT from `localStorage` and adds `Authorization: Bearer <token>`.
- **No response interceptor.** Each page handles 401 manually:
  ```js
  if (err.response?.status === 401) {
    localStorage.removeItem('token');
    navigate('/login');
  }
  ```

This duplication is a polish ticket — a single response interceptor would replace ~12 copies of the same logic.

Every API call is exported as a named function:
```js
signup(data), login(data),
setIncome(data), getIncome(month, year),
setBudget(data), getBudget(month, year),
addExpense(data), getExpenses(month, year), deleteExpense(id),
getMonthlySummary(month, year), getCategoryBreakdown(month, year), getBudgetAlerts(month, year)
```
Pages import only what they need from `../services/api`. **No bare `fetch()` or inline Axios elsewhere.** Enforce in code review.

## 7. Authentication (frontend perspective)

```
1. User submits Login form.
2. api.login({email, password}) → { token, user }.
3. localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)).
4. Axios interceptor picks up the token from localStorage on subsequent calls.
5. On 401 (token expired or invalid), the page clears localStorage and navigates to /login.
6. Logout = localStorage.clear() + navigate('/').
```

**Security implication:** localStorage is readable by any JS that runs in the page (including injected scripts). The XSS surface is the JWT theft vector — covered in `Documents/SecurityAndThreatModel.md` §3.3.

## 8. Data fetching pattern

Pages use the same shape:
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const month = new Date().getMonth() + 1;
  const year  = new Date().getFullYear();
  api.getMonthlySummary(month, year)
    .then(res => setData(res.data))
    .catch(err => {
      if (err.response?.status === 401) { /* logout-redirect */ }
      // else: silently swallowed today — gap
    })
    .finally(() => setLoading(false));
}, []);
```

**Watch-outs:**
- `new Date()` recomputed inside the effect closure but *captured* — fine.
- `useEffect(..., [])` is intentional; we don't want refetch-on-render. If you need refetch-on-something, add it to the dep array, don't add `month/year` (they don't change).
- Non-401 errors are dropped on the floor today. Pages should set an `error` state and render it. Polish ticket.

## 9. Responsive layout

Mobile-first. Single CSS file (`App.css`) with media queries:
- Default styles target ≤480px.
- `@media (min-width: 768px)` switches to a sidebar layout (`<BottomNav />` becomes a vertical sidebar via CSS).
- `@media (min-width: 1200px)` adds wider grids.

`<BottomNav />` renders one DOM tree; CSS controls whether it appears as bottom nav (mobile) or sidebar (desktop). See `StylingGuide.md`.

## 10. Charts

Recharts only. The single chart usage is `<BarChart>` in `MonthlyAnalysis.js`. If you need a new chart type:
1. Use Recharts.
2. Do **not** install Chart.js, Victory, Nivo, or anything else (`Documents/CodeStandardAndGuide.md` §2.7).

## 11. Where to put new code

| You're adding... | It goes in... |
|------------------|---------------|
| A new page (top-level route) | `src/pages/<Name>.js` + register in `App.js` |
| A reusable widget used by ≥2 pages | `src/components/<Name>.js` |
| A widget used by exactly one page | inline in that page until the second consumer appears |
| An API call | a new exported function in `src/services/api.js` |
| A formatting utility | new file in `src/utils/` (folder doesn't exist yet — create it) |
| A custom hook | `src/hooks/useThing.js` (folder doesn't exist yet) |
| A new env var | `package.json` start script + `Documents/SetupAndDeployment.md` §4 |

## 12. Known frontend gaps (recap)
| Gap | Where | SRS ref |
|-----|-------|---------|
| Hardcoded API URL | `services/api.js` | §6 SEC-7 area |
| Hardcoded categories | `pages/AddExpense.js` | §3 |
| No 401 response interceptor | `services/api.js` | docs gap |
| No catch-all 404 route | `App.js` | docs gap |
| Optimistic delete with no rollback | `pages/ExpenseList.js` | §6 background |
| Timezone-unsafe date parsing | `pages/ExpenseList.js` | §6 background |
| `BottomNav` uses `<div onClick>` — accessibility | `components/BottomNav.js` | a11y gap |
| Index-as-key in `BudgetAlerts` | `pages/BudgetAlerts.js` | quality gap |
