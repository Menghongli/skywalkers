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
  datetime: string; // HTML datetime-local formatted string
  venue?: string;
  final_score_skywalkers?: number;
  final_score_opponent?: number;
  video_url?: string;
}

const GameModal: React.FC<GameModalProps> = ({ isOpen, onClose, onSuccess, game }) => {
  const [formData, setFormData] = useState<GameFormData>({
    opponent_name: '',
    datetime: '',
    venue: '',
    final_score_skywalkers: undefined,
    final_score_opponent: undefined,
    video_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (game) {
      const toInputValue = (dt: Date | string): string => {
        const d = typeof dt === 'string' ? new Date(dt) : dt;
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      };

      setFormData({
        opponent_name: game.opponent_name,
        datetime: toInputValue(game.datetime as any),
        venue: game.venue || '',
        final_score_skywalkers: game.final_score_skywalkers,
        final_score_opponent: game.final_score_opponent,
        video_url: game.video_url || '',
      });
    } else {
      setFormData({
        opponent_name: '',
        datetime: '',
        venue: '',
        final_score_skywalkers: undefined,
        final_score_opponent: undefined,
        video_url: '',
      });
    }
    setError(null);
  }, [game, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.opponent_name.trim() || !formData.datetime) {
      setError('Opponent name and date/time are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert datetime-local to ISO string while preserving local timezone
      const localDate = new Date(formData.datetime);
      const timezoneOffset = localDate.getTimezoneOffset() * 60000;
      const localDateTime = new Date(localDate.getTime() - timezoneOffset);

      const submitData: GameCreate = {
        opponent_name: formData.opponent_name,
        datetime: localDateTime.toISOString(),
        venue: formData.venue || undefined,
        final_score_skywalkers: formData.final_score_skywalkers || undefined,
        final_score_opponent: formData.final_score_opponent || undefined,
        video_url: formData.video_url || undefined,
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
            <label htmlFor="datetime">Game Date Time *</label>
            <input
              type="datetime-local"
              id="datetime"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="venue">Venue</label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="Enter venue (e.g., WAV4, TBD)"
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