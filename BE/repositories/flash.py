import os
import json
import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
import schemas
from core import NotFoundException, FLASH_PATH
from utils import delete_file


class FlashRepository:
    """Repository for Flashcard-related filesystem-only cache operations"""

    def __init__(self, db: Session = None):
        self.db = db

    async def create_flash(
        self, flash_data: schemas.FlashCreate, user_id: uuid.UUID
    ) -> schemas.Flash:
        """Create a new flashcard saved to filesystem cache"""
        flash_id = uuid.uuid4()
        os.makedirs(FLASH_PATH, exist_ok=True)
        file_path = f"{FLASH_PATH}/flash_{user_id}_{flash_id}.json"

        flash_dict = {
            "id": str(flash_id),
            "user_id": str(user_id),
            "title": flash_data.title,
            "path": flash_data.path,
            "content": flash_data.content,
        }

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(flash_dict, f, ensure_ascii=False, indent=4)
        except Exception as e:
            raise NotFoundException(f"Error saving flashcard to filesystem: {str(e)}")

        return schemas.Flash(
            id=flash_id,
            path=flash_data.path,
            title=flash_data.title,
            content=flash_data.content,
            user_id=user_id,
        )

    async def get_flash(
        self, flash_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[schemas.Flash]:
        """Get a flashcard from filesystem cache"""
        file_path = f"{FLASH_PATH}/flash_{user_id}_{flash_id}.json"

        if not os.path.exists(file_path):
            return None

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return schemas.Flash(
                id=uuid.UUID(data["id"]),
                path=data.get("path"),
                title=data.get("title"),
                content=data.get("content"),
                user_id=uuid.UUID(data["user_id"]),
            )
        except Exception:
            return None

    async def get_flashes(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[schemas.Flash]:
        """Get all flashcards for a student from filesystem cache with pagination"""
        flash_list = []
        if not os.path.exists(FLASH_PATH):
            return flash_list

        try:
            prefix = f"flash_{user_id}_"
            for filename in os.listdir(FLASH_PATH):
                if filename.startswith(prefix) and filename.endswith(".json"):
                    file_path = os.path.join(FLASH_PATH, filename)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        flash_list.append(
                            schemas.Flash(
                                id=uuid.UUID(data["id"]),
                                path=data.get("path"),
                                title=data.get("title"),
                                content=data.get("content"),
                                user_id=uuid.UUID(data["user_id"]),
                            )
                        )
                    except Exception:
                        pass
        except Exception:
            pass

        # Pagination
        return flash_list[skip : skip + limit]

    async def update_flash(
        self, flash_id: uuid.UUID, flash_update: schemas.FlashUpdate, user_id: uuid.UUID
    ) -> schemas.Flash:
        """Update a flashcard in the filesystem cache"""
        file_path = f"{FLASH_PATH}/flash_{user_id}_{flash_id}.json"

        if not os.path.exists(file_path):
            raise NotFoundException(f"Flashcard with id {flash_id} not found")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            raise NotFoundException(f"Error reading flashcard: {str(e)}")

        update_data = flash_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            data[key] = value

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
        except Exception as e:
            raise NotFoundException(f"Error saving updated flashcard: {str(e)}")

        return schemas.Flash(
            id=uuid.UUID(data["id"]),
            path=data.get("path"),
            title=data.get("title"),
            content=data.get("content"),
            user_id=uuid.UUID(data["user_id"]),
        )

    async def delete_flash(self, flash_id: uuid.UUID, user_id: uuid.UUID) -> dict:
        """Delete a flashcard from filesystem cache"""
        file_path = f"{FLASH_PATH}/flash_{user_id}_{flash_id}.json"

        if not os.path.exists(file_path):
            raise NotFoundException(f"Flashcard with id {flash_id} not found")

        try:
            await delete_file(file_path)
        except Exception as e:
            raise NotFoundException(f"Error deleting flashcard file: {str(e)}")

        return {"message": "Flashcard deleted successfully", "id": flash_id}
