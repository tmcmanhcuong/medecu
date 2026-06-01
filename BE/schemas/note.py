from typing import Optional
from pydantic import BaseModel
import uuid


# ============= Note Schemas =============
class NoteCreateRequest(BaseModel):
    title: str
    content: str
    book_id: Optional[uuid.UUID] = None
    notebook_id: Optional[uuid.UUID] = None
    source_page: Optional[int] = None
    source_excerpt: Optional[str] = None


class NoteUpdateRequest(BaseModel):
    content: Optional[str] = None
    title: Optional[str] = None
    notebook_id: Optional[uuid.UUID] = None
    source_page: Optional[int] = None
    source_excerpt: Optional[str] = None


class NoteResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    book_id: Optional[uuid.UUID] = None
    notebook_id: Optional[uuid.UUID] = None
    source_page: Optional[int] = None
    source_excerpt: Optional[str] = None
    updated_at: Optional[str] 
    created_at: str
