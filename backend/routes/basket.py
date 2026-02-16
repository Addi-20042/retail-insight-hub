"""
Market Basket Analysis routes - Now reads from Supabase
"""
from flask import Blueprint, request, jsonify
from auth.auth_guard import require_auth
from services.basket_analysis import get_all_rules, search_rules, train_basket_model
from database.db import get_sales_dataframe
from services.preprocessing import clean_sales_data, prepare_basket_data

basket_bp = Blueprint('basket', __name__)

@basket_bp.route('/basket', methods=['GET'])
@require_auth
def get_basket_rules():
    """Get all market basket rules using data from Supabase"""
    try:
        user = request.current_user
        user_id = user.get('id') or user.get('user_id')
        
        df = get_sales_dataframe(user_id)
        
        if df.empty:
            return jsonify({
                'rules': [],
                'message': 'No sales data found. Upload data first.'
            })
        
        cleaned = clean_sales_data(df=df)
        basket_data = prepare_basket_data(cleaned)
        
        if basket_data.empty:
            return jsonify({
                'rules': [],
                'message': 'No transaction data available for basket analysis.'
            })
        
        # Train and get rules
        train_basket_model(basket_data)
        rules = get_all_rules()
        
        return jsonify({'rules': rules})
    except Exception as e:
        return jsonify({'rules': [], 'error': str(e)}), 500

@basket_bp.route('/basket/<product>', methods=['GET'])
@require_auth
def search_basket_rules(product: str):
    """Search basket rules for a specific product"""
    try:
        # Ensure rules are computed from Supabase data
        user = request.current_user
        user_id = user.get('id') or user.get('user_id')
        
        df = get_sales_dataframe(user_id)
        if not df.empty:
            cleaned = clean_sales_data(df=df)
            basket_data = prepare_basket_data(cleaned)
            if not basket_data.empty:
                train_basket_model(basket_data)
        
        rules = search_rules(product)
        
        return jsonify({
            'rules': rules,
            'product': product
        })
    except Exception as e:
        return jsonify({'rules': [], 'product': product, 'error': str(e)}), 500
