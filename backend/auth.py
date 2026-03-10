import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import bcrypt
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole

# ---------------------------------------------------------
# Security Configuration
# ---------------------------------------------------------
# In production, do not hardcode the secret key! Use env vars.
SECRET_KEY = os.environ.get("SECRET_KEY", "SUPER_SECURE_MOCK_KEY_FOR_BLACKVAVE_99!@")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ---------------------------------------------------------
# Password Hashing Helper
# ---------------------------------------------------------
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password=password_byte_enc, hashed_password=hashed_password_byte_enc)

# ---------------------------------------------------------
# JWT Token Helpers
# ---------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ---------------------------------------------------------
# FastAPI Dependencies for Route Protection
# ---------------------------------------------------------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Extract and validate the user from the JWT token"""
    payload = decode_access_token(token)
    email: str = payload.get("sub")
    
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account")
        
    return user

def require_superadmin(current_user: User = Depends(get_current_user)):
    """Dependency that only allows SUPERADMIN"""
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin privileges required")
    return current_user

def require_active_access(current_user: User = Depends(get_current_user)):
    """
    Dependency that ensures the user is either a SUPERADMIN, an EMPLOYEE (free tools),
    or a SUBSCRIBER with an Active subscription.
    """
    if current_user.role in [UserRole.SUPERADMIN, UserRole.EMPLOYEE]:
        return current_user
        
    if current_user.role == UserRole.SUBSCRIBER and not current_user.subscription_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active subscription required to use this tool")
        
    return current_user
