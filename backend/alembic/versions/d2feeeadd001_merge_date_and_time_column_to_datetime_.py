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
    # Check database type and handle accordingly
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Get current columns
    games_columns = {col['name']: col for col in inspector.get_columns('games')}
    
    # For PostgreSQL, we can alter columns in place
    if bind.dialect.name == 'postgresql':
        # Add datetime column if it doesn't exist
        if 'datetime' not in games_columns:
            op.add_column('games', sa.Column('datetime', sa.DateTime(), nullable=True))
        
        # Copy date data to datetime column (combining with default noon time)
        if 'date' in games_columns:
            op.execute('''
                UPDATE games 
                SET datetime = CASE 
                    WHEN date IS NOT NULL THEN date + TIME '12:00:00'
                    ELSE NULL 
                END
                WHERE datetime IS NULL
            ''')
            
            # Drop the old date column
            op.drop_column('games', 'date')
        
        # Drop time column if it exists (since we're combining into datetime)
        if 'time' in games_columns:
            op.drop_column('games', 'time')
            
    else:
        # For SQLite, use the table recreation approach
        # Clean up any existing games_new table first
        try:
            op.drop_table('games_new')
        except:
            pass
        try:
            op.drop_index('ix_games_new_id', table_name='games_new')
        except:
            pass

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
        
        # Copy data from old table to new table 
        if 'date' in games_columns:
            op.execute('''
                INSERT INTO games_new (id, opponent_name, datetime, venue, final_score_skywalkers, final_score_opponent, video_url)
                SELECT id, opponent_name, date, venue, final_score_skywalkers, final_score_opponent, video_url 
                FROM games
            ''')
        else:
            op.execute('''
                INSERT INTO games_new (id, opponent_name, datetime, venue, final_score_skywalkers, final_score_opponent, video_url)
                SELECT id, opponent_name, datetime, venue, final_score_skywalkers, final_score_opponent, video_url 
                FROM games
            ''')
        
        # Temporarily drop foreign key constraints before dropping games table
        # Find all tables that have foreign keys pointing to games table
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
    """Downgrade schema."""
    # Check database type and handle accordingly
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Get current columns
    games_columns = {col['name']: col for col in inspector.get_columns('games')}
    
    # For PostgreSQL, alter columns in place
    if bind.dialect.name == 'postgresql':
        # Add date column if it doesn't exist
        if 'date' not in games_columns:
            op.add_column('games', sa.Column('date', sa.Date(), nullable=True))
        
        # Add time column if it doesn't exist
        if 'time' not in games_columns:
            op.add_column('games', sa.Column('time', sa.String(), nullable=True))
        
        # Copy datetime data back to date column
        if 'datetime' in games_columns:
            op.execute('''
                UPDATE games 
                SET date = datetime::date
                WHERE date IS NULL AND datetime IS NOT NULL
            ''')
            
            # Drop the datetime column
            op.drop_column('games', 'datetime')
            
    else:
        # For SQLite, use table recreation
        # Clean up any existing games_new table first
        try:
            op.drop_table('games_new')
        except:
            pass
        try:
            op.drop_index('ix_games_new_id', table_name='games_new')
        except:
            pass

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
        
        # Copy data (extract date from datetime)
        op.execute('''
            INSERT INTO games_new (id, opponent_name, date, venue, final_score_skywalkers, final_score_opponent, video_url)
            SELECT id, opponent_name, date(datetime), venue, final_score_skywalkers, final_score_opponent, video_url 
            FROM games
        ''')
        
        # Temporarily drop foreign key constraints before dropping games table
        # Find all tables that have foreign keys pointing to games table
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
