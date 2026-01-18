"""
Alerts routes
"""
from flask import Blueprint, jsonify
from auth.auth_guard import require_auth
from services.alerts_engine import get_alerts

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/alerts', methods=['GET'])
@require_auth
def get_all_alerts():
    """
    Get all smart alerts
    
    Returns:
        { "alerts": [...] }
    """
    alerts = get_alerts()
    
    return jsonify({
        'alerts': alerts
    })
