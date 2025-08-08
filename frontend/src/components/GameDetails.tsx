import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Game, PlayerGameStats, gamesAPI, statsAPI } from '../services/api';

const GameDetails: React.FC = () => {
  const { id } = useParams();
  const gameId = useMemo(() => Number(id), [id]);

  const [game, setGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<PlayerGameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="game-details-header">
        <div className="header-left">
          <Link to="/games" className="back-link">← Back to Games</Link>
          <h2>Game vs {game.opponent_name}</h2>
        </div>
      </div>

      <div className="dashboard-card game-summary">
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

      <div className="dashboard-card">
        <h3>Player Stats</h3>
        {stats.length === 0 ? (
          <div className="no-recent-games">No stats recorded yet.</div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Jersey</th>
                  <th>Points</th>
                  <th>Fouls</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id}>
                    <td>{s.user?.name}</td>
                    <td>{s.user?.jersey_number ?? '-'}</td>
                    <td>{s.points}</td>
                    <td>{s.fouls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;

