from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Player
from ..schemas import PlayerResponse, PlayerCreate

router = APIRouter(prefix="/players", tags=["players"])

@router.get("", response_model=List[PlayerResponse])
async def get_players(db: Session = Depends(get_db)):
    players = db.query(Player).filter(Player.is_active == 1).order_by(Player.jersey_number).all()
    return players

@router.get("/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id, Player.is_active == 1).first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    return player

@router.post("", response_model=PlayerResponse)
async def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    # Check if jersey number already exists
    existing_player = db.query(Player).filter(Player.jersey_number == player.jersey_number).first()
    if existing_player:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Jersey number already taken")
    
    db_player = Player(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player