import uuid
from pydantic import BaseModel, Field
from typing import Any, Optional, Dict

class ChatWithRAGRequest(BaseModel):
    user_prompt: str = Field(..., alias="user-prompt", description="User's query prompt")
    session_id: str = Field(..., alias="session-id", description="Unique session ID to preserve chat history")
    user_id: Optional[uuid.UUID] = Field(None, alias="user-id", description="Optional ID of the user to filter RAG context")

    class Config:
        populate_by_name = True


class GeneratingRequest(BaseModel):
    chapter_title: str = Field(..., alias="chapter-title", description="Chapter title to target RAG content generation")
    limit: int = Field(10, description="Max number of items to generate")
    user_id: Optional[uuid.UUID] = Field(None, alias="user-id", description="Optional UUID of the user generating content")

    class Config:
        populate_by_name = True


class ChatWithRAGResponse(BaseModel):
    output: str = Field(..., description="Agent response output")


class GeneratingResponse(BaseModel):
    output: Any = Field(..., description="Parsed JSON array or raw string returned by agent")
    cache_file: Optional[str] = Field(None, description="Absolute file path of the cached JSON file on disk")
