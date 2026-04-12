from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email, and password are required', 'code': 400}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists', 'code': 409}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists', 'code': 409}), 409

    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'User created', 'token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required', 'code': 400}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password', 'code': 401}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Login successful', 'token': token, 'user': user.to_dict()}), 200
