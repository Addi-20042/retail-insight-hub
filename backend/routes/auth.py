"""
Authentication routes
Handles Google OAuth, Email/Password, and social login (GitHub, Facebook)
"""
from flask import Blueprint, request, jsonify
from auth.google_auth import verify_google_token
from auth.email_auth import register_user, authenticate_user, validate_email
from auth.token_utils import create_token
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


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register new user with email/password
    
    Request body:
        { "email": "...", "password": "...", "name": "..." (optional) }
        
    Returns:
        { "token": "jwt_token", "user": {...} }
    """
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        user = register_user(
            email=data['email'],
            password=data['password'],
            name=data.get('name')
        )
        
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
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def email_login():
    """
    Login with email/password
    
    Request body:
        { "email": "...", "password": "..." }
        
    Returns:
        { "token": "jwt_token", "user": {...} }
    """
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        user = authenticate_user(data['email'], data['password'])
        
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
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/social/<provider>', methods=['POST'])
def social_login(provider: str):
    """
    Authenticate with social providers (github, facebook)
    
    Request body:
        { "access_token": "...", "user_info": {...} }
        
    Returns:
        { "token": "jwt_token", "user": {...} }
    """
    if provider not in ['github', 'facebook']:
        return jsonify({'error': 'Unsupported provider'}), 400
    
    data = request.get_json()
    
    if not data or 'user_info' not in data:
        return jsonify({'error': 'Missing user_info'}), 400
    
    try:
        user_info = data['user_info']
        provider_id = str(user_info.get('id', user_info.get('sub', '')))
        email = user_info.get('email', f'{provider_id}@{provider}.user')
        name = user_info.get('name', user_info.get('login', 'User'))
        avatar = user_info.get('avatar_url', user_info.get('picture', ''))
        
        # Find or create user by provider
        user = User.find_by_provider(provider, provider_id)
        
        if not user:
            # Try to find by email
            user = User.find_by_email(email)
            
            if user:
                # Link provider to existing account
                User.link_provider(user['id'], provider, provider_id)
            else:
                # Create new user
                user = User.create_with_provider(
                    provider=provider,
                    provider_id=provider_id,
                    email=email,
                    name=name,
                    avatar=avatar or f'https://api.dicebear.com/7.x/avataaars/svg?seed={name}'
                )
        else:
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
        
    except Exception as e:
        return jsonify({'error': f'Social login failed: {str(e)}'}), 500


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
    
    Returns:
        { "message": "Logged out successfully" }
    """
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/password-reset', methods=['POST'])
def request_password_reset():
    """
    Request password reset email
    
    Request body:
        { "email": "..." }
        
    Returns:
        { "message": "If account exists, reset email sent" }
    """
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'error': 'Email is required'}), 400
    
    # Always return success to prevent email enumeration
    # In production, send actual reset email here
    return jsonify({
        'message': 'If an account with that email exists, a password reset link has been sent.'
    })
