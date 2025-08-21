"""remove position, height, weight from players

Revision ID: b1c2d3e4f5g6
Revises: a20ac14837d4
Create Date: 2025-01-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5g6'
down_revision: Union[str, Sequence[str], None] = 'a20ac14837d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove position, height, and weight columns from players table."""
    with op.batch_alter_table('players') as batch_op:
        batch_op.drop_column('position')
        batch_op.drop_column('height')
        batch_op.drop_column('weight')


def downgrade() -> None:
    """Add back position, height, and weight columns to players table."""
    with op.batch_alter_table('players') as batch_op:
        batch_op.add_column(sa.Column('position', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('height', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('weight', sa.Float(), nullable=True))