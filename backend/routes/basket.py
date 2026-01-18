"""
Market Basket Analysis routes
"""
from flask import Blueprint, request, jsonify
from auth.auth_guard import require_auth
from services.basket_analysis import get_all_rules, search_rules

basket_bp = Blueprint('basket', __name__)

@basket_bp.route('/basket', methods=['GET'])
@require_auth
def get_basket_rules():
    """
    Get all market basket rules
    
    Returns:
        { "rules": [...] }
    """
    rules = get_all_rules()
    
    return jsonify({
        'rules': rules
    })

@basket_bp.route('/basket/<product>', methods=['GET'])
@require_auth
def search_basket_rules(product: str):
    """
    Search basket rules for a specific product
    
    Args:
        product: Product name to search
        
    Returns:
        { "rules": [...], "product": "..." }
    """
    rules = search_rules(product)
    
    return jsonify({
        'rules': rules,
        'product': product
    })
