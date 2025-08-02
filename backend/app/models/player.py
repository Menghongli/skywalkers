from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    jersey_number = Column(Integer, nullable=False, unique=True)

    user = relationship("User", back_populates="player")
    game_stats = relationship("PlayerGameStats", back_populates="player")