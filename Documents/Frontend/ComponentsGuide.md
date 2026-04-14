# Components Guide

> Today there is exactly one shared component: `<BottomNav />`. This doc covers it in full and lays out the rules for adding more so the `components/` folder doesn't drift into a junk drawer.

## Inventory

| Component | File | Used by |
|-----------|------|---------|
| `BottomNav` | `src/components/BottomNav.js` | every authenticated page (rendered conditionally in `App.js`) |

That's the entire list. Page-specific UI lives inside the page (`src/pages/<Name>.js`) until it's needed by a second page.

---

## `BottomNav`

**Purpose:** primary navigation. Renders as a horizontal bar at the bottom on mobile, as a vertical sidebar on desktop. The DOM is one tree; CSS controls the visual mode.

**File:** `src/components/BottomNav.js`

**Props:** none. The component reads the current route via `useLocation()` for active-state highlighting.

**Nav data (hardcoded inside the component):**

```js
const mainNav = [
  { path: '/dashboard',    icon: HiHome,           label: 'Home'    },
  { path: '/expenses/add', icon: HiPlusCircle,     label: 'Add'     },
  { path: '/analysis',     icon: HiChartBar,       label: 'Reports' },
  { path: '/summary',      icon: HiUser,           label: 'Profile' },
];

const sidebarExtra = [
  { path: '/expenses',     icon: HiClipboardList,  label: 'Expenses'   },
  { path: '/categories',   icon: HiViewGrid,       label: 'Categories' },
  { path: '/alerts',       icon: HiBell,           label: 'Alerts'     },
  { path: '/setup/income', icon: HiCurrencyDollar, label: 'Income'     },
];
```

**Render shape:**
- One `<div class="sidebar">` for desktop, with `mainNav` then a separator then `sidebarExtra`.
- One `<div class="bottom-nav">` for mobile, with only `mainNav`.
- CSS shows/hides each based on viewport.

**Active-state detection:** exact path match — `location.pathname === item.path`.

### Known issues

| Issue | Impact | Fix sketch |
|-------|--------|------------|
| Uses `<div onClick={...}>` instead of `<Link>` or `<button>` | Not keyboard-navigable, no semantic role | Replace with `<NavLink>` from react-router-dom (gives active state for free too) |
| No `aria-label` on icon-only mobile items | Screen-reader users can't identify items | Add `aria-label={label}` |
| Missing `<nav role="navigation">` wrapper | Same | Wrap output in `<nav>` |
| `sidebarExtra` items have no mobile equivalent | Mobile users can't reach Expenses, Categories, Alerts, Income | Either add a "More" sheet, or hoist them into the page itself |
| Active match is exact | `/expenses/add` does not highlight `/expenses` parent | Use `<NavLink>` (handles partial matching) or check `startsWith` |

A single PR can address all six. Tag scope `ui`.

---

## When to add a new component

A page-local widget gets promoted to `components/` when **any of**:
- It's now used by ≥2 pages.
- It owns non-trivial state that's repeated verbatim in multiple places.
- It encapsulates a UI primitive that should be consistent app-wide (a `<MoneyDisplay>`, a `<MonthYearPicker>`, a `<Confirm>` dialog).

Don't pre-extract. Three similar lines in two pages is fine; it becomes a problem at four.

## Component conventions

- **One component per file.** Filename `PascalCase.js` matches the export.
- **Functional only.** No class components.
- **Props down, callbacks up.** No prop drilling deeper than 2 levels — if you need to, lift the state up or pass a context.
- **No defaultProps.** Use destructured defaults: `function Card({ title = '', children })`.
- **PropTypes / TypeScript:** not used today. If you add the first one, do it for *all* new components going forward — selective typing is worse than none.
- **Styling:** add classes in `App.css` (the project doesn't use CSS modules or styled-components). Class names are kebab-case. See `Frontend/StylingGuide.md`.
- **No business logic in components.** Money math belongs in the API/backend or in `src/utils/`. A component that knows the budget-warning threshold is a smell.

## Suggested near-term components (not built yet)

These would each pay for themselves quickly:

| Component | Why |
|-----------|-----|
| `<MoneyDisplay value={...} />` | Centralizes the `$1,234.50` format. Currently every page does its own `toFixed(2)`. |
| `<LoadingButton onClick={...} loading={...}>` | Disables itself + shows spinner while pending. Removes double-submit risk on every form. |
| `<MonthYearPicker value={...} onChange={...} />` | Unblocks historical viewing on Dashboard / Summary (`SRS.md §6.12`). |
| `<ErrorBanner error={...} />` | Replaces inline `{error && <p>...</p>}`. One place to standardize the look. |
| `<RequireAuth>` | Wraps protected routes so each page doesn't open-code its own 401-handling. |

Open as separate `feature/` tickets when needed; don't ship them all in one PR.
