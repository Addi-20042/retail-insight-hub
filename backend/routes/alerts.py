"""
Alerts routes - Now reads from Supabase
"""
from flask import Blueprint, request, jsonify
from auth.auth_guard import require_auth
from services.alerts_engine import generate_all_alerts
from database.db import get_sales_dataframe
from services.preprocessing import clean_sales_data, aggregate_daily_sales

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/alerts', methods=['GET'])
@require_auth
def get_all_alerts():
    """Get all smart alerts using data from Supabase"""
    try:
        user = request.current_user
        user_id = user.get('id') or user.get('user_id')
        
        df = get_sales_dataframe(user_id)
        
        if df.empty:
            return jsonify({
                'alerts': [],
                'message': 'No sales data found. Upload data first.'
            })
        
        cleaned = clean_sales_data(df=df)
        daily_sales = aggregate_daily_sales(cleaned)
        
        alerts = generate_all_alerts(daily_sales)
        
        return jsonify({'alerts': alerts})
    except Exception as e:
        return jsonify({'alerts': [], 'error': str(e)}), 500
