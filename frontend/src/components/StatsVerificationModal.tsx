import React, { useState, useEffect } from 'react';
import { statsAPI, PlayerGameStats } from '../services/api';

interface StatsVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StatsVerificationModal: React.FC<StatsVerificationModalProps> = ({ isOpen, onClose }) => {
  const [unverifiedStats, setUnverifiedStats] = useState<PlayerGameStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUnverifiedStats();
    }
  }, [isOpen]);

  const loadUnverifiedStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await statsAPI.getUnverifiedStats();
      setUnverifiedStats(stats);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load unverified stats');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (statsId: number) => {
    try {
      setActionLoading(statsId);
      await statsAPI.verifyStats(statsId);
      
      // Remove from list
      setUnverifiedStats(prev => prev.filter(s => s.id !== statsId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify stats');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (statsId: number) => {
    if (!window.confirm('Are you sure you want to reject and delete these stats? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(statsId);
      await statsAPI.rejectStats(statsId);
      
      // Remove from list
      setUnverifiedStats(prev => prev.filter(s => s.id !== statsId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject stats');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = () => {
    setUnverifiedStats([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay stats-modal-overlay" onClick={handleClose}>
      <div className="modal-content stats-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header stats-modal-header">
          <div className="stats-modal-title">
            <span className="stats-icon">🔍</span>
            <h2>Verify Scraped Stats</h2>
          </div>
          <button className="close-btn stats-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="verification-content">
          {loading ? (
            <div className="loading-state">
              <span className="loading-spinner">🔄</span>
              Loading unverified stats...
            </div>
          ) : error ? (
            <div className="error-message stats-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          ) : unverifiedStats.length === 0 ? (
            <div className="no-stats-message">
              <span className="no-stats-icon">✅</span>
              <p>All scraped stats have been verified!</p>
            </div>
          ) : (
            <div className="unverified-stats-list">
              <p className="verification-intro">
                Review and verify the following scraped player stats:
              </p>
              
              {unverifiedStats.map((stats) => (
                <div key={stats.id} className="verification-card">
                  <div className="verification-header">
                    <div className="player-info">
                      <span className="player-name">{stats.player.name}</span>
                      <span className="jersey-number">#{stats.player.jersey_number}</span>
                    </div>
                    <div className="game-info">
                      Game ID: {stats.game_id}
                    </div>
                  </div>
                  
                  <div className="stats-display">
                    <div className="stat-item">
                      <span className="stat-label">Points:</span>
                      <span className="stat-value">{stats.points}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Fouls:</span>
                      <span className="stat-value">{stats.fouls}</span>
                    </div>
                  </div>

                  {stats.scrape_source && (
                    <div className="scrape-info">
                      <span className="scrape-label">Source:</span>
                      <a href={stats.scrape_source} target="_blank" rel="noopener noreferrer" className="scrape-url">
                        View Source
                      </a>
                    </div>
                  )}

                  <div className="verification-actions">
                    <button
                      className="btn-verify"
                      onClick={() => handleVerify(stats.id)}
                      disabled={actionLoading === stats.id}
                    >
                      {actionLoading === stats.id ? (
                        <>
                          <span className="loading-spinner">🔄</span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <span className="verify-icon">✅</span>
                          Verify
                        </>
                      )}
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(stats.id)}
                      disabled={actionLoading === stats.id}
                    >
                      {actionLoading === stats.id ? (
                        <>
                          <span className="loading-spinner">🔄</span>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <span className="reject-icon">❌</span>
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions stats-modal-actions">
          <button type="button" onClick={handleClose} className="btn-secondary">
            Close
          </button>
          <button 
            type="button" 
            onClick={loadUnverifiedStats} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="loading-spinner">🔄</span>
                Refreshing...
              </>
            ) : (
              <>
                <span className="refresh-icon">🔄</span>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsVerificationModal;