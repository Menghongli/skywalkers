from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List, Optional
import logging
import re

from ..models.game import Game
from ..database import SessionLocal
from .fixtures_scraper import FixturesScraper

logger = logging.getLogger(__name__)

class FixturesService:
    """Service for managing fixtures data"""
    
    def __init__(self):
        self.scraper = FixturesScraper()
    
    def _parse_datetime_from_fixture(self, fixture_data: dict) -> Optional[datetime]:
        """Parse date and time from fixture data into a single datetime object"""
        try:
            # Parse the date
            date_str = fixture_data.get('date')
            if not date_str:
                logger.warning("No date found in fixture data")
                return None
            
            game_date = datetime.fromisoformat(date_str).date()
            
            # Parse time if available
            time_str = fixture_data.get('time').strip()
                
            time_format = '%H:%M'
            time_obj = datetime.strptime(time_str, time_format).time()
            # Combine with the game date
            return datetime.combine(game_date, time_obj)
            
        except Exception as e:
            logger.error(f"Error parsing datetime from fixture: {e}")
            return None
    
    def update_fixtures_from_web(self, db: Session, url: str = None) -> dict:
        """
        Fetch and update fixtures data from the web
        
        Args:
            db: Database session
            url: Optional URL to scrape from
            
        Returns:
            dict: Summary of the update operation
        """
        try:
            logger.info("Starting fixtures update from web")
            
            # Fetch data from web
            if url:
                fixtures_data = self.scraper.fetch_fixtures_data(url)
            else:
                fixtures_data = self.scraper.fetch_fixtures_data()
            
            if not fixtures_data:
                logger.warning("No fixtures data received from scraper")
                return {
                    'success': False,
                    'message': 'No fixtures data found',
                    'created': 0,
                    'updated': 0,
                    'skipped': 0
                }
            
            logger.info(f"Found {len(fixtures_data)} upcoming fixtures")
            
            created_count = 0
            updated_count = 0
            skipped_count = 0
            
            for fixture_data in fixtures_data:
                try:
                    result = self._process_fixture(db, fixture_data)
                    if result == 'created':
                        created_count += 1
                    elif result == 'updated':
                        updated_count += 1
                    else:
                        skipped_count += 1
                        
                except Exception as e:
                    logger.error(f"Error processing fixture {fixture_data}: {e}")
                    skipped_count += 1
                    continue
            
            db.commit()
            
            logger.info(f"Fixtures update completed - Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}")
            
            return {
                'success': True,
                'message': f'Successfully processed {len(fixtures_data)} fixtures',
                'created': created_count,
                'updated': updated_count,
                'skipped': skipped_count,
                'total_processed': len(fixtures_data)
            }
            
        except Exception as e:
            logger.error(f"Error updating fixtures from web: {e}")
            db.rollback()
            return {
                'success': False,
                'message': f'Error updating fixtures: {str(e)}',
                'created': 0,
                'updated': 0,
                'skipped': 0
            }
    
    def _process_fixture(self, db: Session, fixture_data: dict) -> str:
        """
        Process a single fixture and create/update game record
        
        Args:
            db: Database session
            fixture_data: Dictionary containing fixture information
            
        Returns:
            str: 'created', 'updated', or 'skipped'
        """
        try:
            # Parse datetime from fixture data
            game_datetime = self._parse_datetime_from_fixture(fixture_data)
            opponent_name = fixture_data.get('opponent_name')
            
            if not game_datetime:
                logger.warning(f"Could not parse datetime for fixture: {fixture_data}")
                return 'skipped'
                
            if not opponent_name:
                logger.warning(f"No opponent name found for fixture: {fixture_data}")
                return 'skipped'
            
            # Check if a game already exists for this date and opponent
            game_date = game_datetime.date()
            existing_game = db.query(Game).filter(
                Game.datetime >= datetime.combine(game_date, datetime.min.time()),
                Game.datetime < datetime.combine(game_date + timedelta(days=1), datetime.min.time()),
                Game.opponent_name.ilike(f"%{opponent_name}%")
            ).first()
            
            if existing_game:
                # Update existing game if needed
                updated = False
                
                # Only update if the existing game doesn't have scores (is upcoming)
                if existing_game.final_score_skywalkers is None and existing_game.final_score_opponent is None:
                    # Update opponent name if it's more complete
                    if len(opponent_name) > len(existing_game.opponent_name or ''):
                        existing_game.opponent_name = opponent_name
                        updated = True
                    
                    # Update datetime if the new one has more precise time
                    if (existing_game.datetime.time() == datetime.min.time().replace(hour=12) and 
                        game_datetime.time() != datetime.min.time().replace(hour=12)):
                        existing_game.datetime = game_datetime
                        updated = True
                    
                    # Update venue if we have it and existing game doesn't
                    if fixture_data.get('venue') and not existing_game.venue:
                        existing_game.venue = fixture_data.get('venue')
                        updated = True
                
                if updated:
                    logger.info(f"Updated existing game: {existing_game.opponent_name} on {existing_game.datetime}")
                    return 'updated'
                else:
                    logger.info(f"Skipped existing game: {existing_game.opponent_name} on {existing_game.datetime}")
                    return 'skipped'
            else:
                # Create new game
                new_game = Game(
                    opponent_name=opponent_name,
                    datetime=game_datetime,                   # Combined date and time
                    venue=fixture_data.get('venue'),          # Add venue from fixtures
                    final_score_skywalkers=None,              # Will be filled in later
                    final_score_opponent=None,                # Will be filled in later
                    video_url=None                            # Will be filled in later if available
                )
                
                db.add(new_game)
                logger.info(f"Created new game: {opponent_name} on {game_datetime}")
                return 'created'
                
        except Exception as e:
            logger.error(f"Error processing fixture {fixture_data}: {e}")
            raise
    
    def get_upcoming_games_from_db(self, db: Session, limit: int = 10) -> List[Game]:
        """
        Get upcoming games from database
        
        Args:
            db: Database session
            limit: Maximum number of games to return
            
        Returns:
            List of upcoming Game objects
        """
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        upcoming_games = db.query(Game).filter(
            Game.datetime >= today_start,
            Game.final_score_skywalkers.is_(None),
            Game.final_score_opponent.is_(None)
        ).order_by(Game.datetime.asc()).limit(limit).all()
        
        return upcoming_games
    
    def get_all_upcoming_fixtures(self, db: Session) -> List[dict]:
        """
        Get all upcoming fixtures with additional metadata
        
        Args:
            db: Database session
            
        Returns:
            List of dictionaries containing fixture information
        """
        upcoming_games = self.get_upcoming_games_from_db(db)
        
        fixtures = []
        for game in upcoming_games:
            game_date = game.datetime.date()
            fixture = {
                'id': game.id,
                'opponent_name': game.opponent_name,
                'date': game_date.isoformat(),
                'datetime': game.datetime.isoformat(),
                'venue': game.venue,
                'is_today': game_date == date.today(),
                'days_until': (game_date - date.today()).days,
                'has_scores': game.final_score_skywalkers is not None and game.final_score_opponent is not None
            }
            fixtures.append(fixture)
        
        return fixtures

def scheduled_fixtures_update():
    """
    Function to be called by the scheduler for automatic fixtures updates
    """
    logger.info("Running scheduled fixtures update")
    
    db = SessionLocal()
    try:
        service = FixturesService()
        result = service.update_fixtures_from_web(db)
        
        if result['success']:
            logger.info(f"Scheduled fixtures update completed successfully: {result['message']}")
        else:
            logger.error(f"Scheduled fixtures update failed: {result['message']}")
            
        return result
        
    except Exception as e:
        logger.error(f"Error in scheduled fixtures update: {e}")
        return {
            'success': False,
            'message': f'Scheduled update failed: {str(e)}',
            'created': 0,
            'updated': 0,
            'skipped': 0
        }
    finally:
        db.close()