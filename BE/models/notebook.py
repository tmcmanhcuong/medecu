from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Text, ForeignKey, UUID, UniqueConstraint, text
import uuid
from core import BaseModel


class Notebook(BaseModel):
    __tablename__ = "notebooks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="notebooks")
    notebook_sources = relationship(
        "NotebookSource", back_populates="notebook", cascade="all, delete-orphan"
    )
    notes = relationship("Note", back_populates="notebook")
    study_history = relationship("StudyActivityHistory", back_populates="notebook")


class NotebookSource(BaseModel):
    __tablename__ = "notebook_sources"
    __table_args__ = (
        UniqueConstraint("notebook_id", "book_id", name="uq_notebook_sources_notebook_book"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    notebook_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("notebooks.id"), nullable=False
    )
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    ingestion_status: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'queued'")
    )
    ingestion_error: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    ingestion_job_id: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )

    notebook = relationship("Notebook", back_populates="notebook_sources")
    book = relationship("Book", back_populates="notebook_sources")
    user = relationship("User")
