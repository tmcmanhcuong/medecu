"""add notebook context to notes and study history

Revision ID: a4f3d9e7c2a1
Revises: 9c4a8d1a2b31
Create Date: 2026-05-27 22:53:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4f3d9e7c2a1"
down_revision: Union[str, Sequence[str], None] = "9c4a8d1a2b31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notes", sa.Column("notebook_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_notes_notebook_id", "notes", "notebooks", ["notebook_id"], ["id"]
    )

    op.add_column("study_activity_history", sa.Column("notebook_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_study_activity_history_notebook_id",
        "study_activity_history",
        "notebooks",
        ["notebook_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_study_activity_history_notebook_id",
        "study_activity_history",
        type_="foreignkey",
    )
    op.drop_column("study_activity_history", "notebook_id")

    op.drop_constraint("fk_notes_notebook_id", "notes", type_="foreignkey")
    op.drop_column("notes", "notebook_id")
