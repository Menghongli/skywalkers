import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fixturesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useGames } from '../contexts/GamesContext';
import { formatGameDateTime } from '../utils/dateUtils';

interface UpcomingGamesProps {
  onViewAll: () => void;
  onAddFirstGame?: () => void;
}

const UpcomingGames: React.FC<UpcomingGamesProps> = ({ onViewAll, onAddFirstGame }) => {
  const { upcomingGames: allUpcomingGames, loading, error, refreshGames } = useGames();
  const [fetchingFixtures, setFetchingFixtures] = useState(false);
  const [fixturesSuccess, setFixturesSuccess] = useState<string | null>(null);
  const [fixturesError, setFixturesError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Get next 5 upcoming games for dashboard widget
  const games = allUpcomingGames.slice(0, 5);

  const isGameToday = (dateTime: Date) => {
    const today = new Date(); // Create a Date object for the current moment

    // Compare the year, month, and day of the two Date objects
    return dateTime.getDate() === today.getDate() &&
         dateTime.getMonth() === today.getMonth() &&
         dateTime.getFullYear() === today.getFullYear();
  };

  const handleFetchFixtures = async () => {
    try {
      setFetchingFixtures(true);
      setFixturesError(null);
      setFixturesSuccess(null);
      
      await fixturesAPI.updateFixtures();
      setFixturesSuccess('Fixtures update started! Refreshing games...');
      
      // Refresh the games data after a short delay
      setTimeout(() => {
        refreshGames();
        setFixturesSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setFixturesError(err.response?.data?.detail || 'Failed to fetch fixtures');
      console.error('Error fetching fixtures:', err);
    } finally {
      setFetchingFixtures(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="upcoming-games-widget">
      {/* Game Count Summary */}
      <div className="games-stats">
        <div className="stat-item">
          <span className="stat-number upcoming">{allUpcomingGames.length}</span>
          <span className="stat-label">{allUpcomingGames.length === 1 ? 'Game' : 'Games'} Scheduled</span>
        </div>
      </div>

      {/* Fetch Fixtures Success Message */}
      {fixturesSuccess && (
        <div className="success-message">
          <span style={{ fontSize: '14px', marginRight: '8px' }}>✅</span>
          {fixturesSuccess}
        </div>
      )}

      {/* Fetch Fixtures Error Message */}
      {fixturesError && (
        <div className="error-message">
          {fixturesError}
        </div>
      )}

      {/* Upcoming Games List */}
      {allUpcomingGames.length === 0 ? (
        <div className="no-upcoming-games">
          <p>No upcoming games scheduled.</p>
          {isAuthenticated && (
            <button onClick={onAddFirstGame || onViewAll} className="btn-primary">
              Schedule Game
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="game-stats-table three-column">
            <div className="game-stats-header">
              <div>Opponent</div>
              <div>Date & Time</div>
              <div>Venue</div>
            </div>
            {games.map((game) => (
              <div
                key={game.id}
                className={`game-stats-row ${isGameToday(game.datetime) ? 'today-game' : ''}`}
                onClick={() => navigate(`/games/${game.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="game-stats-player-name">{game.opponent_name}</div>
                <div className="game-stat right-align">
                  {formatGameDateTime(game.datetime)}
                  {isGameToday(game.datetime) && (
                    <span className="today-indicator" style={{ marginLeft: '8px' }}>🏀</span>
                  )}
                </div>
                <div className="game-stat">{game.venue || 'TBD'}</div>
              </div>
            ))}
          </div>
            
          <button onClick={() => { onViewAll(); navigate('/games?tab=upcoming'); }} className="btn-primary view-all-btn">
            {allUpcomingGames.length > 5 ? `View All ${allUpcomingGames.length} Upcoming Games` : 'View All Upcoming Games'}
          </button>
        </>
      )}

      {/* Fetch Fixtures Button - Always show for authenticated users */}
      {isAuthenticated && (
        <button 
          onClick={handleFetchFixtures} 
          disabled={fetchingFixtures || loading}
          className="btn-secondary"
          style={{ marginTop: '16px', width: '100%' }}
        >
          {fetchingFixtures ? (
            <>
              <span style={{ 
                display: 'inline-block', 
                marginRight: '8px',
                animation: 'spin 1s linear infinite'
              }}>
                ⟳
              </span>
              Fetching Fixtures...
            </>
          ) : (
            'Fetch Latest Fixtures'
          )}
        </button>
      )}
    </div>
  );
};

export default UpcomingGames;