# Backend Testing Guide

> Companion to `Documents/QA/TestingStrategy.md` (the *what*). This doc is the *how* — pytest setup, fixtures, sample tests for the protected business logic. Implementation lives on a separate `feature/test-suite-baseline` branch (one ticket per branch, `CLAUDE.md §6`).

## 1. Tooling

Add to a new `backend/requirements-dev.txt`:

```
pytest>=8.0
pytest-cov>=4.1
```

Install:
```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt
```

Run:
```bash
pytest                                  # all tests
pytest tests/unit -k "savings"          # filter
pytest --cov=. --cov-report=term-missing
```

Target coverage: ≥80% on `routes/` and `models.py`. No gate on `app.py`.

## 2. Folder layout

```
backend/
  tests/
    __init__.py
    conftest.py                  # shared fixtures
    unit/
      test_models.py             # User.set_password, to_dict shapes
      test_business_logic.py     # the 6 protected formulas
    integration/
      test_auth.py
      test_income.py
      test_budget.py
      test_expenses.py
      test_reports.py
```

Mirror the `routes/` shape for integration tests so a route → test mapping is one-to-one.

## 3. `conftest.py` — the fixtures

```python
# backend/tests/conftest.py
import pytest
from app import create_app
from models import db as _db, User


@pytest.fixture
def app():
    """Fresh Flask app per test, in-memory SQLite, schema rebuilt."""
    app = create_app()
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI='sqlite:///:memory:',
        JWT_SECRET_KEY='test-jwt-secret',
        SECRET_KEY='test-secret',
    )
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    return _db


@pytest.fixture
def user(db):
    """A persisted user, password = 'pw12345'."""
    u = User(username='alice', email='alice@example.com')
    u.set_password('pw12345')
    db.session.add(u)
    db.session.commit()
    return u


@pytest.fixture
def auth_headers(client, user):
    """JWT for the `user` fixture, ready to attach to requests."""
    res = client.post('/api/v1/auth/login', json={
        'email': user.email, 'password': 'pw12345',
    })
    token = res.get_json()['token']
    return {'Authorization': f'Bearer {token}'}
```

Pattern notes:
- One app per test → no test-to-test bleed. Slower than a shared app but the safety is worth it at v1 scale.
- `SQLALCHEMY_DATABASE_URI` overridden to in-memory SQLite so we don't touch `expense_tracker.db`.
- `JWT_SECRET_KEY` overridden so test tokens don't accidentally validate against a dev key.

## 4. Sample: protected business logic (the must-have)

`tests/unit/test_business_logic.py`:

```python
"""
Tests for the 6 protected financial formulas (CLAUDE.md §2).
Any change to these is [BIZ-QC-NEEDED].
"""
import pytest
from decimal import Decimal


# --- saved = income - total_spent ---

def test_saved_positive(client, auth_headers, set_income, add_expense):
    set_income(amount=5000, month=4, year=2026)
    add_expense(amount=1500, category='Food', date='2026-04-10')
    res = client.get('/api/v1/reports/summary?month=4&year=2026', headers=auth_headers)
    assert res.get_json()['summary']['saved'] == 3500.0


def test_saved_negative_when_overspent(client, auth_headers, set_income, add_expense):
    set_income(amount=1000, month=4, year=2026)
    add_expense(amount=1500, category='Bills', date='2026-04-10')
    assert client.get('/api/v1/reports/summary?month=4&year=2026', headers=auth_headers
        ).get_json()['summary']['saved'] == -500.0


def test_saved_with_no_income(client, auth_headers, add_expense):
    add_expense(amount=200, category='Food', date='2026-04-10')
    # Behavior today: income defaults to 0.0, so saved = -200.
    assert client.get('/api/v1/reports/summary?month=4&year=2026', headers=auth_headers
        ).get_json()['summary']['saved'] == -200.0


# --- budget_remaining = budget - total_spent ---

def test_budget_remaining_zero_at_exact_budget(client, auth_headers, set_budget, add_expense):
    set_budget(amount=4000, month=4, year=2026)
    add_expense(amount=4000, category='Bills', date='2026-04-10')
    assert client.get('/api/v1/reports/summary?month=4&year=2026', headers=auth_headers
        ).get_json()['summary']['budget_remaining'] == 0.0


# --- alert thresholds ---

@pytest.mark.parametrize('spent,expected_type', [
    ( 100, 'success'),     # 2.5% of 4000 — under 80
    (3199, 'success'),     # 79.975% — still under
    (3200, 'warning'),     # exactly 80%
    (3999, 'warning'),     # 99.975%
    (4000, 'critical'),    # exactly 100%
    (5000, 'critical'),    # over
])
def test_alert_threshold_boundaries(client, auth_headers, set_budget, add_expense,
                                    spent, expected_type):
    set_budget(amount=4000, month=4, year=2026)
    add_expense(amount=spent, category='Food', date='2026-04-10')
    alerts = client.get('/api/v1/reports/alerts?month=4&year=2026', headers=auth_headers
        ).get_json()['alerts']
    types = {a['type'] for a in alerts}
    assert expected_type in types


def test_warning_and_suggestion_both_fire_at_80pct(client, auth_headers, set_budget, add_expense):
    set_budget(amount=4000, month=4, year=2026)
    add_expense(amount=3200, category='Food', date='2026-04-10')
    types = {a['type'] for a in client.get('/api/v1/reports/alerts?month=4&year=2026',
                                           headers=auth_headers).get_json()['alerts']}
    assert types == {'warning', 'suggestion'}


# --- avg_daily_spending = total_spent / days_in_month ---

@pytest.mark.parametrize('month,year,expected_days', [
    (1, 2026, 31),
    (2, 2026, 28),
    (2, 2024, 29),    # leap year
    (4, 2026, 30),
])
def test_avg_daily_uses_calendar_days(client, auth_headers, set_budget, add_expense,
                                      month, year, expected_days):
    set_budget(amount=10000, month=month, year=year)
    add_expense(amount=expected_days * 10, category='Food',
                date=f'{year}-{month:02d}-01')
    summary = client.get(f'/api/v1/reports/summary?month={month}&year={year}',
                         headers=auth_headers).get_json()['summary']
    assert summary['avg_daily_spending'] == 10.0


# --- highest_category ---

def test_highest_category_when_no_expenses(client, auth_headers):
    assert client.get('/api/v1/reports/summary?month=4&year=2026', headers=auth_headers
        ).get_json()['summary']['highest_category'] == 'N/A'


def test_highest_category_picks_max(client, auth_headers, add_expense):
    add_expense(amount=50,  category='Food',     date='2026-04-01')
    add_expense(amount=100, category='Travel',   date='2026-04-02')
    add_expense(amount=75,  category='Bills',    date='2026-04-03')
    assert client.get('/api/v1/reports/summary?month=4&year=2026', headers=auth_headers
        ).get_json()['summary']['highest_category'] == 'Travel'
```

Helper fixtures `set_income`, `set_budget`, `add_expense` are thin wrappers — add them to `conftest.py`:

```python
@pytest.fixture
def set_income(client, auth_headers):
    def _set(amount, month, year):
        return client.post('/api/v1/income', json={
            'amount': amount, 'month': month, 'year': year,
        }, headers=auth_headers)
    return _set


@pytest.fixture
def set_budget(client, auth_headers):
    def _set(amount, month, year, savings_goal=0):
        return client.post('/api/v1/budget', json={
            'amount': amount, 'savings_goal': savings_goal,
            'month': month, 'year': year,
        }, headers=auth_headers)
    return _set


@pytest.fixture
def add_expense(client, auth_headers):
    def _add(amount, category, date, note=''):
        return client.post('/api/v1/expenses', json={
            'amount': amount, 'category': category, 'date': date, 'note': note,
        }, headers=auth_headers)
    return _add
```

## 5. Sample: input validation

`tests/integration/test_expenses.py`:

```python
def test_post_expense_rejects_negative_amount(client, auth_headers):
    res = client.post('/api/v1/expenses', json={
        'amount': -10, 'category': 'Food', 'date': '2026-04-10',
    }, headers=auth_headers)
    assert res.status_code == 400


def test_post_expense_rejects_invalid_category(client, auth_headers):
    res = client.post('/api/v1/expenses', json={
        'amount': 10, 'category': 'Cars', 'date': '2026-04-10',
    }, headers=auth_headers)
    assert res.status_code == 400


def test_post_expense_rejects_malformed_date(client, auth_headers):
    """Currently a regression target — endpoint returns 500 instead of 400 (SRS §6.3)."""
    res = client.post('/api/v1/expenses', json={
        'amount': 10, 'category': 'Food', 'date': 'not-a-date',
    }, headers=auth_headers)
    assert res.status_code == 400, "should be 400 once SRS §6.3 is fixed"
```

The last one is intentionally **failing today** — that's the point. It pins the bug as a regression target so you can't "fix" it without also fixing the test.

## 6. Sample: authorization

```python
def test_protected_endpoint_requires_jwt(client):
    res = client.get('/api/v1/expenses?month=4&year=2026')
    assert res.status_code == 401


def test_user_cannot_delete_other_users_expense(client, auth_headers, db):
    # Add a second user with their own expense.
    other = User(username='bob', email='bob@example.com')
    other.set_password('pw12345')
    db.session.add(other)
    db.session.commit()
    other_exp = Expense(user_id=other.id, amount=10, category='Food', date=date(2026, 4, 1))
    db.session.add(other_exp); db.session.commit()

    # alice (auth_headers) tries to delete bob's expense.
    res = client.delete(f'/api/v1/expenses/{other_exp.id}', headers=auth_headers)
    assert res.status_code == 404      # 404 not 403 — see ApiReference.md §"Error format"
```

## 7. Sample: the `savings_goal` reset bug

This is `SRS.md §6.1`. Pin it:

```python
def test_savings_goal_preserved_when_omitted_from_post(client, auth_headers):
    # Set with savings_goal.
    client.post('/api/v1/budget', json={
        'amount': 4000, 'savings_goal': 500, 'month': 4, 'year': 2026,
    }, headers=auth_headers)

    # Re-submit WITHOUT savings_goal — it should NOT reset to 0.
    client.post('/api/v1/budget', json={
        'amount': 4500, 'month': 4, 'year': 2026,
    }, headers=auth_headers)

    res = client.get('/api/v1/budget?month=4&year=2026', headers=auth_headers).get_json()
    assert res['budget']['savings_goal'] == 500.0  # FAILS today; passes after SRS §6.1 fix.
```

## 8. What NOT to test

- React Router internals, Axios internals, SQLAlchemy internals — trust the libraries.
- Generated `to_dict()` output structure — implicitly covered by integration tests.
- `app.py` factory wiring — assume Flask blueprint registration works.
- Werkzeug's password hash strength — that's a library responsibility.

## 9. Patterns to enforce in review

- Every test name encodes axis + scenario + expected. `test_<unit>__<scenario>__<expected>` lets you `pytest -k "savings_goal"` or `pytest -k "boundary"`.
- Use `@pytest.mark.parametrize` for boundary tests — collapses 6 nearly-identical tests into one (see §4).
- No network. No real DB. `monkeypatch` over real env vars.
- One assertion concept per test. Multiple `assert`s on the same shape are fine; don't bundle unrelated assertions.

## 10. CI gate (when CI exists)

Block merge if:
- `pytest` exits non-zero.
- Coverage on `routes/` or `models.py` drops below 80%.
- A test marked `@pytest.mark.protected` (the 6 financial formulas) fails — these need explicit `[BIZ-QC-NEEDED]` review even to update.
