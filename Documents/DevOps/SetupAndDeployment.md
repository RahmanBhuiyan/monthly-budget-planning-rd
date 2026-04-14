# Setup & Deployment

> If you only read one section, read **§3 The port-mismatch gotcha** — it's the #1 reason a fresh clone "doesn't work."

## 1. Prerequisites
- Python 3.10+ (for Flask 3.1.1)
- Node.js 18+ and npm
- Git

Optional for production:
- MySQL 8.x
- A process manager (gunicorn + systemd / Docker / pm2)

## 2. First-time local setup

```bash
git clone git@github.com:RahmanBhuiyan/monthly-budget-planning-rd.git
cd monthly-budget-planning-rd

# --- Backend ---
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create backend/.env (see §4 below)
cp .env.example .env              # if .env.example doesn't exist yet, see §4

python app.py                     # serves on http://localhost:7576

# --- Frontend (in a second terminal) ---
cd frontend
npm install
PORT=7575 npm start               # MUST be 7575 — see §3
```

After both are running:
- Backend health: `curl http://localhost:7576/api/v1/auth/login` → 400 (missing fields) is healthy.
- Frontend: open `http://localhost:7575` and you should see the Welcome page.

## 3. The port-mismatch gotcha
The backend's CORS allow-list in `backend/app.py` is hardcoded to `http://localhost:7575`. Create-React-App defaults to port 3000, so without `PORT=7575` the browser will silently fail every API call with a CORS error.

**Three ways to fix it:**

1. **Per-run (current convention):** `PORT=7575 npm start`
2. **Per-developer:** add `PORT=7575` to `frontend/.env.local` (gitignored).
3. **Per-project (recommended):** change the start script in `frontend/package.json` to `"start": "PORT=7575 react-scripts start"`. This is `SRS.md §6.11` — open as a `bugfix/` ticket.

## 4. Environment variables

### Backend (`backend/.env`)
| Variable | Required | Default (dev only) | Notes |
|----------|----------|-------------------|-------|
| `SECRET_KEY` | yes in prod | `'dev-secret'` | Flask session signing |
| `JWT_SECRET_KEY` | yes in prod | `'jwt-dev-secret'` | JWT signing — rotate compromises every existing token |
| `DATABASE_URL` | no | `sqlite:///expense_tracker.db` | SQLAlchemy URL — e.g. `mysql+pymysql://user:pass@host/db` |
| `GOOGLE_CLIENT_ID` | yes if Google login used | none | Google OAuth 2.0 client ID. Used by `routes/auth.py` to verify Google ID tokens via `id_token.verify_oauth2_token()`. If unset, `POST /auth/google` will reject every request with 401 (token audience check fails). Get from Google Cloud Console → APIs & Services → Credentials. |

> The hardcoded fallbacks are a v1 blocker (`SRS.md §6.2`). Production must fail-fast when these are unset.

A `backend/.env.example` should exist (currently doesn't — open as a `chore/` ticket). Suggested contents:
```bash
SECRET_KEY=
JWT_SECRET_KEY=
DATABASE_URL=sqlite:///expense_tracker.db
GOOGLE_CLIENT_ID=
```

### Frontend
The frontend currently never reads `process.env`. The Axios base URL is hardcoded to `http://localhost:7576/api/v1` in `src/services/api.js`, and the Google OAuth client ID is hardcoded in `src/components/GoogleLoginButton.js:4`. To deploy beyond localhost, both need to be parameterized via `REACT_APP_API_BASE_URL` and `REACT_APP_GOOGLE_CLIENT_ID` (open as a `feature/` ticket — see `SRS.md §6.14`).

The frontend also pulls the Google Identity Services SDK via a `<script src="https://accounts.google.com/gsi/client">` tag in `public/index.html`. No build-time dependency.

## 5. Database

### Prototype (SQLite, default)
- File: `backend/expense_tracker.db` (auto-created on first `python app.py` via `db.create_all()`).
- Wipe and start over: `rm backend/expense_tracker.db && python backend/app.py`.

### Production (MySQL — target)
1. Create the database and a user with full privileges on it.
2. Set `DATABASE_URL=mysql+pymysql://user:pass@host:3306/dbname` and install the driver: `pip install pymysql`.
3. There is **no migration tool installed yet**. `db.create_all()` is idempotent for new tables but will not alter existing schema. See `Documents/DevOps/MigrationPlan.md` for the path to Flask-Migrate.

## 6. Running tests
> No tests exist yet (`SRS.md §6.9`). When they do, the convention will be:
- Backend: `cd backend && pytest`
- Frontend: `cd frontend && npm test`

## 7. Production deployment (sketch)
This project has not been deployed yet. The minimum viable production setup:

**Backend**
- Run under `gunicorn -w 4 -b 0.0.0.0:7576 'app:app'` (replace `app.py`'s `app.run(debug=True)` block — never run with `debug=True` in production).
- Set every env var in §4 to a secure value.
- Front with nginx (TLS termination, static asset serving for the frontend build).

**Frontend**
- Build: `cd frontend && npm run build` → static files in `frontend/build/`.
- Serve via nginx or any static host.
- The hardcoded API URL in `src/services/api.js` must be parameterized first (see §4).

**Database**
- Switch to MySQL (§5).
- Daily backups; document RTO/RPO.

**TLS**
- All traffic over HTTPS — JWTs in localStorage are useless if they ride over plaintext.

## 8. Common problems

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Frontend renders, all API calls fail with CORS error in console | Frontend not on port 7575 | Use `PORT=7575 npm start` (§3) |
| `KeyError: 'SECRET_KEY'` | None — defaults exist (intentional in dev) | Set the env var for any non-dev environment |
| `sqlite3.OperationalError: unable to open database file` | Working dir doesn't match the relative SQLite path | Run `python app.py` from the `backend/` directory |
| Login succeeds, every subsequent request 401s | Token expired (24h) or `JWT_SECRET_KEY` rotated | Log in again |
| `python app.py` exits with `Address already in use` | Port 7576 occupied | `lsof -i :7576` then kill, or change the port (and update CORS + frontend) |
| `npm start` exits with `Error: listen EADDRINUSE` on 7575 | Port 7575 occupied | Same — `lsof -i :7575` |
