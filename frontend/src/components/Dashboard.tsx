import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './AdminPanel';
import GamesPanel from './GamesPanel';
import RecentGames from './RecentGames';
import Leaderboard from './Leaderboard';
import ThemeToggle from './ThemeToggle';
import GameModal from './GameModal';
import StatsScraperModal from './StatsScraperModal';
import StatsVerificationModal from './StatsVerificationModal';
import { Game, gamesAPI, statsAPI } from '../services/api';

interface DashboardProps {
  initialTab?: 'dashboard' | 'games' | 'admin';
  content?: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ initialTab = 'dashboard', content }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games' | 'admin'>(initialTab);
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [refreshGames, setRefreshGames] = useState(0);
  const [showStatsScraperModal, setShowStatsScraperModal] = useState(false);
  const [showStatsVerificationModal, setShowStatsVerificationModal] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0);
  const [playerStats, setPlayerStats] = useState<Array<{name: string, points: number, fouls: number, avgPoints: number, avgFouls: number}>>([]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Get total games
      const games = await gamesAPI.getAll();
      setTotalGames(games.length);

      // Calculate statistics across all games
      let totalPointsSum = 0;
      let playersSet = new Set<number>();
      let playerTotals: { [playerId: number]: { name: string; points: number; fouls: number; games: Set<number> } } = {};

      for (const game of games) {
        try {
          const gameStats = await statsAPI.getGameStats(game.id);
          gameStats.forEach(stat => {
            totalPointsSum += stat.points;
            playersSet.add(stat.player_id);
            
            // Track player totals
            if (!playerTotals[stat.player_id]) {
              playerTotals[stat.player_id] = {
                name: stat.player?.name || 'Unknown',
                points: 0,
                fouls: 0,
                games: new Set()
              };
            }
            playerTotals[stat.player_id].points += stat.points;
            playerTotals[stat.player_id].fouls += stat.fouls;
            playerTotals[stat.player_id].games.add(game.id);
          });
        } catch (error) {
          console.error(`Failed to load stats for game ${game.id}:`, error);
        }
      }

      setTotalPoints(totalPointsSum);
      setActivePlayers(playersSet.size);
      
      // Convert player totals to array and sort by points
      const playerStatsArray = Object.values(playerTotals).map(player => {
        const gamesCount = player.games.size;
        return {
          name: player.name,
          points: player.points,
          fouls: player.fouls,
          avgPoints: gamesCount > 0 ? Math.round((player.points / gamesCount) * 10) / 10 : 0,
          avgFouls: gamesCount > 0 ? Math.round((player.fouls / gamesCount) * 10) / 10 : 0
        };
      }).sort((a, b) => b.points - a.points);
      
      setPlayerStats(playerStatsArray);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleAddFirstGame = () => {
    setEditingGame(null);
    setShowGameModal(true);
    setActiveTab('games');
  };

  const handleGameModalClose = () => {
    setShowGameModal(false);
    setEditingGame(null);
  };

  const handleGameModalSuccess = () => {
    setRefreshGames(prev => prev + 1);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏀 Skywalkers Dashboard</h1>
          <nav className="dashboard-nav">
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); navigate('/'); }}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${activeTab === 'games' ? 'active' : ''}`}
              onClick={() => { setActiveTab('games'); navigate('/games'); }}
            >
              Games
            </button>
          </nav>
        </div>
        <div className="user-info">
          {isAuthenticated ? (
            <>
              <span>Welcome, {user?.name}!</span>
              <ThemeToggle />
              <button onClick={logout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <button onClick={() => navigate('/login')} className="login-btn">Admin Login</button>
            </>
          )}
        </div>
      </header>

      <main className="dashboard-content">
        {content ? (
          content
        ) : activeTab === 'dashboard' ? (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Recent Games</h3>
              <RecentGames 
                onViewAll={() => setActiveTab('games')} 
                onAddFirstGame={handleAddFirstGame}
              />
            </div>

            <div className="dashboard-card">
              <h3>Team Standings</h3>
              <Leaderboard />
            </div>

            <div className="dashboard-card">
              <h3>Statistics</h3>
              <div className="statistics-content">
                <div className="stats-overview">
                  <div className="stat-item">
                    <div className="stat-number">{totalGames}</div>
                    <div className="stat-label">Games</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{totalPoints}</div>
                    <div className="stat-label">Points</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{activePlayers}</div>
                    <div className="stat-label">Players</div>
                  </div>
                </div>
                
                <div className="player-stats-table">
                  {playerStats.length === 0 ? (
                    <div className="no-player-stats">No player statistics available</div>
                  ) : (
                    <>
                      <div className="stats-header">
                        <div>Player</div>
                        <div>Points</div>
                        <div>Fouls</div>
                        <div>Avg Pts</div>
                        <div>Avg Fouls</div>
                      </div>
                      {playerStats.map((player) => (
                        <div key={player.name} className="stats-row">
                          <div className="stats-player-name">{player.name}</div>
                          <div className="stat">{player.points}</div>
                          <div className="stat">{player.fouls}</div>
                          <div className="stat">{player.avgPoints}</div>
                          <div className="stat">{player.avgFouls}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'games' ? (
          <GamesPanel />
        ) : activeTab === 'admin' ? (
          isAuthenticated ? (
            <AdminPanel />
          ) : (
            <div className="admin-login-required">
              <h2>Admin Access Required</h2>
              <p>Please log in to access the admin panel.</p>
              <button onClick={() => navigate('/login')} className="login-btn">
                Login
              </button>
            </div>
          )
        ) : null}
      </main>
      
      <GameModal
        isOpen={showGameModal}
        onClose={handleGameModalClose}
        onSuccess={handleGameModalSuccess}
        game={editingGame}
      />
      
      <StatsScraperModal
        isOpen={showStatsScraperModal}
        onClose={() => setShowStatsScraperModal(false)}
      />
      
      <StatsVerificationModal
        isOpen={showStatsVerificationModal}
        onClose={() => setShowStatsVerificationModal(false)}
      />
    </div>
  );
};

export default Dashboard;