"""
Segmentation routes - Now reads from Supabase
"""
from flask import Blueprint, request, jsonify
from auth.auth_guard import require_auth
from services.segmentation import get_segments, get_segment_summary
from database.db import get_sales_dataframe
from services.preprocessing import clean_sales_data, prepare_segmentation_data

segments_bp = Blueprint('segments', __name__)

@segments_bp.route('/segments', methods=['GET'])
@require_auth
def get_segmentation():
    """
    Get customer/product segments using data from Supabase
    """
    try:
        user = request.current_user
        user_id = user.get('id') or user.get('user_id')
        
        df = get_sales_dataframe(user_id)
        
        if df.empty:
            return jsonify({
                'segments': [],
                'summary': get_segment_summary(),
                'message': 'No sales data found. Upload data first.'
            })
        
        cleaned = clean_sales_data(df=df)
        product_data = prepare_segmentation_data(cleaned)
        
        segments = get_segments(product_data)
        summary = get_segment_summary()
        
        return jsonify({
            'segments': segments,
            'summary': summary
        })
    except Exception as e:
        return jsonify({
            'segments': [],
            'summary': [],
            'error': str(e)
        }), 500
