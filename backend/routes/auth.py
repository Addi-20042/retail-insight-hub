"""
Authentication routes
Handles Google OAuth login, token verification, and logout
"""
from flask import Blueprint, request, jsonify
from auth.google_auth import verify_google_token
from auth.token_utils import create_token, verify_token
from auth.auth_guard import require_auth
from database.models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/google', methods=['POST'])
def google_login():
    """
    Authenticate user with Google ID token
    
    Request body:
        { "id_token": "google_id_token" }
        
    Returns:
        { "token": "jwt_token", "user": {...} }
    """
    data = request.get_json()
    
    if not data or 'id_token' not in data:
        return jsonify({'error': 'Missing id_token'}), 400
    
    try:
        # Verify Google token and extract user info
        google_user = verify_google_token(data['id_token'])
        
        # Find or create user
        user = User.find_by_google_id(google_user['google_id'])
        
        if not user:
            # Create new user
            user = User.create(
                google_id=google_user['google_id'],
                email=google_user['email'],
                name=google_user['name'],
                avatar=google_user['avatar']
            )
        else:
            # Update last login
            User.update_last_login(user['id'])
        
        # Create JWT token
        token = create_token(user['id'], user['email'])
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'avatar': user['avatar']
            }
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': f'Authentication failed: {str(e)}'}), 500


@auth_bp.route('/verify', methods=['GET'])
@require_auth
def verify_auth():
    """
    Verify current JWT token and return user info
    
    Headers:
        Authorization: Bearer <jwt_token>
        
    Returns:
        { "user": {...} }
    """
    user = request.current_user
    
    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'avatar': user['avatar']
        }
    })


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """
    Logout current user
    (In a stateless JWT system, logout is handled client-side)
    
    Returns:
        { "message": "Logged out successfully" }
    """
    # With JWT, we don't need server-side logout
    # The client should remove the token
    return jsonify({'message': 'Logged out successfully'})
