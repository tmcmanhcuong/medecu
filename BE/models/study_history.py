from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Text, ForeignKey, UUID, text
import uuid
from core import BaseModel


class DocumentExtractedContent(BaseModel):
    __tablename__ = "document_extracted_content"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    content_version: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'v1'"))
    processing_status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'ready'"))
    processing_error: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))

    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    book = relationship("Book", back_populates="extracted_contents")
    user = relationship("User")


class StudyActivityHistory(BaseModel):
    __tablename__ = "study_activity_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    artifact_type: Mapped[str] = mapped_column(Text, nullable=False)
    activity_type: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'generated'"))
    payload: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'{}'"))
    source_page: Mapped[str] = mapped_column(Text, nullable=True)
    source_excerpt: Mapped[str] = mapped_column(Text, nullable=True)

    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id"), nullable=True)
    notebook_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notebooks.id"), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    book = relationship("Book", back_populates="study_history")
    notebook = relationship("Notebook", back_populates="study_history")
    user = relationship("User")
