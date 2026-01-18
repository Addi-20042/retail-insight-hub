"""
Data Upload routes
"""
import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from auth.auth_guard import require_auth
from services.preprocessing import (
    clean_sales_data, 
    aggregate_daily_sales, 
    prepare_segmentation_data,
    prepare_basket_data
)
from services.forecasting import train_model as train_forecast
from services.segmentation import train_model as train_segmentation
from services.basket_analysis import train_basket_model
from services.alerts_engine import generate_all_alerts
from database.models import UploadHistory

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'csv'}
UPLOAD_FOLDER = 'data/raw'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload', methods=['POST'])
@require_auth
def upload_file():
    """
    Upload and process sales data CSV
    
    Form data:
        file: CSV file
        
    Returns:
        { "message": "...", "stats": {...} }
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only CSV files are allowed'}), 400
    
    try:
        # Save file
        filename = secure_filename(file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Process data
        df = clean_sales_data(filepath)
        rows_count = len(df)
        
        # Aggregate for different analyses
        daily_sales = aggregate_daily_sales(df)
        product_data = prepare_segmentation_data(df)
        basket_data = prepare_basket_data(df)
        
        # Retrain models
        training_results = {}
        
        if len(daily_sales) > 0:
            training_results['forecast'] = train_forecast(daily_sales)
        
        if len(product_data) > 0:
            training_results['segmentation'] = train_segmentation(product_data)
        
        if len(basket_data) > 0:
            training_results['basket'] = train_basket_model(basket_data)
        
        # Generate new alerts
        if len(daily_sales) > 0:
            generate_all_alerts(daily_sales)
        
        # Record upload history
        user = request.current_user
        UploadHistory.create(
            user_id=user['id'],
            filename=filename,
            rows_count=rows_count,
            status='success'
        )
        
        return jsonify({
            'message': 'File processed successfully',
            'stats': {
                'rows_processed': rows_count,
                'products_found': len(product_data) if len(product_data) > 0 else 0,
                'date_range': {
                    'start': daily_sales['date'].min().strftime('%Y-%m-%d') if len(daily_sales) > 0 else None,
                    'end': daily_sales['date'].max().strftime('%Y-%m-%d') if len(daily_sales) > 0 else None
                }
            },
            'training': training_results
        })
        
    except Exception as e:
        # Record failed upload
        user = request.current_user
        UploadHistory.create(
            user_id=user['id'],
            filename=file.filename,
            rows_count=0,
            status='failed'
        )
        
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500
