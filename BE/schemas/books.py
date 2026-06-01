
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator
import uuid


# ============= BookContent Schemas =============
class BookContentBase(BaseModel):
    """Base schema for BookContent (without id and book_id)"""
    position: Optional[str] = Field(None, description="Position identifier")
    box: Optional[str] = Field(None, description="Box metadata as JSON string")
    content: Optional[str] = Field(None, description="Actual content text")


class BookContentCreate(BookContentBase):
    """Schema for creating BookContent"""
    pass


class BookContentUpdate(BaseModel):
    """Schema for updating BookContent (all fields optional)"""

    position: Optional[str] = None
    box: Optional[str] = None


class BookContent(BookContentBase):
    """Complete BookContent with id and book_id"""

    id: uuid.UUID = Field(..., description="Unique content ID")
    book_id: uuid.UUID = Field(..., description="Associated book ID")

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)


# ============= Book Schemas =============
class BookBase(BaseModel):
    """Base schema for Book"""

    query_id: Optional[str] = Field(None, description="External query identifier")
    title: Optional[str] = Field(None, description="Book title")
    description: Optional[str] = Field(None, description="Book description")

    path: Optional[str] = Field(None, description="File path where book is saved")
    user_id: Optional[uuid.UUID] = Field(None, description="Student ID owner of the book")
    file_name: Optional[str] = Field(None, description="Uploaded file name")
    mime_type: Optional[str] = Field(None, description="File MIME type")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    ingestion_status: Optional[str] = Field(None, description="Ingestion status")
    ingestion_error: Optional[str] = Field(None, description="Ingestion error details")

class BookCreate(BookBase):
    """Schema for creating a Book"""

    title: str = Field(..., description="Book title is required")


class BookImport(BookBase):
    """Schema for importing Book with contents (cascade)"""

    query_id: str = Field(
        ..., description="Book query_id is required and must be unique"
    )
    title: str = Field(..., description="Book title is required")
    contents: List[BookContentCreate] = Field(
        default_factory=list, description="Book contents/metadata"
    )

    @model_validator(mode="after")
    def validate_required_fields(self):
        """Ensure query_id and title are provided"""
        if not self.query_id:
            raise ValueError("query_id is required for book import")
        if not self.title:
            raise ValueError("title is required for book import")
        # student_id is optional in schema but required via API param usually. 
        # But let's check if present if we want to enforce it at schema level.
        # User requested "add params when calling api", so checking here is good practice.
        if self.user_id is None:
             raise ValueError("user_id is required for book import")
        return self


class BookUpdate(BaseModel):
    """Schema for updating Book (all fields optional)"""

    query_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    saved_path: Optional[str] = None
    contents: Optional[List[BookContentUpdate]] = Field(
        None, description="Contents to update by position"
    )


class Book(BookBase):
    """Complete Book schema without contents"""
    id: uuid.UUID = Field(..., description="Unique book ID")

    class Config:
        from_attributes = True

class BookWithStudentId(Book):
    """Book schema including user_id"""
    user_id: uuid.UUID = Field(..., description="Student ID owner of the book")

    class Config:
        from_attributes = True

class BookWithContents(Book):
    """Book schema with all contents included"""

    contents: List[BookContentBase] = Field(
        default_factory=list, description="Book contents/metadata"
    )

    class Config:
        from_attributes = True


class BookUploadResponse(Book):
    class Config:
        from_attributes = True


# ============= Query Schemas =============
class BookQueryIdsQuery(BaseModel):
    """Schema for querying multiple books by query_ids"""

    query_ids: List[str] = Field(..., description="List of query IDs", min_length=1)


class ContentPositionsQuery(BaseModel):
    """Schema for querying specific positions of book content"""

    query_id: str = Field(..., description="Book query ID")
    positions: List[str] = Field(
        ..., description="List of position identifiers", min_length=1
    )

class BookDeleteRequest(BaseModel):
    """Schema for deleting book or specific content"""

    book_id: uuid.UUID = Field(..., description="Unique book ID to delete from")
    # user_id: uuid.UUID = Field(..., description="Student ID owner of the book")
    positions: Optional[List[str]] = Field(
        None, description="Specific positions to delete (if None, delete entire book)"
    )
