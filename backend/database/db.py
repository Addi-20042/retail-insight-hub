"""
Supabase database client helpers.
"""

from typing import Optional

from config import get_config

try:
    from supabase import Client, create_client
except ImportError:
    Client = None
    create_client = None

_supabase_client: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    """Return a singleton Supabase client when credentials are available."""
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if create_client is None:
        print("[WARNING] Supabase SDK not available - backend is running without DB access")
        return None

    config = get_config()
    url = getattr(config, "SUPABASE_URL", None)
    key = getattr(config, "SUPABASE_SERVICE_KEY", None)

    if not url or not key:
        print("[INFO] Supabase credentials are not configured yet")
        return None

    try:
        _supabase_client = create_client(url, key)
    except Exception as exc:
        print(f"[WARNING] Supabase connection failed: {exc}")
        return None

    return _supabase_client


def get_db_connection() -> Optional[Client]:
    """Compatibility helper for legacy callers."""
    return get_supabase()


def init_db(db_path: str = None):
    """Initialize the Supabase connection if available."""
    try:
        client = get_supabase()
        if client:
            client.table("sales_data").select("id").limit(1).execute()
            print("[SUCCESS] Connected to Supabase database")
        else:
            print("[INFO] Backend started without a live Supabase connection")
    except Exception as exc:
        print(f"[WARNING] Supabase connection warning: {exc}")
        print("  Backend will still start but database operations may fail.")
        print("  Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env.")


def get_sales_data(user_id: str = None):
    """Fetch sales data from Supabase."""
    client = get_supabase()
    if client is None:
        return []

    query = client.table("sales_data").select("*").order("date", desc=False)

    if user_id:
        query = query.eq("user_id", user_id)

    result = query.execute()
    return result.data or []


def get_sales_dataframe(user_id: str = None):
    """Return sales data as a pandas DataFrame."""
    import pandas as pd

    data = get_sales_data(user_id)
    if not data:
        return pd.DataFrame()

    dataframe = pd.DataFrame(data)
    if "date" in dataframe.columns:
        dataframe["date"] = pd.to_datetime(dataframe["date"])

    return dataframe
