import React, { useState, useEffect } from 'react';
import { statsAPI, gamesAPI, Game } from '../services/api';

interface StatsScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Optional callback for successful stats save
  gameId?: number; // Optional game ID for context
}

const StatsScraperModal: React.FC<StatsScraperModalProps> = ({ isOpen, onClose, onSuccess, gameId }) => {
  const [url, setUrl] = useState('');
  const [cookies, setCookies] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const loadCurrentGame = React.useCallback(async () => {
    if (!gameId) return;
    
    try {
      const game = await gamesAPI.getById(gameId);
      setCurrentGame(game);
    } catch (error) {
      console.error('Failed to load current game:', error);
    }
  }, [gameId]);

  useEffect(() => {
    if (isOpen && gameId) {
      loadCurrentGame();
    }
  }, [isOpen, gameId, loadCurrentGame]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    if (!cookies.trim()) {
      setError('iframewba cookie value is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Step 1: Only fetch stats (don't save to database yet)
      const response = await statsAPI.fetchGameStats(url, cookies);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch game stats');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStats = async () => {
    if (!gameId || !result?.data?.player_stats) {
      setError('No stats to save or no game context');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Step 2: Save the already fetched stats to database
      const response = await statsAPI.fetchGameStats(url, cookies, gameId, true);
      setResult(response);
      
      // Close modal after successful save and trigger refresh
      if (response.data?.saved_to_db) {
        if (onSuccess) {
          onSuccess(); // Trigger parent refresh
        }
        setTimeout(() => {
          handleClose();
        }, 1000); // Brief delay to show success message
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save stats to database');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setCookies('');
    setError(null);
    setResult(null);
    setCurrentGame(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay stats-modal-overlay" onClick={handleClose}>
      <div className="modal-content stats-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header stats-modal-header">
          <div className="stats-modal-title">
            <span className="stats-icon">📊</span>
            <h2>Fetch Game Stats</h2>
            {currentGame && (
              <div className="game-context">
                for {currentGame.opponent_name} - {currentGame.datetime.toLocaleDateString()}
              </div>
            )}
          </div>
          <button className="close-btn stats-close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form stats-modal-form" id="statsForm">
          <div className="form-group stats-form-group">
            <label htmlFor="stats_url" className="stats-label">
              <span className="label-icon">🔗</span>
              Stats URL *
            </label>
            <input
              type="url"
              id="stats_url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://example.com/stats-page"
              disabled={loading}
              className="stats-input"
            />
          </div>

          <div className="form-group stats-form-group">
            <label htmlFor="cookies" className="stats-label">
              <span className="label-icon">🍪</span>
              iframewba Cookie Value *
            </label>
            <textarea
              id="cookies"
              value={cookies}
              onChange={(e) => setCookies(e.target.value)}
              placeholder="Paste the iframewba cookie value here..."
              disabled={loading}
              rows={4}
              required
              className="stats-textarea"
            />
            <div className="form-help stats-form-help">
              <span className="help-icon">💡</span>
              Copy the 'iframewba' cookie value from your browser's developer tools (F12 → Application → Cookies)
            </div>
          </div>

          {error && (
            <div className="error-message stats-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {result && (
            <div className="stats-result">
              <div className="stats-result-header">
                <span className="result-icon">✅</span>
                <h4>
                  {result.data?.saved_to_db 
                    ? 'Stats Fetched & Saved to Database Successfully!' 
                    : 'Stats Fetched Successfully!'}
                </h4>
              </div>
              <div className="stats-content">
                {result.data?.player_stats && Object.keys(result.data.player_stats).length > 0 ? (
                  <div className="player-stats-section">
                    <h5 className="stats-section-title">
                      <span className="section-icon">👥</span>
                      Player Statistics
                    </h5>
                    <div className="player-stats-grid">
                      {Object.entries(result.data.player_stats).map(([playerName, stats]: [string, any]) => (
                        <div key={playerName} className="player-stat-card">
                          <div className="player-name">{playerName}</div>
                          <div className="player-stats">
                            <div className="stat-item">
                              <span className="stat-label">Points:</span>
                              <span className="stat-value">{stats.points >= 0 ? stats.points : 'N/A'}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Fouls:</span>
                              <span className="stat-value">{stats.fouls >= 0 ? stats.fouls : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-stats-message">
                    <span className="no-stats-icon">📊</span>
                    <p>No player statistics found in the scraped content.</p>
                  </div>
                )}
                
                {result.data?.raw_content && (
                  <details className="raw-content-details">
                    <summary className="raw-content-summary">
                      <span className="summary-icon">🔍</span>
                      View Raw Content
                    </summary>
                    <div className="raw-content">
                      <pre>{result.data.raw_content}</pre>
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
        </form>

        <div className="modal-actions stats-modal-actions">
          <button type="button" onClick={handleClose} disabled={loading || saving} className="btn-secondary">
            Cancel
          </button>
          
          {/* Show different button based on state */}
          {!result || result.data?.saved_to_db ? (
            // Step 1: Fetch Stats button
            <button type="submit" form="statsForm" disabled={loading} className="btn-primary stats-fetch-btn">
              {loading ? (
                <>
                  <span className="loading-spinner">🔄</span>
                  Fetching Stats...
                </>
              ) : (
                <>
                  <span className="fetch-icon">🚀</span>
                  Fetch Stats
                </>
              )}
            </button>
          ) : (
            // Step 2: Save to Database button (only shown if stats fetched but not saved, and gameId exists)
            gameId && (
              <button 
                type="button" 
                onClick={handleSaveStats} 
                disabled={saving} 
                className="btn-primary stats-save-btn"
              >
                {saving ? (
                  <>
                    <span className="loading-spinner">🔄</span>
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <span className="save-icon">💾</span>
                    Save to Database
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsScraperModal;