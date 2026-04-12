from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Budget

budget_bp = Blueprint('budget', __name__)


@budget_bp.route('', methods=['POST'])
@jwt_required()
def set_budget():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    if not data or not data.get('amount') or not data.get('month') or not data.get('year'):
        return jsonify({'error': 'Amount, month, and year are required', 'code': 400}), 400

    if float(data['amount']) <= 0:
        return jsonify({'error': 'Budget amount must be positive', 'code': 400}), 400

    existing = Budget.query.filter_by(
        user_id=user_id, month=data['month'], year=data['year']
    ).first()

    if existing:
        existing.amount = data['amount']
        existing.savings_goal = data.get('savings_goal', 0)
    else:
        existing = Budget(
            user_id=user_id,
            amount=data['amount'],
            savings_goal=data.get('savings_goal', 0),
            month=data['month'],
            year=data['year']
        )
        db.session.add(existing)

    db.session.commit()
    return jsonify({'message': 'Budget saved', 'budget': existing.to_dict()}), 200


@budget_bp.route('', methods=['GET'])
@jwt_required()
def get_budget():
    user_id = int(get_jwt_identity())
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    if not month or not year:
        return jsonify({'error': 'Month and year are required', 'code': 400}), 400

    budget = Budget.query.filter_by(
        user_id=user_id, month=month, year=year
    ).first()

    if not budget:
        return jsonify({'budget': None}), 200

    return jsonify({'budget': budget.to_dict()}), 200
