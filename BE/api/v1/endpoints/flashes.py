from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.orm import Session
import uuid

import schemas.flash as schemas
from repositories.flash import FlashRepository
from api.deps import get_db

router = APIRouter()


@router.post("/", response_model=schemas.Flash, status_code=status.HTTP_201_CREATED)
async def create_flash(
    flash_in: schemas.FlashCreate,
    user_id: uuid.UUID = Query(..., description="ID of the user creating the flashcard"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create new flashcard saved to filesystem cache.
    """
    repo = FlashRepository(db)
    return await repo.create_flash(flash_in, user_id)


@router.get("/{flash_id}", response_model=schemas.Flash)
async def get_flash(
    flash_id: uuid.UUID = Path(..., description="ID of the flashcard to retrieve"),
    user_id: uuid.UUID = Query(..., description="ID of the user to retrieve the flashcard for"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific flashcard by id.
    """
    repo = FlashRepository(db)
    flash = await repo.get_flash(flash_id, user_id)
    if not flash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found"
        )
    return flash


@router.get("/", response_model=List[schemas.Flash])
async def read_flashes(
    user_id: uuid.UUID = Query(..., description="ID of the user to retrieve flashcards for"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve flashcards.
    """
    repo = FlashRepository(db)
    return await repo.get_flashes(user_id=user_id, skip=skip, limit=limit)


@router.patch("/{flash_id}", response_model=schemas.Flash)
async def update_flash(
    flash_in: schemas.FlashUpdate,
    flash_id: uuid.UUID = Path(..., description="ID of the flashcard to update"),
    user_id: uuid.UUID = Query(..., description="ID of the user updating the flashcard"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Update a flashcard.
    """
    repo = FlashRepository(db)
    try:
        return await repo.update_flash(flash_id, flash_in, user_id)
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found"
            )
        raise e


@router.delete("/{flash_id}")
async def delete_flash(
    flash_id: uuid.UUID = Path(..., description="ID of the flashcard to delete"),
    user_id: uuid.UUID = Query(..., description="ID of the user deleting the flashcard"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Delete a flashcard.
    """
    repo = FlashRepository(db)
    try:
        return await repo.delete_flash(flash_id, user_id)
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found"
            )
        raise e
