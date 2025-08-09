from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    jersey_number = Column(Integer, nullable=False, unique=True)
    position = Column(String, nullable=True)
    height = Column(String, nullable=True)
    weight = Column(Float, nullable=True)
    date_joined = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive

    # Relationships
    game_stats = relationship("PlayerGameStats", back_populates="player")