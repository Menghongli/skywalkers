"""Change time column from string to datetime

Revision ID: 9ebf3d20431d
Revises: 055a4027382c
Create Date: 2025-08-09 18:16:17.584260

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9ebf3d20431d'
down_revision: Union[str, Sequence[str], None] = '055a4027382c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Convert time column from VARCHAR to DateTime."""
    
    # SQLite doesn't support ALTER COLUMN TYPE, so we need to recreate the table
    
    # Create new table with correct schema
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
    
    # Copy data from old table to new table (time column will be NULL since we can't convert string times)
    op.execute('''
        INSERT INTO games_new (id, opponent_name, date, venue, final_score_skywalkers, final_score_opponent, video_url)
        SELECT id, opponent_name, date, venue, final_score_skywalkers, final_score_opponent, video_url 
        FROM games
    ''')
    
    # Temporarily drop foreign key constraints before dropping games table
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    all_tables = inspector.get_table_names()
    dropped_fks = []
    
    for table_name in all_tables:
        if table_name in ['games', 'games_new']:
            continue
        try:
            foreign_keys = inspector.get_foreign_keys(table_name)
            for fk in foreign_keys:
                if fk['referred_table'] == 'games':
                    dropped_fks.append((table_name, fk))
                    op.drop_constraint(fk['name'], table_name, type_='foreignkey')
        except Exception as e:
            # If we can't inspect foreign keys for a table, skip it
            print(f"Warning: Could not inspect foreign keys for table {table_name}: {e}")
    
    # Drop old table
    op.drop_table('games')
    
    # Rename new table to original name
    op.rename_table('games_new', 'games')
    
    # Recreate all the foreign key constraints
    for table_name, fk in dropped_fks:
        op.create_foreign_key(
            fk['name'],
            table_name, 
            'games',
            fk['constrained_columns'], 
            fk['referred_columns']
        )


def downgrade() -> None:
    """Downgrade schema - Convert time column from DateTime back to VARCHAR."""
    
    # Create table with VARCHAR time column
    op.create_table('games_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('opponent_name', sa.String(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('time', sa.String(), nullable=True),
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
    
    # Temporarily drop foreign key constraints before dropping games table
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    all_tables = inspector.get_table_names()
    dropped_fks = []
    
    for table_name in all_tables:
        if table_name in ['games', 'games_new']:
            continue
        try:
            foreign_keys = inspector.get_foreign_keys(table_name)
            for fk in foreign_keys:
                if fk['referred_table'] == 'games':
                    dropped_fks.append((table_name, fk))
                    op.drop_constraint(fk['name'], table_name, type_='foreignkey')
        except Exception as e:
            # If we can't inspect foreign keys for a table, skip it
            print(f"Warning: Could not inspect foreign keys for table {table_name}: {e}")
    
    # Drop old table
    op.drop_table('games')
    
    # Rename new table to original name
    op.rename_table('games_new', 'games')
    
    # Recreate all the foreign key constraints
    for table_name, fk in dropped_fks:
        op.create_foreign_key(
            fk['name'],
            table_name, 
            'games',
            fk['constrained_columns'], 
            fk['referred_columns']
        )
