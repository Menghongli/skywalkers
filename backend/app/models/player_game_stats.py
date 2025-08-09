from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class PlayerGameStats(Base):
    __tablename__ = "player_game_stats"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    points = Column(Integer, default=0)
    fouls = Column(Integer, default=0)
    
    # Verification fields
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_scraped = Column(Boolean, default=False)  # Whether this was auto-scraped or manually entered
    scrape_source = Column(String, nullable=True)  # URL or source of scrape

    player = relationship("Player", back_populates="game_stats")
    game = relationship("Game", back_populates="player_stats")
    verified_by_user = relationship("User", backref="verified_stats")