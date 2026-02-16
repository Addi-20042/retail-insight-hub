"""
Data preprocessing service
Cleans and prepares retail data for ML models
Now reads from Supabase instead of local CSV files
"""
import pandas as pd
import numpy as np
from datetime import datetime


def clean_sales_data(filepath: str = None, df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Clean and preprocess sales data
    
    Args:
        filepath: Path to raw CSV file (legacy support)
        df: Pre-loaded DataFrame (from Supabase)
        
    Returns:
        pd.DataFrame: Cleaned dataframe
    """
    if df is None and filepath:
        df = pd.read_csv(filepath, encoding='latin-1')
    elif df is None:
        return pd.DataFrame()
    
    df = df.copy()
    
    # Standardize column names (support both legacy CSV and Supabase formats)
    column_mapping = {
        'InvoiceNo': 'invoice_id',
        'StockCode': 'product_id',
        'Description': 'product_name',
        'Quantity': 'quantity',
        'InvoiceDate': 'date',
        'UnitPrice': 'price',
        'CustomerID': 'customer_id',
        'Country': 'country',
        # Supabase format mapping
        'product': 'product_name',
        'revenue': 'total',
        'transaction_id': 'invoice_id',
    }
    
    df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})
    
    # Handle Supabase data (already clean)
    if 'total' not in df.columns and 'quantity' in df.columns:
        if 'price' in df.columns:
            df['total'] = df['quantity'] * df['price']
        elif 'revenue' in df.columns:
            df['total'] = df['revenue']
    
    # Handle missing values
    if 'product_name' in df.columns:
        df['product_name'] = df['product_name'].fillna('Unknown')
    
    # Parse date
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        df['date_only'] = df['date'].dt.date
    
    return df


def aggregate_daily_sales(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate sales data by day for forecasting
    """
    if df.empty:
        return pd.DataFrame()
    
    if 'date_only' not in df.columns and 'date' in df.columns:
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['date_only'] = df['date'].dt.date
    
    if 'date_only' not in df.columns:
        return pd.DataFrame()
    
    revenue_col = 'total' if 'total' in df.columns else 'revenue' if 'revenue' in df.columns else None
    if revenue_col is None:
        return pd.DataFrame()
    
    agg_dict = {revenue_col: 'sum', 'quantity': 'sum'}
    if 'invoice_id' in df.columns:
        agg_dict['invoice_id'] = 'nunique'
    
    daily = df.groupby('date_only').agg(agg_dict).reset_index()
    
    # Standardize column names
    rename = {'date_only': 'date', revenue_col: 'revenue'}
    if 'invoice_id' in daily.columns:
        rename['invoice_id'] = 'transactions'
    daily = daily.rename(columns=rename)
    
    daily['date'] = pd.to_datetime(daily['date'])
    daily = daily.sort_values('date')
    
    return daily


def prepare_segmentation_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepare data for customer/product segmentation
    """
    product_col = 'product_name' if 'product_name' in df.columns else 'product' if 'product' in df.columns else None
    if product_col is None or df.empty:
        return pd.DataFrame()
    
    revenue_col = 'total' if 'total' in df.columns else 'revenue' if 'revenue' in df.columns else None
    if revenue_col is None:
        return pd.DataFrame()
    
    agg_dict = {'quantity': 'sum', revenue_col: 'sum'}
    tx_col = 'invoice_id' if 'invoice_id' in df.columns else 'transaction_id' if 'transaction_id' in df.columns else None
    if tx_col:
        agg_dict[tx_col] = 'nunique'
    
    product_agg = df.groupby(product_col).agg(agg_dict).reset_index()
    
    cols = [product_col, 'quantity', revenue_col]
    if tx_col:
        cols.append(tx_col)
    product_agg = product_agg[cols]
    
    rename = {product_col: 'product', revenue_col: 'total_revenue', 'quantity': 'total_quantity'}
    if tx_col:
        rename[tx_col] = 'transaction_count'
    product_agg = product_agg.rename(columns=rename)
    
    if 'transaction_count' not in product_agg.columns:
        product_agg['transaction_count'] = 1
    
    return product_agg


def prepare_basket_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepare data for market basket analysis
    """
    tx_col = 'invoice_id' if 'invoice_id' in df.columns else 'transaction_id' if 'transaction_id' in df.columns else None
    product_col = 'product_name' if 'product_name' in df.columns else 'product' if 'product' in df.columns else None
    
    if tx_col is None or product_col is None or df.empty:
        return pd.DataFrame()
    
    basket = df.groupby([tx_col, product_col])['quantity'].sum().unstack().fillna(0)
    basket = basket.map(lambda x: 1 if x > 0 else 0)
    
    return basket
