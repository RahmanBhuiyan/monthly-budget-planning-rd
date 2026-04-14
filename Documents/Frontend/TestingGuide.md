# Frontend Testing Guide

> Companion to `Documents/TestingStrategy.md`. Implementation lives on a separate `feature/test-suite-baseline` branch.

## 1. Tooling

Already installed (from `package.json`):
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/dom`
- `@testing-library/user-event`
- Jest (via `react-scripts`)

Add for HTTP mocking (when ready):
```bash
cd frontend
npm install --save-dev axios-mock-adapter
```

Run:
```bash
npm test                            # watch mode (default)
npm test -- --watchAll=false        # CI mode (single pass)
npm test -- --coverage              # with coverage report
```

Target coverage: ≥70% on `src/pages/` and `src/services/`. No gate on `src/index.js` or `App.js` (configuration code).

## 2. File layout

CRA's convention: tests sit alongside the source.

```
src/
  pages/
    Dashboard.js
    Dashboard.test.js
    AddExpense.js
    AddExpense.test.js
    ...
  services/
    api.js
    api.test.js
  components/
    BottomNav.js
    BottomNav.test.js
  test-utils/                       # NEW — shared helpers
    renderWithRouter.js
    mockApi.js
```

CRA picks up anything matching `*.test.js` automatically.

## 3. The two essential helpers

### `src/test-utils/renderWithRouter.js`

Almost every page reads `useNavigate` / `useLocation`, so plain `render(<Page />)` crashes. Wrap once:

```jsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, '', route);
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
```

### `src/test-utils/mockApi.js`

Centralize Jest mocks of `services/api`:

```js
jest.mock('../services/api');
import * as api from '../services/api';

export function mockApi(overrides = {}) {
  Object.entries(overrides).forEach(([fn, value]) => {
    api[fn].mockResolvedValue({ data: value });
  });
  return api;
}

export function mockApiError(fn, status = 500, body = {}) {
  api[fn].mockRejectedValue({ response: { status, data: body } });
}
```

Then in tests:
```js
import { mockApi, mockApiError } from '../../test-utils/mockApi';

mockApi({ getMonthlySummary: { summary: { income: 5000, ... } } });
mockApiError('login', 401, { error: 'Invalid credentials' });
```

## 4. Sample: page render smoke tests

`src/pages/Dashboard.test.js`:

```jsx
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../test-utils/renderWithRouter';
import { mockApi } from '../test-utils/mockApi';
import Dashboard from './Dashboard';

beforeEach(() => {
  localStorage.setItem('token', 'fake-jwt');
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('Dashboard renders summary cards', async () => {
  mockApi({
    getMonthlySummary: {
      summary: { income: 5000, budget_remaining: 3500, total_spent: 1500 },
    },
  });

  renderWithRouter(<Dashboard />);

  // Loading first
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Then the cards
  await waitFor(() => expect(screen.getByText('$5000.00')).toBeInTheDocument());
  expect(screen.getByText('$3500.00')).toBeInTheDocument();
  expect(screen.getByText('$1500.00')).toBeInTheDocument();
});

test('Dashboard logs out and redirects on 401', async () => {
  mockApiError('getMonthlySummary', 401);
  renderWithRouter(<Dashboard />);

  await waitFor(() => expect(localStorage.getItem('token')).toBeNull());
});
```

Pattern: every page gets at least one render-with-data test and one 401-handling test.

## 5. Sample: form submit

`src/pages/Login.test.js`:

```jsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test-utils/renderWithRouter';
import { mockApi, mockApiError } from '../test-utils/mockApi';
import Login from './Login';

test('Login stores token and redirects on success', async () => {
  mockApi({
    login: { token: 'jwt-abc', user: { id: 1, username: 'alice', email: 'alice@example.com' } },
  });

  renderWithRouter(<Login />);

  await userEvent.type(screen.getByPlaceholderText(/email/i), 'alice@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'pw12345');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));

  await waitFor(() => expect(localStorage.getItem('token')).toBe('jwt-abc'));
});

test('Login shows error on 401', async () => {
  mockApiError('login', 401, { error: 'Invalid email or password' });

  renderWithRouter(<Login />);

  await userEvent.type(screen.getByPlaceholderText(/email/i), 'wrong@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'badpw');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));

  await waitFor(() => expect(screen.getByText(/invalid/i)).toBeInTheDocument());
  expect(localStorage.getItem('token')).toBeNull();
});
```

## 6. Sample: ExpenseList delete behavior

Pin the **silent failure** issue (`Frontend/PagesGuide.md` ExpenseList "Known issues"):

```jsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test-utils/renderWithRouter';
import { mockApi, mockApiError } from '../test-utils/mockApi';
import ExpenseList from './ExpenseList';

beforeEach(() => localStorage.setItem('token', 'fake-jwt'));
afterEach(() => { localStorage.clear(); jest.clearAllMocks(); });

const sampleExpenses = {
  expenses: [
    { id: 1, amount: 15.5, category: 'Food', note: 'Lunch', date: '2026-04-14' },
    { id: 2, amount:  3.0, category: 'Travel', note: 'Bus',  date: '2026-04-14' },
  ],
};

test('Delete success removes the expense from the list', async () => {
  mockApi({ getExpenses: sampleExpenses, deleteExpense: { message: 'Expense deleted' } });

  renderWithRouter(<ExpenseList />);
  await waitFor(() => expect(screen.getByText(/lunch/i)).toBeInTheDocument());

  await userEvent.click(screen.getAllByRole('button', { name: /x/i })[0]);

  await waitFor(() => expect(screen.queryByText(/lunch/i)).toBeNull());
});

test('Delete failure leaves the expense visible (current behavior — gap)', async () => {
  mockApi({ getExpenses: sampleExpenses });
  mockApiError('deleteExpense', 500);

  renderWithRouter(<ExpenseList />);
  await waitFor(() => expect(screen.getByText(/lunch/i)).toBeInTheDocument());

  await userEvent.click(screen.getAllByRole('button', { name: /x/i })[0]);

  // The expense is still on screen because the API call failed BEFORE the state update.
  // This is the current correct behavior — no rollback needed (it never disappeared).
  // GAP: there is also no user-visible error message.
  await new Promise(r => setTimeout(r, 50));
  expect(screen.getByText(/lunch/i)).toBeInTheDocument();
});
```

The second test documents current behavior. When the UX is improved (visible error toast on failure), update the assertion to also check for the toast.

## 7. Sample: routing smoke

`src/App.test.js`:

```jsx
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import App from './App';

test.each([
  ['/',          /smart expense/i],
  ['/login',     /log in/i],
  ['/signup',    /sign up/i],
])('App renders %s without crashing', (path, expected) => {
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
  expect(screen.getByText(expected)).toBeInTheDocument();
});
```

Authenticated routes (Dashboard etc.) need a token in `localStorage` AND mocked API responses; cover those in their per-page tests rather than here.

## 8. What NOT to test

- React Router internals, Axios internals, react-icons rendering — trust the libraries.
- CSS layout (snapshot tests on rendered HTML) — brittle, low signal. Use visual regression only when a real bug demands it.
- BottomNav highlight CSS — not testable without a full layout engine; rely on visual inspection.
- Recharts SVG output — we're testing the data going *in*, not Recharts' rendering.

## 9. Conventions

- Test name reads as a sentence: `'Login stores token and redirects on success'`.
- One scenario per test. If you find yourself writing "and also" in the test name, split it.
- Prefer `*ByRole`, `*ByLabelText`, `*ByPlaceholderText` over `*ByTestId`. Add `data-testid` only as last resort.
- Always `await` user interactions (`userEvent` is async in v14+).
- Always clean up `localStorage` in `afterEach`.

## 10. CI gate (when CI exists)

Block merge if:
- `npm test -- --watchAll=false` exits non-zero.
- Coverage on `src/pages/` or `src/services/` drops below 70%.

## 11. E2E (Playwright) — deferred

Out of v1 scope (`TestingStrategy.md` §4). When added:
- One scenario per release: signup → set income → set budget → add expense → see dashboard reflect it.
- Run against a real backend bound to an ephemeral DB.
- Not in the per-PR loop — gate per release tag instead.
