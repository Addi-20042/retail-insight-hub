"""
Email/Password Authentication
Handles traditional email-based authentication with password hashing
"""
import hashlib
import secrets
import re
from database.models import User

def hash_password(password: str, salt: str = None) -> tuple:
    """
    Hash password using SHA-256 with salt
    
    Args:
        password: Plain text password
        salt: Optional salt (generated if not provided)
        
    Returns:
        tuple: (hashed_password, salt)
    """
    if salt is None:
        salt = secrets.token_hex(16)
    
    salted = f"{password}{salt}"
    hashed = hashlib.sha256(salted.encode()).hexdigest()
    
    return hashed, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """
    Verify password against stored hash
    
    Args:
        password: Plain text password to verify
        hashed: Stored password hash
        salt: Stored salt
        
    Returns:
        bool: True if password matches
    """
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, hashed)


def validate_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email: Email address to validate
        
    Returns:
        bool: True if valid email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    
    return True, None


def register_user(email: str, password: str, name: str = None) -> dict:
    """
    Register a new user with email/password
    
    Args:
        email: User email
        password: User password
        name: Optional display name
        
    Returns:
        dict: Created user object
        
    Raises:
        ValueError: If validation fails or user exists
    """
    # Validate email
    if not validate_email(email):
        raise ValueError("Invalid email format")
    
    # Validate password
    is_valid, error = validate_password(password)
    if not is_valid:
        raise ValueError(error)
    
    # Check if user exists
    existing = User.find_by_email(email)
    if existing:
        raise ValueError("An account with this email already exists")
    
    # Hash password
    hashed, salt = hash_password(password)
    
    # Create user
    display_name = name or email.split('@')[0]
    user = User.create_with_password(
        email=email,
        password_hash=hashed,
        password_salt=salt,
        name=display_name
    )
    
    return user


def authenticate_user(email: str, password: str) -> dict:
    """
    Authenticate user with email/password
    
    Args:
        email: User email
        password: User password
        
    Returns:
        dict: User object if authenticated
        
    Raises:
        ValueError: If authentication fails
    """
    # Find user by email
    user = User.find_by_email(email)
    if not user:
        raise ValueError("Invalid email or password")
    
    # Check if user has password auth enabled
    if not user.get('password_hash') or not user.get('password_salt'):
        raise ValueError("This account uses social login. Please sign in with Google, GitHub, or Facebook.")
    
    # Verify password
    if not verify_password(password, user['password_hash'], user['password_salt']):
        raise ValueError("Invalid email or password")
    
    # Update last login
    User.update_last_login(user['id'])
    
    return user
