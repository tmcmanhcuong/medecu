from core import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import BookRepository
from repositories import NotebookRepository
from fastapi import Depends

def get_book_repository(db: AsyncSession = Depends(get_db)) -> BookRepository:
    """Dependency to get repository instance"""
    return BookRepository(db)


def get_notebook_repository(db: AsyncSession = Depends(get_db)) -> NotebookRepository:
    return NotebookRepository(db)
