from typing import Optional, List
from sqlalchemy.orm import Session
import uuid
import models
import schemas
from core import NotFoundException, ConflictException
from services.notebook_ingestion import NotebookIngestionService


class NotebookRepository:
    def __init__(self, db: Session):
        self.db = db
        self.ingestion_service = NotebookIngestionService()

    def create_notebook(
        self, user_id: uuid.UUID, payload: schemas.NotebookCreateRequest
    ) -> models.Notebook:
        notebook = models.Notebook(
            user_id=user_id,
            title=payload.title,
            description=payload.description or "",
        )
        self.db.add(notebook)
        self.db.commit()
        self.db.refresh(notebook)
        return notebook

    def list_notebooks_for_user(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> List[models.Notebook]:
        return (
            self.db.query(models.Notebook)
            .filter(models.Notebook.user_id == user_id)
            .order_by(models.Notebook.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_notebooks_for_user(self, user_id: uuid.UUID) -> int:
        return self.db.query(models.Notebook).filter(models.Notebook.user_id == user_id).count()

    def get_notebook_for_user(
        self, notebook_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[models.Notebook]:
        return (
            self.db.query(models.Notebook)
            .filter(models.Notebook.id == notebook_id, models.Notebook.user_id == user_id)
            .first()
        )

    def update_notebook_for_user(
        self, notebook_id: uuid.UUID, user_id: uuid.UUID, payload: schemas.NotebookUpdateRequest
    ) -> models.Notebook:
        notebook = self.get_notebook_for_user(notebook_id=notebook_id, user_id=user_id)
        if not notebook:
            raise NotFoundException("Notebook not found")
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(notebook, field, value)
        self.db.commit()
        self.db.refresh(notebook)
        return notebook

    def delete_notebook_for_user(self, notebook_id: uuid.UUID, user_id: uuid.UUID) -> None:
        notebook = self.get_notebook_for_user(notebook_id=notebook_id, user_id=user_id)
        if not notebook:
            raise NotFoundException("Notebook not found")
        self.db.delete(notebook)
        self.db.commit()

    def attach_source_to_notebook(
        self, notebook_id: uuid.UUID, user_id: uuid.UUID, book_id: uuid.UUID
    ) -> models.NotebookSource:
        notebook = self.get_notebook_for_user(notebook_id=notebook_id, user_id=user_id)
        if not notebook:
            raise NotFoundException("Notebook not found")

        book = (
            self.db.query(models.Book)
            .filter(models.Book.id == book_id, models.Book.user_id == user_id)
            .first()
        )
        if not book:
            raise NotFoundException("Source document not found")

        existing = (
            self.db.query(models.NotebookSource)
            .filter(
                models.NotebookSource.notebook_id == notebook_id,
                models.NotebookSource.book_id == book_id,
            )
            .first()
        )
        if existing:
            raise ConflictException("Source document already attached to notebook")

        source = models.NotebookSource(
            notebook_id=notebook_id,
            book_id=book_id,
            user_id=user_id,
            ingestion_status="queued",
            ingestion_error="",
            ingestion_job_id="",
        )
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        self.db.refresh(source, attribute_names=["book"])
        try:
            self.ingestion_service.trigger_source_ingestion(source)
            self.db.commit()
            self.db.refresh(source)
        except Exception as exc:
            source.ingestion_status = "failed"
            source.ingestion_error = str(exc)
            self.db.commit()
            self.db.refresh(source)
        return source

    def list_notebook_sources(
        self, notebook_id: uuid.UUID, user_id: uuid.UUID
    ) -> List[models.NotebookSource]:
        notebook = self.get_notebook_for_user(notebook_id=notebook_id, user_id=user_id)
        if not notebook:
            raise NotFoundException("Notebook not found")
        sources = (
            self.db.query(models.NotebookSource)
            .filter(
                models.NotebookSource.notebook_id == notebook_id,
                models.NotebookSource.user_id == user_id,
            )
            .order_by(models.NotebookSource.created_at.desc())
            .all()
        )
        for source in sources:
            self.ingestion_service.refresh_source_ingestion_status(source)
        self.db.commit()
        for source in sources:
            self.db.refresh(source)
        return sources

    def detach_source_from_notebook(
        self, notebook_id: uuid.UUID, book_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        source = (
            self.db.query(models.NotebookSource)
            .filter(
                models.NotebookSource.notebook_id == notebook_id,
                models.NotebookSource.book_id == book_id,
                models.NotebookSource.user_id == user_id,
            )
            .first()
        )
        if not source:
            raise NotFoundException("Notebook source membership not found")
        self.db.delete(source)
        self.db.commit()

    def retry_source_ingestion(
        self, notebook_id: uuid.UUID, book_id: uuid.UUID, user_id: uuid.UUID
    ) -> models.NotebookSource:
        source = (
            self.db.query(models.NotebookSource)
            .filter(
                models.NotebookSource.notebook_id == notebook_id,
                models.NotebookSource.book_id == book_id,
                models.NotebookSource.user_id == user_id,
            )
            .first()
        )
        if not source:
            raise NotFoundException("Notebook source membership not found")
        self.db.refresh(source, attribute_names=["book"])
        try:
            self.ingestion_service.trigger_source_ingestion(source)
            self.db.commit()
            self.db.refresh(source)
        except Exception as exc:
            source.ingestion_status = "failed"
            source.ingestion_error = str(exc)
            self.db.commit()
            self.db.refresh(source)
        return source
