from typing import Optional
from pydantic import BaseModel, Field
import uuid

class QuizzBase(BaseModel):
    """Base schema for Quizz"""
    # path: Optional[str] = Field(None, description="Path associated with the quizz")
    content: Optional[str] = Field(None, description="Content of the quizz")
    path: Optional[str] = Field(None, description="Path associated with the quizz")
    title: Optional[str] = Field(None, description="Title of the quizz")

class QuizzCreate(QuizzBase):
    """Schema for creating a Quizz"""
    pass

class Quizz(QuizzBase):
    """Complete Quizz schema"""
    id: uuid.UUID = Field(..., description="Unique quizz ID")
    user_id: uuid.UUID = Field(..., description="User ID owner of the quizz")

    class Config:
        from_attributes = True

class QuizzUpdate(QuizzBase):
    """Schema for updating a Quizz"""
    class Config:
        from_attributes = True
