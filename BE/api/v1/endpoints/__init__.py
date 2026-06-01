from .books import router as books_router
from .users import router as users_router
from .notes import router as notes_router
from .quizzes import router as quizzes_router
from .auth import router as auth_router
from .files import router as files_router
from .AI import router as ai_router
from .study_history import router as study_history_router
from .flashes import router as flashes_router
from .notebooks import router as notebooks_router

__all__ = [
    "books_router",
    "users_router",
    "notes_router",
    "quizzes_router",
    "auth_router",
    "files_router",
    "ai_router",
    "study_history_router",
    "flashes_router",
    "notebooks_router",
]
