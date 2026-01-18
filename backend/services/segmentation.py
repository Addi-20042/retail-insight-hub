"""
Customer Segmentation Service
Uses K-Means clustering to segment customers/products
"""
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os

MODEL_PATH = 'models/segmentation_model.pkl'
SCALER_PATH = 'models/segmentation_scaler.pkl'

def train_model(product_data: pd.DataFrame, n_clusters: int = 4) -> dict:
    """
    Train K-Means clustering model
    
    Args:
        product_data: Product aggregated data
        n_clusters: Number of clusters
        
    Returns:
        dict: Training results
    """
    if len(product_data) < n_clusters:
        return {'error': 'Insufficient data for clustering'}
    
    # Features for clustering
    features = product_data[['total_quantity', 'total_revenue', 'transaction_count']].copy()
    
    # Scale features
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    # Train K-Means
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    model.fit(features_scaled)
    
    # Save model and scaler
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    
    return {
        'clusters': n_clusters,
        'inertia': model.inertia_,
        'samples': len(product_data)
    }


def get_segments(product_data: pd.DataFrame = None) -> list:
    """
    Get product segments
    
    Args:
        product_data: Product aggregated data
        
    Returns:
        list: Segmented products with cluster labels
    """
    # If no data provided, return sample data
    if product_data is None or len(product_data) == 0:
        return generate_sample_segments()
    
    # Check if model exists
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        # Train model first
        train_model(product_data)
    
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
    except Exception:
        return generate_sample_segments()
    
    # Prepare features
    features = product_data[['total_quantity', 'total_revenue', 'transaction_count']].copy()
    features_scaled = scaler.transform(features)
    
    # Predict clusters
    clusters = model.predict(features_scaled)
    
    # Add cluster labels
    result = product_data.copy()
    result['segment_id'] = clusters
    result['segment_name'] = result['segment_id'].map({
        0: 'High Value',
        1: 'Regular',
        2: 'Occasional',
        3: 'Low Activity'
    })
    
    # Convert to list of dicts
    return result.to_dict('records')


def get_segment_summary() -> list:
    """Get summary statistics for each segment"""
    return [
        {
            'id': 0,
            'name': 'High Value',
            'description': 'Top performers with high revenue and frequency',
            'color': '#10b981'
        },
        {
            'id': 1,
            'name': 'Regular',
            'description': 'Consistent moderate activity',
            'color': '#3b82f6'
        },
        {
            'id': 2,
            'name': 'Occasional',
            'description': 'Infrequent but notable purchases',
            'color': '#f59e0b'
        },
        {
            'id': 3,
            'name': 'Low Activity',
            'description': 'Minimal engagement, potential for growth',
            'color': '#ef4444'
        }
    ]


def generate_sample_segments() -> list:
    """Generate sample segment data"""
    products = [
        {'product': 'WHITE HANGING HEART', 'total_quantity': 2450, 'total_revenue': 8575.00, 'segment_id': 0, 'segment_name': 'High Value'},
        {'product': 'REGENCY CAKESTAND', 'total_quantity': 1890, 'total_revenue': 7560.00, 'segment_id': 0, 'segment_name': 'High Value'},
        {'product': 'JUMBO BAG RED RETROSPOT', 'total_quantity': 1650, 'total_revenue': 4950.00, 'segment_id': 1, 'segment_name': 'Regular'},
        {'product': 'PARTY BUNTING', 'total_quantity': 1420, 'total_revenue': 4260.00, 'segment_id': 1, 'segment_name': 'Regular'},
        {'product': 'LUNCH BAG APPLE DESIGN', 'total_quantity': 980, 'total_revenue': 2940.00, 'segment_id': 2, 'segment_name': 'Occasional'},
        {'product': 'SET OF 3 CAKE TINS', 'total_quantity': 750, 'total_revenue': 2250.00, 'segment_id': 2, 'segment_name': 'Occasional'},
        {'product': 'POSTAGE', 'total_quantity': 320, 'total_revenue': 640.00, 'segment_id': 3, 'segment_name': 'Low Activity'},
        {'product': 'DISCOUNT', 'total_quantity': 150, 'total_revenue': -450.00, 'segment_id': 3, 'segment_name': 'Low Activity'},
    ]
    return products
