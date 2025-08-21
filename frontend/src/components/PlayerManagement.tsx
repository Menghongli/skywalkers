import React, { useState, useEffect } from 'react';
import { adminAPI, Player, PlayerCreate, PlayerUpdate, PlayerMerge } from '../services/api';

interface PlayerManagementProps {
  className?: string;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ className }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  const [newPlayer, setNewPlayer] = useState<PlayerCreate>({
    name: '',
    jersey_number: 0,
  });

  const [editForm, setEditForm] = useState<PlayerUpdate>({});

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await adminAPI.getAllPlayers();
      setPlayers(playersData);
    } catch (err) {
      setError('Failed to load players');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.createPlayer(newPlayer);
      setNewPlayer({
        name: '',
        jersey_number: 0,
      });
      setShowCreateForm(false);
      loadPlayers();
    } catch (err) {
      setError('Failed to create player');
      console.error(err);
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    
    try {
      await adminAPI.updatePlayer(editingPlayer.id, editForm);
      setEditingPlayer(null);
      setEditForm({});
      loadPlayers();
    } catch (err) {
      setError('Failed to update player');
      console.error(err);
    }
  };

  const handleTogglePlayerStatus = async (player: Player) => {
    try {
      if (player.is_active) {
        await adminAPI.deactivatePlayer(player.id);
      } else {
        await adminAPI.activatePlayer(player.id);
      }
      loadPlayers();
    } catch (err) {
      setError('Failed to update player status');
      console.error(err);
    }
  };

  const handleMergePlayers = async () => {
    if (selectedPlayers.length !== 2) {
      setError('Please select exactly 2 players to merge');
      return;
    }

    const [sourceId, targetId] = selectedPlayers;
    const sourceName = players.find(p => p.id === sourceId)?.name;
    const targetName = players.find(p => p.id === targetId)?.name;
    
    if (window.confirm(`Merge ${sourceName} into ${targetName}? This will transfer all stats and deactivate ${sourceName}.`)) {
      try {
        await adminAPI.mergePlayers({ source_player_id: sourceId, target_player_id: targetId });
        setSelectedPlayers([]);
        setMergeMode(false);
        loadPlayers();
      } catch (err) {
        setError('Failed to merge players');
        console.error(err);
      }
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.jersey_number.toString().includes(searchTerm);
    const matchesStatus = showInactive || player.is_active === 1;
    return matchesSearch && matchesStatus;
  });

  const handlePlayerSelection = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < 2) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  if (loading) return <div className="loading">Loading players...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className={`player-management ${className || ''}`}>
      <div className="player-management-header">
        <h2>Player Management</h2>
        <div className="controls">
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            {showCreateForm ? 'Cancel' : 'Add Player'}
          </button>
          <button 
            onClick={() => {
              setMergeMode(!mergeMode);
              setSelectedPlayers([]);
            }}
            className={`btn ${mergeMode ? 'btn-secondary' : 'btn-warning'}`}
          >
            {mergeMode ? 'Cancel Merge' : 'Merge Players'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreatePlayer} className="create-form">
          <h3>Create New Player</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Player Name"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Jersey Number (0-99)"
              value={newPlayer.jersey_number === 0 ? '0' : newPlayer.jersey_number || ''}
              onChange={(e) => setNewPlayer({...newPlayer, jersey_number: e.target.value === '' ? 0 : parseInt(e.target.value)})}
              min="0"
              max="99"
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Create Player</button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder="Search players by name or jersey number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive players
        </label>
      </div>

      {mergeMode && (
        <div className="merge-controls">
          <p>Select 2 players to merge. Stats will be transferred from first to second player.</p>
          <p>Selected: {selectedPlayers.length}/2</p>
          {selectedPlayers.length === 2 && (
            <button onClick={handleMergePlayers} className="btn btn-warning">
              Merge Selected Players
            </button>
          )}
        </div>
      )}

      <div className="players-table-container">
        <table className="players-table">
          <thead>
            <tr>
              {mergeMode && <th>Select</th>}
              <th>Jersey #</th>
              <th>Name</th>
              <th>Status</th>
              <th>Date Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => (
              <tr key={player.id} className={player.is_active ? '' : 'inactive-player'}>
                {mergeMode && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handlePlayerSelection(player.id)}
                      disabled={selectedPlayers.length >= 2 && !selectedPlayers.includes(player.id)}
                    />
                  </td>
                )}
                <td className="jersey-number">#{player.jersey_number}</td>
                <td>{player.name}</td>
                <td>
                  <span className={`status ${player.is_active ? 'active' : 'inactive'}`}>
                    {player.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(player.date_joined).toLocaleDateString()}</td>
                <td className="actions">
                  <button 
                    onClick={() => {
                      setEditingPlayer(player);
                      setEditForm({
                        name: player.name,
                        jersey_number: player.jersey_number,
                        is_active: player.is_active,
                      });
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleTogglePlayerStatus(player)}
                    className={`btn btn-sm ${player.is_active ? 'btn-warning' : 'btn-success'}`}
                  >
                    {player.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPlayer && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <form onSubmit={handleUpdatePlayer}>
              <h3>Edit Player: {editingPlayer.name}</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Player Name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Jersey Number (0-99)"
                  value={editForm.jersey_number === 0 ? '0' : editForm.jersey_number || ''}
                  onChange={(e) => setEditForm({...editForm, jersey_number: e.target.value === '' ? undefined : parseInt(e.target.value)})}
                  min="0"
                  max="99"
                />
                <select
                  value={editForm.is_active}
                  onChange={(e) => setEditForm({...editForm, is_active: parseInt(e.target.value)})}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update Player</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingPlayer(null);
                    setEditForm({});
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;