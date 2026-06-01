from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Text, ForeignKey, UUID, text, Integer
import uuid
from core import Base, BaseModel


class Book(BaseModel):
    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    query_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text)
    path: Mapped[str] = mapped_column(Text)  # saved_path -> path
    file_name: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    mime_type: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'application/pdf'"))
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    ingestion_status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'uploaded'"))
    ingestion_error: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    user = relationship("User", back_populates="books")
    contents = relationship("BookContent", back_populates="book")
    extracted_contents = relationship("DocumentExtractedContent", back_populates="book")
    notes = relationship("Note", back_populates="book")
    study_history = relationship("StudyActivityHistory", back_populates="book")
    notebook_sources = relationship("NotebookSource", back_populates="book")


class BookContent(Base):
    __tablename__ = "book_content"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    position: Mapped[str] = mapped_column(Text)
    box: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column()

    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id"), nullable=False)

    book = relationship("Book", back_populates="contents")
