import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, error_code: str = ""):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or f"ERR_{status_code}"


class NotFoundException(AppException):
    def __init__(self, message="Resource not found"):
        super().__init__(message=message, status_code=404, error_code="NOT_FOUND")


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(message=message, status_code=400, error_code="BAD_REQUEST")


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=401, error_code="UNAUTHORIZED")


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message=message, status_code=409, error_code="CONFLICT")


def setup_exception_handlers(app):
    """
    Setup all exception handlers for the application.
    Ensures consistent error response format across all endpoints.
    """

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle standard HTTP exceptions"""
        logger.warning(
            f"HTTP {exc.status_code}: {exc.detail} - Path: {request.url.path}"
        )

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.detail,
                "data": None,
                "error_code": f"HTTP_{exc.status_code}",
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        """Handle Pydantic validation errors (422)"""
        logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")

        return JSONResponse(
            status_code=422,
            content={
                "message": "Validation error",
                "data": None,
                "error_code": "VALIDATION_ERROR",
                "errors": exc.errors(),
            },
        )

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle custom application exceptions"""
        logger.info(
            f"AppException {exc.status_code}: {exc.message} - Path: {request.url.path}"
        )

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.message,
                "data": None,
                "error_code": exc.error_code,
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected errors (500)"""
        logger.error(
            f"Unexpected error on {request.url.path}: {str(exc)}",
            exc_info=True,  # Log full traceback
        )

        # Note expose exception detail
        return JSONResponse(
            status_code=500,
            content={
                "message": "Internal server error",
                "data": None,
                "error_code": "INTERNAL_ERROR",
            },
        )
