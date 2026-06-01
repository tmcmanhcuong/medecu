from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
    Path,
)
from typing import Optional
from sqlalchemy.orm import Session
from api.deps import get_db
import schemas
from repositories.note import NoteRepository
from core import SuccessResponse, PaginatedResponse
from utils.upload_file import read_file
import uuid


router = APIRouter()


def get_note_repository(db: Session = Depends(get_db)) -> NoteRepository:
    return NoteRepository(db)


@router.post(
    "/", response_model=SuccessResponse[schemas.NoteResponse], summary="Create new note"
)
async def create_note(
    request: schemas.NoteCreateRequest,
    user_id: uuid.UUID = Query(..., description="ID of the user creating the note"),
    repo: NoteRepository = Depends(get_note_repository),
):
    note_response = await repo.create_note(request=request, user_id=user_id)
    return {"message": "Note created successfully", "data": note_response}


@router.get(
    "/{note_id}",
    response_model=SuccessResponse[schemas.NoteResponse],
    summary="Get note by ID",
)
async def read_note(
    note_id: uuid.UUID = Path(..., description="ID of the note to retrieve"),
    repo: NoteRepository = Depends(get_note_repository),
):
    """Get note by ID with quizzes"""
    db_note = await repo.get_note(note_id=note_id)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    note_response = schemas.NoteResponse(
        id=db_note.id,
        title=db_note.title,
        content=await read_file(db_note.path),
        book_id=db_note.book_id,
        notebook_id=db_note.notebook_id,
        source_page=db_note.source_page,
        source_excerpt=db_note.source_excerpt,
        updated_at=str(db_note.updated_at),
        created_at=str(db_note.created_at),
    )
    return {"message": "Note retrieved successfully", "data": note_response}


@router.get(
    "/", response_model=PaginatedResponse[schemas.NoteResponse], summary="List notes"
)
async def read_notes(
    user_id: uuid.UUID,
    book_id: Optional[uuid.UUID] = Query(None, description="Optional document id filter"),
    notebook_id: Optional[uuid.UUID] = Query(None, description="Optional notebook id filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    repo: NoteRepository = Depends(get_note_repository),
):
    """List notes for a student with pagination"""
    skip = (page - 1) * page_size
    try:
        notes = await repo.get_notes(
            user_id=user_id, book_id=book_id, notebook_id=notebook_id, skip=skip, limit=page_size
        )
    except TypeError:
        notes = await repo.get_notes(
            user_id=user_id, book_id=book_id, skip=skip, limit=page_size
        )
    notes_response = []

    for db_note in notes:
        notes_response.append(
            schemas.NoteResponse(
                id=db_note.id,
                title=db_note.title,
                content=await read_file(db_note.path),
                book_id=db_note.book_id,
                notebook_id=db_note.notebook_id,
                source_page=db_note.source_page,
                source_excerpt=db_note.source_excerpt,
                updated_at=str(db_note.updated_at),
                created_at=str(db_note.created_at),
            )
        )
    try:
        total = await repo.count_notes(
            user_id=user_id, book_id=book_id, notebook_id=notebook_id
        )
    except TypeError:
        total = await repo.count_notes(user_id=user_id, book_id=book_id)

    return {
        "message": "Notes retrieved successfully",
        "data": notes_response,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.patch(
    "/{note_id}",
    response_model=SuccessResponse[schemas.NoteResponse],
    summary="Update note",
)
async def update_note(
    request: schemas.NoteUpdateRequest,
    note_id: uuid.UUID = Path(..., description="ID of the note to update"),
    repo: NoteRepository = Depends(get_note_repository),
):
    note_response = await repo.update_note(note_id=note_id, request=request)
    return {"message": "Note updated successfully", "data": note_response}


@router.delete(
    "/{note_id}", response_model=SuccessResponse[dict], summary="Delete note"
)
async def delete_note(
    note_id: uuid.UUID = Path(..., description="ID of the note to delete"),
    repo: NoteRepository = Depends(get_note_repository),
):
    result = await repo.delete_note(note_id)
    return {"message": "Note deleted successfully", "data": result}
