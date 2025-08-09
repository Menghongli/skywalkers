import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Game, PlayerGameStats, gamesAPI, statsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatsScraperModal from './StatsScraperModal';

const GameDetails: React.FC = () => {
  const { id } = useParams();
  const gameId = useMemo(() => Number(id), [id]);
  const { isAuthenticated } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<PlayerGameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [g, s] = await Promise.all([
          gamesAPI.getById(gameId),
          statsAPI.getGameStats(gameId),
        ]);
        setGame(g);
        setStats(s);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load game');
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isFinite(gameId)) {
      setError('Invalid game id');
      setLoading(false);
      return;
    }
    load();
  }, [gameId]);

  const formatScore = (sky?: number, opp?: number) => {
    if (sky === undefined || opp === undefined) return 'TBD';
    return `${sky} - ${opp}`;
  };

  if (loading) return <div className="loading">Loading game...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!game) return <div className="error-message">Game not found</div>;

  return (
    <div className="game-details-page">
      <div className="games-header">
        <div>
          <Link to="/games" className="back-link">← Back to Games</Link>
          <h3>Game vs {game.opponent_name}</h3>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowStatsModal(true)} className="btn-secondary">
            Fetch Stats
          </button>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Game Summary</h3>
          <div className="game-summary">
            <div className="summary-left">
              <div className="game-date">{new Date(game.date).toLocaleDateString()}</div>
              <div className="score-display-large">{formatScore(game.final_score_skywalkers, game.final_score_opponent)}</div>
            </div>
            {game.video_url && (
              <a href={game.video_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Watch Video
              </a>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Player Stats</h3>
          {stats.length === 0 ? (
            <div className="no-recent-games">No stats recorded yet.</div>
          ) : (
            <div className="game-stats-table">
              <div className="game-stats-header">
                <div>Player</div>
                <div>Points</div>
                <div>Fouls</div>
              </div>
              {stats.map((s) => (
                <div key={s.id} className="game-stats-row">
                  <div className="game-stats-player-name">{s.player?.name}</div>
                  <div className="game-stat">{s.points}</div>
                  <div className="game-stat">{s.fouls}</div>
                </div>
              ))}
              <div className="game-stats-total-row">
                <div className="game-total-label"><strong>Total</strong></div>
                <div className="game-stat"><strong>{stats.reduce((sum, s) => sum + s.points, 0)}</strong></div>
                <div className="game-stat"><strong>{stats.reduce((sum, s) => sum + s.fouls, 0)}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <StatsScraperModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        gameId={gameId}
      />
    </div>
  );
};

export default GameDetails;

