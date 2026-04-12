from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Income

income_bp = Blueprint('income', __name__)


@income_bp.route('', methods=['POST'])
@jwt_required()
def set_income():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    if not data or not data.get('amount') or not data.get('month') or not data.get('year'):
        return jsonify({'error': 'Amount, month, and year are required', 'code': 400}), 400

    if float(data['amount']) <= 0:
        return jsonify({'error': 'Amount must be positive', 'code': 400}), 400

    existing = Income.query.filter_by(
        user_id=user_id, month=data['month'], year=data['year']
    ).first()

    if existing:
        existing.amount = data['amount']
    else:
        existing = Income(
            user_id=user_id,
            amount=data['amount'],
            month=data['month'],
            year=data['year']
        )
        db.session.add(existing)

    db.session.commit()
    return jsonify({'message': 'Income saved', 'income': existing.to_dict()}), 200


@income_bp.route('', methods=['GET'])
@jwt_required()
def get_income():
    user_id = int(get_jwt_identity())
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    if not month or not year:
        return jsonify({'error': 'Month and year are required', 'code': 400}), 400

    income = Income.query.filter_by(
        user_id=user_id, month=month, year=year
    ).first()

    if not income:
        return jsonify({'income': None}), 200

    return jsonify({'income': income.to_dict()}), 200
