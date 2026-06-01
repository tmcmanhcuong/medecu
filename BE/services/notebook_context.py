from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import uuid
import models
from core import BEDROCK_CONTEXT_CHAR_LIMIT
from core import AI_RUNTIME
from utils.extraction_service import extract_text_from_document


class NoSourceContextError(Exception):
    """Raised when notebook has no usable source content"""
    pass


class NotebookContextService:
    """
    Service for building bounded context from notebook source documents.
    Gathers persisted BookContent from attached books and builds deterministic
    source snippets up to the configured context limit.
    """

    def __init__(self, db: Session, context_char_limit: Optional[int] = None):
        """
        Initialize context service.

        Args:
            db: SQLAlchemy database session
            context_char_limit: Max characters for context (defaults to config)
        """
        self.db = db
        self.context_char_limit = context_char_limit or BEDROCK_CONTEXT_CHAR_LIMIT

    def build_context_for_notebook(
        self, notebook_id: uuid.UUID, user_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Build bounded context from notebook source documents.

        Args:
            notebook_id: The notebook ID
            user_id: The user ID (for authorization)

        Returns:
            Dict with:
                - context_text: str - Concatenated source content up to limit
                - sources: List[Dict] - Source metadata (book titles, content counts)
                - total_chars: int - Total characters in context
                - truncated: bool - Whether context was truncated

        Raises:
            NoSourceContextError: When notebook has no usable source content
        """
        notebook = (
            self.db.query(models.Notebook)
            .filter(models.Notebook.id == notebook_id, models.Notebook.user_id == user_id)
            .first()
        )
        if not notebook:
            raise ValueError("Notebook not found or access denied")

        notebook_sources = (
            self.db.query(models.NotebookSource)
            .filter(
                models.NotebookSource.notebook_id == notebook_id,
                models.NotebookSource.user_id == user_id,
            )
            .order_by(models.NotebookSource.created_at.asc())
            .all()
        )

        if not notebook_sources:
            raise NoSourceContextError(
                "Notebook has no attached source documents. "
                "Please attach books to this notebook before chatting."
            )

        not_ready_sources = [
            source for source in notebook_sources if source.ingestion_status in {"queued", "processing"}
        ]
        failed_sources = [
            source for source in notebook_sources if source.ingestion_status == "failed"
        ]

        ready_sources = [
            source for source in notebook_sources if source.ingestion_status == "ready"
        ]

        if not ready_sources and not_ready_sources:
            raise NoSourceContextError(
                "Notebook sources are still being ingested. Please wait until ingestion is ready."
            )
        if not ready_sources and failed_sources:
            raise NoSourceContextError(
                "Notebook source ingestion failed. Please retry ingestion from source management."
            )

        source_contents = self._gather_source_contents(ready_sources)

        if not source_contents and AI_RUNTIME.lower() != "agentcore":
            raise NoSourceContextError(
                "Notebook sources have no extractable content. "
                "Please ensure attached books have been processed."
            )
        if not source_contents and AI_RUNTIME.lower() == "agentcore":
            sources_metadata = []
            for source in ready_sources:
                book = (
                    self.db.query(models.Book)
                    .filter(models.Book.id == source.book_id)
                    .first()
                )
                if not book:
                    continue
                sources_metadata.append(
                    {
                        "book_id": str(book.id),
                        "book_title": book.title,
                        "content_count": 0,
                        "chars_included": 0,
                    }
                )
            return {
                "context_text": "",
                "sources": sources_metadata,
                "total_chars": 0,
                "truncated": False,
            }

        context_result = self._build_bounded_context(source_contents)

        return context_result

    def _gather_source_contents(
        self, notebook_sources: List[models.NotebookSource]
    ) -> List[Dict[str, Any]]:
        """
        Gather persisted source document contents from attached books.

        Args:
            notebook_sources: List of NotebookSource records

        Returns:
            List of dicts with book_id, book_title, and content_items
        """
        source_contents = []

        for source in notebook_sources:
            book = (
                self.db.query(models.Book)
                .filter(models.Book.id == source.book_id)
                .first()
            )
            if not book:
                continue

            book_contents = (
                self.db.query(models.BookContent)
                .filter(models.BookContent.book_id == book.id)
                .order_by(models.BookContent.id.asc())
                .all()
            )

            if book_contents:
                source_contents.append({
                    "book_id": str(book.id),
                    "book_title": book.title,
                    "content_items": [
                        {
                            "id": str(content.id),
                            "content": content.content or "",
                            "position": content.position or "",
                        }
                        for content in book_contents
                    ],
                })
                continue

            extracted_content = (
                self.db.query(models.DocumentExtractedContent)
                .filter(
                    models.DocumentExtractedContent.book_id == book.id,
                    models.DocumentExtractedContent.processing_status == "ready",
                )
                .order_by(models.DocumentExtractedContent.id.desc())
                .first()
            )
            extracted_text = ""
            if extracted_content:
                raw_text = getattr(extracted_content, "content_text", "")
                extracted_text = raw_text if isinstance(raw_text, str) else ""
            if extracted_text.strip():
                source_contents.append(
                    {
                        "book_id": str(book.id),
                        "book_title": book.title,
                        "content_items": [
                            {
                                "id": str(extracted_content.id),
                                "content": extracted_text,
                                "position": "extracted_content",
                            }
                        ],
                    }
                )
                continue

            file_path = getattr(book, "path", "")
            if isinstance(file_path, str) and file_path.strip():
                try:
                    on_demand_text = extract_text_from_document(file_path)
                except Exception:
                    on_demand_text = ""
                if on_demand_text.strip():
                    self.db.add(
                        models.BookContent(
                            book_id=book.id,
                            position="extracted_content",
                            box="",
                            content=on_demand_text,
                        )
                    )
                    book.ingestion_status = "ready"
                    book.ingestion_error = ""
                    self.db.commit()
                    source_contents.append(
                        {
                            "book_id": str(book.id),
                            "book_title": book.title,
                            "content_items": [
                                {
                                    "id": f"on-demand-{book.id}",
                                    "content": on_demand_text,
                                    "position": "extracted_content",
                                }
                            ],
                        }
                    )

        return source_contents

    def _build_bounded_context(
        self, source_contents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Build deterministic source snippets up to the configured context limit.

        Args:
            source_contents: List of source content dicts from _gather_source_contents

        Returns:
            Dict with context_text, sources metadata, total_chars, truncated flag
        """
        context_parts = []
        total_chars = 0
        truncated = False
        sources_metadata = []

        for source in source_contents:
            book_title = source["book_title"]
            content_items = source["content_items"]

            book_header = f"\n\n=== Source: {book_title} ===\n\n"
            book_content_parts = []
            book_chars = 0

            for item in content_items:
                content_text = item["content"]
                if not content_text.strip():
                    continue

                remaining_chars = self.context_char_limit - total_chars
                if remaining_chars <= 0:
                    truncated = True
                    break

                if len(content_text) > remaining_chars:
                    content_text = content_text[:remaining_chars]
                    truncated = True

                book_content_parts.append(content_text)
                book_chars += len(content_text)
                total_chars += len(content_text)

                if truncated:
                    break

            if book_content_parts:
                header_chars = len(book_header)
                if total_chars + header_chars <= self.context_char_limit:
                    context_parts.append(book_header)
                    context_parts.extend(book_content_parts)
                    total_chars += header_chars

                    sources_metadata.append({
                        "book_id": source["book_id"],
                        "book_title": book_title,
                        "content_count": len(book_content_parts),
                        "chars_included": book_chars,
                    })

            if truncated:
                break

        context_text = "".join(context_parts)
        if len(context_text) > self.context_char_limit:
            context_text = context_text[: self.context_char_limit]
            truncated = True

        return {
            "context_text": context_text,
            "sources": sources_metadata,
            "total_chars": len(context_text),
            "truncated": truncated,
        }
