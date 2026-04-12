import calendar
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Expense, Income, Budget

reports_bp = Blueprint('reports', __name__)


def _get_month_year(request):
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    return month, year


def _get_total_spent(user_id, month, year):
    """Protected: Budget remaining = budget_amount - total_spent"""
    result = db.session.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        db.extract('month', Expense.date) == month,
        db.extract('year', Expense.date) == year
    ).scalar()
    return float(result) if result else 0.0


@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
def monthly_summary():
    user_id = int(get_jwt_identity())
    month, year = _get_month_year(request)

    if not month or not year:
        return jsonify({'error': 'Month and year are required', 'code': 400}), 400

    income = Income.query.filter_by(user_id=user_id, month=month, year=year).first()
    budget = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    total_spent = _get_total_spent(user_id, month, year)

    income_amount = float(income.amount) if income else 0.0
    budget_amount = float(budget.amount) if budget else 0.0

    # Protected business logic: savings and remaining calculations
    saved = income_amount - total_spent
    budget_remaining = budget_amount - total_spent

    # Find highest expense category
    category_totals = db.session.query(
        Expense.category, func.sum(Expense.amount).label('total')
    ).filter(
        Expense.user_id == user_id,
        db.extract('month', Expense.date) == month,
        db.extract('year', Expense.date) == year
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()

    highest_category = category_totals[0].category if category_totals else 'N/A'

    # Average daily spending
    days_in_month = calendar.monthrange(year, month)[1]
    avg_daily = total_spent / days_in_month if days_in_month > 0 else 0.0

    return jsonify({
        'summary': {
            'income': income_amount,
            'budget': budget_amount,
            'total_spent': total_spent,
            'saved': saved,
            'budget_remaining': budget_remaining,
            'highest_category': highest_category,
            'avg_daily_spending': round(avg_daily, 2),
            'month': month,
            'year': year
        }
    }), 200


@reports_bp.route('/categories', methods=['GET'])
@jwt_required()
def category_breakdown():
    user_id = int(get_jwt_identity())
    month, year = _get_month_year(request)

    if not month or not year:
        return jsonify({'error': 'Month and year are required', 'code': 400}), 400

    category_totals = db.session.query(
        Expense.category, func.sum(Expense.amount).label('total')
    ).filter(
        Expense.user_id == user_id,
        db.extract('month', Expense.date) == month,
        db.extract('year', Expense.date) == year
    ).group_by(Expense.category).all()

    categories = [
        {'category': row.category, 'total': float(row.total)}
        for row in category_totals
    ]

    return jsonify({'categories': categories}), 200


@reports_bp.route('/alerts', methods=['GET'])
@jwt_required()
def budget_alerts():
    user_id = int(get_jwt_identity())
    month, year = _get_month_year(request)

    if not month or not year:
        return jsonify({'error': 'Month and year are required', 'code': 400}), 400

    budget = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    total_spent = _get_total_spent(user_id, month, year)

    alerts = []

    if not budget:
        alerts.append({
            'type': 'info',
            'message': 'No budget set for this month. Set a budget to receive alerts.'
        })
    else:
        budget_amount = float(budget.amount)
        # Protected business logic: alert thresholds
        usage_percent = (total_spent / budget_amount * 100) if budget_amount > 0 else 0

        if usage_percent >= 100:
            alerts.append({
                'type': 'critical',
                'message': f'You have exceeded your budget! Spent ${total_spent:.2f} of ${budget_amount:.2f} ({usage_percent:.0f}%)'
            })
        elif usage_percent >= 80:
            alerts.append({
                'type': 'warning',
                'message': f'You have used {usage_percent:.0f}% of your budget. ${budget_amount - total_spent:.2f} remaining.'
            })
        else:
            alerts.append({
                'type': 'success',
                'message': f'On track! You have used {usage_percent:.0f}% of your budget. ${budget_amount - total_spent:.2f} remaining.'
            })

        # Category-based suggestion
        category_totals = db.session.query(
            Expense.category, func.sum(Expense.amount).label('total')
        ).filter(
            Expense.user_id == user_id,
            db.extract('month', Expense.date) == month,
            db.extract('year', Expense.date) == year
        ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).first()

        if category_totals and usage_percent >= 80:
            alerts.append({
                'type': 'suggestion',
                'message': f'Reduce {category_totals.category} expenses this week — it is your highest spending area at ${float(category_totals.total):.2f}.'
            })

    return jsonify({
        'alerts': alerts,
        'usage_percent': round(usage_percent if budget else 0, 1),
        'total_spent': total_spent,
        'budget_amount': float(budget.amount) if budget else 0
    }), 200
