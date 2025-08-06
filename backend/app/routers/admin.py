from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from ..database import get_db
from ..models import User, Player, UserRole
from ..schemas import UserResponse, UserCreate
from ..dependencies import get_current_manager
from ..auth.auth import get_password_hash
from ..services.email import email_service

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    users = db.query(User).all()
    return users

@router.post("/create-manager", response_model=UserResponse)
async def create_manager(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    verification_token = email_service.generate_verification_token()
    hashed_password = get_password_hash(user_data.password)
    
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        role=UserRole.MANAGER,
        is_verified=False,
        verification_token=verification_token,
        verification_sent_at=datetime.utcnow()
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Send verification email
    email_sent = email_service.send_verification_email(
        to_email=db_user.email,
        name=db_user.name,
        verification_token=verification_token
    )
    
    if not email_sent:
        print(f"Warning: Failed to send verification email to {db_user.email}")
    
    return db_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
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
    
    # Delete associated player record if exists
    if user.role == UserRole.PLAYER:
        player = db.query(Player).filter(Player.user_id == user_id).first()
        if player:
            db.delete(player)
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.put("/users/{user_id}/verify")
async def manually_verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified = True
    user.verification_token = None
    user.verification_sent_at = None
    db.commit()
    
    return {"message": "User verified successfully"}