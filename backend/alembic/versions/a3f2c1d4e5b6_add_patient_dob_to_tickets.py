"""add patient_dob to tickets

Revision ID: a3f2c1d4e5b6
Revises: 9799b830c6b1
Create Date: 2026-03-15

"""
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a3f2c1d4e5b6'
down_revision: Union[str, None] = '9799b830c6b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tickets', sa.Column('patient_dob', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('tickets', 'patient_dob')
