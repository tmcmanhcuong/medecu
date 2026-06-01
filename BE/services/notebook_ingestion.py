import os
from typing import Optional, Tuple
from urllib.parse import urlparse

import models
from agentcore.client import agent_client
from core import FILE_STORAGE_MODE


class NotebookIngestionService:
    def _read_book_content(self, book: models.Book) -> Tuple[bytes, str]:
        path = (book.path or "").strip()
        if not path:
            raise ValueError("Book path is empty")

        if FILE_STORAGE_MODE == "s3" and path.startswith("s3://"):
            return b"", path

        with open(path, "rb") as source_file:
            content = source_file.read()
        return content, ""

    def _build_kb_metadata(
        self, source: models.NotebookSource, object_key: str
    ) -> dict[str, str]:
        book = source.book
        return {
            "source": "notebook-source-upload",
            "notebook_id": str(source.notebook_id),
            "book_id": str(source.book_id),
            "user_id": str(source.user_id),
            "notebook_source_id": str(source.id),
            "file_name": book.file_name or os.path.basename(book.path or object_key),
            "book_title": book.title,
            "content_type": book.mime_type or "application/octet-stream",
        }

    def _notebook_object_key(self, source: models.NotebookSource) -> str:
        book = source.book
        file_name = book.file_name or os.path.basename(book.path or str(book.id))
        return f"notebook-sources/{source.notebook_id}/{book.id}/{file_name}"

    def _parse_s3_uri(self, uri: str) -> Tuple[str, str]:
        parsed = urlparse(uri)
        if parsed.scheme != "s3" or not parsed.netloc or not parsed.path:
            raise ValueError("Book path must be a valid s3:// URI")
        return parsed.netloc, parsed.path.lstrip("/")

    def trigger_source_ingestion(self, source: models.NotebookSource) -> Optional[str]:
        book = source.book
        if not book:
            raise ValueError("Source book not found")

        source.ingestion_status = "queued"
        source.ingestion_error = ""

        if FILE_STORAGE_MODE == "s3" and (book.path or "").startswith("s3://"):
            source_bucket, source_key = self._parse_s3_uri(book.path)
            target_key = self._notebook_object_key(source)
            response = agent_client.copy_source_to_s3_and_sync_kb(
                source_bucket=source_bucket,
                source_key=source_key,
                target_key=target_key,
                metadata_attributes=self._build_kb_metadata(source, target_key),
            )
            job_id = response.get("ingestion_job_id", "")
            source.ingestion_job_id = job_id
            source.ingestion_status = "processing"
            return job_id or None

        content, _ = self._read_book_content(book)
        if not content:
            raise ValueError("Book content is empty")

        key = self._notebook_object_key(source)
        response = agent_client.upload_source_to_s3_and_sync_kb(
            object_key=key,
            file_content=content,
            content_type=book.mime_type or "application/pdf",
            metadata_attributes=self._build_kb_metadata(source, key),
        )
        job_id = response.get("ingestion_job_id", "")
        source.ingestion_job_id = job_id
        source.ingestion_status = "processing" if job_id else "failed"
        if not job_id:
            source.ingestion_error = response.get("message", "Ingestion job was not started")
        return job_id or None

    def refresh_source_ingestion_status(self, source: models.NotebookSource) -> str:
        if not source.ingestion_job_id:
            return source.ingestion_status
        if source.ingestion_status not in {"queued", "processing"}:
            return source.ingestion_status
        try:
            job = agent_client.get_kb_ingestion_job(source.ingestion_job_id)
        except Exception:
            return source.ingestion_status

        job_status = (job.get("ingestion_job_status") or "").upper()
        if job_status in {"COMPLETE", "COMPLETED"}:
            source.ingestion_status = "ready"
            source.ingestion_error = ""
        elif job_status in {"FAILED", "STOPPED"}:
            source.ingestion_status = "failed"
            reasons = job.get("failure_reasons") or []
            source.ingestion_error = "; ".join(reasons) if reasons else "Ingestion failed"
        else:
            source.ingestion_status = "processing"
        return source.ingestion_status
