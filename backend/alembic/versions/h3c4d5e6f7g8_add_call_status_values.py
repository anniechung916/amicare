"""add on_hold, transferring, busy to callstatus enum

Revision ID: h3c4d5e6f7g8
Revises: g2b3c4d5e6f7
Create Date: 2026-03-17

"""
from typing import Union

from alembic import op

revision: str = 'h3c4d5e6f7g8'
down_revision: Union[str, None] = 'g2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL requires ADD VALUE outside a transaction for enum types.
    # Use IF NOT EXISTS so this is safe to re-run.
    op.execute("ALTER TYPE callstatus ADD VALUE IF NOT EXISTS 'on_hold'")
    op.execute("ALTER TYPE callstatus ADD VALUE IF NOT EXISTS 'transferring'")
    op.execute("ALTER TYPE callstatus ADD VALUE IF NOT EXISTS 'busy'")


def downgrade() -> None:
    # PostgreSQL does not support DROP VALUE from an enum; downgrade is a no-op.
    pass
