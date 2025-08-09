import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional, List
import logging
from sqlalchemy.orm import Session
from ..models import Player, Game, PlayerGameStats
from ..database import get_db

logger = logging.getLogger(__name__)

class StatsScraperService:
    """Service for scraping game stats from external websites"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
    
    def fetch_stats_from_url(self, url: str, cookie_value: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch game stats from the provided URL
        
        Args:
            url: The URL to scrape stats from
            cookie_value: The value for the 'iframewba' cookie
            
        Returns:
            Dictionary containing scraped stats data
            
        Raises:
            requests.RequestException: If the HTTP request fails
            ValueError: If the required stats cell is not found
        """
        try:
            # Set the iframewba cookie with provided value
            cookies = {}
            if cookie_value and cookie_value.strip():
                cookies['iframewba'] = cookie_value.strip()
                logger.info("Added iframewba cookie")
            else:
                logger.warning("No cookie value provided - request may fail if authentication is required")
            
            logger.info(f"Fetching stats from URL: {url}")
            
            # Make request with the cookie and headers
            response = requests.get(
                url, 
                cookies=cookies, 
                headers=self.headers, 
                timeout=30,
                allow_redirects=True
            )
            response.raise_for_status()
            
            logger.info(f"Successfully fetched page, status code: {response.status_code}")
            
            # Parse HTML content
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the specific cell with stats by looking for cell_info with SKYWALKERS heading
            stats_cell = None
            skywalkers_container = None
            
            # Find all cell_info containers
            cell_info_containers = soup.find_all(class_='cell_info')
            logger.info(f"Found {len(cell_info_containers)} cell_info containers")
            
            # Look for the one that contains "SKYWALKERS" in a cell_heading
            for container in cell_info_containers:
                cell_heading = container.find(class_='cell_heading')
                if cell_heading and 'SKYWALKERS' in cell_heading.get_text().upper():
                    skywalkers_container = container
                    logger.info("Found cell_info container with SKYWALKERS heading")
                    break
            
            if skywalkers_container:
                # Find all tables inside the SKYWALKERS container
                tables = skywalkers_container.find_all('table')
                logger.info(f"Found {len(tables)} tables inside SKYWALKERS container")
                
                # Look for cell_stats_title in the 2nd table (index 1)
                if len(tables) >= 2:
                    second_table = tables[1]
                    stats_cell = second_table.find(class_='cell_stats_title')
                    if stats_cell:
                        logger.info("Found cell_stats_title in the 2nd table inside SKYWALKERS container")
                    else:
                        logger.warning("cell_stats_title not found in the 2nd table")
                else:
                    logger.warning(f"Expected at least 2 tables in SKYWALKERS container, but found {len(tables)}")
            
            # Fallback: try to find cell_stats_title in any cell_info container
            if not stats_cell:
                logger.info("Trying fallback: looking for cell_stats_title in any cell_info container")
                for container in cell_info_containers:
                    stats_cell = container.find(class_='cell_stats_title')
                    if stats_cell:
                        logger.info("Found cell_stats_title in fallback search")
                        break
            
            # Last fallback: try to find cell_stats_title anywhere on the page
            if not stats_cell:
                stats_cell = soup.find(class_='cell_stats_title')
                if stats_cell:
                    logger.info("Found cell_stats_title outside cell_info containers")
            
            if not stats_cell:
                logger.warning("Stats cell with class 'cell_stats_title' not found on the page")
                # Log available classes and headings for debugging
                all_classes = set()
                headings = []
                for element in soup.find_all(class_=True):
                    all_classes.update(element.get('class', []))
                for heading in soup.find_all(class_='cell_heading'):
                    headings.append(heading.get_text().strip())
                
                logger.info(f"Available classes on page: {sorted(list(all_classes))[:20]}...")
                logger.info(f"Found headings: {headings}")
                raise ValueError("Stats cell not found on the page")
            
            # Parse player statistics from the stats cell
            player_stats = self._parse_player_stats(stats_cell)
            
            # Build the base stats data
            stats_data = {
                "url": url,
                "success": True,
                "timestamp": response.headers.get('Date', 'Unknown'),
                "player_stats": player_stats
            }
            
            return stats_data
            
        except requests.Timeout:
            logger.error(f"Timeout while fetching URL: {url}")
            raise requests.RequestException("Request timed out")
        except requests.RequestException as e:
            logger.error(f"Request error while fetching {url}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error while processing {url}: {str(e)}")
            raise
    
    def _parse_player_stats(self, stats_cell) -> Dict[str, Dict[str, int]]:
        """
        Parse player statistics from the stats cell
        
        Returns:
            Dictionary with player names as keys and stats as values
            Example: {"Player Name": {"points": 10, "fouls": 2}}
        """
        player_stats = {}
        
        try:
            # Look for a table containing the stats cell or find the parent table
            parent_table = stats_cell.find_parent('table')
            if not parent_table:
                logger.warning("No parent table found for stats cell")
                return player_stats
            
            # Find all rows in the table
            rows = parent_table.find_all('tr')
            logger.info(f"Found {len(rows)} rows in stats table")
            
            # Set column positions
            stats_col = 1
            name_col = 0  # Assume first column is player name
            
            for row in rows:
                cells = row.find_all(['th', 'td'])
                if not cells:
                    continue
                
            # Parse data rows
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if not cells or len(cells) < max(name_col + 1, stats_col + 1):
                    continue
                
                # Extract player name
                name_cell = cells[name_col] if name_col < len(cells) else None
                if not name_cell:
                    continue
                
                player_name = name_cell.get_text().strip(":")
                logger.info(f"Found player: {player_name}")
                
                # Extract points and fouls
                points = -1
                fouls = -1
                
                stats = cells[stats_col].get_text().strip().split(",")
                for stat in stats:
                    if "point" in stat:
                        points = int(stat.split()[0])
                    elif "foul" in stat:
                        fouls = int(stat.split()[0])

                # Add player stats if we have valid data
                if player_name and (points >= 0 or fouls >= 0):
                    player_stats[player_name] = {
                        "points": points,
                        "fouls": fouls
                    }
                    logger.info(f"Added player: {player_name} - Points: {points}, Fouls: {fouls}")
            
            logger.info(f"Successfully parsed stats for {len(player_stats)} players")
            
        except Exception as e:
            logger.error(f"Error parsing player stats: {str(e)}")
        
        return player_stats

    def save_player_stats_to_db(self, player_stats: Dict[str, Dict[str, int]], game_id: int, db: Session, source_url: str = None) -> List[PlayerGameStats]:
        """
        Save scraped player stats to the database
        
        Args:
            player_stats: Dictionary with player names as keys and stats as values
            game_id: ID of the game these stats belong to
            db: Database session
            
        Returns:
            List of created PlayerGameStats objects
        """
        saved_stats = []
        
        try:
            for player_name, stats in player_stats.items():
                # Find or create player (idempotent by name)
                player = db.query(Player).filter(Player.name == player_name).first()
                
                if not player:
                    # Create new player if doesn't exist
                    # Generate jersey number (simple approach: max + 1)
                    max_jersey = db.query(Player).order_by(Player.jersey_number.desc()).first()
                    new_jersey = (max_jersey.jersey_number + 1) if max_jersey else 1
                    
                    player = Player(
                        name=player_name,
                        jersey_number=new_jersey,
                        position="Unknown",
                        is_active=1
                    )
                    db.add(player)
                    db.commit()
                    db.refresh(player)
                    logger.info(f"Created new player: {player_name} with jersey #{new_jersey}")
                else:
                    logger.debug(f"Found existing player: {player_name} (ID: {player.id}, Jersey: #{player.jersey_number})")
                
                # Check if stats already exist for this player and game
                existing_stats = db.query(PlayerGameStats).filter(
                    PlayerGameStats.player_id == player.id,
                    PlayerGameStats.game_id == game_id
                ).first()
                
                # Prepare stats values
                new_points = stats.get('points', 0) if stats.get('points', -1) >= 0 else 0
                new_fouls = stats.get('fouls', 0) if stats.get('fouls', -1) >= 0 else 0
                
                if existing_stats:
                    # Update existing stats (idempotent operation)
                    old_points = existing_stats.points
                    old_fouls = existing_stats.fouls
                    
                    existing_stats.points = new_points
                    existing_stats.fouls = new_fouls
                    existing_stats.is_scraped = True
                    existing_stats.is_verified = False  # Reset verification when updated
                    existing_stats.verified_at = None
                    existing_stats.verified_by = None
                    if source_url:
                        existing_stats.scrape_source = source_url
                    
                    saved_stats.append(existing_stats)
                    
                    # Log idempotent update
                    if old_points == new_points and old_fouls == new_fouls:
                        logger.info(f"Idempotent update for {player_name}: Stats unchanged (Points={new_points}, Fouls={new_fouls})")
                    else:
                        logger.info(f"Updated stats for {player_name}: Points {old_points}→{new_points}, Fouls {old_fouls}→{new_fouls}")
                else:
                    # Create new stats record
                    player_game_stats = PlayerGameStats(
                        player_id=player.id,
                        game_id=game_id,
                        points=new_points,
                        fouls=new_fouls,
                        is_scraped=True,
                        is_verified=False,
                        scrape_source=source_url
                    )
                    db.add(player_game_stats)
                    saved_stats.append(player_game_stats)
                    logger.info(f"Created new stats for {player_name}: Points={new_points}, Fouls={new_fouls}")
            
            db.commit()
            
            # Refresh all objects to get updated data
            for stats_obj in saved_stats:
                db.refresh(stats_obj)
            
            logger.info(f"Successfully processed stats for {len(saved_stats)} players to database (idempotent operation)")
            return saved_stats
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving player stats to database: {str(e)}")
            raise

    def fetch_and_save_stats(self, url: str, game_id: int, cookie_value: Optional[str] = None, db: Session = None) -> Dict[str, Any]:
        """
        Fetch stats from URL and save to database
        
        Args:
            url: The URL to scrape stats from
            game_id: ID of the game to associate stats with
            cookie_value: The value for the 'iframewba' cookie
            db: Database session
            
        Returns:
            Dictionary containing scraped stats data and saved records info
        """
        # First fetch the stats
        stats_data = self.fetch_stats_from_url(url, cookie_value)
        
        if db and stats_data.get('player_stats'):
            try:
                # Save to database
                saved_stats = self.save_player_stats_to_db(
                    stats_data['player_stats'], 
                    game_id, 
                    db,
                    url
                )
                
                # Add database info to response
                stats_data['saved_to_db'] = True
                stats_data['saved_records_count'] = len(saved_stats)
                stats_data['saved_records'] = [
                    {
                        'id': stat.id,
                        'player_name': stat.player.name,
                        'points': stat.points,
                        'fouls': stat.fouls
                    } for stat in saved_stats
                ]
                
            except Exception as e:
                stats_data['saved_to_db'] = False
                stats_data['save_error'] = str(e)
                logger.error(f"Failed to save stats to database: {str(e)}")
        else:
            stats_data['saved_to_db'] = False
            stats_data['save_error'] = "No database session provided or no player stats found"
        
        return stats_data

# Create a singleton instance
stats_scraper_service = StatsScraperService()