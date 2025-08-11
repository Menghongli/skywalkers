import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import re
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

class FixturesScraper:
    """Scraper for Waverley Basketball fixtures data"""
    
    def __init__(self):
        self.base_url = "https://www.waverleybasketball.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def fetch_fixtures_data(self, url: str = "https://www.waverleybasketball.com/fixtures.aspx?sgid2=4947&tid=7271#fixtures") -> List[Dict]:
        """
        Fetch fixtures data from Waverley Basketball website
        
        Args:
            url: The URL to scrape fixtures data from
            
        Returns:
            List of dictionaries containing game fixture information
        """
        try:
            logger.info(f"Fetching fixtures data from: {url}")
            
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            fixtures_data = []
            
            # Look for fixtures tables
            tables = soup.find_all('table')
            
            for table in tables:
                # Check if this table contains fixture data by looking for typical fixture headers
                headers = []
                first_row = table.find('tr')
                if first_row:
                    headers = [td.get_text(strip=True).lower() for td in first_row.find_all(['th', 'td'])]
                
                logger.info(f"Found potential fixtures table with headers: {headers}")
                
                # Extract fixture data from this table
                table_fixtures = self._extract_fixtures_from_table(table)
                fixtures_data.extend(table_fixtures)
            
            
            logger.info(f"Successfully extracted {len(fixtures_data)} fixtures")
            return fixtures_data
            
        except requests.RequestException as e:
            logger.error(f"Network error fetching fixtures: {e}")
            raise
        except Exception as e:
            logger.error(f"Error parsing fixtures data: {e}")
            raise
    
    def _extract_fixtures_from_table(self, table) -> List[Dict]:
        """Extract fixtures data from a table element with 'Time & Venue' and 'Versus' columns"""
        fixtures = []
        rows = table.find_all('tr')
        
        # Find header row to identify column positions
        header_row = None
        time_venue_col = -1
        versus_col = -1
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) >= 2:
                cell_texts = [cell.get_text(strip=True).lower() for cell in cells]
                
                # Look for "Time & Venue" and "Versus" columns
                for i, text in enumerate(cell_texts):
                    if 'time' in text and 'venue' in text:
                        time_venue_col = i
                        header_row = row
                    elif 'versus' in text or 'vs' in text:
                        versus_col = i
                        header_row = row
                
                if time_venue_col >= 0 and versus_col >= 0:
                    break
        
        if time_venue_col == -1 or versus_col == -1:
            logger.warning("Could not find 'Time & Venue' and 'Versus' columns")
            return fixtures
        
        # Process data rows (skip header)
        start_index = rows.index(header_row) + 1 if header_row else 0
        data_rows = rows[start_index:]
        
        for row in data_rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) <= max(time_venue_col, versus_col):
                continue
                
            try:
                fixture = self._parse_two_column_fixture(cells, time_venue_col, versus_col)
                if fixture:
                    fixtures.append(fixture)
            except Exception as e:
                logger.warning(f"Failed to parse fixture row: {e}")
                continue
        
        return fixtures
    
    def _parse_two_column_fixture(self, cells, time_venue_col: int, versus_col: int) -> Optional[Dict]:
        """Parse fixture from two-column format: 'Time & Venue' and 'Versus'"""
        try:
            time_venue_text = cells[time_venue_col].get_text(strip=True)
            versus_text = cells[versus_col].get_text(strip=True)
            
            if not time_venue_text or not versus_text:
                return None
            
            fixture = {
                'date': None,
                'opponent_name': None,
                'venue': None,
                'time': None,
            }
            
            # Parse time & venue column
            # Look for date pattern first
            date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+\w+\s+\d{2,4}'
            date_match = re.search(date_pattern, time_venue_text, re.IGNORECASE)
            if date_match:
                fixture['date'] = self._parse_date(date_match.group())
            
            # Look for time
            time_pattern = r'\d{1,2}:\d{2}\s*(?:am|pm)?'
            time_match = re.search(time_pattern, time_venue_text, re.IGNORECASE)
            if time_match:
                fixture['time'] = time_match.group()
            
            # Look for venue (remaining text after removing date and time)
            venue_text = time_venue_text
            if date_match:
                venue_text = venue_text.replace(date_match.group(), '')
            if time_match:
                venue_text = venue_text.replace(time_match.group(), '')
            
            # Clean up venue text
            venue_text = re.sub(r'[,-]+', ' ', venue_text).strip()
            if venue_text and len(venue_text) > 2:
                fixture['venue'] = venue_text
            
            # Parse versus column
            fixture['opponent_name'] = versus_text.strip()
            
            return fixture
            
        except Exception as e:
            logger.warning(f"Error parsing two-column fixture: {e}")
            return None
    
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats into ISO format"""
        date_str = date_str.strip()
        
        date_format = "%d %b %Y"
        parsed_date = datetime.strptime(date_str, date_format).date()
        return parsed_date.isoformat()
    
    
def display_fixtures():
    """Display the upcoming fixtures from Waverley Basketball"""
    try:
        print("🕷️  Fetching fixtures data from Waverley Basketball...")
        print("    URL: https://www.waverleybasketball.com/fixtures.aspx?sgid2=4947&tid=7271#fixtures")
        print()
        
        scraper = FixturesScraper()
        data = scraper.fetch_fixtures_data()
        
        if data:
            print(f"✅ Successfully scraped {len(data)} fixtures:")
            print()
            
            for i, fixture in enumerate(data, 1):
                opponent = fixture.get('opponent_name', 'Unknown')
                date_str = fixture.get('date', 'Unknown date')
                venue = fixture.get('venue', '')
                time_str = fixture.get('time', '')
                
                venue_info = f" at {venue}" if venue else ""
                time_info = f" {time_str}" if time_str else ""
                
                print(f"  {i:2}. {date_str:<12} vs {opponent:<25}{time_info}{venue_info}")
        else:
            print("❌ No fixtures data found")
            
        return 0  # Success exit code
    except Exception as e:
        print(f"❌ Error fetching fixtures: {e}")
        return 1  # Error exit code
