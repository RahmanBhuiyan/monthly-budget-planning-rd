# Backend Architecture

> Companion to `Documents/Engineering/Engineering/Backend/RoutesGuide.md` and `Documents/Engineering/Engineering/Backend/ModelsGuide.md`. For the cross-cutting standards (PEP 8, error format), see `Documents/Process/CodeStandardAndGuide.md` §1.

## 1. Stack at a glance
- **Framework:** Flask 3.1.1 (factory pattern in `app.py`)
- **ORM:** Flask-SQLAlchemy 3.1.1 (raw SQL is forbidden — `GEMINI.md`, `CLAUDE.md §7`)
- **Auth:** Flask-JWT-Extended 4.7.1 (HS256, 24h TTL)
- **CORS:** Flask-CORS 5.0.1 (allow-list hardcoded to `http://localhost:7575`)
- **Hashing:** Werkzeug 3.1.3 (`generate_password_hash`)
- **Env:** python-dotenv 1.1.0
- **DB:** SQLite (dev), MySQL (production target)
- **Port:** 7576

## 2. Folder layout
```
backend/
  app.py               # factory + CORS + JWT + db.create_all() + dev server entrypoint
  models.py            # SQLAlchemy models (User, Income, Budget, Expense)
  routes/
    __init__.py        # empty — could host shared constants
    auth.py            # /api/v1/auth/{signup,login}
    income.py          # /api/v1/income (POST upsert, GET)
    budget.py          # /api/v1/budget (POST upsert, GET)
    expenses.py        # /api/v1/expenses (POST, GET, DELETE) + VALID_CATEGORIES
    reports.py         # /api/v1/reports/{summary,categories,alerts} + helpers
  requirements.txt
  GEMINI.md            # backend-specific governance
  expense_tracker.db   # SQLite (dev), gitignored
```

## 3. Application factory (`app.py`)

```python
app = Flask(__name__)
app.config['SECRET_KEY']        = os.getenv('SECRET_KEY', 'dev-secret')        # gap — see SRS §6.2
app.config['JWT_SECRET_KEY']    = os.getenv('JWT_SECRET_KEY', 'jwt-dev-secret')# gap — see SRS §6.2
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///expense_tracker.db')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

CORS(app, origins=['http://localhost:7575'])   # hardcoded — gap (SRS §6.11 / §6 SEC-9)
JWTManager(app)
db.init_app(app)

with app.app_context():
    db.create_all()                             # to be replaced by Flask-Migrate (MigrationPlan §"Step 1")

# blueprints registered under url_prefix='/api/v1/...'
```

## 4. Request lifecycle

```
HTTP request from frontend (port 7575)
    │
    ├── CORS preflight (Flask-CORS) — allow only http://localhost:7575
    │
    ├── Route resolution (blueprint @ /api/v1/<resource>)
    │
    ├── @jwt_required() decorator   ──► 401 if missing/invalid
    │       │
    │       └── get_jwt_identity() returns str(user.id)
    │           (cast to int inside the route — see RoutesGuide §"Identity handling")
    │
    ├── Handler reads request.get_json() and validates manually
    │       │
    │       └── on validation fail: return jsonify({'error': '...', 'code': 400}), 400
    │
    ├── SQLAlchemy ORM (no raw SQL)
    │       │
    │       └── db.session.commit() / db.session.rollback()
    │
    └── jsonify(...) response with proper HTTP status
```

## 5. Blueprint pattern
Each `routes/*.py` defines a `Blueprint('<name>', __name__)` and is registered with a URL prefix:

```python
# in app.py
app.register_blueprint(auth_bp,     url_prefix='/api/v1/auth')
app.register_blueprint(income_bp,   url_prefix='/api/v1/income')
app.register_blueprint(budget_bp,   url_prefix='/api/v1/budget')
app.register_blueprint(expenses_bp, url_prefix='/api/v1/expenses')
app.register_blueprint(reports_bp,  url_prefix='/api/v1/reports')
```

One blueprint per file. New resources get a new file (don't pile routes into an existing one just because the URL is similar).

## 6. Authentication flow

```
1. POST /auth/signup
       Werkzeug hash → store in users.password_hash
       create_access_token(identity=str(user.id))
       respond { token, user }

2. POST /auth/login
       look up user by email
       check_password_hash(...)
       short-circuits if user is None  ── timing leak (SRS §6.6)
       create_access_token(identity=str(user.id))
       respond { token, user }

3. Frontend stores token in localStorage (XSS exposure — SRS §6 SEC-7)
       Axios interceptor attaches `Authorization: Bearer <token>` on every request

4. Protected endpoint:
       @jwt_required()
       user_id = int(get_jwt_identity())
       … query filtered by user_id …
```

JWT payload is intentionally minimal: just `sub = str(user.id)`. We do not embed username/email/roles — the route looks up what it needs.

## 7. Error handling pattern
There is no global error handler today. Each route returns `jsonify({'error': '...', 'code': N}), N` itself. Two consequences:
- Unhandled exceptions surface as Werkzeug's default 500 page (HTML, not JSON).
- Validation logic is duplicated across routes (manual checks for missing fields, positive amounts, valid month/year).

**Recommended next step (not yet a ticket):** add an `@app.errorhandler(Exception)` that converts to the JSON shape, plus a thin `validate_payload(schema)` helper. Out of scope for v1.

## 8. CORS

Hardcoded to a single origin: `http://localhost:7575`. Implications:
- Frontend MUST run on 7575 (`Documents/DevOps/SetupAndDeployment.md` §3).
- Cannot deploy without code change. Should accept a comma-separated `CORS_ORIGINS` env var (`SEC-9` in `SecurityAndThreatModel.md`).

## 9. Database access

- `db.session` for all reads and writes (no raw SQL).
- Commit at the end of every successful write.
- Rollback in `except` blocks (today's code is inconsistent about this — gap).
- `db.create_all()` runs once at startup. This is fine for prototype; the production path is in `Documents/DevOps/MigrationPlan.md`.

## 10. Logging

`app.logger` is available but not used today. The dev server prints Werkzeug's request log line per request. Production logging is a ticket waiting to be opened (see `Documents/Security/SecurityAndThreatModel.md` §7).

## 11. The dev server vs. production

`app.py` ends with:
```python
if __name__ == '__main__':
    app.run(debug=True, port=7576)     # NEVER ship this
```

`debug=True` enables Werkzeug's interactive debugger — remote code execution if it ever reaches a public network. Production must run under gunicorn (`Documents/DevOps/SetupAndDeployment.md` §7) and the `if __name__ == '__main__'` block must be guarded by an env check.

## 12. Where to put new code

| You're adding... | It goes in... |
|------------------|---------------|
| A new endpoint on an existing resource | the existing `routes/<resource>.py` |
| A new resource | a new `routes/<new>.py` blueprint, registered in `app.py` |
| A new model | `models.py` (one file, no per-model file split until it grows past ~5 models) |
| A shared validation helper | new file `routes/_utils.py`; underscore prefix marks it as internal |
| A new env var | `app.py` config block, plus `backend/.env.example` (to be created) and `Documents/DevOps/SetupAndDeployment.md` §4 |
| A constant used by multiple routes | `routes/__init__.py` (today only `VALID_CATEGORIES` qualifies but lives in `expenses.py` — fine until a second consumer appears) |
