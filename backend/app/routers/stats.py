from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import PlayerGameStats, User
from ..schemas import PlayerGameStatsCreate, PlayerGameStatsResponse
from ..dependencies import get_current_user, get_current_manager

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/game/{game_id}", response_model=List[PlayerGameStatsResponse])
async def get_game_stats(game_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stats = db.query(PlayerGameStats).filter(PlayerGameStats.game_id == game_id).all()
    return stats

@router.get("/player/{user_id}", response_model=List[PlayerGameStatsResponse])
async def get_player_stats(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stats = db.query(PlayerGameStats).filter(PlayerGameStats.user_id == user_id).all()
    return stats

@router.post("/", response_model=PlayerGameStatsResponse)
async def create_stats(
    stats: PlayerGameStatsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    existing_stats = db.query(PlayerGameStats).filter(
        PlayerGameStats.user_id == stats.user_id,
        PlayerGameStats.game_id == stats.game_id
    ).first()
    
    if existing_stats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stats already exist for this player and game"
        )
    
    db_stats = PlayerGameStats(**stats.model_dump())
    db.add(db_stats)
    db.commit()
    db.refresh(db_stats)
    return db_stats

@router.put("/{stats_id}", response_model=PlayerGameStatsResponse)
async def update_stats(
    stats_id: int,
    stats: PlayerGameStatsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_stats = db.query(PlayerGameStats).filter(PlayerGameStats.id == stats_id).first()
    if not db_stats:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stats not found")
    
    for field, value in stats.model_dump().items():
        setattr(db_stats, field, value)
    
    db.commit()
    db.refresh(db_stats)
    return db_stats