import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGames } from '../contexts/GamesContext';
import AdminPanel from './AdminPanel';
import GamesPanel from './GamesPanel';
import RecentGames from './RecentGames';
import UpcomingGames from './UpcomingGames';
import Leaderboard from './Leaderboard';
import ThemeToggle from './ThemeToggle';
import GameModal from './GameModal';
import StatsScraperModal from './StatsScraperModal';
import StatsVerificationModal from './StatsVerificationModal';
import { Game, statsAPI, PlayerGameStats } from '../services/api';

interface DashboardProps {
  initialTab?: 'dashboard' | 'games' | 'admin';
  content?: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ initialTab = 'dashboard', content }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { recentGames, refreshGames } = useGames();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games' | 'admin'>(initialTab);
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showStatsScraperModal, setShowStatsScraperModal] = useState(false);
  const [showStatsVerificationModal, setShowStatsVerificationModal] = useState(false);

  // Get stats from completed games only
  const totalGames = recentGames.length; // Only count completed games
  
  // Calculate total team points from completed games
  const totalPoints = recentGames.reduce((sum, game) => {
    return sum + (game.final_score_skywalkers || 0);
  }, 0);
  
  const [playerStats, setPlayerStats] = useState<Array<{name: string, points: number, fouls: number, avgPoints: number, avgFouls: number}>>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Calculate active players from loaded stats
  const activePlayers = playerStats.length;

  // Load player statistics from all completed games
  useEffect(() => {
    const loadPlayerStats = async () => {
      if (recentGames.length === 0) {
        setPlayerStats([]);
        return;
      }

      setStatsLoading(true);
      try {
        // Collect all stats from all completed games
        const allGameStats: PlayerGameStats[] = [];
        
        for (const game of recentGames) {
          try {
            const gameStats = await statsAPI.getGameStats(game.id);
            allGameStats.push(...gameStats);
          } catch (error) {
            console.error(`Failed to load stats for game ${game.id}:`, error);
          }
        }

        // Aggregate stats by player
        const playerTotals: { [playerId: number]: { 
          name: string; 
          points: number; 
          fouls: number; 
          gamesCount: number; 
        } } = {};

        allGameStats.forEach(stat => {
          if (!playerTotals[stat.player_id]) {
            playerTotals[stat.player_id] = {
              name: stat.player?.name || 'Unknown',
              points: 0,
              fouls: 0,
              gamesCount: 0,
            };
          }
          playerTotals[stat.player_id].points += stat.points;
          playerTotals[stat.player_id].fouls += stat.fouls;
          playerTotals[stat.player_id].gamesCount += 1;
        });

        // Convert to display format and calculate averages
        const playerStatsArray = Object.values(playerTotals)
          .map(player => ({
            name: player.name,
            points: player.points,
            fouls: player.fouls,
            avgPoints: player.gamesCount > 0 ? Math.round((player.points / player.gamesCount) * 10) / 10 : 0,
            avgFouls: player.gamesCount > 0 ? Math.round((player.fouls / player.gamesCount) * 10) / 10 : 0,
          }))
          .sort((a, b) => b.points - a.points); // Sort by total points descending

        setPlayerStats(playerStatsArray);
      } catch (error) {
        console.error('Failed to load player statistics:', error);
        setPlayerStats([]);
      } finally {
        setStatsLoading(false);
      }
    };

    loadPlayerStats();
  }, [recentGames]);

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
    refreshGames(); // Refresh games data instead of loading stats
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-left">
            <div className="header-logo-title">
              <img src="/skywalkers-logo.png" alt="Skywalkers Logo" className="nav-logo" />
            </div>
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
              <h3>Upcoming Games</h3>
              <UpcomingGames 
                onViewAll={() => setActiveTab('games')}
                onAddFirstGame={handleAddFirstGame}
              />
            </div>

            <div className="dashboard-card">
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
                  {statsLoading ? (
                    <div className="no-player-stats">Loading player statistics...</div>
                  ) : playerStats.length === 0 ? (
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