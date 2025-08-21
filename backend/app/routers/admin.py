from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Player, PlayerGameStats
from ..schemas import UserResponse, UserCreate, PlayerResponse, PlayerCreate, PlayerUpdate, PlayerMerge
from ..auth.auth import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    request: Request,
    db: Session = Depends(get_db)
):
    # Manager auth is handled by middleware
    users = db.query(User).all()
    return users

@router.post("/create-user", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    # Get current manager from middleware
    current_manager = request.state.current_manager
    
    # Prevent self-deletion
    if user_id == current_manager.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # No need to delete associated player record - jersey_number is now part of User
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

# Player Management Routes for Admin
@router.get("/players", response_model=List[PlayerResponse])
async def get_all_players_admin(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all players including inactive ones for admin management"""
    players = db.query(Player).order_by(Player.jersey_number).all()
    return players

@router.post("/players", response_model=PlayerResponse)
async def create_player_admin(
    player: PlayerCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new player (admin only)"""
    # Check if jersey number already exists
    existing_player = db.query(Player).filter(Player.jersey_number == player.jersey_number).first()
    if existing_player:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Jersey number already taken")
    
    db_player = Player(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.put("/players/{player_id}", response_model=PlayerResponse)
async def update_player_admin(
    player_id: int,
    player_update: PlayerUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update player details (admin only)"""
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

@router.delete("/players/{player_id}")
async def deactivate_player_admin(
    player_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Deactivate a player (admin only)"""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    
    db_player.is_active = 0
    db.commit()
    return {"message": "Player deactivated successfully"}

@router.post("/players/{player_id}/activate")
async def activate_player_admin(
    player_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Reactivate a player (admin only)"""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    
    db_player.is_active = 1
    db.commit()
    return {"message": "Player activated successfully"}

@router.post("/players/merge")
async def merge_players_admin(
    merge_data: PlayerMerge,
    request: Request,
    db: Session = Depends(get_db)
):
    """Merge source player into target player and transfer all stats (admin only)"""
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

