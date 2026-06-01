from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, UUID, text
import uuid
from core import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    username: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )  # check if username is unique
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)

    books = relationship("Book", back_populates="user")
    notebooks = relationship("Notebook", back_populates="user")
    notes = relationship("Note", back_populates="user")
    quizzes = relationship("Quizz", back_populates="user")
    extracted_contents = relationship("DocumentExtractedContent", back_populates="user")
    study_history = relationship("StudyActivityHistory", back_populates="user")
