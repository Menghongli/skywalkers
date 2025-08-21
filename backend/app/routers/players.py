from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Player
from ..schemas import PlayerResponse, PlayerCreate, PlayerUpdate, PlayerMerge

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

@router.put("/{player_id}", response_model=PlayerResponse)
async def update_player(player_id: int, player_update: PlayerUpdate, db: Session = Depends(get_db)):
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    
    # Check if jersey number already exists for another player
    if player_update.jersey_number is not None:
        existing_player = db.query(Player).filter(
            Player.jersey_number == player_update.jersey_number,
            Player.id != player_id
        ).first()
        if existing_player:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Jersey number already taken")
    
    # Update only provided fields
    update_data = player_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_player, field, value)
    
    db.commit()
    db.refresh(db_player)
    return db_player

@router.delete("/{player_id}")
async def deactivate_player(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    
    db_player.is_active = 0
    db.commit()
    return {"message": "Player deactivated successfully"}

@router.get("/all", response_model=List[PlayerResponse])
async def get_all_players(db: Session = Depends(get_db)):
    """Get all players including inactive ones for admin purposes"""
    players = db.query(Player).order_by(Player.jersey_number).all()
    return players

@router.post("/merge")
async def merge_players(merge_data: PlayerMerge, db: Session = Depends(get_db)):
    """Merge source player into target player and transfer all stats"""
    from ..models import PlayerGameStats
    
    source_player = db.query(Player).filter(Player.id == merge_data.source_player_id).first()
    target_player = db.query(Player).filter(Player.id == merge_data.target_player_id).first()
    
    if not source_player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source player not found")
    if not target_player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target player not found")
    if source_player.id == target_player.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot merge player with itself")
    
    # Transfer all game stats from source to target player
    source_stats = db.query(PlayerGameStats).filter(PlayerGameStats.player_id == merge_data.source_player_id).all()
    for stat in source_stats:
        # Check if target player already has stats for this game
        existing_stat = db.query(PlayerGameStats).filter(
            PlayerGameStats.player_id == merge_data.target_player_id,
            PlayerGameStats.game_id == stat.game_id
        ).first()
        
        if existing_stat:
            # Merge the stats by adding points and fouls
            existing_stat.points += stat.points
            existing_stat.fouls += stat.fouls
            # Delete the source stat
            db.delete(stat)
        else:
            # Transfer the stat to target player
            stat.player_id = merge_data.target_player_id
    
    # Deactivate the source player
    source_player.is_active = 0
    
    db.commit()
    return {"message": f"Successfully merged {source_player.name} into {target_player.name}"}