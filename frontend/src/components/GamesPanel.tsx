import React, { useState } from 'react';
import { Game } from '../services/api';
import GamesList from './GamesList';
import GameModal from './GameModal';

const GamesPanel: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddGame = () => {
    setEditingGame(null);
    setShowModal(true);
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingGame(null);
  };

  return (
    <div className="games-panel">
      <GamesList
        key={refreshKey}
        onAddGame={handleAddGame}
        onEditGame={handleEditGame}
      />
      
      <GameModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        game={editingGame}
      />
    </div>
  );
};

export default GamesPanel;