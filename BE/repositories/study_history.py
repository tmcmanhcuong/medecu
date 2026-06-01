from typing import Optional
from sqlalchemy.orm import Session
import uuid
import models
import schemas
from core import NotFoundException


class StudyHistoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert_extracted_content(
        self, book_id: uuid.UUID, user_id: uuid.UUID, payload: schemas.ExtractedContentUpsertRequest
    ) -> models.DocumentExtractedContent:
        record = (
            self.db.query(models.DocumentExtractedContent)
            .filter(models.DocumentExtractedContent.book_id == book_id)
            .first()
        )
        if record is None:
            record = models.DocumentExtractedContent(
                book_id=book_id,
                user_id=user_id,
                content_text=payload.content_text,
                content_version=payload.content_version or "v1",
                processing_status=payload.processing_status or "ready",
                processing_error=payload.processing_error or "",
            )
            self.db.add(record)
        else:
            record.content_text = payload.content_text
            record.content_version = payload.content_version or "v1"
            record.processing_status = payload.processing_status or "ready"
            record.processing_error = payload.processing_error or ""

        book = self.db.query(models.Book).filter(models.Book.id == book_id).first()
        if not book:
            raise NotFoundException(f"Book with id {book_id} not found")
        book.ingestion_status = "ready" if record.processing_status == "ready" else record.processing_status
        book.ingestion_error = record.processing_error or ""
        self._sync_extracted_content_to_book_content(book_id=book_id, record=record)

        self.db.commit()
        self.db.refresh(record)
        return record

    def _sync_extracted_content_to_book_content(
        self, book_id: uuid.UUID, record: models.DocumentExtractedContent
    ) -> None:
        if record.processing_status != "ready":
            return
        content_text = (record.content_text or "").strip()
        if not content_text:
            return

        synthetic_position = "extracted_content"
        existing = (
            self.db.query(models.BookContent)
            .filter(
                models.BookContent.book_id == book_id,
                models.BookContent.position == synthetic_position,
            )
            .first()
        )
        if existing is None:
            self.db.add(
                models.BookContent(
                    book_id=book_id,
                    position=synthetic_position,
                    box="",
                    content=content_text,
                )
            )
            return
        existing.content = content_text

    def mark_extraction_failed(self, book_id: uuid.UUID, error_message: str) -> None:
        book = self.db.query(models.Book).filter(models.Book.id == book_id).first()
        if not book:
            raise NotFoundException(f"Book with id {book_id} not found")
        book.ingestion_status = "failed"
        book.ingestion_error = error_message
        self.db.commit()

    def create_history(
        self, user_id: uuid.UUID, payload: schemas.StudyActivityCreateRequest
    ) -> models.StudyActivityHistory:
        record = models.StudyActivityHistory(
            user_id=user_id,
            book_id=payload.book_id,
            notebook_id=payload.notebook_id,
            artifact_type=payload.artifact_type,
            activity_type=payload.activity_type or "generated",
            payload=payload.payload,
            source_page=payload.source_page,
            source_excerpt=payload.source_excerpt,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_history(
        self,
        user_id: uuid.UUID,
        book_id: Optional[uuid.UUID],
        notebook_id: Optional[uuid.UUID],
        limit: int,
    ) -> list[models.StudyActivityHistory]:
        query = self.db.query(models.StudyActivityHistory).filter(
            models.StudyActivityHistory.user_id == user_id
        )
        if book_id:
            query = query.filter(models.StudyActivityHistory.book_id == book_id)
        if notebook_id:
            query = query.filter(models.StudyActivityHistory.notebook_id == notebook_id)
        return query.order_by(models.StudyActivityHistory.created_at.desc()).limit(limit).all()

    def delete_history_item(self, user_id: uuid.UUID, history_id: uuid.UUID) -> None:
        record = (
            self.db.query(models.StudyActivityHistory)
            .filter(
                models.StudyActivityHistory.id == history_id,
                models.StudyActivityHistory.user_id == user_id,
            )
            .first()
        )
        if not record:
            raise NotFoundException("Study history not found")
        self.db.delete(record)
        self.db.commit()

    def clear_history(
        self,
        user_id: uuid.UUID,
        notebook_id: Optional[uuid.UUID] = None,
        artifact_type: Optional[str] = None,
    ) -> int:
        query = self.db.query(models.StudyActivityHistory).filter(
            models.StudyActivityHistory.user_id == user_id
        )
        if notebook_id:
            query = query.filter(models.StudyActivityHistory.notebook_id == notebook_id)
        if artifact_type:
            query = query.filter(models.StudyActivityHistory.artifact_type == artifact_type)
        deleted = query.delete(synchronize_session=False)
        self.db.commit()
        return deleted
