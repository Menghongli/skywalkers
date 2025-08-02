from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Player, User
from ..schemas import PlayerResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/players", tags=["players"])

@router.get("/", response_model=List[PlayerResponse])
async def get_players(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    players = db.query(Player).order_by(Player.jersey_number).all()
    return players

@router.get("/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    return player