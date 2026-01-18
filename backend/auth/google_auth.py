"""
Google OAuth verification
Validates Google ID tokens and extracts user information
"""
from google.oauth2 import id_token
from google.auth.transport import requests
from config import get_config

def verify_google_token(token: str) -> dict:
    """
    Verify Google ID token and extract user info
    
    Args:
        token: Google ID token from frontend
        
    Returns:
        dict: User information (sub, email, name, picture)
        
    Raises:
        ValueError: If token is invalid
    """
    config = get_config()
    
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            config.GOOGLE_CLIENT_ID
        )
        
        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Invalid issuer')
        
        # Extract user info
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', idinfo['email'].split('@')[0]),
            'avatar': idinfo.get('picture', '')
        }
        
    except Exception as e:
        raise ValueError(f'Invalid Google token: {str(e)}')
