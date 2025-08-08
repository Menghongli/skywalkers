import React, { useState, useEffect } from 'react';
import { Game, GameCreate, gamesAPI } from '../services/api';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  game?: Game | null;
}

interface GameFormData {
  opponent_name: string;
  date: string;
  final_score_skywalkers?: number;
  final_score_opponent?: number;
  video_url?: string;
}

const GameModal: React.FC<GameModalProps> = ({ isOpen, onClose, onSuccess, game }) => {
  const [formData, setFormData] = useState<GameFormData>({
    opponent_name: '',
    date: '',
    final_score_skywalkers: undefined,
    final_score_opponent: undefined,
    video_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (game) {
      setFormData({
        opponent_name: game.opponent_name,
        date: game.date,
        final_score_skywalkers: game.final_score_skywalkers,
        final_score_opponent: game.final_score_opponent,
        video_url: game.video_url || '',
      });
    } else {
      setFormData({
        opponent_name: '',
        date: '',
        final_score_skywalkers: undefined,
        final_score_opponent: undefined,
        video_url: '',
      });
    }
    setError(null);
  }, [game, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.opponent_name.trim() || !formData.date) {
      setError('Opponent name and date are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData: GameCreate = {
        opponent_name: formData.opponent_name,
        date: formData.date,
        final_score_skywalkers: formData.final_score_skywalkers || undefined,
        final_score_opponent: formData.final_score_opponent || undefined,
      };

      if (game) {
        await gamesAPI.update(game.id, submitData);
      } else {
        await gamesAPI.create(submitData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save game');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'final_score_skywalkers' || name === 'final_score_opponent') {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : parseInt(value, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{game ? 'Edit Game' : 'Add New Game'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" id="gameForm">
          <div className="form-group">
            <label htmlFor="opponent_name">Opponent Name *</label>
            <input
              type="text"
              id="opponent_name"
              name="opponent_name"
              value={formData.opponent_name}
              onChange={handleChange}
              required
              placeholder="Enter opponent team name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Game Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="final_score_skywalkers">Skywalkers Score</label>
              <input
                type="number"
                id="final_score_skywalkers"
                name="final_score_skywalkers"
                value={formData.final_score_skywalkers || ''}
                onChange={handleChange}
                min="0"
                placeholder="Enter score"
              />
            </div>

            <div className="form-group">
              <label htmlFor="final_score_opponent">Opponent Score</label>
              <input
                type="number"
                id="final_score_opponent"
                name="final_score_opponent"
                value={formData.final_score_opponent || ''}
                onChange={handleChange}
                min="0"
                placeholder="Enter score"
              />
            </div>
          </div>

        <div className="form-group">
          <label htmlFor="video_url">Video URL</label>
          <input
            type="url"
            id="video_url"
            name="video_url"
            value={formData.video_url || ''}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>

          {error && <div className="error-message">{error}</div>}
        </form>

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="gameForm" disabled={loading}>
            {loading ? 'Saving...' : (game ? 'Update Game' : 'Add Game')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModal;