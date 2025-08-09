from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Game, User
from ..schemas import GameCreate, GameResponse
from ..dependencies import get_current_manager

router = APIRouter(prefix="/games", tags=["games"])

@router.get("", response_model=List[GameResponse])
async def get_games(db: Session = Depends(get_db)):
    games = db.query(Game).order_by(Game.date.desc()).all()
    return games

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    return game

@router.post("", response_model=GameResponse)
async def create_game(
    game: GameCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_manager)
):
    db_game = Game(**game.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

@router.put("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: int,
    game: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    
    for field, value in game.model_dump().items():
        setattr(db_game, field, value)
    
    db.commit()
    db.refresh(db_game)
    return db_game

@router.delete("/{game_id}")
async def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    
    db.delete(db_game)
    db.commit()
    return {"message": "Game deleted successfully"}