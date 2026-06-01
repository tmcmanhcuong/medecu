from typing import Optional
import os
import schemas
from core import (
    BOOK_ENTITIES_INDEX_PATH,
    NotFoundException,
    PaginatedResponse,
    SuccessResponse,
    ADMIN_ID,
    get_db,
)
from utils import upload_pdf_file, convert_from_path_to_index, save_uploaded_document
from utils import extract_text_from_document
from repositories import BookRepository
from repositories import StudyHistoryRepository
from api.deps import get_book_repository, get_notebook_repository
from repositories import NotebookRepository

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
    File,
    HTTPException,
    UploadFile,
    Path,
    Form,
)
from sqlalchemy.orm import Session
import uuid

router = APIRouter()


# def get_book_repository(db: Session = Depends(get_db)) -> BookRepository:
#     """Dependency to get repository instance"""
#     return BookRepository(db)


@router.post(
    "/upload",
    response_model=SuccessResponse[schemas.BookUploadResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF document",
)
async def upload_document(
    pdf_file: UploadFile = File(...),
    user_id: uuid.UUID = Form(..., description="Document owner"),
    notebook_id: Optional[uuid.UUID] = Form(None, description="Optional notebook context"),
    repo: BookRepository = Depends(get_book_repository),
    notebook_repo: NotebookRepository = Depends(get_notebook_repository),
    db: Session = Depends(get_db),
):
    if pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    saved_path, file_size = await save_uploaded_document(pdf_file)
    book = repo.create_uploaded_book(
        user_id=user_id,
        file_name=pdf_file.filename,
        file_path=saved_path,
        file_size=file_size,
        mime_type=pdf_file.content_type,
    )
    book_id = book["id"] if isinstance(book, dict) else book.id
    if isinstance(book_id, str):
        book_id = uuid.UUID(book_id)
    if notebook_id:
        notebook_repo.attach_source_to_notebook(
            notebook_id=notebook_id,
            user_id=user_id,
            book_id=book_id,
        )

    history_repo = StudyHistoryRepository(db)
    if isinstance(saved_path, str) and not saved_path.startswith("s3://"):
        try:
            extracted_text = extract_text_from_document(saved_path)
            if not extracted_text:
                raise ValueError("Extraction returned empty content")
            history_repo.upsert_extracted_content(
                book_id=book_id,
                user_id=user_id,
                payload=schemas.ExtractedContentUpsertRequest(
                    content_text=extracted_text,
                    content_version="v1",
                    processing_status="ready",
                    processing_error="",
                ),
            )
        except Exception as exc:
            try:
                history_repo.mark_extraction_failed(book_id=book_id, error_message=str(exc))
            except Exception:
                pass
    return {"message": "Document uploaded successfully", "data": book}


@router.post(
    "/import",
    response_model=SuccessResponse[schemas.BookWithContents],
    status_code=status.HTTP_201_CREATED,
    summary="Import book with contents (cascade)",
    description="Create a new book along with all its content metadata in a single operation",
)
async def import_book(
    pdf_file: UploadFile = File(...),
    # user_id: uuid.UUID = Form(..., description="Student ID owner of the book"),
    repo: BookRepository = Depends(get_book_repository),
):
    """
    Import a complete book with all metadata/contents.

    Use this endpoint to create a book and its associated content in one transaction.
    """

    upload_result = await upload_pdf_file(pdf_file, BOOK_ENTITIES_INDEX_PATH, repo)
    if isinstance(upload_result, HTTPException):
        raise upload_result

    # return is id_to_bbox and id_to_raw
    id_to_bboxes, id_to_raws = convert_from_path_to_index(
        os.path.join(BOOK_ENTITIES_INDEX_PATH, pdf_file.filename),
        user_id=str(ADMIN_ID)
    )

    contents = []
    for bboxes, raws in zip(id_to_bboxes.items(), id_to_raws.items()):
        contents.append(
            schemas.BookContentCreate(
                position=bboxes[0], box=f"{bboxes[1]}", content=raws[1]
            )
        )

    book_data = schemas.BookImport(
        query_id=pdf_file.filename.split(".")[0],
        title=pdf_file.filename,
        description="",
        path=os.path.join(BOOK_ENTITIES_INDEX_PATH, pdf_file.filename),
        user_id=ADMIN_ID,
        contents=contents,
    )
    del contents

    book = repo.create_book(book_data)
    return {"message": "Book imported successfully", "data": book}




@router.get(
    "",
    response_model=PaginatedResponse[schemas.Book],
    summary="Get all books",
    description="Retrieve paginated list of books without contents",
)
def get_all_books(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter books by owner"),
    repo: BookRepository = Depends(get_book_repository),
):
    """Get paginated list of all books (without contents)"""
    skip = (page - 1) * page_size
    if user_id:
        books = repo.get_books_for_user(user_id=user_id, skip=skip, limit=page_size)
        total = repo.count_books_for_user(user_id=user_id)
    else:
        books = repo.get_books(skip=skip, limit=page_size)
        total = repo.count_books()

    return {
        "message": "Books retrieved successfully",
        "data": books,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }

@router.get(
    "/{book_id}",
    response_model=SuccessResponse[schemas.Book],
    summary="Get document detail",
)
def get_document_detail(
    book_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(...),
    repo: BookRepository = Depends(get_book_repository),
):
    book = repo.get_book_for_user(book_id=book_id, user_id=user_id)
    if not book:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document detail retrieved", "data": book}


@router.get(
    "/{book_id}/contents",
    response_model=SuccessResponse[schemas.BookWithContents],
    summary="Get single book with all contents",
    description="Retrieve a single book by its query_id including all contents",
)
def get_single_book_with_contents(
    book_id: uuid.UUID = Path(..., description="Business identifier of the book"), 
    user_id: Optional[uuid.UUID] = Query(None, description="Owner user id"),
    repo: BookRepository = Depends(get_book_repository)
):
    """Get a single book by query_id (with all contents)"""
    if user_id:
        book = repo.get_book_for_user(book_id=book_id, user_id=user_id)
        if book:
            book = repo.get_book_with_contents(book.id)
    else:
        book = repo.get_book_with_contents(book_id)
    if not book:
        raise NotFoundException(f"Book with query_id '{book_id}' not found")

    return {"message": "Book with contents retrieved successfully", "data": book}


@router.patch(
    "/{book_id}",
    response_model=SuccessResponse[schemas.BookWithContents],
    summary="Update book (partial)",
    description="Update book fields and/or contents by book_id",
)
def update_book(
    book_update: schemas.BookUpdate,
    book_id: str = Path(..., description="Book's business identifier"),
    repo: BookRepository = Depends(get_book_repository),
):
    """
    Update book with partial data.

    - query_id: Book's business identifier
    - Only provided fields will be updated
    - Contents are updated by position (create if not exists)
    """
    book = repo.update_book(book_id, book_update)
    return {"message": "Book updated successfully", "data": book}


@router.delete(
    "",
    response_model=SuccessResponse[dict],
    summary="Delete book or specific contents",
    description="Delete entire book or only specific content positions by query_id",
)
def delete_book_or_contents(
    delete_request: schemas.BookDeleteRequest,
    repo: BookRepository = Depends(get_book_repository),
):
    """
    Delete book or specific contents.

    - If positions is None or empty: Delete entire book
    - If positions provided: Delete only those content positions
    """
    result = repo.delete_book(delete_request.book_id, delete_request.positions)

    return {"message": result["message"], "data": result}
