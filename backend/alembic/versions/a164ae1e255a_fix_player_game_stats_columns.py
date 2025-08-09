"""fix_player_game_stats_columns

Revision ID: a164ae1e255a
Revises: 86219af15bfd
Create Date: 2025-08-09 11:09:33.935232

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a164ae1e255a'
down_revision: Union[str, Sequence[str], None] = '86219af15bfd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Since we can't easily alter the existing table in SQLite, 
    # and the table structure is already inconsistent,
    # we'll recreate the player_game_stats table properly
    
    # Step 1: Create a new temp table with correct structure
    op.create_table('player_game_stats_new',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('player_id', sa.Integer(), nullable=False),
    sa.Column('game_id', sa.Integer(), nullable=False),
    sa.Column('points', sa.Integer(), nullable=True),
    sa.Column('fouls', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
    sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_player_game_stats_new_id'), 'player_game_stats_new', ['id'], unique=False)
    
    # Step 2: Drop the old table
    op.drop_index(op.f('ix_player_game_stats_id'), table_name='player_game_stats')
    op.drop_table('player_game_stats')
    
    # Step 3: Rename the new table
    op.rename_table('player_game_stats_new', 'player_game_stats')
    op.drop_index(op.f('ix_player_game_stats_new_id'), table_name='player_game_stats')
    op.create_index(op.f('ix_player_game_stats_id'), 'player_game_stats', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Recreate the original player_game_stats table with user_id
    op.create_table('player_game_stats_old',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('game_id', sa.Integer(), nullable=False),
    sa.Column('points', sa.Integer(), nullable=True),
    sa.Column('fouls', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_player_game_stats_old_id'), 'player_game_stats_old', ['id'], unique=False)
    
    # Drop the current table
    op.drop_index(op.f('ix_player_game_stats_id'), table_name='player_game_stats')
    op.drop_table('player_game_stats')
    
    # Rename back
    op.rename_table('player_game_stats_old', 'player_game_stats')
    op.drop_index(op.f('ix_player_game_stats_old_id'), table_name='player_game_stats')
    op.create_index(op.f('ix_player_game_stats_id'), 'player_game_stats', ['id'], unique=False)
