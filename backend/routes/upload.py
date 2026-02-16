"""
Data Upload routes - Now writes to Supabase
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
from database.db import get_supabase

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
    Saves data to Supabase instead of local storage
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only CSV files are allowed'}), 400
    
    try:
        import pandas as pd
        
        user = request.current_user
        user_id = str(user.get('id') or user.get('user_id'))
        
        # Save file temporarily for processing
        filename = secure_filename(file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Read and clean data
        raw_df = pd.read_csv(filepath, encoding='latin-1')
        df = clean_sales_data(filepath=filepath)
        rows_count = len(df)
        
        # Insert data into Supabase
        client = get_supabase()
        
        # Prepare records for Supabase
        records = []
        for _, row in df.iterrows():
            record = {
                'user_id': user_id,
                'date': row.get('date_only', row.get('date', '')),
                'product': row.get('product_name', row.get('product', 'Unknown')),
                'quantity': int(row.get('quantity', 0)),
                'revenue': float(row.get('total', row.get('revenue', 0))),
            }
            
            if isinstance(record['date'], pd.Timestamp):
                record['date'] = record['date'].strftime('%Y-%m-%d')
            else:
                record['date'] = str(record['date'])
            
            if 'customer_id' in row and pd.notna(row['customer_id']):
                record['customer_id'] = str(int(row['customer_id'])) if isinstance(row['customer_id'], float) else str(row['customer_id'])
            
            if 'invoice_id' in row and pd.notna(row['invoice_id']):
                record['transaction_id'] = str(row['invoice_id'])
            
            if 'category' in row and pd.notna(row['category']):
                record['category'] = str(row['category'])
            
            records.append(record)
        
        # Batch insert into Supabase (chunks of 500)
        chunk_size = 500
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            result = client.table('sales_data').insert(chunk).execute()
        
        # Record upload history in Supabase
        client.table('upload_history').insert({
            'user_id': user_id,
            'filename': filename,
            'rows_count': len(records),
            'status': 'success'
        }).execute()
        
        # Log activity
        client.table('activity_log').insert({
            'user_id': user_id,
            'type': 'upload',
            'message': f'Uploaded {filename} ({len(records)} rows) via Flask backend'
        }).execute()
        
        # Retrain models with new data
        daily_sales = aggregate_daily_sales(df)
        product_data = prepare_segmentation_data(df)
        basket_data = prepare_basket_data(df)
        
        training_results = {}
        
        if len(daily_sales) > 0:
            training_results['forecast'] = train_forecast(daily_sales)
        
        if len(product_data) > 0:
            training_results['segmentation'] = train_segmentation(product_data)
        
        if len(basket_data) > 0:
            training_results['basket'] = train_basket_model(basket_data)
        
        if len(daily_sales) > 0:
            generate_all_alerts(daily_sales)
        
        # Clean up temp file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'message': 'File processed and saved to database',
            'stats': {
                'rows_processed': len(records),
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
        try:
            client = get_supabase()
            client.table('upload_history').insert({
                'user_id': user_id,
                'filename': file.filename,
                'rows_count': 0,
                'status': 'failed'
            }).execute()
        except:
            pass
        
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500
