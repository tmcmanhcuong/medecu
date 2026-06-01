from fastapi import APIRouter
from api.v1.endpoints import (
    books_router,
    users_router,
    notes_router,
    quizzes_router,
    auth_router,
    files_router,
    ai_router,
    study_history_router,
    flashes_router,
    notebooks_router,
)

api_router = APIRouter()

api_router.include_router(
    books_router,
    prefix="/books",
    tags=["Books"],
)

api_router.include_router(
    users_router,
    prefix="/users",
    tags=["Users"],
)

api_router.include_router(
    notes_router,
    prefix="/notes",
    tags=["Notes"],
)

api_router.include_router(
    quizzes_router,
    prefix="/quizzes",
    tags=["Quizzes"],
)

api_router.include_router(
    ai_router,
    prefix="/ai",
    tags=["AI"],
)

api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Auth"],
)

api_router.include_router(
    files_router,
    prefix="/files",
    tags=["Files"],
)

api_router.include_router(
    study_history_router,
    prefix="/study",
    tags=["Study Foundation"],
)

api_router.include_router(
    flashes_router,
    prefix="/flashes",
    tags=["Flashes"],
)

api_router.include_router(
    notebooks_router,
    prefix="/notebooks",
    tags=["Notebooks"],
)
