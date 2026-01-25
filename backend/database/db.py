"""
Database initialization and connection management
Uses SQLite for lightweight storage
"""
import sqlite3
import os

DATABASE_PATH = None

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path: str):
    """Initialize the database with required tables"""
    global DATABASE_PATH
    DATABASE_PATH = db_path
    
    os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else '.', exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table with multiple auth providers
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            avatar TEXT,
            google_id TEXT UNIQUE,
            github_id TEXT UNIQUE,
            facebook_id TEXT UNIQUE,
            password_hash TEXT,
            password_salt TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create user_settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            theme TEXT DEFAULT 'dark',
            notifications_enabled BOOLEAN DEFAULT 1,
            default_forecast_days INTEGER DEFAULT 7,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create upload_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS upload_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            rows_count INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'success',
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database initialized at {db_path}")
