import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class LadderScraper:
    """Scraper for Waverley Basketball ladder data"""
    
    def __init__(self):
        self.base_url = "https://www.waverleybasketball.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def fetch_ladder_data(self, url: str = "https://www.waverleybasketball.com/ladders.aspx?sgid2=4947#ladders") -> List[Dict]:
        """
        Fetch ladder data from Waverley Basketball website
        
        Args:
            url: The URL to scrape ladder data from
            
        Returns:
            List of dictionaries containing team ladder information
        """
        try:
            logger.info(f"Fetching ladder data from: {url}")
            
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the ladder table - this might need adjustment based on actual HTML structure
            ladder_data = []
            
            # Extract division/grade from dropdown
            division = self._extract_grade_from_dropdown(soup)
            
            # Look for tables with ladder information
            tables = soup.find_all('table')
            
            for table in tables:
                # Check if this table contains ladder data
                headers = table.find_all('th') if table.find('thead') else table.find_all('td')
                
                if not headers:
                    continue
                    
                header_text = [th.get_text().strip().lower() for th in headers[:10]]  # First 10 headers
                
                # Check if this looks like a ladder table
                if any(keyword in ' '.join(header_text) for keyword in ['team', 'win', 'loss', 'draw', '%']):
                    logger.info("Found potential ladder table")
                    ladder_data = self._parse_ladder_table(table)
                    if ladder_data:
                        break
            
            # Add division info to each team entry
            if ladder_data and division:
                for team_data in ladder_data:
                    team_data['division'] = division
            
            logger.info(f"Successfully parsed {len(ladder_data)} teams from ladder (Division: {division})")
            return ladder_data
            
        except requests.RequestException as e:
            logger.error(f"Network error fetching ladder data: {e}")
            raise Exception(f"Failed to fetch ladder data: {e}")
        except Exception as e:
            logger.error(f"Error parsing ladder data: {e}")
            raise Exception(f"Failed to parse ladder data: {e}")
    
    def _parse_ladder_table(self, table) -> List[Dict]:
        """Parse ladder data from a table element"""
        ladder_data = []
        
        try:
            rows = table.find_all('tr')
            if len(rows) < 2:  # Need at least header + 1 data row
                return []
            
            # Get headers
            header_row = rows[0]
            headers = [th.get_text().strip().lower() for th in header_row.find_all(['th', 'td'])]
            
            logger.info(f"Table headers: {headers}")
            
            # Parse data rows
            for row in rows[1:]:
                cells = row.find_all(['td', 'th'])
                if len(cells) < 4:  # Need minimum columns
                    continue
                
                cell_values = [cell.get_text().strip() for cell in cells]
                
                # Try to map columns to our data structure
                team_data = self._map_row_data(headers, cell_values)
                if team_data and team_data.get('team_name'):
                    ladder_data.append(team_data)
            
            return ladder_data
            
        except Exception as e:
            logger.error(f"Error parsing table: {e}")
            return []
    
    def _map_row_data(self, headers: List[str], values: List[str]) -> Optional[Dict]:
        """Map table row data to our ladder structure"""
        try:
            team_data = {
                'team_name': '',
                'position': 0,
                'wins': 0,
                'draws': 0,
                'losses': 0,
                'points_for': 0,
                'points_against': 0,
                'win_percentage': 0.0,
                'games_played': 0
            }
            
            for i, header in enumerate(headers):
                if i >= len(values):
                    break
                    
                value = values[i].strip()
                
                # Map common column names
                if 'team' in header or 'club' in header:
                    team_data['team_name'] = value
                elif header in ['w', 'win', 'wins']:
                    team_data['wins'] = self._safe_int(value)
                elif header in ['d', 'draw', 'draws', 'tie', 'ties']:
                    team_data['draws'] = self._safe_int(value)
                elif header in ['l', 'loss', 'losses', 'lose']:
                    team_data['losses'] = self._safe_int(value)
                elif header in ['%', 'win%', 'percentage', 'pct']:
                    team_data['win_percentage'] = self._safe_float(value.replace('%', '')) / 100
                elif 'for' in header or 'pf' in header:
                    team_data['points_for'] = self._safe_int(value)
                elif 'against' in header or 'pa' in header:
                    team_data['points_against'] = self._safe_int(value)
                elif 'played' in header or 'gp' in header or 'games' in header:
                    team_data['games_played'] = self._safe_int(value)
            
            # Calculate games played if not provided
            if team_data['games_played'] == 0:
                team_data['games_played'] = team_data['wins'] + team_data['draws'] + team_data['losses']
            
            # Calculate win percentage if not provided
            if team_data['win_percentage'] == 0.0 and team_data['games_played'] > 0:
                team_data['win_percentage'] = (team_data['wins'] + team_data['draws'] * 0.5) / team_data['games_played']
            
            return team_data if team_data['team_name'] else None
            
        except Exception as e:
            logger.error(f"Error mapping row data: {e}")
            return None
    
    def _safe_int(self, value: str) -> int:
        """Safely convert string to int"""
        try:
            # Remove any non-numeric characters except negative sign
            clean_value = re.sub(r'[^\d-]', '', value)
            return int(clean_value) if clean_value else 0
        except:
            return 0
    
    def _safe_float(self, value: str) -> float:
        """Safely convert string to float"""
        try:
            # Remove any non-numeric characters except decimal point and negative sign
            clean_value = re.sub(r'[^\d.-]', '', value)
            return float(clean_value) if clean_value else 0.0
        except:
            return 0.0
    
    def _extract_grade_from_dropdown(self, soup) -> Optional[str]:
        """Extract the selected grade/division from dropdown box"""
        try:
            # Look for select elements that might contain grade/division info
            select_elements = soup.find_all('select')
            
            for select in select_elements:
                # Check if this select contains grade/division options
                select_id = select.get('id', '').lower()
                select_name = select.get('name', '').lower()
                
                if any(keyword in select_id or keyword in select_name 
                       for keyword in ['grade', 'division', 'section', 'comp']):
                    
                    # Find the selected option
                    selected_option = select.find('option', selected=True)
                    if selected_option:
                        grade_text = selected_option.get_text().strip()
                        logger.info(f"Found selected grade: {grade_text}")
                        return grade_text
                    
                    # If no selected option found, look for options and try to determine context
                    options = select.find_all('option')
                    if options:
                        # Sometimes the first non-empty option might be selected
                        for option in options:
                            option_text = option.get_text().strip()
                            if option_text and option_text.lower() not in ['select', 'choose', '']:
                                logger.info(f"Found first grade option: {option_text}")
                                return option_text
            
            logger.warning("Could not find grade/division information")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting grade from dropdown: {e}")
            return None

# Display function
def display_ladder():
    """Display the current ladder from Waverley Basketball"""
    scraper = LadderScraper()
    try:
        print("🕷️  Fetching ladder data from Waverley Basketball...")
        data = scraper.fetch_ladder_data()
        
        if data:
            print(f"✅ Successfully scraped {len(data)} teams:")
            print()
            for i, team in enumerate(data, 1):
                print(f"  {i:2}. {team['team_name']:<20} {team['wins']:2}-{team['draws']:2}-{team['losses']:2} ({team['win_percentage']:5.1%})")
        else:
            print("❌ No ladder data found")
            
        return data
    except Exception as e:
        print(f"❌ Error fetching ladder: {e}")
        return []
