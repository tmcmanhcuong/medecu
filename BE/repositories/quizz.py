import os
import json
import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
import schemas
from core import NotFoundException, QUIZZ_PATH
from utils import delete_file


class QuizzRepository:
    """Repository for Quizz-related filesystem-only cache operations"""

    def __init__(self, db: Session = None):
        self.db = db

    async def create_quizz(
        self, quizz_data: schemas.QuizzCreate, user_id: uuid.UUID
    ) -> schemas.Quizz:
        """Create a new quizz saved to filesystem cache"""
        quizz_id = uuid.uuid4()
        os.makedirs(QUIZZ_PATH, exist_ok=True)
        file_path = f"{QUIZZ_PATH}/quizz_{user_id}_{quizz_id}.json"

        quizz_dict = {
            "id": str(quizz_id),
            "user_id": str(user_id),
            "title": quizz_data.title,
            "path": quizz_data.path,
            "content": quizz_data.content,
        }

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(quizz_dict, f, ensure_ascii=False, indent=4)
        except Exception as e:
            raise NotFoundException(f"Error saving quiz to filesystem: {str(e)}")

        return schemas.Quizz(
            id=quizz_id,
            path=quizz_data.path,
            title=quizz_data.title,
            content=quizz_data.content,
            user_id=user_id,
        )

    async def get_quizz(
        self, quizz_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[schemas.Quizz]:
        """Get a quizz from filesystem cache"""
        file_path = f"{QUIZZ_PATH}/quizz_{user_id}_{quizz_id}.json"

        if not os.path.exists(file_path):
            return None

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return schemas.Quizz(
                id=uuid.UUID(data["id"]),
                path=data.get("path"),
                title=data.get("title"),
                content=data.get("content"),
                user_id=uuid.UUID(data["user_id"]),
            )
        except Exception:
            return None

    async def get_quizzes(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[schemas.Quizz]:
        """Get all quizzes for a student from filesystem cache with pagination"""
        quizz_list = []
        if not os.path.exists(QUIZZ_PATH):
            return quizz_list

        try:
            prefix = f"quizz_{user_id}_"
            for filename in os.listdir(QUIZZ_PATH):
                if filename.startswith(prefix) and filename.endswith(".json"):
                    file_path = os.path.join(QUIZZ_PATH, filename)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        quizz_list.append(
                            schemas.Quizz(
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
        return quizz_list[skip : skip + limit]

    async def update_quizz(
        self, quizz_id: uuid.UUID, quizz_update: schemas.QuizzUpdate, user_id: uuid.UUID
    ) -> schemas.Quizz:
        """Update a quizz in the filesystem cache"""
        file_path = f"{QUIZZ_PATH}/quizz_{user_id}_{quizz_id}.json"

        if not os.path.exists(file_path):
            raise NotFoundException(f"Quizz with id {quizz_id} not found")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            raise NotFoundException(f"Error reading quizz: {str(e)}")

        update_data = quizz_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            data[key] = value

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
        except Exception as e:
            raise NotFoundException(f"Error saving updated quizz: {str(e)}")

        return schemas.Quizz(
            id=uuid.UUID(data["id"]),
            path=data.get("path"),
            title=data.get("title"),
            content=data.get("content"),
            user_id=uuid.UUID(data["user_id"]),
        )

    async def delete_quizz(self, quizz_id: uuid.UUID, user_id: uuid.UUID) -> dict:
        """Delete a quizz from filesystem cache"""
        file_path = f"{QUIZZ_PATH}/quizz_{user_id}_{quizz_id}.json"

        if not os.path.exists(file_path):
            raise NotFoundException(f"Quizz with id {quizz_id} not found")

        try:
            await delete_file(file_path)
        except Exception as e:
            raise NotFoundException(f"Error deleting quizz file: {str(e)}")

        return {"message": "Quizz deleted successfully", "id": quizz_id}
