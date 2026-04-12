import os
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from models import db

load_dotenv()


def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///expense_tracker.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-dev-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:7575"}})
    JWTManager(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.income import income_bp
    from routes.budget import budget_bp
    from routes.expenses import expenses_bp
    from routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(income_bp, url_prefix='/api/v1/income')
    app.register_blueprint(budget_bp, url_prefix='/api/v1/budget')
    app.register_blueprint(expenses_bp, url_prefix='/api/v1/expenses')
    app.register_blueprint(reports_bp, url_prefix='/api/v1/reports')

    # Create tables
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=7576)
