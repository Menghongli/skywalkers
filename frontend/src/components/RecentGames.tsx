import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Game, gamesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RecentGamesProps {
  onViewAll: () => void;
}

const RecentGames: React.FC<RecentGamesProps> = ({ onViewAll }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isManager } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentGames();
  }, []);

  const fetchRecentGames = async () => {
    try {
      setLoading(true);
      const allGames = await gamesAPI.getAll();
      // Get the 5 most recent games
      const recentGames = allGames.slice(0, 5);
      setGames(recentGames);
    } catch (err) {
      setError('Failed to load recent games');
      console.error('Error fetching recent games:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const gamesWithScores = games.filter(
      game => game.final_score_skywalkers !== undefined && game.final_score_opponent !== undefined
    );
    
    let wins = 0;
    let losses = 0;
    let ties = 0;
    
    gamesWithScores.forEach(game => {
      if (game.final_score_skywalkers! > game.final_score_opponent!) {
        wins++;
      } else if (game.final_score_skywalkers! < game.final_score_opponent!) {
        losses++;
      } else {
        ties++;
      }
    });
    
    return { wins, losses, ties, total: gamesWithScores.length };
  };

  const formatScore = (skywalkers?: number, opponent?: number) => {
    if (skywalkers === undefined || opponent === undefined) {
      return 'TBD';
    }
    return `${skywalkers}-${opponent}`;
  };

  const getGameResult = (skywalkers?: number, opponent?: number) => {
    if (skywalkers === undefined || opponent === undefined) return '';
    if (skywalkers > opponent) return 'W';
    if (skywalkers < opponent) return 'L';
    return 'T';
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const stats = calculateStats();

  return (
    <div className="recent-games-widget">
      {/* Quick Stats */}
      <div className="games-stats">
        <div className="stat-item">
          <span className="stat-number wins">{stats.wins}</span>
          <span className="stat-label">Wins</span>
        </div>
        <div className="stat-item">
          <span className="stat-number losses">{stats.losses}</span>
          <span className="stat-label">Losses</span>
        </div>
        {stats.ties > 0 && (
          <div className="stat-item">
            <span className="stat-number ties">{stats.ties}</span>
            <span className="stat-label">Ties</span>
          </div>
        )}
      </div>

      {/* Recent Games List */}
      {games.length === 0 ? (
        <div className="no-recent-games">
          <p>No games recorded yet.</p>
          {isManager && (
            <button onClick={onViewAll} className="btn-primary">
              Add First Game
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="recent-games-list">
            {games.map((game) => (
              <div
                key={game.id}
                className="recent-game-item"
                onClick={() => navigate(`/games/${game.id}`)}
              >
                <div className="game-info">
                  <div className="opponent">vs {game.opponent_name}</div>
                  <div className="game-date">{new Date(game.date).toLocaleDateString()}</div>
                </div>
                <div className="game-score">
                  <span className="score">{formatScore(game.final_score_skywalkers, game.final_score_opponent)}</span>
                  <span className={`result ${getGameResult(game.final_score_skywalkers, game.final_score_opponent).toLowerCase()}`}>
                    {getGameResult(game.final_score_skywalkers, game.final_score_opponent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={onViewAll} className="btn-primary view-all-btn">
            View All Games
          </button>
        </>
      )}
    </div>
  );
};

export default RecentGames;