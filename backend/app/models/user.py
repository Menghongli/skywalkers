from sqlalchemy import Column, Integer, String, Enum, Boolean, DateTime
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from ..database import Base

class UserRole(str, enum.Enum):
    MANAGER = "manager"
    PLAYER = "player"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)
    verification_sent_at = Column(DateTime, nullable=True)
    jersey_number = Column(Integer, nullable=True, unique=True)

    game_stats = relationship("PlayerGameStats", back_populates="user")