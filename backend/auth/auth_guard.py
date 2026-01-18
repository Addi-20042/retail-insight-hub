"""
Authentication guard decorator
Protects routes that require authentication
"""
from functools import wraps
from flask import request, jsonify
from auth.token_utils import verify_token
from database.models import User
import jwt

def require_auth(f):
    """
    Decorator to protect routes with JWT authentication
    
    Usage:
        @require_auth
        def protected_route():
            user = request.current_user
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        # Extract token from "Bearer <token>"
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        token = parts[1]
        
        try:
            # Verify token
            payload = verify_token(token)
            
            # Get user from database
            user = User.find_by_id(payload['user_id'])
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            # Attach user to request
            request.current_user = user
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
    
    return decorated
