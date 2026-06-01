"""002-create-seed-users

Revision ID: f2c49616a6af
Revises: 44d7b624a6dd
Create Date: 2026-01-14 17:41:58.354648

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f2c49616a6af"
down_revision: Union[str, Sequence[str], None] = "44d7b624a6dd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    users_table = sa.table(
        "users",
        sa.column("username", sa.String),
        sa.column("email", sa.String),
        sa.column("full_name", sa.String),
        sa.column("password", sa.String),
    )
    op.bulk_insert(
        users_table,
        [
            {
                "username": "minghoan",
                "email": "mn@gmail.com",
                "full_name": "Nguyen Minh Hoang",
                "password": "123456",
            },
            {
                "username": "duchuy",
                "email": "duchuy@gmail.com",
                "full_name": "Phan Duc Huy",
                "password": "123456",
            },
        ],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        """
        DELETE FROM users
        WHERE username IN ('minghoan', 'duchuy')
        """
    )
