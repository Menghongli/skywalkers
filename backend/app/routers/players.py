from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/players", tags=["players"])

@router.get("/", response_model=List[UserResponse])
async def get_players(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    players = db.query(User).filter(User.role == UserRole.PLAYER).order_by(User.jersey_number).all()
    return players

@router.get("/{user_id}", response_model=UserResponse)
async def get_player(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    player = db.query(User).filter(User.id == user_id, User.role == UserRole.PLAYER).first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    return player