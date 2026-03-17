"""add provider_tax_id and service_type to tickets

Revision ID: i4d5e6f7g8h9
Revises: h3c4d5e6f7g8
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa

revision = 'i4d5e6f7g8h9'
down_revision = 'h3c4d5e6f7g8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tickets', sa.Column('provider_tax_id', sa.String(20), nullable=True))
    op.add_column('tickets', sa.Column('service_type', sa.String(50), nullable=True))


def downgrade():
    op.drop_column('tickets', 'service_type')
    op.drop_column('tickets', 'provider_tax_id')
