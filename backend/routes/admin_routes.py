from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List

from database import get_db
from models import User, UserRole
from auth import require_superadmin, hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])

class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    is_active: bool = True
    subscription_active: bool = False

class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    is_active: bool
    subscription_active: bool

    class Config:
        from_attributes = True

@router.post("/users", response_model=UserResponse)
def create_user(
    user_data: UserCreateRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin) # Protected!
):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        role=user_data.role,
        is_active=user_data.is_active,
        subscription_active=user_data.subscription_active
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin) # Protected!
):
    users = db.query(User).all()
    return users
