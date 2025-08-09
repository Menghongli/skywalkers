"""remove_user_role_and_verification

Revision ID: 33f5bf7a6232
Revises: a164ae1e255a
Create Date: 2025-08-09 11:17:11.424378

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33f5bf7a6232'
down_revision: Union[str, Sequence[str], None] = 'a164ae1e255a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove columns from users table using batch mode for SQLite
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('role')
        batch_op.drop_column('is_verified')
        batch_op.drop_column('verification_token')
        batch_op.drop_column('verification_sent_at')
        batch_op.drop_column('jersey_number')


def downgrade() -> None:
    """Downgrade schema."""
    # Add back columns to users table using batch mode for SQLite
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('role', sa.VARCHAR(), nullable=True))
        batch_op.add_column(sa.Column('is_verified', sa.BOOLEAN(), nullable=True))
        batch_op.add_column(sa.Column('verification_token', sa.VARCHAR(), nullable=True))
        batch_op.add_column(sa.Column('verification_sent_at', sa.DATETIME(), nullable=True))
        batch_op.add_column(sa.Column('jersey_number', sa.INTEGER(), nullable=True))
