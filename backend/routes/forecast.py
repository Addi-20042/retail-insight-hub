"""
Forecast routes - Now reads from Supabase
"""
from flask import Blueprint, request, jsonify
from auth.auth_guard import require_auth
from services.forecasting import generate_forecast
from database.db import get_sales_dataframe
from services.preprocessing import aggregate_daily_sales, clean_sales_data

forecast_bp = Blueprint('forecast', __name__)

@forecast_bp.route('/forecast', methods=['GET'])
@require_auth
def get_forecast():
    """
    Get sales forecast using data from Supabase
    
    Query params:
        days: Number of days to forecast (default: 7)
        
    Returns:
        { "predictions": [...], "days": N }
    """
    days = request.args.get('days', 7, type=int)
    days = max(1, min(days, 30))
    
    try:
        # Get sales data from Supabase
        user = request.current_user
        user_id = user.get('id') or user.get('user_id')
        
        df = get_sales_dataframe(user_id)
        
        if df.empty:
            return jsonify({
                'predictions': [],
                'days': days,
                'message': 'No sales data found. Upload data first.'
            })
        
        # Process and forecast
        cleaned = clean_sales_data(df=df)
        daily_sales = aggregate_daily_sales(cleaned)
        
        predictions = generate_forecast(days=days, daily_sales=daily_sales)
        
        return jsonify({
            'predictions': predictions,
            'days': days
        })
    except Exception as e:
        return jsonify({
            'predictions': [],
            'days': days,
            'error': str(e)
        }), 500
