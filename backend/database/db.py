"""
Supabase database client
Replaces SQLite with Supabase for all data operations
"""
import os
from supabase import create_client, Client
from config import get_config

_supabase_client: Client = None

def get_supabase() -> Client:
    """Get Supabase client instance (singleton)"""
    global _supabase_client
    if _supabase_client is None:
        config = get_config()
        url = config.SUPABASE_URL
        key = config.SUPABASE_SERVICE_KEY
        
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment. "
                "Get these from your Lovable Cloud project settings."
            )
        
        _supabase_client = create_client(url, key)
    
    return _supabase_client


def init_db(db_path: str = None):
    """Initialize database connection (now uses Supabase)"""
    try:
        client = get_supabase()
        # Test connection
        result = client.table('sales_data').select('id').limit(1).execute()
        print("✅ Connected to Supabase database")
    except Exception as e:
        print(f"⚠️ Supabase connection warning: {e}")
        print("  Backend will still start but database operations may fail.")
        print("  Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.")


def get_sales_data(user_id: str = None):
    """
    Fetch sales data from Supabase
    
    Args:
        user_id: Optional user ID to filter by
        
    Returns:
        list: Sales data records
    """
    client = get_supabase()
    query = client.table('sales_data').select('*').order('date', desc=False)
    
    if user_id:
        query = query.eq('user_id', user_id)
    
    result = query.execute()
    return result.data or []


def get_sales_dataframe(user_id: str = None):
    """
    Get sales data as a pandas DataFrame
    
    Args:
        user_id: Optional user ID to filter by
        
    Returns:
        pd.DataFrame: Sales data
    """
    import pandas as pd
    
    data = get_sales_data(user_id)
    if not data:
        return pd.DataFrame()
    
    df = pd.DataFrame(data)
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
    
    return df
