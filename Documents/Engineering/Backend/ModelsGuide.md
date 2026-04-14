# Models Guide

> Companion to `Documents/Reference/DatabaseDesign.md` (which is the schema reference). This doc covers the *Python side*: how the SQLAlchemy classes are shaped, what the methods do, and what to watch for when adding a model.

All models live in a single file: `backend/models.py`. Splitting per-model is not warranted yet (4 models).

## 1. Common shape

Every model follows the same recipe:
- `__tablename__` set explicitly (lowercase plural).
- `id` integer primary key with autoincrement.
- `to_dict()` returns the API-shaped JSON.
- Money columns: `db.Numeric(10, 2)` (maps to `DECIMAL(10,2)`).
- Timestamps: `db.DateTime` with `default=lambda: datetime.now(timezone.utc)`.

## 2. The four models

### 2.1 `User`
```python
class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256),               nullable=True)
    google_id     = db.Column(db.String(100), unique=True,  nullable=True)
    created_at    = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc))

    incomes  = db.relationship('Income',  backref='user', lazy=True)
    budgets  = db.relationship('Budget',  backref='user', lazy=True)
    expenses = db.relationship('Expense', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }
```

**Watch-outs:**
- `password_hash` must never be in `to_dict()`. It currently isn't — keep it that way.
- `password_hash` is **nullable** — Google-only users have `NULL` here. Code that reads it must `if user.password_hash is None: ...` first. `routes/auth.py:45` already guards this in the email/password login path.
- `google_id` is also kept out of `to_dict()` deliberately — it's a server-side join key, not user-facing data.
- `created_at` defaults via lambda to ensure each insert gets a fresh timestamp, not the import-time value.
- `to_dict()` will raise `AttributeError` if `created_at` is `None` (it shouldn't be — the default lambda fires on insert — but if a row is constructed without `db.session.add()`/`commit()`, the default hasn't run yet).

### 2.2 `Income`
```python
class Income(db.Model):
    __tablename__ = 'incomes'
    id      = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount  = db.Column(db.Numeric(10, 2), nullable=False)
    month   = db.Column(db.Integer, nullable=False)
    year    = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'month', 'year'),)

    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount),     # ← NFR-1 violation, see §3
            'month': self.month,
            'year': self.year,
        }
```

**Notes:**
- Composite uniqueness enforces "one income per user per month per year".
- No `created_at` — minor inconsistency with User/Expense (see §4).

### 2.3 `Budget`
Same shape as `Income`, plus:
```python
savings_goal = db.Column(db.Numeric(10, 2), nullable=False, default=0)
```

**Notes:**
- `savings_goal` is **stored but never read** by any business calculation today (`SRS.md §6.8`).
- The reset bug in `routes/budget.py` (`SRS.md §6.1`) lives at the route layer, not here.

### 2.4 `Expense`
```python
class Expense(db.Model):
    __tablename__ = 'expenses'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount     = db.Column(db.Numeric(10, 2), nullable=False)
    category   = db.Column(db.String(50),  nullable=False)
    note       = db.Column(db.String(200))
    date       = db.Column(db.Date,       nullable=False)
    created_at = db.Column(db.DateTime,   default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount),     # ← NFR-1 violation
            'category': self.category,
            'note': self.note,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
```

**Notes:**
- `category` is constrained at the route layer (`VALID_CATEGORIES` in `routes/expenses.py`) — there is **no DB-level CHECK constraint**. Bypassing the route would let any string in.
- No relationship declared from `User` (see §4).

## 3. The `to_dict()` precision leak (NFR-1 violation)

Every model casts `Numeric(10, 2)` to `float` in `to_dict()`. This defeats the `DECIMAL` storage guarantee at the API boundary — every JSON-serialized money field is a float-rounded approximation, not the exact value.

Concrete example:
```python
amount = Decimal('19.99')
float(amount)        # → 19.99 in this case, but 0.1 + 0.2 = 0.30000000000000004 in general
```

**Fix sketch:**
```python
'amount': str(self.amount),     # 'amount': '19.99'
```
Frontend then parses with care. Or, better, register a custom JSON encoder for `Decimal`.

This is `SRS.md §6.5`. Tag any fix `[BIZ-QC-NEEDED]`.

## 4. Inconsistencies worth knowing

| Issue | Where | Impact |
|-------|-------|--------|
| `Income` and `Budget` don't have `created_at` columns | models.py | Cannot tell when a row was first written. Add as a nullable column in a future migration. |
| `category` has no DB-level CHECK constraint | models.py | Validation is route-only. If anyone adds a script that writes directly to the DB, garbage gets in. |
| No cascade delete behavior set on relationships | models.py | If you ever `db.session.delete(user)`, related rows remain. Add `cascade='all, delete-orphan'` if/when account deletion ships. |
| `Expense.note` defaults to `''` (empty string), not `None` | models.py | Stored value is empty string when omitted. Slightly noisy for queries that look for "no note" — `WHERE note = ''` instead of `IS NULL`. |

## 5. Adding a new model

1. Add the class to `models.py`.
2. If money: `db.Numeric(10, 2)`. If timestamp: `db.DateTime` with the UTC default lambda. If date-only: `db.Date`.
3. Always set `__tablename__` (don't rely on SQLAlchemy's auto-derivation).
4. Define a `to_dict()` — keep it shallow; nested objects are usually a smell at this scale.
5. If it's owned by a user, add `user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)`.
6. After Flask-Migrate is installed (`Documents/DevOps/MigrationPlan.md` §"Step 1"), also: `flask db migrate -m "add <model>"` and commit the generated file.
7. Until then, you must drop and recreate the SQLite DB to pick up the change in dev. Document this clearly in your PR description.

## 6. Querying conventions

- Always filter by `user_id` first on every owned table — it's the privacy gate AND the most-selective predicate.
- Use `.first()` for single-row lookups (returns None if absent), `.one()` only when you want an explicit raise.
- Never call `.all()` on an unbounded user-driven query (e.g. `Expense.query.all()`); always include filters.
- Aggregate with `db.func.sum(...)` and `db.func.extract('month', column)` — see `routes/reports.py` for examples.
