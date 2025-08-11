import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Game, gamesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useGames } from '../contexts/GamesContext';
import { formatGameDateTime } from '../utils/dateUtils';

type GameFilter = 'recent' | 'upcoming';

interface GamesListProps {
  filter?: GameFilter;
  onAddGame?: () => void;
  onEditGame?: (game: Game) => void;
}

const GamesList: React.FC<GamesListProps> = ({ filter = 'recent', onAddGame, onEditGame }) => {
  const { games: allGames, recentGames, upcomingGames, loading, error, refreshGames } = useGames();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Apply filter based on the current filter setting
  const games = React.useMemo(() => {
    if (filter === 'recent') {
      return recentGames;
    } else if (filter === 'upcoming') {
      return upcomingGames;
    }
    // 'all' filter shows all games in default order
    return allGames;
  }, [filter, allGames, recentGames, upcomingGames]);

  const handleDelete = async (gameId: number) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await gamesAPI.delete(gameId);
      refreshGames();
    } catch (err) {
      console.error('Error deleting game:', err);
      alert('Failed to delete game');
    }
  };

  const formatScore = (skywalkers?: number, opponent?: number) => {
    if (skywalkers === undefined || opponent === undefined) {
      return 'TBD';
    }
    return `${skywalkers} - ${opponent}`;
  };

  const getGameResult = (skywalkers?: number, opponent?: number) => {
    if (skywalkers === undefined || opponent === undefined) return '';
    if (skywalkers > opponent) return 'W';
    if (skywalkers < opponent) return 'L';
    return 'T';
  };

  if (loading) return <div className="loading">Loading games...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="games-list">
      <div className="games-header">
        <h3>Games</h3>
        {isAuthenticated && onAddGame && (
          <button onClick={onAddGame} className="btn-primary">
            Add Game
          </button>
        )}
      </div>

      {games.length === 0 ? (
        <div className="no-games">No games recorded yet.</div>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
            <div
              key={game.id}
              className="game-card"
              onClick={() => navigate(`/games/${game.id}`)}
            >
              <div className="game-header">
                <div className="game-opponent">vs {game.opponent_name}</div>
                <div className="game-datetime">{formatGameDateTime(game.datetime)}</div>
              </div>
              
              <div className="game-score">
                <div className="score-display">
                  {formatScore(game.final_score_skywalkers, game.final_score_opponent)}
                </div>
                <div className={`game-result ${getGameResult(game.final_score_skywalkers, game.final_score_opponent).toLowerCase()}`}>
                  {getGameResult(game.final_score_skywalkers, game.final_score_opponent)}
                </div>
              </div>

              {game.video_url && (
                <div className="game-video">
                  <a
                    href={game.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📹 Watch Video
                  </a>
                </div>
              )}

              {isAuthenticated && (
                <div className="game-actions">
                  {onEditGame && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGame(game);
                      }}
                      className="btn-secondary"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(game.id);
                    }}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamesList;