from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, UserRole
from auth import verify_password, create_access_token, get_current_user, hash_password
from datetime import timedelta, datetime
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserProfileResponse(BaseModel):
    id: int
    email: str
    role: str
    subscription_active: bool

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "SUBSCRIBER" # Default to subscriber, can also request EMPLOYEE

@router.post("/register")
def register_user(
    request: RegisterRequest, 
    db: Session = Depends(get_db)
):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed_pwd = hash_password(request.password)
    
    # Map string role to enum
    try:
        user_role = UserRole(request.role.upper())
    except ValueError:
        user_role = UserRole.SUBSCRIBER
        
    new_user = User(
        email=request.email,
        hashed_password=hashed_pwd,
        role=user_role,
        is_active=False,  # Needs admin approval
        subscription_active=False
    )
    
    db.add(new_user)
    db.commit()
    
    return {"message": "Registration successful. Please wait for an Admin to approve your account."}

@router.post("/login", response_model=TokenResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Your account is pending Admin approval.")
        
    # Generate token
    session_token = uuid.uuid4().hex
    user.active_session_token = session_token
    db.commit()
    
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": user.email, "session": session_token}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserProfileResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
