from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..database import get_db
from ..dependencies import get_current_manager
from ..models import User
from ..services.stats_scraper_service import stats_scraper_service

router = APIRouter(prefix="/stats", tags=["stats-scraper"])

@router.post("/fetch-game-stats")
async def fetch_game_stats(
    url_data: dict,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_manager)
):
    """
    Fetch game stats from external URL and optionally save to database
    """
    try:
        url = url_data.get("url")
        cookie_value = url_data.get("cookies")  # Still named 'cookies' for frontend compatibility
        game_id = url_data.get("game_id")  # Optional game ID to save stats to
        save_to_db = url_data.get("save_to_db", False)  # Whether to save to database
        
        if not url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URL is required"
            )

        # If save_to_db is requested but no game_id provided, return error
        if save_to_db and not game_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="game_id is required when save_to_db is true"
            )

        # Use the appropriate method based on whether we need to save to DB
        if save_to_db and game_id:
            stats_data = stats_scraper_service.fetch_and_save_stats(url, game_id, cookie_value, db)
            message = "Stats fetched and saved to database successfully"
        else:
            stats_data = stats_scraper_service.fetch_stats_from_url(url, cookie_value)
            message = "Stats fetched successfully"

        return {
            "message": message,
            "data": stats_data
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing stats: {str(e)}"
        )