from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Expense

expenses_bp = Blueprint('expenses', __name__)

VALID_CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping']


@expenses_bp.route('', methods=['POST'])
@jwt_required()
def add_expense():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    if not data or not data.get('amount') or not data.get('category'):
        return jsonify({'error': 'Amount and category are required', 'code': 400}), 400

    if float(data['amount']) <= 0:
        return jsonify({'error': 'Amount must be positive', 'code': 400}), 400

    if data['category'] not in VALID_CATEGORIES:
        return jsonify({'error': f'Category must be one of: {", ".join(VALID_CATEGORIES)}', 'code': 400}), 400

    expense_date = data.get('date', date.today().isoformat())

    expense = Expense(
        user_id=user_id,
        amount=data['amount'],
        category=data['category'],
        note=data.get('note', ''),
        date=date.fromisoformat(expense_date)
    )

    db.session.add(expense)
    db.session.commit()
    return jsonify({'message': 'Expense added', 'expense': expense.to_dict()}), 201


@expenses_bp.route('', methods=['GET'])
@jwt_required()
def get_expenses():
    user_id = int(get_jwt_identity())
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    if not month or not year:
        return jsonify({'error': 'Month and year are required', 'code': 400}), 400

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        db.extract('month', Expense.date) == month,
        db.extract('year', Expense.date) == year
    ).order_by(Expense.date.desc()).all()

    return jsonify({'expenses': [e.to_dict() for e in expenses]}), 200


@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    user_id = int(get_jwt_identity())

    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()

    if not expense:
        return jsonify({'error': 'Expense not found', 'code': 404}), 404

    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Expense deleted'}), 200
