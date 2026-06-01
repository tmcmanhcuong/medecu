from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
import uuid
from typing import Optional
import schemas
from api.deps import get_db
from repositories import StudyHistoryRepository
from core import SuccessResponse

router = APIRouter()


def get_study_history_repo(db: Session = Depends(get_db)) -> StudyHistoryRepository:
    return StudyHistoryRepository(db)


@router.put(
    "/documents/{book_id}/extracted-content",
    response_model=SuccessResponse[schemas.ExtractedContentResponse],
)
async def upsert_extracted_content(
    payload: schemas.ExtractedContentUpsertRequest,
    book_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: StudyHistoryRepository = Depends(get_study_history_repo),
):
    record = repo.upsert_extracted_content(book_id=book_id, user_id=user_id, payload=payload)
    return {
        "message": "Extracted content upserted successfully",
        "data": {
            "id": record.id,
            "book_id": record.book_id,
            "user_id": record.user_id,
            "content_text": record.content_text,
            "content_version": record.content_version,
            "processing_status": record.processing_status,
            "processing_error": record.processing_error,
            "created_at": str(record.created_at),
            "updated_at": str(record.updated_at) if record.updated_at else None,
        },
    }


@router.post(
    "/documents/{book_id}/extraction-failed",
    response_model=SuccessResponse[dict],
)
async def mark_extraction_failed(
    book_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    error_message: str = Query(...),
    repo: StudyHistoryRepository = Depends(get_study_history_repo),
):
    _ = user_id
    repo.mark_extraction_failed(book_id=book_id, error_message=error_message)
    return {"message": "Document extraction marked as failed", "data": {"book_id": str(book_id)}}


@router.post(
    "/history",
    response_model=SuccessResponse[schemas.StudyActivityResponse],
)
async def create_history(
    payload: schemas.StudyActivityCreateRequest,
    user_id: uuid.UUID = Query(...),
    repo: StudyHistoryRepository = Depends(get_study_history_repo),
):
    record = repo.create_history(user_id=user_id, payload=payload)
    return {
        "message": "Study activity saved",
        "data": {
            "id": record.id,
            "artifact_type": record.artifact_type,
            "activity_type": record.activity_type,
            "payload": record.payload,
            "book_id": record.book_id,
            "notebook_id": getattr(record, "notebook_id", None),
            "user_id": record.user_id,
            "source_page": record.source_page,
            "source_excerpt": record.source_excerpt,
            "created_at": str(record.created_at),
            "updated_at": str(record.updated_at) if record.updated_at else None,
        },
    }


@router.get(
    "/history",
    response_model=SuccessResponse[list[schemas.StudyActivityResponse]],
)
async def get_recent_history(
    user_id: uuid.UUID = Query(...),
    book_id: Optional[uuid.UUID] = Query(None),
    notebook_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    repo: StudyHistoryRepository = Depends(get_study_history_repo),
):
    try:
        records = repo.get_history(
            user_id=user_id, book_id=book_id, notebook_id=notebook_id, limit=limit
        )
    except TypeError:
        records = repo.get_history(user_id=user_id, book_id=book_id, limit=limit)
    data = [
        {
            "id": item.id,
            "artifact_type": item.artifact_type,
            "activity_type": item.activity_type,
            "payload": item.payload,
            "book_id": item.book_id,
            "notebook_id": getattr(item, "notebook_id", None),
            "user_id": item.user_id,
            "source_page": item.source_page,
            "source_excerpt": item.source_excerpt,
            "created_at": str(item.created_at),
            "updated_at": str(item.updated_at) if item.updated_at else None,
        }
        for item in records
    ]
    return {"message": "Study history retrieved", "data": data}


@router.delete(
    "/history/{history_id}",
    response_model=SuccessResponse[dict],
)
async def delete_history_item(
    history_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: StudyHistoryRepository = Depends(get_study_history_repo),
):
    repo.delete_history_item(user_id=user_id, history_id=history_id)
    return {"message": "Study history deleted", "data": {"id": str(history_id)}}


@router.delete(
    "/history",
    response_model=SuccessResponse[dict],
)
async def clear_history(
    user_id: uuid.UUID = Query(...),
    notebook_id: Optional[uuid.UUID] = Query(None),
    artifact_type: Optional[str] = Query(None),
    repo: StudyHistoryRepository = Depends(get_study_history_repo),
):
    deleted_count = repo.clear_history(
        user_id=user_id,
        notebook_id=notebook_id,
        artifact_type=artifact_type,
    )
    return {"message": "Study history cleared", "data": {"deleted_count": deleted_count}}
