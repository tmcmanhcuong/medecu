from typing import List, Optional
from core import ConflictException, NotFoundException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import models
import schemas
import uuid


class UserRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_user(self, user_id: str) -> Optional[schemas.User]:
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            return schemas.User.model_validate(user)
        return None

    def get_user_by_email(self, email: str) -> Optional[models.User]:
        return self.db.query(models.User).filter(models.User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[models.User]:
        return (
            self.db.query(models.User).filter(models.User.username == username).first()
        )

    def get_user_by_password(self, password: str) -> Optional[models.User]:
        return (
            self.db.query(models.User).filter(models.User.password == password).first()
        )

    def get_users(self, skip: int = 0, limit: int = 100) -> List[schemas.User]:
        users = self.db.query(models.User).offset(skip).limit(limit).all()
        return [schemas.User.model_validate(user) for user in users]

    def create_user(self, user: schemas.UserCreate) -> schemas.User:
        db_user = models.User(
            username=user.username, email=user.email, full_name=user.full_name, password=user.password
        )
        self.db.add(db_user)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictException("Username or email already registered") from exc
        self.db.refresh(db_user)
        return schemas.User.model_validate(db_user)

    def count_users(self) -> int:
        return self.db.query(models.User).count()

    def update_user(
        self, user_id: str, user_update: schemas.UserUpdate
    ) -> schemas.User:
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise NotFoundException(f"User with id {user_id} not found")

        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return schemas.User.model_validate(user)

    def delete_user(self, user_id: uuid.UUID) -> dict:
        user = self.get_user(user_id)
        if not user:
            raise NotFoundException(f"User with id {user_id} not found")

        print('huy')
        self.db.delete(
            self.db.query(models.User).filter(models.User.id == user_id).first()
        )
        # self.db.delete(user)
        self.db.commit()
        return {"message": "User deleted successfully", "id": user_id}
