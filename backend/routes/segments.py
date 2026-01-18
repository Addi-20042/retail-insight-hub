"""
Segmentation routes
"""
from flask import Blueprint, jsonify
from auth.auth_guard import require_auth
from services.segmentation import get_segments, get_segment_summary

segments_bp = Blueprint('segments', __name__)

@segments_bp.route('/segments', methods=['GET'])
@require_auth
def get_segmentation():
    """
    Get customer/product segments
    
    Returns:
        { "segments": [...], "summary": [...] }
    """
    segments = get_segments()
    summary = get_segment_summary()
    
    return jsonify({
        'segments': segments,
        'summary': summary
    })
