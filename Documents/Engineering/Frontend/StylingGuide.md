# Styling Guide

> Applies to all CSS in `frontend/src/`. The current convention is **a single `App.css`** with global, semantic class names. No CSS modules, no styled-components, no Tailwind. This is a deliberate v1 choice for simplicity.

## 1. Approach

- **One file:** `src/App.css`. New styles go in here, organized by section (page-level / component-level / utility / responsive).
- **Mobile-first:** base styles target ≤480px viewports; larger breakpoints widen via `@media (min-width: ...)`.
- **Semantic class names:** describe the *thing*, not the *look*. `.expense-amount` good. `.text-red-bold` bad.
- **Kebab-case** for class names (`.bottom-nav`, `.alert-warning`).
- **No inline styles** except for genuinely dynamic values (e.g. a chart bar fill computed at render time).

## 2. Color palette

| Role | Token | Notes |
|------|-------|-------|
| Primary dark | `#1a1a2e` | App bg, sidebar, primary buttons |
| Primary mid | `#16213e` | Section bg gradients |
| Primary deep | `#0f3460` | Sidebar bg, gradient anchor |
| Accent / link | `#4fc3f7` | CTA buttons, active states |
| Accent light | `#81d4fa` | Button gradient end |
| Success | `#27ae60` | Positive amounts, success alerts |
| Danger | `#e74c3c` | Negative balances, errors, critical alerts |
| Warning | `#ffc107` | Warning alerts |
| Suggestion | `#8e44ad` | Suggestion alert background |
| Background light | `#f8f9fa`, `#f0f2f5` | Card bg, page bg |
| Border / divider | `#e9ecef`, `#ddd` | Card borders |
| Text dark | `#222` | Primary text |
| Text muted | `#888`, `#aaa` | Secondary text, placeholders |

These hex values are scattered through `App.css` today. **A near-term refactor should hoist them to CSS custom properties** on `:root`:

```css
:root {
  --color-primary-dark:  #1a1a2e;
  --color-accent:        #4fc3f7;
  --color-success:       #27ae60;
  --color-danger:        #e74c3c;
  /* etc. */
}
```

Then use `var(--color-success)` everywhere. Easier theming, easier dark-mode later, and any drift is caught by a single search.

## 3. Typography

- **Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. System fonts only — no web font dependency.
- **Weights used:** 500, 600, 700, 800. Don't introduce 400 or 900 unless a design genuinely needs them.
- **Welcome page** uses `clamp()` for fluid sizing — `clamp(2rem, 6vw, 3rem)` style. Replicate this pattern for any future hero text.
- Body text default sits around 15–16px depending on viewport.

## 4. Spacing

No formal scale today. Sizes come up ad-hoc (`8px`, `12px`, `16px`, `20px`, `24px`). Stick to multiples of 4 when adding new spacing. If/when refactoring to CSS variables, define a scale:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

## 5. Breakpoints

```css
/* default — mobile, ≤480px */

@media (min-width: 768px) {
  /* tablet / small desktop — sidebar appears, 2-col grids */
}

@media (min-width: 1200px) {
  /* large desktop — 3-col grids, more padding */
}
```

Magic numbers `480`, `768`, `1200` are intentional. If you reach for a fourth breakpoint, stop and ask whether the layout is over-customized.

## 6. Component class catalog

A non-exhaustive map of the conventions in `App.css`. Use these names; don't invent parallel ones.

### Layout
- `.page` — main page container, includes `padding-bottom: 80px` to clear the bottom nav on mobile
- `.sidebar` — desktop sidebar (hidden under 768px)
- `.bottom-nav` — mobile bottom navigation (hidden at 768px+)
- `.nav-item` — single nav entry (icon + label)

### Cards
- `.card` — generic card with border, padding, white bg
- `.category-card`, `.expense-item` — specialized cards for category/expense lists

### Buttons
- `.btn` — base button
- `.btn-primary` — solid accent
- `.btn-outline` — bordered
- `.btn-danger` — destructive
- `.btn-sm` — small variant

### Forms
- `.form-group` — label + input wrapper (also targets nested `input`, `select`, `textarea`)

### Alerts
- `.alert` — base
- `.alert-info` / `.alert-success` / `.alert-warning` / `.alert-critical` / `.alert-suggestion`
- These class names mirror the backend's alert `type` values — keep them in sync.

### Auth pages
- `.auth-page`, `.auth-card`, `.auth-logo`, `.auth-title`, `.auth-subtitle`, `.auth-link`

### Welcome
- `.welcome-page`, `.welcome-content`, `.welcome-title`, `.welcome-features`, `.welcome-btn`

### Charts
- `.chart-container`, `.chart-title`

### Misc
- `.expense-info`, `.expense-note`, `.expense-amount`, `.date-header`
- `.category-name`, `.category-amount`

## 7. Money display

There is no shared money-formatting CSS or component today. Every page does inline `toFixed(2)` and template literals. **All money should display with two decimals and a leading `$`** (US-style — locale-aware formatting is out of v1 scope).

Standard form: `$1,234.50` (with thousands separator). Today most code emits `$1234.50` (no separator). A `formatCurrency()` utility + a `<MoneyDisplay>` component would fix this in one PR — see `Engineering/Frontend/ComponentsGuide.md` "Suggested near-term components".

## 8. Animations

- Color transitions: `0.2s` linear.
- Button press: `transform: scale(0.98)`.
- Card hover (desktop): subtle `box-shadow` lift.
- Don't introduce a CSS-in-JS animation library. If you need keyframes, write `@keyframes` in `App.css`.

## 9. Accessibility minimums

The current styles meet the basics but could be tightened:

- **Focus states** — every interactive element must have a visible focus ring. `BottomNav` items currently don't (uses `<div onClick>`). Fix is a Components ticket.
- **Color contrast** — primary text on white passes WCAG AA. Muted gray (`#888`) on white is borderline; do not use for body copy, only for secondary metadata.
- **Tap targets** — minimum 44×44px for any tappable element on mobile. Buttons in the current CSS comfortably exceed this; verify when adding new icon-only controls.
- **Reduced motion** — no `prefers-reduced-motion` handling today. Add when the first complex animation lands.

## 10. What NOT to introduce (without explicit discussion)

- A second styling system (Tailwind, styled-components, CSS modules, emotion).
- A theming library — CSS custom properties + an optional `data-theme` attribute is enough.
- A second icon library (`react-icons` is established; sub-packs within it are fine).
- Inline `style={{...}}` for static values — use a class.
- `!important` — solve the specificity problem instead.

## 11. The path to dark mode (when prioritized)

1. Hoist the palette to CSS custom properties on `:root`.
2. Define a `[data-theme="dark"]` block that overrides those variables.
3. Add a toggle in `MonthlySummary` (the closest thing to a Settings page).
4. Persist the choice in `localStorage` under a non-sensitive key (e.g. `theme`).
5. Read it on app boot in `index.js` and set `document.documentElement.dataset.theme`.

This is a single feature PR once the palette is variable-ified; do not attempt it before §2's refactor.
