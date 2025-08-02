from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from .models.user import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    jersey_number: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    
    class Config:
        from_attributes = True

class PlayerResponse(BaseModel):
    id: int
    user_id: int
    jersey_number: int
    user: UserResponse
    
    class Config:
        from_attributes = True

class GameCreate(BaseModel):
    opponent_name: str
    date: date
    final_score_skywalkers: Optional[int] = None
    final_score_opponent: Optional[int] = None

class GameResponse(BaseModel):
    id: int
    opponent_name: str
    date: date
    final_score_skywalkers: Optional[int]
    final_score_opponent: Optional[int]
    video_url: Optional[str]
    
    class Config:
        from_attributes = True

class PlayerGameStatsCreate(BaseModel):
    player_id: int
    game_id: int
    points: int = 0
    fouls: int = 0

class PlayerGameStatsResponse(BaseModel):
    id: int
    player_id: int
    game_id: int
    points: int
    fouls: int
    player: PlayerResponse
    
    class Config:
        from_attributes = True