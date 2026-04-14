---
adr: 0002
title: JWT stored in localStorage with Bearer-token Axios interceptor
status: Accepted (acknowledged-debt)
date: 2026-04-14
deciders: [project owner]
---

# ADR 0002: JWT stored in localStorage with Bearer-token Axios interceptor

## Status
Accepted (acknowledged-debt). Likely to be **superseded** when we move to httpOnly cookies — see `Documents/Project/ticket-inventory.md` FEAT-7.

## Context
The frontend needs to authenticate API calls. The backend uses Flask-JWT-Extended with HS256 and a 24-hour expiry (`Documents/Engineering/Backend/Architecture.md` §6).

Two storage options for the JWT on the browser side:
1. **localStorage / sessionStorage** + `Authorization: Bearer <jwt>` header on every request.
2. **httpOnly Secure SameSite=Strict cookie**, automatically sent by the browser on same-origin requests, with CSRF token defense.

Option 1 is the simpler implementation. Option 2 is the more secure default.

This decision was made implicitly during the prototype build. We're recording it now so the trade-off is explicit and the path to changing it is clear.

## Decision
Store the JWT in `localStorage` under the key `token`. Attach it via an Axios request interceptor (`frontend/src/services/api.js`).

## Alternatives considered

| Option | Pros | Cons | Why not (yet) |
|--------|------|------|---------------|
| httpOnly cookie + CSRF | XSS cannot read the token; browser handles attachment | Backend must read from cookie not header; CSRF token machinery on every state-changing request; CORS preflight more complex; testing harder | Multi-PR change touching every API call site and the auth layer; deferred until v1 hardening |
| In-memory only (React state) | XSS still can't exfiltrate easily; no persistence beyond tab | Token lost on every page reload — user is logged out — abysmal UX | UX cost too high for the security gain at our scale |
| OAuth/OIDC with an external provider | Best long-term; no password handling | Onboarding cost (Auth0, Clerk, etc.); cost; another vendor | Out of scope for v1; could be a v2 path |

## Consequences

**Positive:**
- Trivial to implement and reason about.
- Bearer tokens make CSRF a non-issue (the attacker can't read the token without XSS, and without the token they can't forge a request).
- Stateless backend — no server-side session store needed.
- Fits naturally with `react-router-dom` SPA navigation (no full page reloads to lose state).

**Negative:**
- **XSS theft is the threat.** Any successful XSS attack — first-party, third-party script, malicious npm package — can read `localStorage` and exfiltrate the JWT. Cataloged as `SEC-7` in `Documents/Security/SecurityAndThreatModel.md`.
- **No revocation list.** A stolen token is valid until it expires (24h). The only mitigation is rotating `JWT_SECRET_KEY`, which logs every user out.
- **Each frontend page open-codes 401 handling.** Without a global response interceptor, every page repeats the localStorage clear + redirect (gap noted in `Documents/Engineering/Frontend/Architecture.md` §6).

**Neutral:**
- This decision constrains *where* CSRF protection is needed (nowhere today) but *enables* needing it later (when we move to cookies).

## Triggers for revisit
- Before any production launch with non-friend users — the XSS surface becomes real.
- If we ever introduce `dangerouslySetInnerHTML` or third-party widgets that execute arbitrary JS in our origin.
- If we add a "remember me" flow longer than 24 hours — refresh tokens are awkward in localStorage.
- If we need same-origin SSR — cookies become the more natural fit.

## Mitigation we're applying today
- `dangerouslySetInnerHTML` is forbidden (`Documents/Process/CodeStandardAndGuide.md` §3.5).
- Adding any new npm dependency goes through `RACI.md` W5 (license + CVE check).
- The CSP for the production deployment will restrict `script-src` to first-party only (TBD — open as a `chore/csp-headers` ticket once deploying).

## References
- `Documents/Security/SecurityAndThreatModel.md` §3.3, SEC-7
- `Documents/Engineering/Frontend/Architecture.md` §6, §7
- `Documents/Project/ticket-inventory.md` FEAT-7 (the future change)
- OWASP cheat sheet on JWT storage (web search)
