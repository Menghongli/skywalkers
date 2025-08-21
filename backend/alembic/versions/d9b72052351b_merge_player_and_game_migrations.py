"""merge player and game migrations

Revision ID: d9b72052351b
Revises: b1c2d3e4f5g6, d2feeeadd001
Create Date: 2025-08-21 12:34:27.795821

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9b72052351b'
down_revision: Union[str, Sequence[str], None] = ('b1c2d3e4f5g6', 'd2feeeadd001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
