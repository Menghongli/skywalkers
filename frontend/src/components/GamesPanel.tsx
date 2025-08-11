import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Game } from '../services/api';
import GamesList from './GamesList';
import GameModal from './GameModal';

type GameTab = 'recent' | 'upcoming';

const GamesPanel: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<GameTab>('recent');
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check URL params to set initial tab
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'upcoming' || tabParam === 'recent') {
      setActiveTab(tabParam as GameTab);
    }
  }, [location.search]);

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
      <div className="games-tabs">
        <button 
          className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent Games
        </button>
        <button 
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Games
        </button>
      </div>

      <GamesList
        key={`${refreshKey}-${activeTab}`}
        filter={activeTab}
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