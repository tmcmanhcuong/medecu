from typing import Optional
from pydantic import BaseModel, Field
import uuid

class FlashBase(BaseModel):
    """Base schema for Flashcard"""
    content: Optional[str] = Field(None, description="Content of the flashcard")
    path: Optional[str] = Field(None, description="Path associated with the flashcard")
    title: Optional[str] = Field(None, description="Title of the flashcard")

class FlashCreate(FlashBase):
    """Schema for creating a Flashcard"""
    pass

class Flash(FlashBase):
    """Complete Flashcard schema"""
    id: uuid.UUID = Field(..., description="Unique flashcard ID")
    user_id: uuid.UUID = Field(..., description="User ID owner of the flashcard")

    class Config:
        from_attributes = True

class FlashUpdate(FlashBase):
    """Schema for updating a Flashcard"""
    class Config:
        from_attributes = True
