from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User
from auth import verify_password, create_access_token, get_current_user
from datetime import timedelta, datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserProfileResponse(BaseModel):
    id: int
    email: str
    role: str
    subscription_active: bool

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
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    # Generate token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserProfileResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
