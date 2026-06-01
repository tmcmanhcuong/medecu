"""
Book Repository - Business logic layer for book operations

Follows FastAPI best practices by separating complex database operations
from route handlers, improving testability and maintainability.
"""

from typing import List, Optional
from core import NotFoundException
from sqlalchemy.orm import Session, joinedload
import models
import schemas
import uuid


class BookRepository:
    """Repository for Book-related database operations"""

    def __init__(self, db: Session):
        self.db = db

    # ============= CREATE Operations =============

    def create_book(self, book_data: schemas.BookImport) -> models.Book:
        """
        Import a book with all its contents (cascade create).

        Args:
            book_data: Book data with contents

        Returns:
            Created book with all contents

        Raises:
            ConflictException: If book with query_id already exists
        """

        # Create book
        db_book = models.Book(
            query_id=book_data.query_id,
            title=book_data.title,
            description=book_data.description,
            path=book_data.path,
            user_id=book_data.user_id,
        )

        # Add contents
        for content_data in book_data.contents:
            db_content = models.BookContent(
                position=content_data.position,
                box=content_data.box,
                content=content_data.content,
            )
            db_book.contents.append(db_content)

        self.db.add(db_book)
        self.db.commit()
        self.db.refresh(db_book)

        return db_book

    # ============= READ Operations =============

    def get_book(self, book_id: uuid.UUID) -> Optional[models.Book]:
        """
        Get book by query_id without contents.
        Primary method for fetching a single book.
        """
        return (
            self.db.query(models.Book).filter(models.Book.id == book_id).first()
        )

    def get_book_for_user(self, book_id: uuid.UUID, user_id: uuid.UUID) -> Optional[models.Book]:
        return (
            self.db.query(models.Book)
            .filter(models.Book.id == book_id, models.Book.user_id == user_id)
            .first()
        )

    def get_book_by_query_id(self, query_id: str) -> Optional[models.Book]:
        """
        Get book by query_id without contents.
        Primary method for fetching a single book.
        """
        return (
            self.db.query(models.Book).filter(models.Book.query_id == query_id).first()
        )

    def get_book_with_contents(self, book_id: uuid.UUID) -> Optional[models.Book]:
        """
        Get book by query_id with all contents.
        Primary method for fetching a single book with relationships.
        """
        return (
            self.db.query(models.Book)
            .options(joinedload(models.Book.contents))
            .filter(models.Book.id == book_id)
            .first()
        )

    def get_books_by_ids(self, query_ids: List[str]) -> List[models.Book]:
        """
        Get multiple books by query_ids without contents.
        Batch operation for fetching multiple books efficiently.
        """
        return (
            self.db.query(models.Book).filter(models.Book.query_id.in_(query_ids)).all()
        )

    def get_books_with_contents_by_ids(self, query_ids: List[str]) -> List[models.Book]:
        """
        Get multiple books by query_ids with all contents.
        Batch operation with eager loading of relationships.
        """
        return (
            self.db.query(models.Book)
            .options(joinedload(models.Book.contents))
            .filter(models.Book.query_id.in_(query_ids))
            .all()
        )

    def get_book_contents_by_positions(
        self, query_id: str, positions: List[str]
    ) -> Optional[models.Book]:
        """
        Get book with only specific content positions.
        Useful for fetching partial content based on position filters.
        """
        book = self.get_book(query_id)
        if not book:
            return None

        # Get only specific positions
        contents = (
            self.db.query(models.BookContent)
            .filter(
                models.BookContent.book_id == book.id,
                models.BookContent.position.in_(positions),
            )
            .all()
        )

        # Attach filtered contents to book
        book.contents = contents
        return book

    def get_books(self, skip: int = 0, limit: int = 10) -> List[models.Book]:
        """Get all books with pagination (without contents)"""
        # return self.db.query(models.Book).offset(skip).limit(limit).all()
        return self.db.query(models.Book).offset(skip).limit(limit).all()

    def get_books_for_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 10) -> List[models.Book]:
        return (
            self.db.query(models.Book)
            .filter(models.Book.user_id == user_id)
            .order_by(models.Book.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_books(self) -> int:
        """Count total books"""
        return self.db.query(models.Book).count()

    def count_books_for_user(self, user_id: uuid.UUID) -> int:
        return self.db.query(models.Book).filter(models.Book.user_id == user_id).count()

    def create_uploaded_book(
        self,
        *,
        user_id: uuid.UUID,
        file_name: str,
        file_path: str,
        file_size: int,
        mime_type: str,
    ) -> models.Book:
        db_book = models.Book(
            query_id=file_name.rsplit(".", 1)[0],
            title=file_name,
            description="",
            path=file_path,
            user_id=user_id,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            ingestion_status="uploaded",
            ingestion_error="",
        )
        self.db.add(db_book)
        self.db.commit()
        self.db.refresh(db_book)
        return db_book

    # ============= UPDATE Operations =============

    def update_book(
        self,
        book_id: uuid.UUID,
        book_update: schemas.BookUpdate,
    ) -> models.Book:
        """
        Update book with partial data by query_id.

        Args:
            query_id: Book's query_id (business identifier)
            book_update: Fields to update

        Returns:
            Updated book

        Raises:
            NotFoundException: If book not found
        """
        # Find book by query_id
        book = self.get_book(book_id)
        if not book:
            raise NotFoundException(f"Book with query_id '{book_id}' not found")

        # Update book fields (only provided fields)
        update_data = book_update.model_dump(exclude_unset=True, exclude={"contents"})
        for field, value in update_data.items():
            setattr(book, field, value)

        # Update contents if provided
        if book_update.contents is not None:
            for content_update in book_update.contents:
                if content_update.position is None:
                    continue

                # Find content by position
                existing_content = next(
                    (c for c in book.contents if c.position == content_update.position),
                    None,
                )

                if existing_content:
                    # Update existing content
                    if content_update.box is not None:
                        existing_content.box = content_update.box
                else:
                    # Create new content if position doesn't exist
                    new_content = models.BookContent(
                        book_id=book.id,
                        position=content_update.position,
                        box=content_update.box,
                    )
                    self.db.add(new_content)

        self.db.commit()
        self.db.refresh(book)

        return book

    # ============= DELETE Operations =============

    def delete_book(
        self,
        book_id: uuid.UUID,
        positions: Optional[List[str]] = None,
    ) -> dict:
        """
        Delete entire book or specific content positions.

        Args:
            query_id: Book query ID
            positions: If None, delete entire book. If provided, delete only those positions.

        Returns:
            Dict with deletion info

        Raises:
            NotFoundException: If book not found
        """

        book = self.get_book(self.db.query(models.Book).get(book_id).query_id)
        if not book:
            raise NotFoundException(f"Book with query_id '{book_id}' not found")

        if positions is None:
            # Delete entire book (cascade will delete contents)
            self.db.query(models.BookContent).filter(
                models.BookContent.book_id == book_id
            ).delete(synchronize_session=False)
            self.db.query(models.Book).filter(models.Book.id == book_id).delete(
                synchronize_session=False
            )

            self.db.commit()

            # self.db.commit()
            return {
                "deleted": "book",
                "query_id": book_id,
                "message": "Book and all contents deleted successfully",
            }
        else:
            # Delete only specific positions
            deleted_count = (
                self.db.query(models.BookContent)
                .filter(
                    models.BookContent.book_id == book_id,
                    models.BookContent.position.in_(positions),
                )
                .delete(synchronize_session=False)
            )

            self.db.commit()

            return {
                "deleted": "contents",
                "query_id": book_id,
                "positions": positions,
                "deleted_count": deleted_count,
                "message": f"Deleted {deleted_count} content(s) successfully",
            }
