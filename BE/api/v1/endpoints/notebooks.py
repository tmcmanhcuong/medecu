import uuid
from fastapi import APIRouter, Depends, Query, Path
import schemas
from core import SuccessResponse, PaginatedResponse
from repositories import NotebookRepository
from api.deps import get_notebook_repository

router = APIRouter()


@router.post(
    "",
    response_model=SuccessResponse[schemas.NotebookResponse],
)
def create_notebook(
    payload: schemas.NotebookCreateRequest,
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    notebook = repo.create_notebook(user_id=user_id, payload=payload)
    return {"message": "Notebook created successfully", "data": notebook}


@router.get(
    "",
    response_model=PaginatedResponse[schemas.NotebookResponse],
)
def list_notebooks(
    user_id: uuid.UUID = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    skip = (page - 1) * page_size
    notebooks = repo.list_notebooks_for_user(user_id=user_id, skip=skip, limit=page_size)
    total = repo.count_notebooks_for_user(user_id=user_id)
    return {
        "message": "Notebooks retrieved successfully",
        "data": notebooks,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get(
    "/{notebook_id}",
    response_model=SuccessResponse[schemas.NotebookDetailResponse],
)
def get_notebook(
    notebook_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    notebook = repo.get_notebook_for_user(notebook_id=notebook_id, user_id=user_id)
    if notebook is None:
        from core import NotFoundException

        raise NotFoundException("Notebook not found")
    sources = repo.list_notebook_sources(notebook_id=notebook_id, user_id=user_id)
    response = {
        "id": notebook.id,
        "title": notebook.title,
        "description": notebook.description,
        "user_id": notebook.user_id,
        "created_at": str(notebook.created_at),
        "updated_at": str(notebook.updated_at) if notebook.updated_at else None,
        "sources": [
            {
                "id": source.id,
                "notebook_id": source.notebook_id,
                "book_id": source.book_id,
                "user_id": source.user_id,
                "ingestion_status": source.ingestion_status,
                "ingestion_error": source.ingestion_error,
                "ingestion_job_id": source.ingestion_job_id,
                "created_at": str(source.created_at),
                "updated_at": str(source.updated_at) if source.updated_at else None,
            }
            for source in sources
        ],
    }
    return {"message": "Notebook detail retrieved", "data": response}


@router.patch(
    "/{notebook_id}",
    response_model=SuccessResponse[schemas.NotebookResponse],
)
def update_notebook(
    payload: schemas.NotebookUpdateRequest,
    notebook_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    notebook = repo.update_notebook_for_user(
        notebook_id=notebook_id, user_id=user_id, payload=payload
    )
    return {"message": "Notebook updated successfully", "data": notebook}


@router.delete(
    "/{notebook_id}",
    response_model=SuccessResponse[dict],
)
def delete_notebook(
    notebook_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    repo.delete_notebook_for_user(notebook_id=notebook_id, user_id=user_id)
    return {"message": "Notebook deleted successfully", "data": {"id": str(notebook_id)}}


@router.post(
    "/{notebook_id}/sources",
    response_model=SuccessResponse[schemas.NotebookSourceResponse],
)
def attach_notebook_source(
    payload: schemas.NotebookSourceAttachRequest,
    notebook_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    source = repo.attach_source_to_notebook(
        notebook_id=notebook_id, user_id=user_id, book_id=payload.book_id
    )
    return {"message": "Source attached successfully", "data": source}


@router.get(
    "/{notebook_id}/sources",
    response_model=SuccessResponse[list[schemas.NotebookSourceResponse]],
)
def list_notebook_sources(
    notebook_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    sources = repo.list_notebook_sources(notebook_id=notebook_id, user_id=user_id)
    return {"message": "Notebook sources retrieved", "data": sources}


@router.delete(
    "/{notebook_id}/sources/{book_id}",
    response_model=SuccessResponse[dict],
)
def detach_notebook_source(
    notebook_id: uuid.UUID = Path(...),
    book_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    repo.detach_source_from_notebook(
        notebook_id=notebook_id, book_id=book_id, user_id=user_id
    )
    return {"message": "Source detached successfully", "data": {"book_id": str(book_id)}}


@router.post(
    "/{notebook_id}/sources/{book_id}/retry",
    response_model=SuccessResponse[schemas.NotebookSourceResponse],
)
def retry_notebook_source_ingestion(
    notebook_id: uuid.UUID = Path(...),
    book_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: NotebookRepository = Depends(get_notebook_repository),
):
    source = repo.retry_source_ingestion(
        notebook_id=notebook_id, book_id=book_id, user_id=user_id
    )
    return {"message": "Source ingestion retried", "data": source}
