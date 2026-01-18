"""
Database models and operations
"""
from database.db import get_db_connection
from datetime import datetime

class User:
    """User model for authentication"""
    
    @staticmethod
    def find_by_google_id(google_id: str):
        """Find user by Google ID"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE google_id = ?', (google_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    
    @staticmethod
    def find_by_email(email: str):
        """Find user by email"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    
    @staticmethod
    def find_by_id(user_id: int):
        """Find user by ID"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    
    @staticmethod
    def create(google_id: str, email: str, name: str, avatar: str = None):
        """Create a new user"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (google_id, email, name, avatar)
            VALUES (?, ?, ?, ?)
        ''', (google_id, email, name, avatar))
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Create default settings
        UserSettings.create(user_id)
        
        return User.find_by_id(user_id)
    
    @staticmethod
    def update_last_login(user_id: int):
        """Update user's last login timestamp"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE users SET last_login = ? WHERE id = ?
        ''', (datetime.now(), user_id))
        conn.commit()
        conn.close()


class UserSettings:
    """User settings model"""
    
    @staticmethod
    def find_by_user_id(user_id: int):
        """Find settings by user ID"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM user_settings WHERE user_id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    
    @staticmethod
    def create(user_id: int):
        """Create default settings for user"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_settings (user_id) VALUES (?)
        ''', (user_id,))
        conn.commit()
        conn.close()
    
    @staticmethod
    def update(user_id: int, **kwargs):
        """Update user settings"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        for key, value in kwargs.items():
            if key in ['theme', 'notifications_enabled', 'default_forecast_days']:
                updates.append(f'{key} = ?')
                values.append(value)
        
        if updates:
            values.append(user_id)
            cursor.execute(f'''
                UPDATE user_settings SET {', '.join(updates)} WHERE user_id = ?
            ''', values)
            conn.commit()
        
        conn.close()
        return UserSettings.find_by_user_id(user_id)


class UploadHistory:
    """Upload history model"""
    
    @staticmethod
    def create(user_id: int, filename: str, rows_count: int, status: str = 'success'):
        """Record a new upload"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO upload_history (user_id, filename, rows_count, status)
            VALUES (?, ?, ?, ?)
        ''', (user_id, filename, rows_count, status))
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_user_history(user_id: int, limit: int = 10):
        """Get upload history for user"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM upload_history 
            WHERE user_id = ? 
            ORDER BY uploaded_at DESC 
            LIMIT ?
        ''', (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
