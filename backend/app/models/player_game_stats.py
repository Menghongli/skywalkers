from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class PlayerGameStats(Base):
    __tablename__ = "player_game_stats"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    points = Column(Integer, default=0)
    fouls = Column(Integer, default=0)

    player = relationship("Player", back_populates="game_stats")
    game = relationship("Game", back_populates="player_stats")