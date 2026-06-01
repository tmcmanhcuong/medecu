"""add ingestion fields to notebook_sources

Revision ID: b17e0cb16ab9
Revises: a4f3d9e7c2a1
Create Date: 2026-05-28 10:44:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b17e0cb16ab9"
down_revision: Union[str, None] = "a4f3d9e7c2a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notebook_sources",
        sa.Column("ingestion_status", sa.Text(), nullable=False, server_default=sa.text("'queued'")),
    )
    op.add_column(
        "notebook_sources",
        sa.Column("ingestion_error", sa.Text(), nullable=False, server_default=sa.text("''")),
    )
    op.add_column(
        "notebook_sources",
        sa.Column("ingestion_job_id", sa.Text(), nullable=False, server_default=sa.text("''")),
    )


def downgrade() -> None:
    op.drop_column("notebook_sources", "ingestion_job_id")
    op.drop_column("notebook_sources", "ingestion_error")
    op.drop_column("notebook_sources", "ingestion_status")

