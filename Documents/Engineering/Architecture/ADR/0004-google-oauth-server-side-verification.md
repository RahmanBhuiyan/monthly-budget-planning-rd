---
adr: 0004
title: Google OAuth login with server-side ID-token verification
status: Accepted
date: 2026-04-14
deciders: [project owner]
supersedes: []
relates_to: [0002]
---

# ADR 0004: Google OAuth login with server-side ID-token verification

## Status
Accepted. Shipped to master in commit `2a917fa` (auth code) and documented post-hoc on branch `docs/oauth-backfill` (this ADR + 10 sibling doc updates) under ticket `DOCS-3`.

This ADR partially walks back ADR 0002's "OAuth/OIDC with an external provider — out of scope for v1" line: Google sign-in is now in scope, but the email/password + JWT-in-localStorage path from ADR 0002 remains the primary auth model. Google is additive, not a replacement.

## Context
The prototype shipped with email/password auth only (`/auth/signup`, `/auth/login`). Onboarding friction was noticeable — new users had to invent a password just to try the app. Google sign-in is a low-friction alternative, and Google Identity Services (GIS) provides a drop-in button that handles the entire OAuth dance client-side, leaving the backend with one job: **verify the resulting ID token before trusting any claims**.

Three implementation shapes were considered:

1. **Server-side ID-token verification** (chosen). Frontend obtains a Google ID token via GIS, POSTs it to `/auth/google`, backend calls `id_token.verify_oauth2_token(...)` against `GOOGLE_CLIENT_ID`, then resolves to a user.
2. **Trust the frontend's claims.** Frontend decodes the ID token and POSTs `{email, sub, name}`. Backend creates the user from those fields without verification.
3. **Full OAuth Authorization Code flow with PKCE.** Backend handles the redirect, exchanges the code for tokens, etc.

## Decision
Implement **option 1** in `backend/routes/auth.py:52-109`:
- New endpoint `POST /api/v1/auth/google` accepting `{credential: <google-id-token>}`.
- Verify with `google.oauth2.id_token.verify_oauth2_token(credential, google.auth.transport.requests.Request(), GOOGLE_CLIENT_ID)`. This validates signature, audience, and expiry against Google's public key set.
- Resolve to a user via three flows: (a) existing `users.google_id == sub`, (b) existing `users.email == email` (link Google ID to that account), (c) new user with `password_hash = NULL`, `google_id = sub`, username derived from Google `name` with collision suffix.
- Issue the same `create_access_token(identity=str(user.id))` used by email/password login. From that point on, the session is identical to a password-based session.

Schema changes (`backend/models.py`):
- `users.google_id` — `VARCHAR(100)`, `UNIQUE`, nullable.
- `users.password_hash` — relaxed from `NOT NULL` to nullable.

Frontend (`frontend/src/components/GoogleLoginButton.js`):
- Reusable button that initializes GIS once `window.google` is available, renders the official Google button, and forwards the resulting credential to `api.googleLogin()`.
- Used on `Login.js` and `Signup.js` with an "OR" divider above the email form.

## Alternatives considered

| Option | Pros | Cons | Why not |
|--------|------|------|---------|
| **Trust the frontend's claims** | Simplest; no `google-auth` dependency | A malicious user can POST any `{email, sub}` and become anyone | Catastrophically insecure — rejected on principle |
| **Authorization Code flow + PKCE** | The "right" full-OAuth flow; backend never sees Google credentials | Multiple round trips; redirect handling; backend session state; significantly more code | Overkill for a personal-finance prototype that already trusts the browser-side JWT model. ID-token verification gives 99% of the security with 10% of the complexity |
| **Defer Google login entirely** | No new dependency, no new attack surface | Persistent onboarding friction; ADR 0002 had already flagged OAuth as a "v2 path" and v2 is the prototype's de facto state | We chose to bring v2 forward |

## Consequences

**Positive:**
- New users can onboard in two clicks. No password to invent or remember.
- Email-link flow means a user who originally signed up with email/password and later clicks the Google button is *not* duplicated — their accounts merge automatically (Google has already verified the email).
- `password_hash` is no longer required, which means `routes/auth.py` login (`POST /auth/login`) must short-circuit when `password_hash IS NULL` to avoid a `check_password_hash(None, ...)` crash. **This is implemented at `routes/auth.py:45`.**
- The frontend is never trusted — backend pulls the canonical identity from the verified token.

**Negative:**
- New backend dependencies: `google-auth==2.49.2`, `requests==2.32.5` (both via `google-auth`'s transport layer). Adds attack surface and supply-chain exposure.
- New env var: `GOOGLE_CLIENT_ID`. If unset in production, `/auth/google` 401s every request. Documented in `Documents/DevOps/SetupAndDeployment.md §4`.
- The frontend pulls the Google Identity Services SDK from `https://accounts.google.com/gsi/client`, an external script in the document origin. CSP planning (when added) must allow this.
- Account-linking by email assumes Google has already verified the user owns that email. True for `@gmail.com`-issued tokens, but if Google ever issues tokens with unverified emails (e.g. for some federated identity edge case), a malicious user could hijack a local account by attaching their Google identity to it. We accept this risk for v1 and documented the assumption in `SecurityAndThreatModel.md §3.1`.
- One more place to test (8 new rows in `Documents/QA/TestingChecklist.md` — I-08a..I-08g and F-13a..F-13c).

**Neutral:**
- The session model after sign-in is identical to email/password — same JWT, same `localStorage`, same `Authorization: Bearer …`. ADR 0002 still applies end-to-end.

## Triggers for revisit
- If we add a second OAuth provider (Apple, GitHub) — refactor toward a generic `/auth/oauth/<provider>` shape with shared verification scaffolding, rather than copy-pasting `/auth/google`.
- If any incident links to the email-link assumption (an attacker hijacking a local account by attaching their Google identity to it), revisit account-linking — possibly require an existing-session confirmation before linking.
- If we move JWTs out of `localStorage` (per ADR 0002's revisit conditions and `SecurityAndThreatModel.md SEC-7`), the post-Google-login storage step changes too.
- If `GOOGLE_CLIENT_ID` ever needs to differ across environments without redeploying the frontend, parameterize via `REACT_APP_GOOGLE_CLIENT_ID` (`SRS §6.14`, ticket `FEAT-14`).

## References
- `backend/routes/auth.py:52-109` — the endpoint
- `backend/models.py:8-26` — `User.google_id`, `password_hash` nullable
- `frontend/src/components/GoogleLoginButton.js` — the GIS button
- `Documents/Reference/ApiReference.md` — `POST /auth/google` contract
- `Documents/Engineering/Backend/Architecture.md §6` — verification flow
- `Documents/Security/SecurityAndThreatModel.md §3.1`, SEC-11, SEC-12
- `Documents/Engineering/Architecture/ADR/0002-jwt-in-localstorage.md` — partially walked back here
- `Documents/Project/ticket-inventory.md` DOCS-3 — this backfill ticket
- Google docs: https://developers.google.com/identity/gsi/web/guides/overview
- `id_token.verify_oauth2_token`: https://google-auth.readthedocs.io/
