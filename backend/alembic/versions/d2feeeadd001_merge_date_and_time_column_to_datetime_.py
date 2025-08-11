"""merge_date_and_time_column_to_datetime_column

Revision ID: d2feeeadd001
Revises: 9ebf3d20431d
Create Date: 2025-08-09 19:49:12.787395

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2feeeadd001'
down_revision: Union[str, Sequence[str], None] = '9ebf3d20431d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop table
    op.drop_table('games_new')
    op.drop_index('ix_games_new_id', table_name='games_new')

    # Create new table with correct schema
    op.create_table('games_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('opponent_name', sa.String(), nullable=False),
        sa.Column('datetime', sa.DateTime(), nullable=True),
        sa.Column('venue', sa.String(), nullable=True),
        sa.Column('final_score_skywalkers', sa.Integer(), nullable=True),
        sa.Column('final_score_opponent', sa.Integer(), nullable=True),
        sa.Column('video_url', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on new table
    op.create_index(op.f('ix_games_new_id'), 'games_new', ['id'], unique=False)
    
    # Copy data from old table to new table (time column will be NULL since we can't convert string times)
    op.execute('''
        INSERT INTO games_new (id, opponent_name, datetime, venue, final_score_skywalkers, final_score_opponent, video_url)
        SELECT id, opponent_name, date, venue, final_score_skywalkers, final_score_opponent, video_url 
        FROM games
    ''')
    
    # Drop old table
    op.drop_table('games')
    
    # Rename new table to original name
    op.rename_table('games_new', 'games')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('games_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('opponent_name', sa.String(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('time', sa.DateTime(), nullable=True),
        sa.Column('venue', sa.String(), nullable=True),
        sa.Column('final_score_skywalkers', sa.Integer(), nullable=True),
        sa.Column('final_score_opponent', sa.Integer(), nullable=True),
        sa.Column('video_url', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on new table
    op.create_index(op.f('ix_games_new_id'), 'games_new', ['id'], unique=False)
    
    # Copy data (time will be NULL since we can't easily convert datetime back to original string format)
    op.execute('''
        INSERT INTO games_new (id, opponent_name, date, venue, final_score_skywalkers, final_score_opponent, video_url)
        SELECT id, opponent_name, date, venue, final_score_skywalkers, final_score_opponent, video_url 
        FROM games
    ''')
    
    # Drop old table
    op.drop_table('games')
    
    # Rename new table to original name
    op.rename_table('games_new', 'games')
