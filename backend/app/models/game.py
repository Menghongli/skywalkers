from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from ..database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    opponent_name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    final_score_skywalkers = Column(Integer)
    final_score_opponent = Column(Integer)
    video_url = Column(String)

    player_stats = relationship("PlayerGameStats", back_populates="game")