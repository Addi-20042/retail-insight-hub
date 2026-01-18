"""
Data preprocessing service
Cleans and prepares retail data for ML models
"""
import pandas as pd
import numpy as np
from datetime import datetime
import os

def clean_sales_data(filepath: str) -> pd.DataFrame:
    """
    Clean and preprocess raw sales data
    
    Expected CSV columns:
        - InvoiceNo / invoice_id
        - StockCode / product_id
        - Description / product_name
        - Quantity
        - InvoiceDate / date
        - UnitPrice / price
        - CustomerID / customer_id
        - Country (optional)
    
    Args:
        filepath: Path to raw CSV file
        
    Returns:
        pd.DataFrame: Cleaned dataframe
    """
    # Read CSV
    df = pd.read_csv(filepath, encoding='latin-1')
    
    # Standardize column names
    column_mapping = {
        'InvoiceNo': 'invoice_id',
        'StockCode': 'product_id',
        'Description': 'product_name',
        'Quantity': 'quantity',
        'InvoiceDate': 'date',
        'UnitPrice': 'price',
        'CustomerID': 'customer_id',
        'Country': 'country'
    }
    
    df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})
    
    # Handle missing values
    df = df.dropna(subset=['invoice_id', 'quantity', 'price'])
    
    if 'product_name' in df.columns:
        df['product_name'] = df['product_name'].fillna('Unknown')
    
    if 'customer_id' in df.columns:
        df['customer_id'] = df['customer_id'].fillna(0).astype(int)
    
    # Remove negative quantities and prices (returns)
    df = df[df['quantity'] > 0]
    df = df[df['price'] > 0]
    
    # Calculate total revenue per line
    df['total'] = df['quantity'] * df['price']
    
    # Parse date
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        df['date_only'] = df['date'].dt.date
    
    return df


def aggregate_daily_sales(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate sales data by day for forecasting
    
    Args:
        df: Cleaned sales dataframe
        
    Returns:
        pd.DataFrame: Daily aggregated sales
    """
    if 'date_only' not in df.columns:
        return pd.DataFrame()
    
    daily = df.groupby('date_only').agg({
        'total': 'sum',
        'quantity': 'sum',
        'invoice_id': 'nunique'
    }).reset_index()
    
    daily.columns = ['date', 'revenue', 'quantity', 'transactions']
    daily['date'] = pd.to_datetime(daily['date'])
    daily = daily.sort_values('date')
    
    return daily


def prepare_segmentation_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepare data for customer/product segmentation
    
    Args:
        df: Cleaned sales dataframe
        
    Returns:
        pd.DataFrame: Aggregated data for clustering
    """
    if 'product_name' not in df.columns:
        return pd.DataFrame()
    
    # Aggregate by product
    product_agg = df.groupby('product_name').agg({
        'quantity': 'sum',
        'total': 'sum',
        'invoice_id': 'nunique'
    }).reset_index()
    
    product_agg.columns = ['product', 'total_quantity', 'total_revenue', 'transaction_count']
    
    return product_agg


def prepare_basket_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepare data for market basket analysis
    
    Args:
        df: Cleaned sales dataframe
        
    Returns:
        pd.DataFrame: Transaction-product matrix
    """
    if 'invoice_id' not in df.columns or 'product_name' not in df.columns:
        return pd.DataFrame()
    
    # Create basket dataframe
    basket = df.groupby(['invoice_id', 'product_name'])['quantity'].sum().unstack().fillna(0)
    
    # Convert to binary (purchased or not)
    basket = basket.applymap(lambda x: 1 if x > 0 else 0)
    
    return basket
