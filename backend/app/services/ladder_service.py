from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from ..models.ladder import LadderEntry
from ..database import SessionLocal
from .ladder_scraper import LadderScraper

logger = logging.getLogger(__name__)

class LadderService:
    """Service for managing ladder data"""
    
    def __init__(self):
        self.scraper = LadderScraper()
    
    def update_ladder_from_web(self, db: Session, url: str = None) -> bool:
        """
        Fetch and update ladder data from the web
        
        Args:
            db: Database session
            url: Optional URL to scrape from
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info("Starting ladder update from web")
            
            # Fetch data from web
            if url:
                ladder_data = self.scraper.fetch_ladder_data(url)
            else:
                ladder_data = self.scraper.fetch_ladder_data()
            
            if not ladder_data:
                logger.warning("No ladder data received from scraper")
                return False
            
            # Clear existing data for today
            today = datetime.utcnow().date()
            db.query(LadderEntry).filter(
                LadderEntry.last_updated >= today,
                LadderEntry.last_updated < today + timedelta(days=1)
            ).delete()
            
            # Insert new data
            current_time = datetime.utcnow()
            
            for position, team_data in enumerate(ladder_data, 1):
                ladder_entry = LadderEntry(
                    team_name=team_data['team_name'],
                    position=position,
                    wins=team_data['wins'],
                    draws=team_data['draws'],
                    losses=team_data['losses'],
                    points_for=team_data.get('points_for', 0),
                    points_against=team_data.get('points_against', 0),
                    win_percentage=team_data['win_percentage'],
                    games_played=team_data['games_played'],
                    season=self._get_current_season(),
                    division=team_data.get('division'),
                    last_updated=current_time,
                    created_at=current_time
                )
                db.add(ladder_entry)
            
            db.commit()
            logger.info(f"Successfully updated ladder with {len(ladder_data)} teams")
            return True
            
        except Exception as e:
            logger.error(f"Error updating ladder from web: {e}")
            db.rollback()
            return False
    
    def get_latest_ladder(self, db: Session, limit: int = 10) -> List[LadderEntry]:
        """
        Get the latest ladder entries
        
        Args:
            db: Database session
            limit: Maximum number of entries to return
            
        Returns:
            List of LadderEntry objects
        """
        try:
            # Get the most recent update time
            latest_update = db.query(LadderEntry.last_updated).order_by(
                LadderEntry.last_updated.desc()
            ).first()
            
            if not latest_update:
                return []
            
            # Get all entries from the latest update
            ladder_entries = db.query(LadderEntry).filter(
                LadderEntry.last_updated == latest_update[0]
            ).order_by(LadderEntry.position).limit(limit).all()
            
            return ladder_entries
            
        except Exception as e:
            logger.error(f"Error fetching latest ladder: {e}")
            return []
    
    def get_team_position(self, db: Session, team_name: str) -> Optional[LadderEntry]:
        """
        Get position for a specific team
        
        Args:
            db: Database session
            team_name: Name of the team to find
            
        Returns:
            LadderEntry object if found, None otherwise
        """
        try:
            # Get the most recent update time
            latest_update = db.query(LadderEntry.last_updated).order_by(
                LadderEntry.last_updated.desc()
            ).first()
            
            if not latest_update:
                return None
            
            # Find the team in the latest ladder
            team_entry = db.query(LadderEntry).filter(
                LadderEntry.last_updated == latest_update[0],
                LadderEntry.team_name.ilike(f"%{team_name}%")
            ).first()
            
            return team_entry
            
        except Exception as e:
            logger.error(f"Error fetching team position for {team_name}: {e}")
            return None
    
    def _get_current_season(self) -> str:
        """Get current season string based on month"""
        now = datetime.utcnow()
        # Season determination: before July = Winter, July onwards = Spring
        if now.month < 7:  # January to June = Winter
            return f"{now.year} Winter"
        else:  # July to December = Spring
            return f"{now.year} Spring"
    
def scheduled_ladder_update():
    """Function to be called by scheduler"""
    logger.info("Starting scheduled ladder update")
    
    success = False
    db = None
    
    try:
        db = SessionLocal()
        service = LadderService()
        
        success = service.update_ladder_from_web(db)
        
        if success:
            logger.info("Scheduled ladder update completed successfully")
        else:
            logger.error("Scheduled ladder update failed")
            
    except Exception as e:
        logger.error(f"Error in scheduled ladder update: {e}")
        success = False
        
    finally:
        if db:
            db.close()
        
    return success