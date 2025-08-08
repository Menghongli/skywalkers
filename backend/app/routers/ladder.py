from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import User, LadderEntry
from ..schemas import LadderEntryResponse
from ..dependencies import get_current_user, get_current_manager
from ..services.ladder_service import LadderService
from ..scheduler import get_scheduler

router = APIRouter(prefix="/ladder", tags=["ladder"])

@router.get("/", response_model=List[LadderEntryResponse])
async def get_ladder(
    limit: int = 10,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get the latest ladder standings"""
    service = LadderService()
    ladder_entries = service.get_latest_ladder(db, limit)
    
    # Convert datetime to string for response
    for entry in ladder_entries:
        entry.last_updated = entry.last_updated.isoformat()
    
    return ladder_entries

@router.get("/team/{team_name}", response_model=LadderEntryResponse)
async def get_team_position(
    team_name: str,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get position for a specific team"""
    service = LadderService()
    team_entry = service.get_team_position(db, team_name)
    
    if not team_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Team '{team_name}' not found in ladder"
        )
    
    # Convert datetime to string for response
    team_entry.last_updated = team_entry.last_updated.isoformat()
    
    return team_entry

@router.post("/update")
async def update_ladder(
    background_tasks: BackgroundTasks,
    url: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """Manually trigger ladder update (manager only)"""
    
    def update_ladder_task():
        service = LadderService()
        db_session = Session(bind=db.get_bind())
        try:
            success = service.update_ladder_from_web(db_session, url)
            return success
        finally:
            db_session.close()
    
    background_tasks.add_task(update_ladder_task)
    
    return {
        "message": "Ladder update started in background",
        "initiated_by": current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/schedule/status")
async def get_schedule_status(
    current_user: User = Depends(get_current_manager)
):
    """Get scheduled jobs status (manager only)"""
    scheduler = get_scheduler()
    jobs = scheduler.get_scheduled_jobs()
    
    return {
        "scheduled_jobs": jobs,
        "scheduler_running": scheduler.scheduler.running
    }

@router.post("/schedule/trigger")
async def trigger_scheduled_update(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_manager)
):
    """Manually trigger the scheduled ladder update (manager only)"""
    
    def trigger_update():
        scheduler = get_scheduler()
        return scheduler.trigger_ladder_update_now()
    
    background_tasks.add_task(trigger_update)
    
    return {
        "message": "Scheduled ladder update triggered manually",
        "initiated_by": current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    }