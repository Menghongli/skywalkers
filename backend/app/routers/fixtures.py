from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import User
from ..dependencies import get_current_manager
from ..services.fixtures_service import FixturesService

router = APIRouter(prefix="/fixtures", tags=["fixtures"])

@router.get("")
async def get_upcoming_fixtures(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get upcoming fixtures from database"""
    service = FixturesService()
    fixtures = service.get_all_upcoming_fixtures(db)
    
    # Apply limit
    if limit > 0:
        fixtures = fixtures[:limit]
    
    return {
        "fixtures": fixtures,
        "count": len(fixtures)
    }

@router.post("/update")
async def update_fixtures(
    background_tasks: BackgroundTasks,
    url: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """Manually trigger fixtures update (manager only)"""
    
    def update_fixtures_task():
        service = FixturesService()
        db_session = Session(bind=db.get_bind())
        try:
            result = service.update_fixtures_from_web(db_session, url)
            return result
        finally:
            db_session.close()
    
    background_tasks.add_task(update_fixtures_task)
    
    return {
        "message": "Fixtures update started in background",
        "initiated_by": current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/status")
async def get_fixtures_status(
    db: Session = Depends(get_db)
):
    """Get fixtures status information (no auth required)"""
    service = FixturesService()
    
    # Get upcoming fixtures count
    upcoming_games = service.get_upcoming_games_from_db(db, limit=50)  # Get more for stats
    
    today_games = [game for game in upcoming_games if game.date == datetime.now().date()]
    this_week_games = [game for game in upcoming_games if (game.date - datetime.now().date()).days <= 7]
    
    return {
        "upcoming_count": len(upcoming_games),
        "today_count": len(today_games),
        "this_week_count": len(this_week_games),
        "last_checked": datetime.utcnow().isoformat()
    }

@router.post("/sync-with-games")
async def sync_fixtures_with_games(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """Sync existing upcoming games with latest fixture data (manager only)"""
    
    def sync_task():
        service = FixturesService()
        db_session = Session(bind=db.get_bind())
        try:
            # This would be a more comprehensive sync that checks existing games
            # against current fixture data and updates as needed
            result = service.update_fixtures_from_web(db_session)
            return result
        finally:
            db_session.close()
    
    background_tasks.add_task(sync_task)
    
    return {
        "message": "Fixtures sync with games started in background",
        "initiated_by": current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    }