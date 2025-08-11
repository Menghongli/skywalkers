from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from ..database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    opponent_name = Column(String, nullable=False)
    datetime = Column(DateTime, nullable=False)  # Combined date and time
    venue = Column(String)
    final_score_skywalkers = Column(Integer)
    final_score_opponent = Column(Integer)
    video_url = Column(String)

    player_stats = relationship("PlayerGameStats", back_populates="game")