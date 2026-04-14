# Compliance Posture

> **Today: no claims, no audits, no compliance program.** The project is a single-developer prototype with no production users.
>
> This document exists to capture the *questions that must be answered* before going live, so they're not discovered the day before launch.

## Disclaimer
Nothing in this document is legal advice. The project owner is responsible for engaging actual legal counsel before any production launch with real users.

## What we ARE today
- A prototype.
- No real user data.
- No data shared with third parties.
- No automated decisions affecting users (no algorithmic credit decisions, no automated denials, etc.).
- US-based development; hosting target undecided.

## What we collect (current schema)

| Data | Purpose | Sensitivity |
|------|---------|-------------|
| `email` | Login + future communication | PII |
| `username` | Display | Low |
| `password_hash` | Auth | High (hash, not plaintext) |
| `incomes.amount` | Core feature | High (financial) |
| `budgets.amount`, `savings_goal` | Core feature | High (financial) |
| `expenses.amount`, `category`, `note`, `date` | Core feature | High (financial; `note` may be very personal) |
| Server access logs | Operations | Medium (IP, user-agent — once collected) |

**Implication:** even at v1 this is "sensitive personal financial data" by any reasonable reading. That puts us in scope for several frameworks the moment we have real users.

## Frameworks to consider before launch

### GDPR (if any user is in the EU/EEA)
Triggered by having even one EU user, regardless of where the company is. Key requirements:
- **Lawful basis** for processing (consent or legitimate interest — contract is the obvious basis here).
- **Right to access** — user can request all data we hold about them.
- **Right to erasure** — user can request deletion. (Today, `DELETE /users/{id}` doesn't exist; cascade behavior on related rows is undefined per `Documents/Reference/DatabaseDesign.md` §10.)
- **Right to portability** — user can request their data in a machine-readable format.
- **Breach notification** — to authorities within 72 hours.
- **Privacy policy** — must exist and must be linked from the app.
- **Data Processing Agreement** with any vendor that processes user data on our behalf (hosting, email, analytics).

**v1 minimum:** decide if EU users are in scope. If yes, the above are blockers.

### CCPA / CPRA (California users)
Similar shape to GDPR, narrower scope. Less strict on lawful basis but adds "do not sell" and notice requirements.

### PCI-DSS
Triggered by handling credit card data. **Not in scope** — we don't process payments. Stay not-in-scope by never accepting card numbers in our app; if billing is added, use Stripe / Paddle and never touch the card number ourselves.

### SOC 2
Not legally required. May be required by enterprise customers if/when we sell B2B. Defer until that conversation arrives.

### Local financial regulations
Varies by jurisdiction. Likely not in scope because we're a personal expense tracker, not a financial service. **But verify** before launching in any country with strict financial-app licensing (UK FCA, Singapore MAS, etc.).

## v1 launch checklist (before first real user)

- [ ] Privacy policy written and linked.
- [ ] Terms of service written and linked.
- [ ] Cookie / localStorage notice (the JWT in localStorage is an unmistakable trigger).
- [ ] Data retention policy decided and documented (how long do we keep deleted-user data? expense data after account closure?).
- [ ] Right-to-erasure procedure documented (who can run it, against which DB, with what verification).
- [ ] Right-to-access procedure documented.
- [ ] Breach response procedure (extends `Documents/Security/IncidentResponse.md` Scenario A).
- [ ] Vendor list catalogued — for each, confirm DPA/equivalent or rule them out.
- [ ] Geographical decision: where can users sign up from? If "anywhere", GDPR applies.

## Specific architectural decisions that have compliance implications

| Decision | Where it lives | Compliance angle |
|----------|----------------|------------------|
| JWT in `localStorage` | `Documents/Engineering/Frontend/Architecture.md` §7 | Cookie/storage notice required under EU rules |
| No cascade delete on `User → *` | `Documents/Reference/DatabaseDesign.md` §10 | Right-to-erasure is broken today |
| Hardcoded dev secret fallbacks | `Documents/Reference/SRS.md` §6.2 | If they ever ship to prod, that's a breach by negligence |
| No backups defined | `DatabaseDesign.md` §10 | Most jurisdictions require "appropriate" data protection |
| No structured logging | `Documents/Security/SecurityAndThreatModel.md` §7 | Breach detection / forensics impossible without logs |

Every one of these is also on `Documents/Project/ticket-inventory.md`; the compliance lens just changes the priority.

## What this document is NOT
- A privacy policy.
- A terms of service.
- A substitute for legal review.
- A claim of compliance with any framework.

## Review cadence
Re-read this document at the start of every quarter. If the project is still pre-launch, no changes needed. If users are imminent, every "before launch" item must be a `feature/` ticket in flight.
