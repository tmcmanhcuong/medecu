import logging
import json
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from agentcore.config import settings
from agentcore.client import agent_client

logger = logging.getLogger("agentcore.router")
logger.setLevel(logging.INFO)

router = APIRouter()

# --- Request Schemas ---

class ChatWithRAGRequest(BaseModel):
    user_prompt: str = Field(..., alias="user-prompt")
    session_id: str = Field(..., alias="session-id")
    user_id: Optional[uuid.UUID] = Field(None, alias="user-id")

    class Config:
        populate_by_name = True


class GeneratingRequest(BaseModel):
    chapter_title: str = Field(..., alias="chapter-title")
    limit: int = Field(10)
    user_id: Optional[uuid.UUID] = Field(None, alias="user-id")

    class Config:
        populate_by_name = True


# --- Endpoint Implementations ---

@router.put("/uploading-book-content-to-rag", summary="Upload Book Content to S3 and Sync Knowledge Base")
async def uploading_book_content_to_rag(
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(None, alias="user-id")
):
    """
    Receives book content (markdown file) from the backend, uploads it to the 
    S3 bucket associated with Bedrock, and triggers the Knowledge Base ingestion job.
    """
    try:
        file_content = await file.read()
        file_name = file.filename or "output.md"
        
        logger.info(f"Received file: {file_name} ({len(file_content)} bytes) for user_id: {user_id}")
        
        result = agent_client.upload_to_s3_and_sync_kb(file_name, file_content, user_id=user_id)
        return result
    except Exception as e:
        logger.error(f"Error in upload endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document and sync KB: {str(e)}"
        )


@router.post("/chat-with-rag", summary="Chat with RAG Agent")
async def chat_with_rag(payload: ChatWithRAGRequest):
    """
    Acts as the entrypoint for chat-with-rag, invoking the Chat Bedrock Agent.
    """
    try:
        agent_id = settings.AWS_AGENT_ID_CHAT
        alias_id = settings.AWS_AGENT_ALIAS_ID_CHAT

        if not agent_id:
            raise ValueError("AGENTCORE_CHAT_AGENT_ID environment variable is not configured.")

        # Construct dynamic metadata filter based on user-id to ensure data privacy
        session_state = None
        if payload.user_id and settings.AWS_KB_ID:
            logger.info(f"Applying dynamic retrieval filter for user_id: {payload.user_id} on KB: {settings.AWS_KB_ID}")
            session_state = {
                "knowledgeBaseConfigurations": [
                    {
                        "knowledgeBaseId": settings.AWS_KB_ID,
                        "retrievalConfiguration": {
                            "vectorSearchConfiguration": {
                                "filter": {
                                    "equals": {
                                        "key": "user_id",
                                        "value": str(payload.user_id)
                                    }
                                }
                            }
                        }
                    }
                ]
            }

        # Invoke Bedrock Agent
        result = agent_client.invoke_bedrock_agent(
            agent_id=agent_id,
            agent_alias_id=alias_id,
            session_id=payload.session_id,
            input_text=payload.user_prompt,
            session_state=session_state
        )
        
        # Return format expected by AI.py: a dict containing the "output" key
        return {
            "output": result.get("output", "")
        }
    except Exception as e:
        logger.error(f"Error in chat-with-rag endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent runtime error: {str(e)}"
        )


@router.post("/generating-flashcard", summary="Generate Flashcards using Flashcard Agent")
async def generating_flashcard(payload: GeneratingRequest):
    """
    Acts as the entrypoint for generating-flashcard, invoking the Flashcard Bedrock Agent.
    """
    try:
        agent_id = settings.AWS_AGENT_ID_FLASHCARD
        alias_id = settings.AWS_AGENT_ALIAS_ID_FLASHCARD

        if not agent_id:
            raise ValueError("AGENTCORE_FLASHCARD_AGENT_ID environment variable is not configured.")

        # Construct input text to direct the agent
        input_text = f"Hãy tạo flashcard từ chương sách có tiêu đề: \"{payload.chapter_title}\". Số lượng tối đa: {payload.limit}."

        # Session ID is unique to keep flashcard generation isolated
        import uuid
        session_id = str(uuid.uuid4())

        result = agent_client.invoke_bedrock_agent(
            agent_id=agent_id,
            agent_alias_id=alias_id,
            session_id=session_id,
            input_text=input_text
        )

        output_str = result.get("output", "")
        # Clean and parse JSON
        clean_content = output_str
        if "```json" in output_str:
            try:
                clean_content = output_str.split("```json")[1].split("```")[0].strip()
            except Exception:
                pass
        elif "```" in output_str:
            try:
                clean_content = output_str.split("```")[1].split("```")[0].strip()
            except Exception:
                pass

        try:
            parsed_data = json.loads(clean_content.strip())
        except Exception:
            parsed_data = output_str

        # Save to JSON cache file
        cache_file = None
        try:
            import os
            from core import FLASH_PATH
            os.makedirs(FLASH_PATH, exist_ok=True)
            file_id = str(uuid.uuid4())
            user_id_str = str(payload.user_id) if payload.user_id else "default_user"
            file_path = os.path.join(FLASH_PATH, f"flash_{user_id_str}_{file_id}.json")

            flash_dict = {
                "id": file_id,
                "user_id": user_id_str,
                "title": payload.chapter_title,
                "path": "",
                "content": parsed_data
            }

            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(flash_dict, f, ensure_ascii=False, indent=4)
            cache_file = file_path
        except Exception as cache_err:
            logger.error(f"Failed to save generated flashcards to cache: {str(cache_err)}")

        return {
            "output": parsed_data,
            "cache_file": cache_file
        }
    except Exception as e:
        logger.error(f"Error in generating-flashcard endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flashcard Agent runtime error: {str(e)}"
        )


@router.post("/generating-quizz", summary="Generate Quizzes using Quiz Agent")
async def generating_quizz(payload: GeneratingRequest):
    """
    Acts as the entrypoint for generating-quizz, invoking the Quiz Bedrock Agent.
    """
    try:
        agent_id = settings.AWS_AGENT_ID_QUIZ
        alias_id = settings.AWS_AGENT_ALIAS_ID_QUIZ

        if not agent_id:
            raise ValueError("AGENTCORE_QUIZ_AGENT_ID environment variable is not configured.")

        # Construct input text to direct the agent
        input_text = f"Hãy tạo câu hỏi trắc nghiệm MCQ từ chương sách có tiêu đề: \"{payload.chapter_title}\". Số lượng tối đa: {payload.limit}."

        import uuid
        session_id = str(uuid.uuid4())

        result = agent_client.invoke_bedrock_agent(
            agent_id=agent_id,
            agent_alias_id=alias_id,
            session_id=session_id,
            input_text=input_text
        )

        output_str = result.get("output", "")
        # Clean and parse JSON
        clean_content = output_str
        if "```json" in output_str:
            try:
                clean_content = output_str.split("```json")[1].split("```")[0].strip()
            except Exception:
                pass
        elif "```" in output_str:
            try:
                clean_content = output_str.split("```")[1].split("```")[0].strip()
            except Exception:
                pass

        try:
            parsed_data = json.loads(clean_content.strip())
        except Exception:
            parsed_data = output_str

        # Save to JSON cache file
        cache_file = None
        try:
            import os
            from core import QUIZZ_PATH
            os.makedirs(QUIZZ_PATH, exist_ok=True)
            file_id = str(uuid.uuid4())
            user_id_str = str(payload.user_id) if payload.user_id else "default_user"
            file_path = os.path.join(QUIZZ_PATH, f"quizz_{user_id_str}_{file_id}.json")

            quizz_dict = {
                "id": file_id,
                "user_id": user_id_str,
                "title": payload.chapter_title,
                "path": "",
                "content": parsed_data
            }

            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(quizz_dict, f, ensure_ascii=False, indent=4)
            cache_file = file_path
        except Exception as cache_err:
            logger.error(f"Failed to save generated quiz questions to cache: {str(cache_err)}")

        return {
            "output": parsed_data,
            "cache_file": cache_file
        }
    except Exception as e:
        logger.error(f"Error in generating-quizz endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz Agent runtime error: {str(e)}"
        )
