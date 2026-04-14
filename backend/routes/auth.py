import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from models import db, User

auth_bp = Blueprint('auth', __name__)

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')


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

    if not user or not user.password_hash or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password', 'code': 401}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Login successful', 'token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/google', methods=['POST'])
def google_auth():
    """Verify Google credential token and login or create user."""
    data = request.get_json()

    if not data or not data.get('credential'):
        return jsonify({'error': 'Google credential token is required', 'code': 400}), 400

    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            data['credential'],
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])

    except ValueError as e:
        return jsonify({'error': f'Invalid Google token: {str(e)}', 'code': 401}), 401

    # Find existing user by google_id
    user = User.query.filter_by(google_id=google_id).first()

    if not user:
        # Check if user exists with same email (link accounts)
        user = User.query.filter_by(email=email).first()

        if user:
            # Link Google ID to existing account
            user.google_id = google_id
        else:
            # Create new user
            # Generate unique username from name
            base_username = name.replace(' ', '').lower()[:70]
            username = base_username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                username=username,
                email=email,
                google_id=google_id
            )
            db.session.add(user)

        db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Google login successful',
        'token': token,
        'user': user.to_dict()
    }), 200
