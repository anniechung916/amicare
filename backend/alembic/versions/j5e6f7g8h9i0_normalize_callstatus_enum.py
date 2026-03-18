"""normalize callstatus enum values to lowercase

Revision ID: j5e6f7g8h9i0
Revises: i4d5e6f7g8h9
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa

revision = 'j5e6f7g8h9i0'
down_revision = 'i4d5e6f7g8h9'
branch_labels = None
depends_on = None

# Uppercase values in DB that need to become lowercase
_REMAP = {
    'QUEUED': 'queued',
    'RINGING': 'ringing',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'NO_ANSWER': 'no_answer',
    'VOICEMAIL': 'voicemail',
}


def upgrade():
    # Add lowercase variants that don't already exist
    for new_val in _REMAP.values():
        op.execute(f"ALTER TYPE callstatus ADD VALUE IF NOT EXISTS '{new_val}'")

    # Migrate existing rows to lowercase values
    op.execute("ALTER TABLE call_logs ALTER COLUMN status TYPE varchar USING status::text")
    for old, new in _REMAP.items():
        op.execute(f"UPDATE call_logs SET status = '{new}' WHERE status = '{old}'")
    op.execute("ALTER TABLE call_logs ALTER COLUMN status TYPE callstatus USING status::callstatus")


def downgrade():
    pass  # Cannot remove enum values in PostgreSQL; downgrade is a no-op
