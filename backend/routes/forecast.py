"""
Forecast routes
"""
from flask import Blueprint, request, jsonify
from auth.auth_guard import require_auth
from services.forecasting import generate_forecast

forecast_bp = Blueprint('forecast', __name__)

@forecast_bp.route('/forecast', methods=['GET'])
@require_auth
def get_forecast():
    """
    Get sales forecast
    
    Query params:
        days: Number of days to forecast (default: 7)
        
    Returns:
        { "predictions": [...], "days": N }
    """
    days = request.args.get('days', 7, type=int)
    
    # Limit days to reasonable range
    days = max(1, min(days, 30))
    
    predictions = generate_forecast(days=days)
    
    return jsonify({
        'predictions': predictions,
        'days': days
    })
