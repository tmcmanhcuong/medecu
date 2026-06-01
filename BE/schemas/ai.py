import uuid
from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict

class ChatWithRAGRequest(BaseModel):
    user_prompt: str = Field(..., description="User prompt for chatting with the book")

class ChatWithRAGResponse(BaseModel):
    message: str = Field("Chat successful", description="Success message")
    data: Any = Field(..., description="RAG response data from n8n")

class BriefParagraphRequest(BaseModel):
    content: str = Field(..., description="Chapter title or long paragraph of book to summarize")

class BriefParagraphResponse(BaseModel):
    message: str = Field("Briefing successful", description="Success message")
    data: Any = Field(..., description="Briefing response data from n8n")


class NotebookGenerationRequest(BaseModel):
    notebook_id: Optional[uuid.UUID] = Field(
        None, description="Notebook ID to scope retrieval to notebook-owned sources"
    )
    source_book_ids: List[uuid.UUID] = Field(
        default_factory=list,
        description="Book IDs attached to the notebook and allowed for retrieval",
    )
    source_file_names: List[str] = Field(
        default_factory=list,
        description="File names attached to the notebook and allowed for retrieval",
    )

class GeneratingFlashcardRequest(BaseModel):
    chapter_title: str = Field(..., description="Chapter title to generate flashcards from")
    limit: int = Field(10, ge=1, description="Limit the number of flashcards generated")
    user_id: uuid.UUID = Field(..., description="ID of the user generating flashcards")
    notebook_id: Optional[uuid.UUID] = Field(
        None, description="Notebook ID to scope flashcard generation"
    )
    source_book_ids: List[uuid.UUID] = Field(
        default_factory=list,
        description="Notebook source book IDs to scope flashcard generation",
    )
    source_file_names: List[str] = Field(
        default_factory=list,
        description="Notebook source file names to scope flashcard generation",
    )

class GeneratingFlashcardResponse(BaseModel):
    message: str = Field("Generating successful", description="Success message")
    data: Any = Field(..., description="Generated flashcards response data from n8n")
    cache_file: Optional[str] = Field(None, description="Path to the saved JSON file in cache")

class GeneratingQuizzRequest(BaseModel):
    chapter_title: str = Field(..., description="Chapter title to generate quizzes from")
    limit: int = Field(10, ge=1, description="Limit the number of quiz questions generated")
    user_id: uuid.UUID = Field(..., description="ID of the user generating quizzes")
    notebook_id: Optional[uuid.UUID] = Field(
        None, description="Notebook ID to scope quiz generation"
    )
    source_book_ids: List[uuid.UUID] = Field(
        default_factory=list,
        description="Notebook source book IDs to scope quiz generation",
    )
    source_file_names: List[str] = Field(
        default_factory=list,
        description="Notebook source file names to scope quiz generation",
    )

class GeneratingQuizzResponse(BaseModel):
    message: str = Field("Generating successful", description="Success message")
    data: Any = Field(..., description="Generated quizzes response data from n8n")
    cache_file: Optional[str] = Field(None, description="Path to the saved JSON file in cache")

class NotebookChatRequest(BaseModel):
    notebook_id: uuid.UUID = Field(..., description="ID of the notebook to chat with")
    user_message: str = Field(..., description="User's chat message")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Optional conversation history for multi-turn chat")
    action_type: Optional[str] = Field(None, description="Optional action type: chat|quiz|flashcard")

class NotebookChatResponse(BaseModel):
    answer_text: str = Field(..., description="AI-generated response text")
    sources: List[Dict[str, Any]] = Field(..., description="Metadata about source documents used for context")
    citations: List[Dict[str, Any]] = Field(default_factory=list, description="Citations returned by Bedrock retrieval")
    provider_metadata: Dict[str, Any] = Field(..., description="Metadata from the AI provider (Bedrock)")
