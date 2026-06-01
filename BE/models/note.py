from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, UUID, text, Integer, Text
from core import BaseModel
import uuid


class Note(BaseModel):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    source_page: Mapped[int] = mapped_column(Integer, nullable=True)
    source_excerpt: Mapped[str] = mapped_column(Text, nullable=True)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id"), nullable=True)
    notebook_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notebooks.id"), nullable=True)

    user = relationship("User", back_populates="notes")
    book = relationship("Book", back_populates="notes")
    notebook = relationship("Notebook", back_populates="notes")
