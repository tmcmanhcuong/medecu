from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class NotebookBase(BaseModel):
    title: str = Field(..., description="Notebook title")
    description: Optional[str] = Field("", description="Notebook description")


class NotebookCreateRequest(NotebookBase):
    pass


class NotebookUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class NotebookResponse(NotebookBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotebookSourceAttachRequest(BaseModel):
    book_id: uuid.UUID


class NotebookSourceResponse(BaseModel):
    id: uuid.UUID
    notebook_id: uuid.UUID
    book_id: uuid.UUID
    user_id: uuid.UUID
    ingestion_status: str = Field("queued", description="Ingestion lifecycle state")
    ingestion_error: str = Field("", description="Ingestion error details")
    ingestion_job_id: str = Field("", description="Bedrock ingestion job id")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotebookDetailResponse(NotebookResponse):
    sources: List[NotebookSourceResponse] = Field(default_factory=list)
