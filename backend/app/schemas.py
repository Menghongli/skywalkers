from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

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

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class GameCreate(BaseModel):
    opponent_name: str
    datetime: datetime
    venue: Optional[str] = None
    final_score_skywalkers: Optional[int] = None
    final_score_opponent: Optional[int] = None

class GameResponse(BaseModel):
    id: int
    opponent_name: str
    datetime: datetime
    venue: Optional[str]
    final_score_skywalkers: Optional[int]
    final_score_opponent: Optional[int]
    video_url: Optional[str]
    
    class Config:
        from_attributes = True

class PlayerCreate(BaseModel):
    name: str
    jersey_number: int
    position: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[float] = None

class PlayerResponse(BaseModel):
    id: int
    name: str
    jersey_number: int
    position: Optional[str]
    height: Optional[str]
    weight: Optional[float]
    date_joined: datetime
    is_active: int
    
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
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    is_scraped: bool = False
    scrape_source: Optional[str] = None
    player: PlayerResponse
    
    class Config:
        from_attributes = True

class LadderEntryResponse(BaseModel):
    id: int
    team_name: str
    position: int
    wins: int
    draws: int
    losses: int
    points_for: int
    points_against: int
    win_percentage: float
    games_played: int
    season: Optional[str]
    division: Optional[str]
    last_updated: str
    
    class Config:
        from_attributes = True