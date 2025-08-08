from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from ..database import Base

class LadderEntry(Base):
    __tablename__ = "ladder_entries"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String, nullable=False)
    position = Column(Integer, nullable=False)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    points_for = Column(Integer, default=0)
    points_against = Column(Integer, default=0)
    win_percentage = Column(Float, default=0.0)
    games_played = Column(Integer, default=0)
    
    # Metadata
    season = Column(String, nullable=True)
    division = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)