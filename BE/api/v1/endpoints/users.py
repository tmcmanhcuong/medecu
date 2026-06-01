from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from api.deps import get_db
import schemas
from repositories.user import UserRepository
from core import SuccessResponse, PaginatedResponse
import uuid

router = APIRouter()


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


@router.post(
    "/", response_model=SuccessResponse[schemas.User], summary="Create new user"
)
def create_user(
    user: schemas.UserCreate, repo: UserRepository = Depends(get_user_repository)
):
    db_user = repo.get_user_by_email(email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = repo.get_user_by_username(username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    created_user = repo.create_user(user=user)
    return {"message": "User created successfully", "data": created_user}


@router.post("/authenticate", summary="Authenticate user")
def read_user(
    user: schemas.UserLoginRequest, repo: UserRepository = Depends(get_user_repository)
):
    try:
        db_user = repo.get_user_by_email(email=user.email)
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail=f"DB error: {str(exc)}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(exc)}") from exc

    # Kiểm tra xem user có tồn tại và mật khẩu có trùng khớp hay không
    if db_user is None or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    return {
        "message": "User authenticated successfully",
        "data": {
            "id": str(db_user.id),
            "username": db_user.username,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "created_at": str(db_user.created_at) if db_user.created_at else None,
            "updated_at": str(db_user.updated_at) if db_user.updated_at else None,
        },
    }


@router.get("", response_model=PaginatedResponse[schemas.User], summary="List users")
def read_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    repo: UserRepository = Depends(get_user_repository),
):
    """List users with pagination"""
    skip = (page - 1) * page_size
    users = repo.get_users(skip=skip, limit=page_size)
    total = repo.count_users()

    return {
        "message": "Users retrieved successfully",
        "data": users,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.patch(
    "/{user_id}", response_model=SuccessResponse[schemas.User], summary="Update user"
)
def update_user(
    user_id: str,
    user_update: schemas.UserUpdate,
    repo: UserRepository = Depends(get_user_repository),
):
    user = repo.update_user(user_id, user_update)
    return {"message": "User updated successfully", "data": user}



@router.delete(
    "/{user_id}", response_model=SuccessResponse[dict], summary="Delete user"
)
def delete_user(
    user_id: uuid.UUID, repo: UserRepository = Depends(get_user_repository)
):
    result = repo.delete_user(user_id)
    return {"message": "User deleted successfully", "data": result}
