"""add share_token and diagnosis_codes to tickets

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-03-17

"""
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "g2b3c4d5e6f7"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tickets", sa.Column("diagnosis_codes", sa.JSON(), nullable=True))
    op.add_column("tickets", sa.Column("share_token", sa.String(64), nullable=True))
    op.create_index("ix_tickets_share_token", "tickets", ["share_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_tickets_share_token", table_name="tickets")
    op.drop_column("tickets", "share_token")
    op.drop_column("tickets", "diagnosis_codes")
