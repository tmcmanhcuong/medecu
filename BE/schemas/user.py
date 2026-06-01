from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
import uuid


# ============= User Schemas =============
class UserBase(BaseModel):
    """Base schema for User"""

    username: Optional[str] = Field(None, description="Unique username")
    email: Optional[EmailStr] = Field(None, description="Unique email address")
    full_name: Optional[str] = Field(None, description="User's full name")


class UserCreate(UserBase):
    """Schema for creating a User"""

    username: str = Field(..., description="Username is required")
    email: EmailStr = Field(..., description="Email is required")
    full_name: str = Field(..., description="Full name is required")
    password: str = Field(..., description="Password is required")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserUpdate(BaseModel):
    """Schema for updating User"""

    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class User(UserBase):
    """Complete User schema"""

    id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
