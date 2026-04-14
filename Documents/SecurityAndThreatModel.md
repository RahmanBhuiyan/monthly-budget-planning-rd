# Security & Threat Model

> This is a financial application. The threat model is intentionally conservative — assume the attacker is willing to script attacks against any exposed surface. Nothing here is paranoid.

## 1. Trust boundaries

```
[ Browser (untrusted) ]
        | HTTPS (prod) / HTTP (dev only)
        v
[ Frontend SPA (untrusted — anything in JS can be tampered with) ]
        | XHR + Bearer JWT
        v
[ Flask backend (semi-trusted) ]
        | SQLAlchemy ORM
        v
[ SQLite/MySQL (trusted, but assume compromise possible) ]
```

**Implication:** every input that crosses a boundary must be validated on the receiving side. Frontend validation is UX, not security.

## 2. Assets and impact

| Asset | Confidentiality | Integrity | Availability |
|-------|----------------|-----------|--------------|
| User credentials (`password_hash`, JWTs) | HIGH | HIGH | MEDIUM |
| Financial records (income, budgets, expenses) | HIGH | HIGH | MEDIUM |
| `SECRET_KEY`, `JWT_SECRET_KEY` | CRITICAL | CRITICAL | LOW |
| Database file (SQLite) / DB credentials (MySQL) | CRITICAL | CRITICAL | HIGH |

## 3. STRIDE-light per surface

### 3.1 `/auth/signup` and `/auth/login`
| Threat | Status | Notes |
|--------|--------|-------|
| **S**poofing — attacker tries another user's password | Mitigated | Werkzeug bcrypt-style hash; rate-limit not yet present (gap) |
| **T**ampering — request body manipulated | Mitigated | Server validates; HTTPS in prod prevents wire tampering |
| **R**epudiation — user denies action | Partially | No audit log of logins (gap) |
| **I**nformation disclosure — email enumeration | **Open** | Login short-circuits when user not found → timing leak (`SRS.md §6.6`) |
| **D**enial of service — brute-force credential stuffing | **Open** | No rate limiting; no account lockout (gap) |
| **E**levation of privilege | N/A | No roles in the system |

### 3.2 `/income`, `/budget`, `/expenses`, `/reports/*` (JWT-protected)
| Threat | Status |
|--------|--------|
| Spoofing — replay another user's JWT | Mitigated by short TTL (24h) + secret signing; **no revocation list**, so a stolen token is valid until expiry |
| Tampering — modify another user's data | Mitigated by `user_id` filter inside every route handler |
| Information disclosure — enumerate other users' expense IDs | Mitigated — `DELETE /expenses/{id}` returns 404 for both "not found" and "not yours" |
| DoS — large queries (`GET /expenses` with year=1900) | **Open** — no pagination, no query bounds (gap) |

### 3.3 Frontend (JWT in `localStorage`)
| Threat | Status |
|--------|--------|
| XSS → token theft | **Open** — any successful XSS exfiltrates the JWT; `dangerouslySetInnerHTML` is not currently used (good), but the storage choice itself is the weakness |
| CSRF | Mitigated by Bearer-token model (CSRF needs ambient credentials like cookies) |
| Phishing / credential reuse | Out of scope at the app level |

**Recommendation:** move JWT to an `httpOnly; Secure; SameSite=Strict` cookie + add a CSRF token. This is a multi-PR change — backend has to read from cookie, frontend has to drop the Axios interceptor, and CORS preflight has to allow credentials.

## 4. Known weaknesses (linked to SRS gaps)

| ID | Weakness | Severity | Fix lives at |
|----|----------|----------|--------------|
| SEC-1 | Hardcoded dev secret fallbacks in `app.py` (`'dev-secret'`, `'jwt-dev-secret'`) | HIGH | `SRS.md §6.2` |
| SEC-2 | Login timing attack reveals which emails exist | LOW–MED | `SRS.md §6.6` |
| SEC-3 | No password complexity / length validation | MED | `SRS.md §6.7` |
| SEC-4 | No email format validation (accepts arbitrary strings) | LOW | `SRS.md §6.7` |
| SEC-5 | No rate limiting on auth endpoints | MED | new ticket |
| SEC-6 | No pagination on `GET /expenses` (DoS via huge result set) | LOW | new ticket |
| SEC-7 | JWT in `localStorage` — XSS-exposed | MED | new ticket (large change) |
| SEC-8 | `app.run(debug=True)` hardcoded — Werkzeug debugger is RCE if it ever ships | HIGH (if deployed) | new ticket |
| SEC-9 | CORS allow-list hardcoded to one origin — can't deploy without code change | LOW | new ticket |
| SEC-10 | No HTTPS at the app layer (must be terminated upstream) | INFRA | deployment runbook |

## 5. Secrets management
- **Today:** `.env` files, gitignored. Defaults in `app.py` for dev convenience.
- **Required for prod:**
  - Fail-fast on missing env vars (no `'dev-secret'` fallback).
  - Distinct `SECRET_KEY` and `JWT_SECRET_KEY` per environment.
  - `JWT_SECRET_KEY` rotation procedure (planned, not documented).
- **Never commit:** `.env`, `*.db`, `*.sqlite3`, dump files, anything matching `.gitignore`.

## 6. Cryptography
- **Passwords:** Werkzeug's `generate_password_hash` (PBKDF2-SHA256 by default, ≥260000 iterations on current versions). Acceptable for v1; revisit if Argon2 is mandated.
- **JWT:** HS256 signing with `JWT_SECRET_KEY`. 24-hour expiry, no refresh tokens. If a token is compromised, the only mitigation is rotating `JWT_SECRET_KEY` (which logs everyone out).
- **TLS:** terminated upstream (nginx). The application speaks HTTP locally. Never expose the Flask port directly.

## 7. Logging and audit
- **Today:** none beyond Werkzeug request logs.
- **Required:** structured logging for: signup, login (success + fail), every POST/DELETE on financial data, every 5xx. PII (email, password) must never be logged. Open as a `feature/logging` ticket.

## 8. Incident response (placeholder)
1. Rotate `JWT_SECRET_KEY` (invalidates all tokens).
2. Rotate `SECRET_KEY`.
3. Rotate database credentials.
4. Audit recent commits for the leak vector.
5. Notify affected users per applicable regulations.
6. Post-mortem in `Documents/projectManager/retro-{date}-incident.md`.

## 9. Compliance posture
- **Today:** none claimed. Single-developer prototype.
- **Before going live:** decide on data residency, retention, and which (if any) regulations apply (GDPR if EU users, PSD2 if categorized as a payment service, local financial-data laws). Document the answer here.

## 10. Threat model review cadence
Re-review this document:
- After any change to authentication or authorization flow.
- Before adding a new external integration.
- At least once per release.
