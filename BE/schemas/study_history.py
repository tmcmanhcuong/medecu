from pydantic import BaseModel
from typing import Optional
import uuid


class ExtractedContentUpsertRequest(BaseModel):
    content_text: str
    content_version: Optional[str] = "v1"
    processing_status: Optional[str] = "ready"
    processing_error: Optional[str] = None


class ExtractedContentResponse(BaseModel):
    id: uuid.UUID
    book_id: uuid.UUID
    user_id: uuid.UUID
    content_text: str
    content_version: str
    processing_status: str
    processing_error: str
    created_at: str
    updated_at: Optional[str] = None


class StudyActivityCreateRequest(BaseModel):
    artifact_type: str
    activity_type: Optional[str] = "generated"
    payload: str
    book_id: Optional[uuid.UUID] = None
    notebook_id: Optional[uuid.UUID] = None
    source_page: Optional[str] = None
    source_excerpt: Optional[str] = None


class StudyActivityResponse(BaseModel):
    id: uuid.UUID
    artifact_type: str
    activity_type: str
    payload: str
    book_id: Optional[uuid.UUID] = None
    notebook_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    source_page: Optional[str] = None
    source_excerpt: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
