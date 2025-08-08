import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Game, gamesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface GamesListProps {
  onAddGame?: () => void;
  onEditGame?: (game: Game) => void;
}

const GamesList: React.FC<GamesListProps> = ({ onAddGame, onEditGame }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isManager } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const data = await gamesAPI.getAll();
      setGames(data);
    } catch (err) {
      setError('Failed to load games');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gameId: number) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await gamesAPI.delete(gameId);
      setGames(games.filter(game => game.id !== gameId));
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
        {isManager && onAddGame && (
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
                <div className="game-date">{new Date(game.date).toLocaleDateString()}</div>
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

              {isManager && (
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