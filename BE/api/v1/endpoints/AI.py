import uuid
from typing import Optional
import os
import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
import requests
from typing import Any
import schemas
from core import (
    N8N_WEBHOOK_URL,
    FLASH_PATH,
    QUIZZ_PATH,
    get_db,
    SuccessResponse,
    AGENTCORE_QUIZ_AGENT_ID,
    AGENTCORE_QUIZ_AGENT_ALIAS_ID,
    AGENTCORE_FLASHCARD_AGENT_ID,
    AGENTCORE_FLASHCARD_AGENT_ALIAS_ID,
    AGENTCORE_KNOWLEDGE_BASE_ID,
)
from services.bedrock_provider import (
    BedrockProviderError,
    BedrockAccessError,
    BedrockThrottlingError,
    BedrockValidationError,
)
from services.notebook_context import NotebookContextService, NoSourceContextError
from services.notebook_generation_scope import (
    build_generation_cache_path,
    build_retrieval_session_state,
    extract_retrieval_preview,
    normalize_uuid_strings,
)
from services.notebook_chat_runtime import (
    get_notebook_chat_runtime,
    AgentCoreRuntimeError,
    AgentCoreAccessError,
    AgentCoreThrottlingError,
    AgentCoreValidationError,
)
from repositories import NotebookRepository
from api.deps import get_notebook_repository
from agentcore.client import agent_client as notebook_agent_client

router = APIRouter()
logger = logging.getLogger("api.v1.endpoints.AI")


def extract_clean_json(rag_response: dict) -> str:
    output_val = rag_response.get("output", "")
    if not isinstance(output_val, str):
        return json.dumps(output_val, ensure_ascii=False)
        
    output_str = output_val
    if "```json" in output_str:
        try:
            return output_str.split("```json")[1].split("```")[0].strip()
        except Exception:
            return output_str
    elif "```" in output_str:
        try:
            return output_str.split("```")[1].split("```")[0].strip()
        except Exception:
            return output_str
    return output_str


def _has_notebook_scope(payload: Any) -> bool:
    return bool(payload.notebook_id or payload.source_book_ids or payload.source_file_names)


def _generation_prompt(
    kind: str,
    chapter_title: str,
    limit: int,
    notebook_id: Optional[uuid.UUID],
    source_file_names: list[str],
    source_book_ids: list[uuid.UUID],
) -> str:
    source_names = ", ".join(source_file_names) if source_file_names else "các tài liệu đã gắn với notebook"
    source_ids = ", ".join(normalize_uuid_strings(source_book_ids)) if source_book_ids else "không giới hạn theo book id"
    notebook_text = str(notebook_id) if notebook_id else "không có notebook_id"
    if kind == "quiz":
        return (
            f'Hãy tạo {limit} câu hỏi trắc nghiệm MCQ từ notebook "{chapter_title}". '
            f'Notebook ID: {notebook_text}. '
            f'Chỉ dùng nội dung từ source_book_ids={source_ids} và source_file_names={source_names}. '
            f"Không dùng tài liệu ngoài notebook, không suy diễn từ knowledge base khác."
        )
    return (
        f'Hãy tạo {limit} flashcard từ notebook "{chapter_title}". '
        f'Notebook ID: {notebook_text}. '
        f'Chỉ dùng nội dung từ source_book_ids={source_ids} và source_file_names={source_names}. '
        f"Không dùng tài liệu ngoài notebook, không suy diễn từ knowledge base khác."
    )


def _serialize_generation_debug(
    artifact_type: str,
    payload: Any,
) -> dict:
    return {
        "endpoint": f"/ai/generating-{artifact_type}",
        "chapter_title": payload.chapter_title,
        "limit": payload.limit,
        "user_id": str(payload.user_id),
        "notebook_id": str(payload.notebook_id) if payload.notebook_id else None,
        "source_book_ids": normalize_uuid_strings(payload.source_book_ids),
        "source_file_names": list(payload.source_file_names or []),
        "notebook_scope": _has_notebook_scope(payload),
    }


def _build_n8n_payload(
    artifact_type: str,
    payload: Any,
) -> dict:
    return {
        "chapter-title": payload.chapter_title,
        "limit": payload.limit,
        "user-id": str(payload.user_id),
        "notebook_id": str(payload.notebook_id) if payload.notebook_id else None,
        "source_book_ids": normalize_uuid_strings(payload.source_book_ids),
        "source_file_names": list(payload.source_file_names or []),
        "strict_notebook_scope": _has_notebook_scope(payload),
        "artifact_type": artifact_type,
    }


def _parse_agent_output(output_value: object) -> tuple[object, str]:
    if isinstance(output_value, (dict, list)):
        return output_value, json.dumps(output_value, ensure_ascii=False)
    if not isinstance(output_value, str):
        return output_value, json.dumps(output_value, ensure_ascii=False)

    clean_content = output_value
    if "```json" in output_value:
        try:
            clean_content = output_value.split("```json")[1].split("```")[0].strip()
        except Exception:
            pass
    elif "```" in output_value:
        try:
            clean_content = output_value.split("```")[1].split("```")[0].strip()
        except Exception:
            pass

    try:
        return json.loads(clean_content.strip()), clean_content
    except Exception:
        return output_value, output_value


def _save_generated_cache(
    artifact_type: str,
    payload: Any,
    parsed_data: object,
) -> tuple[str, str]:
    cache_dir = FLASH_PATH if artifact_type == "flashcard" else QUIZZ_PATH
    artifact_prefix = "flash" if artifact_type == "flashcard" else "quizz"
    file_path, scope_key = build_generation_cache_path(
        cache_dir=cache_dir,
        artifact_prefix=artifact_prefix,
        user_id=payload.user_id,
        notebook_id=payload.notebook_id,
        source_book_ids=payload.source_book_ids,
    )

    os.makedirs(cache_dir, exist_ok=True)
    cache_dict = {
        "id": str(uuid.uuid4()),
        "user_id": str(payload.user_id),
        "title": payload.chapter_title,
        "path": "",
        "content": parsed_data,
        "notebook_id": str(payload.notebook_id) if payload.notebook_id else None,
        "source_book_ids": normalize_uuid_strings(payload.source_book_ids),
        "source_file_names": list(payload.source_file_names or []),
        "source_scope_key": scope_key,
        "artifact_type": artifact_type,
    }

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(cache_dict, f, ensure_ascii=False, indent=4)
    return file_path, scope_key


def _invoke_agentcore_generation(
    artifact_type: str,
    payload: Any,
) -> dict:
    if artifact_type == "flashcard":
        agent_id = AGENTCORE_FLASHCARD_AGENT_ID
        alias_id = AGENTCORE_FLASHCARD_AGENT_ALIAS_ID
    else:
        agent_id = AGENTCORE_QUIZ_AGENT_ID
        alias_id = AGENTCORE_QUIZ_AGENT_ALIAS_ID

    if not agent_id:
        raise HTTPException(
            status_code=500,
            detail=f"Missing AgentCore agent id for {artifact_type} generation",
        )

    prompt = _generation_prompt(
        kind=artifact_type,
        chapter_title=payload.chapter_title,
        limit=payload.limit,
        notebook_id=payload.notebook_id,
        source_file_names=list(payload.source_file_names or []),
        source_book_ids=list(payload.source_book_ids or []),
    )
    session_state = build_retrieval_session_state(
        knowledge_base_id=AGENTCORE_KNOWLEDGE_BASE_ID,
        notebook_id=payload.notebook_id,
        source_book_ids=payload.source_book_ids,
        source_file_names=payload.source_file_names,
        number_of_results=max(payload.limit, 8),
    )
    session_id = str(payload.notebook_id or payload.user_id)

    result = notebook_agent_client.invoke_bedrock_agent(
        agent_id=agent_id,
        agent_alias_id=alias_id,
        session_id=session_id,
        input_text=prompt,
        session_state=session_state or None,
    )
    return result


@router.post(
    "/chat-with-rag",
    response_model=schemas.ChatWithRAGResponse,
    summary="Chatting with RAG",
    description="Chat with the book using Retrieval-Augmented Generation (RAG) technique",
)
async def chat_with_rag(
    payload: schemas.ChatWithRAGRequest,
    session_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = Query(None, description="Optional ID of the user to filter RAG context"),
):
    """
    Chat with the book using Retrieval-Augmented Generation (RAG) technique.

    This endpoint allows users to interact with the book content by providing a prompt.
    The system retrieves relevant information from the book and generates a response.
    """

    n8n_payload = {
        "user-prompt": payload.user_prompt,
        "session-id": str(session_id),
        "user-id": str(user_id) if user_id else None,
    }

    try:
        response = requests.post(f"{N8N_WEBHOOK_URL}/chat-with-rag", json=n8n_payload)
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"RAG service error: {str(e)}")

    rag_response = response.json()
    return schemas.ChatWithRAGResponse(message="Chat successful", data=rag_response)


@router.post(
    "/briefing-paragraph",
    response_model=schemas.BriefParagraphResponse,
    summary="Briefing Paragraph with RAG",
)
async def brief_paragraph(
    payload: schemas.BriefParagraphRequest,
):

    n8n_payload = {
        "content": payload.content,
    }

    try:
        response = requests.post(f"{N8N_WEBHOOK_URL}/brief-paragraph", json=n8n_payload)
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"RAG service error: {str(e)}")

    rag_response = response.json()
    return schemas.BriefParagraphResponse(message="Briefing successful", data=rag_response)


@router.post(
    "/generating-flashcard",
    response_model=schemas.GeneratingFlashcardResponse,
    summary="Generating Flashcard with RAG",
    description="Generate flashcards using Retrieval-Augmented Generation (RAG) technique and cache it as a JSON file",
)
async def generating_flashcard(
    payload: schemas.GeneratingFlashcardRequest,
):
    """
    Generate flashcards using Retrieval-Augmented Generation (RAG) technique.
    This endpoint allows users to generate flashcards from the book content by providing a prompt,
    limiting the output number of flashcards, and caching the result to a JSON file.
    """

    debug_payload = _serialize_generation_debug("flashcard", payload)
    logger.info("generating_flashcard request=%s", json.dumps(debug_payload, ensure_ascii=False))

    notebook_scoped = _has_notebook_scope(payload)
    if notebook_scoped:
        rag_response = _invoke_agentcore_generation("flashcard", payload)
        response_origin = "agentcore"
    else:
        n8n_payload = _build_n8n_payload("flashcard", payload)
        try:
            response = requests.post(
                f"{N8N_WEBHOOK_URL}/generating-flashcard", json=n8n_payload
            )
            response.raise_for_status()
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"RAG service error: {str(e)}")
        rag_response = response.json()
        response_origin = "n8n"

    logger.info(
        "generating_flashcard upstream=%s retrieval_preview=%s",
        response_origin,
        json.dumps(extract_retrieval_preview(rag_response), ensure_ascii=False),
    )

    output_value = rag_response.get("output", "") if isinstance(rag_response, dict) else rag_response
    parsed_data, clean_content = _parse_agent_output(output_value)
    if notebook_scoped and (parsed_data == [] or parsed_data == {} or parsed_data == ""):
        raise HTTPException(
            status_code=422,
            detail="Notebook-scoped flashcard generation returned no items for the provided sources.",
        )

    try:
        file_path, scope_key = _save_generated_cache("flashcard", payload, parsed_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving generated flashcards to cache: {str(e)}"
        )

    logger.info(
        "generating_flashcard cache_file=%s scope_key=%s parsed_preview=%s",
        file_path,
        scope_key,
        clean_content[:200] if isinstance(clean_content, str) else str(clean_content)[:200],
    )

    return schemas.GeneratingFlashcardResponse(
        message="Generating successful",
        data=parsed_data,
        cache_file=file_path
    )


@router.post(
    "/generating-quizz",
    response_model=schemas.GeneratingQuizzResponse,
    summary="Generating Quiz with RAG",
    description="Generate quiz questions using Retrieval-Augmented Generation (RAG) technique and cache it as a JSON file",
)
async def generating_quizz(
    payload: schemas.GeneratingQuizzRequest,
):
    """
    Generate quiz questions using Retrieval-Augmented Generation (RAG) technique.
    This endpoint allows users to generate quiz questions from the book content by providing a prompt,
    limiting the output number of questions, and caching the result to a JSON file.
    """

    debug_payload = _serialize_generation_debug("quizz", payload)
    logger.info("generating_quizz request=%s", json.dumps(debug_payload, ensure_ascii=False))

    notebook_scoped = _has_notebook_scope(payload)
    if notebook_scoped:
        rag_response = _invoke_agentcore_generation("quizz", payload)
        response_origin = "agentcore"
    else:
        n8n_payload = _build_n8n_payload("quizz", payload)
        try:
            response = requests.post(
                f"{N8N_WEBHOOK_URL}/generating-quizz", json=n8n_payload
            )
            response.raise_for_status()
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"RAG service error: {str(e)}")
        rag_response = response.json()
        response_origin = "n8n"

    logger.info(
        "generating_quizz upstream=%s retrieval_preview=%s",
        response_origin,
        json.dumps(extract_retrieval_preview(rag_response), ensure_ascii=False),
    )

    output_value = rag_response.get("output", "") if isinstance(rag_response, dict) else rag_response
    parsed_data, clean_content = _parse_agent_output(output_value)
    if notebook_scoped and (parsed_data == [] or parsed_data == {} or parsed_data == ""):
        raise HTTPException(
            status_code=422,
            detail="Notebook-scoped quiz generation returned no items for the provided sources.",
        )

    try:
        file_path, scope_key = _save_generated_cache("quizz", payload, parsed_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving generated quiz questions to cache: {str(e)}"
        )

    logger.info(
        "generating_quizz cache_file=%s scope_key=%s parsed_preview=%s",
        file_path,
        scope_key,
        clean_content[:200] if isinstance(clean_content, str) else str(clean_content)[:200],
    )

    return schemas.GeneratingQuizzResponse(
        message="Generating successful",
        data=parsed_data,
        cache_file=file_path
    )


@router.post(
    "/notebook-chat",
    response_model=SuccessResponse[schemas.NotebookChatResponse],
    summary="Chat with notebook using Bedrock",
    description="Send a message to chat with a notebook's sources using Amazon Bedrock",
)
def notebook_chat(
    payload: schemas.NotebookChatRequest,
    user_id: uuid.UUID = Query(..., description="ID of the user"),
    db: Session = Depends(get_db),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    """
    Chat with a notebook using Amazon Bedrock.

    This endpoint validates notebook ownership, builds context from attached sources,
    and generates a response using Amazon Bedrock Runtime.
    """

    # Task 5.3: Validate notebook ownership
    notebook = repo.get_notebook_for_user(
        notebook_id=payload.notebook_id, user_id=user_id
    )
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found or access denied")

    # Task 5.4: Build context and construct Bedrock prompt
    try:
        context_service = NotebookContextService(db)
        context_result = context_service.build_context_for_notebook(
            notebook_id=payload.notebook_id, user_id=user_id
        )

        runtime = get_notebook_chat_runtime()
        runtime_response = runtime.converse(
            user_message=payload.user_message,
            notebook_id=payload.notebook_id,
            context_text=context_result["context_text"],
            conversation_history=payload.conversation_history,
            action_type=payload.action_type,
        )

        # Task 5.5: Return normalized response
        response_data = schemas.NotebookChatResponse(
            answer_text=runtime_response["answer_text"],
            sources=context_result["sources"],
            citations=runtime_response.get("citations", []),
            provider_metadata=runtime_response["provider_metadata"],
        )

        return {"message": "Chat successful", "data": response_data}

    except NoSourceContextError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except BedrockAccessError as e:
        raise HTTPException(
            status_code=403,
            detail=f"Bedrock access error: {str(e)}"
        )
    except BedrockThrottlingError as e:
        raise HTTPException(
            status_code=429,
            detail=f"Bedrock throttling: {str(e)}"
        )
    except BedrockValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {str(e)}"
        )
    except AgentCoreAccessError as e:
        raise HTTPException(
            status_code=403,
            detail=f"Agent Core access error: {str(e)}"
        )
    except AgentCoreThrottlingError as e:
        raise HTTPException(
            status_code=429,
            detail=f"Agent Core throttling: {str(e)}"
        )
    except AgentCoreValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Agent Core validation error: {str(e)}"
        )
    except AgentCoreRuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent Core runtime error: {str(e)}"
        )
    except BedrockProviderError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Bedrock provider error: {str(e)}"
        )
