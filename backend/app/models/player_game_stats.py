from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class PlayerGameStats(Base):
    __tablename__ = "player_game_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    points = Column(Integer, default=0)
    fouls = Column(Integer, default=0)

    user = relationship("User", back_populates="game_stats")
    game = relationship("Game", back_populates="player_stats")