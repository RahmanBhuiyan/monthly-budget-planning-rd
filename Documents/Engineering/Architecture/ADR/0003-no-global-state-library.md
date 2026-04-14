---
adr: 0003
title: No global state library on the frontend (local useState only)
status: Accepted
date: 2026-04-14
deciders: [project owner]
---

# ADR 0003: No global state library on the frontend

## Status
Accepted

## Context
React applications routinely reach for a global state container (Redux, Zustand, Jotai, MobX) or React Context for cross-component data. The Smart Expense & Budget Tracker has 12 pages and one shared component (`BottomNav`). State that crosses page boundaries today consists of: the JWT and user object (in `localStorage`).

We had to decide whether to introduce a global state library, use React Context, or keep state strictly local to each page.

## Decision
**Local component state only.** No Redux, Zustand, Jotai, MobX, or React Context for v1. Cross-cutting state lives in `localStorage` (auth token + user) and is read where needed.

## Alternatives considered

| Option | Pros | Cons | Why not |
|--------|------|------|---------|
| Redux Toolkit | Mature, huge ecosystem, time-travel debugging, well-known patterns | Boilerplate per slice; conceptual overhead; overkill for 12-page app | Wrong tool for the size |
| Zustand | Minimal API, no provider, familiar hook surface | Adds a dependency; team has to learn one more thing | The thing it solves doesn't exist for us yet |
| React Context | Built-in; no dep; familiar | Re-render footgun (every consumer re-renders on any value change); worse DevTools story | Reach for this *before* a library if state-sharing genuinely needed |
| Server-state libraries (React Query, SWR) | Eliminates a lot of "fetch + cache + invalidate" boilerplate | Adds a dep; another concept to learn; doesn't replace state mgmt | Worth revisiting if/when we add a real cache need |

## Consequences

**Positive:**
- Zero dependencies added. The bundle stays small.
- New contributors don't need to learn a state-management library before touching code.
- Each page is self-contained — easy to read, easy to delete, easy to test in isolation.
- No "where is this state coming from" archaeology. `useState` declarations are visible at the top of the component.

**Negative:**
- **Each page re-fetches on mount.** Switching `/dashboard` → `/expenses` → `/dashboard` triggers two `getMonthlySummary` calls. Acceptable at v1 traffic; would need React Query or similar at scale.
- **Implicit shared state lives in `localStorage`.** Pages can't react to a logout that happened in another tab without a `storage` event listener (which we don't have).
- **Auth check repeated.** Every protected page reads `localStorage.getItem('token')` and handles 401 itself — duplication noted in `Documents/Engineering/Frontend/Architecture.md` §6, FEAT-5 in the ticket inventory.
- **No cross-page invalidation.** Adding an expense from `/expenses/add` doesn't notify `/dashboard` to refetch. Today this is hidden because the user navigates between pages and triggers a fresh fetch each time.

**Neutral:**
- The decision keeps the door open. Adding a library later is straightforward; removing one would have been the painful direction.

## Triggers for revisit
- If we introduce real-time updates (a notification feed, live dashboard) that need pushing to multiple pages simultaneously.
- If three or more pages start needing identical data and the duplicate-fetch cost is measurable.
- If we add a "shopping cart"-style accumulator that persists across navigation.
- If multi-tab consistency becomes a user-visible bug.

When triggered, **prefer React Context first** (built-in, no dep). Reach for Zustand only if Context's re-render behavior becomes a real problem.

## References
- `Documents/Engineering/Frontend/Architecture.md` §5
- `Documents/Engineering/Frontend/PagesGuide.md` (per-page state declarations)
- `Documents/Project/ticket-inventory.md` FEAT-5 (response interceptor — closest related ticket)
