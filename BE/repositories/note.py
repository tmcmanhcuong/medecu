from typing import List, Optional
from sqlalchemy.orm import Session
from core import NotFoundException, MARKDOWN_PATH
from utils import upload_file, read_file, delete_file
import models
import schemas
import uuid


class NoteRepository:
    def __init__(self, db: Session):
        self.db = db

    async def get_note(self, note_id: uuid.UUID) -> Optional[models.Note]:
        return self.db.query(models.Note).filter(models.Note.id == note_id).first()

    async def get_notes(
        self,
        user_id: uuid.UUID,
        book_id: Optional[uuid.UUID] = None,
        notebook_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[models.Note]:
        query = self.db.query(models.Note).filter(models.Note.user_id == user_id)
        if book_id:
            query = query.filter(models.Note.book_id == book_id)
        if notebook_id:
            query = query.filter(models.Note.notebook_id == notebook_id)
        return query.order_by(models.Note.created_at.desc()).offset(skip).limit(limit).all()

    async def create_note(
        self, request: schemas.NoteCreateRequest, user_id: uuid.UUID
    ) -> schemas.NoteResponse:

        db_note = models.Note(
            title=request.title,
            user_id=user_id,
            path="",
            book_id=request.book_id,
            notebook_id=request.notebook_id,
            source_page=request.source_page,
            source_excerpt=request.source_excerpt,
        )

        self.db.add(db_note)
        self.db.commit()
        self.db.refresh(db_note)

        file_path = f"{MARKDOWN_PATH}/{db_note.id}.md"

        await upload_file(request.content, file_path)

        db_note.path = file_path
        self.db.commit()
        self.db.refresh(db_note)

        note_response = schemas.NoteResponse(
            id=db_note.id,
            title=db_note.title,
            content=request.content,
            book_id=db_note.book_id,
            notebook_id=db_note.notebook_id,
            source_page=db_note.source_page,
            source_excerpt=db_note.source_excerpt,
            created_at=str(db_note.created_at),
            updated_at=str(db_note.updated_at),
        )
        return note_response

    async def count_notes(
        self, user_id: uuid.UUID, book_id: Optional[uuid.UUID] = None, notebook_id: Optional[uuid.UUID] = None
    ) -> int:
        query = self.db.query(models.Note).filter(models.Note.user_id == user_id)
        if book_id:
            query = query.filter(models.Note.book_id == book_id)
        if notebook_id:
            query = query.filter(models.Note.notebook_id == notebook_id)
        return query.count()

    async def update_note(
        self, note_id: uuid.UUID, request: schemas.NoteUpdateRequest
    ) -> schemas.NoteResponse:

        note = await self.get_note(note_id)

        if not note:
            raise NotFoundException(f"Note with id {note_id} not found")

        update_data = request.model_dump(exclude_unset=True)

        content = update_data.pop("content", None)

        for field, value in update_data.items():
            setattr(note, field, value)

        self.db.commit()
        self.db.refresh(note)

        if content is not None:
            file_path = f"{MARKDOWN_PATH}/{note.id}.md"
            await upload_file(
                content=content,
                file_path=file_path,
            )
        note_response = schemas.NoteResponse(
            id=note.id,
            title=note.title,
            content=await read_file(note.path),
            book_id=note.book_id,
            notebook_id=note.notebook_id,
            source_page=note.source_page,
            source_excerpt=note.source_excerpt,
            created_at=str(note.created_at),
            updated_at=str(note.updated_at),
        )

        return note_response

    async def delete_note(self, note_id: uuid.UUID) -> dict:
        note = await self.get_note(note_id)
        if not note:
            raise NotFoundException(f"Note with id {note_id} not found")
        await delete_file(note.path)
        self.db.delete(note)
        self.db.commit()
        return {"message": "Note deleted successfully", "id": note_id}
