"""
Common response schemas and utilities for consistent API responses across all services.

This module provides generic response wrappers that ensure all endpoints
return data in a consistent format, making it easier for frontend clients
to handle responses uniformly.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

# Generic type variable for response data
T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """
    Standard success response wrapper for single resource endpoints.

    Usage:
        @router.get("/books/{id}", response_model=SuccessResponse[Book])
        def get_book(id: int):
            book = get_book_from_db(id)
            return {"message": "Book retrieved successfully", "data": book}

    Response:
        {
            "message": "Book retrieved successfully",
            "data": {"id": 1, "title": "..."}
        }
    """

    message: str = Field(..., description="Human-readable success message")
    data: T = Field(..., description="The actual response data")


class PaginationMeta(BaseModel):
    """
    Pagination metadata for list endpoints.

    Attributes:
        page: Current page number (1-indexed)
        page_size: Number of items per page
        total: Total number of items across all pages
        total_pages: Total number of pages
    """

    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    page_size: int = Field(..., ge=1, le=100, description="Number of items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Standard paginated response wrapper for list endpoints.

    Usage:
        @router.get("/books", response_model=PaginatedResponse[Book])
        def get_books(page: int = 1, page_size: int = 10):
            books = get_paginated_books(page, page_size)
            total = count_all_books()
            return {
                "message": "Books retrieved successfully",
                "data": books,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size
                }
            }

    Response:
        {
            "message": "Books retrieved successfully",
            "data": [{"id": 1, "title": "..."}, ...],
            "pagination": {"page": 1, "page_size": 10, "total": 50, "total_pages": 5}
        }
    """

    message: str = Field(..., description="Human-readable success message")
    data: list[T] = Field(..., description="List of items for current page")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")


# Helper functions to create responses easily
def success_response(message: str, data: Any) -> dict:
    """
    Helper function to create a success response dict.

    Args:
        message: Success message to return
        data: The actual data to return

    Returns:
        Dictionary ready to be returned from endpoint

    Example:
        return success_response("Book created successfully", book)
    """
    return {"message": message, "data": data}


def paginated_response(
    message: str, data: list[Any], page: int, page_size: int, total: int
) -> dict:
    """
    Helper function to create a paginated response dict.

    Args:
        message: Success message to return
        data: List of items for current page
        page: Current page number (1-indexed)
        page_size: Number of items per page
        total: Total number of items across all pages

    Returns:
        Dictionary ready to be returned from endpoint

    Example:
        return paginated_response(
            "Books retrieved successfully",
            books,
            page=1,
            page_size=10,
            total=50
        )
    """
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    return {
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


# Export all public APIs
# __all__ = [
#     "SuccessResponse",
#     "PaginatedResponse",
#     "PaginationMeta",
#     "success_response",
#     "paginated_response",
# ]
