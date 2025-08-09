"""add verification fields to player_game_stats

Revision ID: a20ac14837d4
Revises: 33f5bf7a6232
Create Date: 2025-08-09 12:05:03.129409

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a20ac14837d4'
down_revision: Union[str, Sequence[str], None] = '33f5bf7a6232'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add verification fields to player_game_stats table
    with op.batch_alter_table('player_game_stats') as batch_op:
        batch_op.add_column(sa.Column('is_verified', sa.Boolean(), default=False))
        batch_op.add_column(sa.Column('verified_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('verified_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_player_game_stats_verified_by', 'users', ['verified_by'], ['id'])
        batch_op.add_column(sa.Column('is_scraped', sa.Boolean(), default=False))
        batch_op.add_column(sa.Column('scrape_source', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove verification fields from player_game_stats table
    with op.batch_alter_table('player_game_stats') as batch_op:
        batch_op.drop_column('scrape_source')
        batch_op.drop_column('is_scraped')
        batch_op.drop_constraint('fk_player_game_stats_verified_by', type_='foreignkey')
        batch_op.drop_column('verified_by')
        batch_op.drop_column('verified_at')
        batch_op.drop_column('is_verified')
