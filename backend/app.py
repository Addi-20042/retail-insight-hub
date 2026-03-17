"""
RetailMind Backend - Main Application Entry Point
Flask server initialization and route registration
"""
import os
from flask import Flask
from flask_cors import CORS

from config import get_config
from database.db import init_db
from routes.health import health_bp
from routes.auth import auth_bp
# from routes.forecast import forecast_bp  # Skip ML services (scipy issue)
# from routes.segments import segments_bp
# from routes.basket import basket_bp  # Skip basket
# from routes.alerts import alerts_bp
from routes.upload import upload_bp


def create_app():
    """Application factory for creating Flask app"""

    app = Flask(__name__)

    config = get_config()
    app.config.from_object(config)

    CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)

    os.makedirs('data/raw', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    os.makedirs('models', exist_ok=True)

    init_db()

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    # app.register_blueprint(forecast_bp, url_prefix='/api')  # Skip ML
    # app.register_blueprint(segments_bp, url_prefix='/api')  # Skip ML
    # app.register_blueprint(basket_bp, url_prefix='/api')  # Skip basket
    # app.register_blueprint(alerts_bp, url_prefix='/api')  # Skip ML
    app.register_blueprint(upload_bp, url_prefix='/api')

    return app


app = create_app()

if __name__ == '__main__':
    print("RetailMind Backend Starting...")
    print("API available at: http://localhost:5000/api")
    print("Health check: http://localhost:5000/api/health")
    print("Connected to Supabase for data storage")
    app.run(host='0.0.0.0', port=5000, debug=True)
