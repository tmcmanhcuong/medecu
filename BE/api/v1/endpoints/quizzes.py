from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.orm import Session
import uuid 

import schemas.quizz as schemas
from repositories.quizz import QuizzRepository
from api.deps import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Quizz, status_code=status.HTTP_201_CREATED)
async def create_quizz(
    quizz_in: schemas.QuizzCreate ,
    user_id: uuid.UUID = Query(..., description="ID of the user creating the quizz"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new quizz.
    """
    repo = QuizzRepository(db)
    return await repo.create_quizz(quizz_in, user_id)

@router.get("/{quizz_id}", response_model=schemas.Quizz)
async def get_quizz(
    quizz_id: uuid.UUID = Path(..., description="ID of the quizz to retrieve"),
    user_id: uuid.UUID = Query(..., description="ID of the user to retrieve the quizz for"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific quizz by id.
    """
    repo = QuizzRepository(db)
    quizz = await repo.get_quizz(quizz_id, user_id)
    if not quizz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quizz not found"
        )
    return quizz

@router.get("/", response_model=List[schemas.Quizz])
async def read_quizzes(
    user_id: uuid.UUID = Query(..., description="ID of the user to retrieve quizzes for"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve quizzes.
    """
    repo = QuizzRepository(db)
    return await repo.get_quizzes(user_id=user_id, skip=skip, limit=limit)

@router.patch("/{quizz_id}", response_model=schemas.Quizz)
async def update_quizz(
    quizz_in: schemas.QuizzUpdate,
    quizz_id: uuid.UUID = Path(..., description="ID of the quizz to update"),
    user_id: uuid.UUID = Query(..., description="ID of the user updating the quizz"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update a quizz.
    """
    repo = QuizzRepository(db)
    try:
        return await repo.update_quizz(quizz_id, quizz_in, user_id)
    except Exception as e:
        # Check for specific exceptions if needed, but generic catch for now
        # Ideally, repository raises a specific NotFoundException which we should catch
        if "not found" in str(e).lower():
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quizz not found"
            )
        raise e

@router.delete("/{quizz_id}")
async def delete_quizz(
    quizz_id: uuid.UUID = Path(..., description="ID of the quizz to delete"),
    user_id: uuid.UUID = Query(..., description="ID of the user deleting the quizz"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete a quizz.
    """
    repo = QuizzRepository(db)
    try:
        return await repo.delete_quizz(quizz_id, user_id)
    except Exception as e:
         if "not found" in str(e).lower():
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quizz not found"
            )
         raise e
