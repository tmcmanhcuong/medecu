"""add-study-foundation-tables

Revision ID: 0c3af90af6f1
Revises: f2c49616a6af
Create Date: 2026-05-27 14:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0c3af90af6f1"
down_revision: Union[str, Sequence[str], None] = "2ddfe2a329cb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("books", sa.Column("file_name", sa.Text(), server_default=sa.text("''"), nullable=False))
    op.add_column("books", sa.Column("mime_type", sa.Text(), server_default=sa.text("'application/pdf'"), nullable=False))
    op.add_column("books", sa.Column("file_size", sa.Integer(), server_default=sa.text("0"), nullable=False))
    op.add_column("books", sa.Column("ingestion_status", sa.Text(), server_default=sa.text("'uploaded'"), nullable=False))
    op.add_column("books", sa.Column("ingestion_error", sa.Text(), server_default=sa.text("''"), nullable=False))

    op.add_column("notes", sa.Column("source_page", sa.Integer(), nullable=True))
    op.add_column("notes", sa.Column("source_excerpt", sa.Text(), nullable=True))
    op.add_column("notes", sa.Column("book_id", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_notes_book_id", "notes", "books", ["book_id"], ["id"])

    op.create_table(
        "document_extracted_content",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=False),
        sa.Column("content_version", sa.Text(), server_default=sa.text("'v1'"), nullable=False),
        sa.Column("processing_status", sa.Text(), server_default=sa.text("'ready'"), nullable=False),
        sa.Column("processing_error", sa.Text(), server_default=sa.text("''"), nullable=False),
        sa.Column("book_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "study_activity_history",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("artifact_type", sa.Text(), nullable=False),
        sa.Column("activity_type", sa.Text(), server_default=sa.text("'generated'"), nullable=False),
        sa.Column("payload", sa.Text(), server_default=sa.text("'{}'"), nullable=False),
        sa.Column("source_page", sa.Text(), nullable=True),
        sa.Column("source_excerpt", sa.Text(), nullable=True),
        sa.Column("book_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("study_activity_history")
    op.drop_table("document_extracted_content")
    op.drop_constraint("fk_notes_book_id", "notes", type_="foreignkey")
    op.drop_column("notes", "book_id")
    op.drop_column("notes", "source_excerpt")
    op.drop_column("notes", "source_page")
    op.drop_column("books", "ingestion_error")
    op.drop_column("books", "ingestion_status")
    op.drop_column("books", "file_size")
    op.drop_column("books", "mime_type")
    op.drop_column("books", "file_name")
