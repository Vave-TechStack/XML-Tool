from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLAlchemyEnum
from database import Base
import enum

class UserRole(str, enum.Enum):
    SUPERADMIN = "SUPERADMIN"
    EMPLOYEE = "EMPLOYEE"
    SUBSCRIBER = "SUBSCRIBER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole), default=UserRole.SUBSCRIBER, nullable=False)
    
    # Status flags
    is_active = Column(Boolean, default=True)
    subscription_active = Column(Boolean, default=False)
