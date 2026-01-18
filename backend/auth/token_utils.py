"""
JWT Token utilities
Handles token creation and verification
"""
import jwt
from datetime import datetime, timedelta
from config import get_config

def create_token(user_id: int, email: str) -> str:
    """
    Create a JWT token for authenticated user
    
    Args:
        user_id: Database user ID
        email: User's email
        
    Returns:
        str: JWT token
    """
    config = get_config()
    
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm='HS256')


def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token
        
    Returns:
        dict: Token payload
        
    Raises:
        jwt.InvalidTokenError: If token is invalid or expired
    """
    config = get_config()
    
    return jwt.decode(token, config.JWT_SECRET_KEY, algorithms=['HS256'])


def decode_token_unsafe(token: str) -> dict:
    """
    Decode token without verification (for debugging)
    
    Args:
        token: JWT token
        
    Returns:
        dict: Token payload
    """
    return jwt.decode(token, options={"verify_signature": False})
