"""add title either quizz and flashcard

Revision ID: 2ddfe2a329cb
Revises: f2c49616a6af
Create Date: 2026-01-17 06:39:43.973842

"""
from typing import Sequence, Union



# revision identifiers, used by Alembic.
revision: str = '2ddfe2a329cb'
down_revision: Union[str, Sequence[str], None] = 'f2c49616a6af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
