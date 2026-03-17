"""
Database models and operations
NOTE: This module has been migrated to Supabase. 
Methods below are deprecated stubs for backward compatibility.
"""
from datetime import datetime
from database.db import get_supabase

class User:
    """User model for authentication - Supabase implementation"""
    
    @staticmethod
    def find_by_google_id(google_id: str):
        """Find user by Google ID"""
        try:
            client = get_supabase()
            response = client.table('users').select('*').eq('google_id', google_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error finding user by google_id: {e}")
            return None
    
    @staticmethod
    def find_by_email(email: str):
        """Find user by email"""
        try:
            client = get_supabase()
            response = client.table('users').select('*').eq('email', email).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error finding user by email: {e}")
            return None
    
    @staticmethod
    def find_by_id(user_id: int):
        """Find user by ID"""
        try:
            client = get_supabase()
            response = client.table('users').select('*').eq('id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error finding user by id: {e}")
            return None
    
    @staticmethod
    def find_by_provider(provider: str, provider_id: str):
        """Find user by social provider"""
        try:
            client = get_supabase()
            response = client.table('users').select('*').eq(f'{provider}_id', provider_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error finding user by provider: {e}")
            return None
    
    @staticmethod
    def create(google_id: str, email: str, name: str, avatar: str = None):
        """Create a new user with Google auth"""
        try:
            client = get_supabase()
            avatar = avatar or f'https://api.dicebear.com/7.x/avataaars/svg?seed={name}'
            data = {
                'google_id': google_id,
                'email': email,
                'name': name,
                'avatar': avatar
            }
            response = client.table('users').insert(data).execute()
            created_user = response.data[0] if response.data else None
            if created_user:
                UserSettings.create(created_user.get('id'))
            return created_user
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    @staticmethod
    def create_with_password(email: str, password_hash: str, password_salt: str, name: str):
        """Create a new user with email/password auth"""
        try:
            client = get_supabase()
            avatar = f'https://api.dicebear.com/7.x/avataaars/svg?seed={name}'
            data = {
                'email': email,
                'name': name,
                'avatar': avatar,
                'password_hash': password_hash,
                'password_salt': password_salt
            }
            response = client.table('users').insert(data).execute()
            created_user = response.data[0] if response.data else None
            if created_user:
                UserSettings.create(created_user.get('id'))
            return created_user
        except Exception as e:
            print(f"Error creating user with password: {e}")
            return None
    
    @staticmethod
    def create_with_provider(provider: str, provider_id: str, email: str, name: str, avatar: str = None):
        """Create a new user with social provider"""
        try:
            client = get_supabase()
            data = {
                f'{provider}_id': provider_id,
                'email': email,
                'name': name,
                'avatar': avatar
            }
            response = client.table('users').insert(data).execute()
            created_user = response.data[0] if response.data else None
            if created_user:
                UserSettings.create(created_user.get('id'))
            return created_user
        except Exception as e:
            print(f"Error creating user with provider: {e}")
            return None
    
    @staticmethod
    def link_provider(user_id: int, provider: str, provider_id: str):
        """Link social provider to existing user"""
        try:
            client = get_supabase()
            client.table('users').update({f'{provider}_id': provider_id}).eq('id', user_id).execute()
        except Exception as e:
            print(f"Error linking provider: {e}")
    
    @staticmethod
    def update_last_login(user_id: int):
        """Update user's last login timestamp"""
        try:
            client = get_supabase()
            client.table('users').update({'last_login': datetime.now().isoformat()}).eq('id', user_id).execute()
        except Exception as e:
            print(f"Error updating last login: {e}")


class UserSettings:
    """User settings model"""
    
    @staticmethod
    def find_by_user_id(user_id: int):
        """Find settings by user ID"""
        try:
            client = get_supabase()
            response = client.table('user_settings').select('*').eq('user_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error finding user settings: {e}")
            return None
    
    @staticmethod
    def create(user_id: int):
        """Create default settings for user"""
        try:
            client = get_supabase()
            data = {'user_id': user_id}
            client.table('user_settings').insert(data).execute()
        except Exception as e:
            print(f"Error creating user settings: {e}")
    
    @staticmethod
    def update(user_id: int, **kwargs):
        """Update user settings"""
        try:
            client = get_supabase()
            update_data = {}
            for key, value in kwargs.items():
                if key in ['theme', 'notifications_enabled', 'default_forecast_days']:
                    update_data[key] = value
            
            if update_data:
                client.table('user_settings').update(update_data).eq('user_id', user_id).execute()
                return UserSettings.find_by_user_id(user_id)
        except Exception as e:
            print(f"Error updating user settings: {e}")
        return None


class UploadHistory:
    """Upload history model"""
    
    @staticmethod
    def create(user_id: int, filename: str, rows_count: int, status: str = 'success'):
        """Record a new upload"""
        try:
            client = get_supabase()
            data = {
                'user_id': user_id,
                'filename': filename,
                'rows_count': rows_count,
                'status': status
            }
            client.table('upload_history').insert(data).execute()
        except Exception as e:
            print(f"Error creating upload history: {e}")
    
    @staticmethod
    def get_user_history(user_id: int, limit: int = 10):
        """Get upload history for user"""
        try:
            client = get_supabase()
            response = client.table('upload_history').select('*').eq('user_id', user_id).order('uploaded_at', desc=True).limit(limit).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting upload history: {e}")
            return []

