import logging
import json
import os
import uuid
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from app.config import settings
from app.schemas import (
    ChatWithRAGRequest,
    GeneratingRequest,
    ChatWithRAGResponse,
    GeneratingResponse
)
from app.langchain_client import agent_client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bedrockagentcore.main")

app = FastAPI(
    title="AWS Bedrock Agent Core LangChain Service",
    description="Microservice exposing AWS Bedrock Agent Core endpoints integrated with LangChain and S3 RAG.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

@router.get("/health", summary="Health Check")
async def health_check():
    """Simple health check endpoint for ECS / ALB targets"""
    return {
        "status": "healthy",
        "service": "AWS Bedrock Agent Core LangChain Service",
        "aws_region": settings.AWS_REGION
    }


@router.put("/uploading-book-content-to-rag", summary="Upload Book Content to S3 and Sync Knowledge Base")
async def uploading_book_content_to_rag(
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(None, alias="user-id")
):
    """
    Receives book content (markdown file), uploads it to S3,
    and starts the Bedrock Knowledge Base Ingestion/Sync job.
    """
    try:
        file_content = await file.read()
        file_name = file.filename or f"upload_{uuid.uuid4()}.md"
        
        logger.info(f"Received file: {file_name} ({len(file_content)} bytes) for user_id: {user_id}")
        
        result = agent_client.upload_to_s3_and_sync_kb(file_name, file_content, user_id=user_id)
        return result
    except Exception as e:
        logger.error(f"Error in upload endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document and sync KB: {str(e)}"
        )


@router.post("/chat-with-rag", response_model=ChatWithRAGResponse, summary="Chat with RAG Agent")
async def chat_with_rag(payload: ChatWithRAGRequest):
    """
    Invokes the Chat Bedrock Agent using a custom LangChain Runnable.
    Maintains memory of the conversation via session_id.
    """
    try:
        runnable = agent_client.get_runnable("chat")
        
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

        # Invoke LangChain Runnable
        result = runnable.invoke({
            "input_text": payload.user_prompt,
            "session_id": payload.session_id,
            "session_state": session_state
        })
        
        return ChatWithRAGResponse(output=result.get("output", ""))
    except Exception as e:
        logger.error(f"Error in chat-with-rag endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent runtime error: {str(e)}"
        )


@router.post("/generating-flashcard", response_model=GeneratingResponse, summary="Generate Flashcards using Flashcard Agent")
async def generating_flashcard(payload: GeneratingRequest):
    """
    Invokes the Flashcard Bedrock Agent using LangChain, parses output to JSON,
    and caches it as a file on disk.
    """
    try:
        runnable = agent_client.get_runnable("flashcard")
        
        input_text = f"Hãy tạo flashcard từ chương sách có tiêu đề: \"{payload.chapter_title}\". Số lượng tối đa: {payload.limit}."
        session_id = str(uuid.uuid4())  # Isolated session

        result = runnable.invoke({
            "input_text": input_text,
            "session_id": session_id
        })

        output_str = result.get("output", "")
        
        # Clean and parse JSON from Markdown blocks
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
            os.makedirs(settings.FLASH_PATH, exist_ok=True)
            file_id = str(uuid.uuid4())
            user_id_str = str(payload.user_id) if payload.user_id else "default_user"
            file_path = os.path.join(settings.FLASH_PATH, f"flash_{user_id_str}_{file_id}.json")

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

        return GeneratingResponse(
            output=parsed_data,
            cache_file=cache_file
        )
    except Exception as e:
        logger.error(f"Error in generating-flashcard endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flashcard Agent runtime error: {str(e)}"
        )


@router.post("/generating-quizz", response_model=GeneratingResponse, summary="Generate Quizzes using Quiz Agent")
async def generating_quizz(payload: GeneratingRequest):
    """
    Invokes the Quiz Bedrock Agent using LangChain, parses output to JSON,
    and caches it as a file on disk.
    """
    try:
        runnable = agent_client.get_runnable("quiz")
        
        input_text = f"Hãy tạo câu hỏi trắc nghiệm MCQ từ chương sách có tiêu đề: \"{payload.chapter_title}\". Số lượng tối đa: {payload.limit}."
        session_id = str(uuid.uuid4())  # Isolated session

        result = runnable.invoke({
            "input_text": input_text,
            "session_id": session_id
        })

        output_str = result.get("output", "")
        
        # Clean and parse JSON from Markdown blocks
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
            os.makedirs(settings.QUIZZ_PATH, exist_ok=True)
            file_id = str(uuid.uuid4())
            user_id_str = str(payload.user_id) if payload.user_id else "default_user"
            file_path = os.path.join(settings.QUIZZ_PATH, f"quizz_{user_id_str}_{file_id}.json")

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

        return GeneratingResponse(
            output=parsed_data,
            cache_file=cache_file
        )
    except Exception as e:
        logger.error(f"Error in generating-quizz endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz Agent runtime error: {str(e)}"
        )

# Register router
app.include_router(router)
