import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './AdminPanel';
import GamesPanel from './GamesPanel';
import RecentGames from './RecentGames';
import Leaderboard from './Leaderboard';
import ThemeToggle from './ThemeToggle';

interface DashboardProps {
  initialTab?: 'dashboard' | 'games' | 'admin';
  content?: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ initialTab = 'dashboard', content }) => {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games' | 'admin'>(initialTab);

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
            {isManager && (
              <button 
                className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </button>
            )}
          </nav>
        </div>
        <div className="user-info">
          <span>Welcome, {user?.name}!</span>
          <span className="role-badge">{isManager ? 'Manager' : 'Player'}</span>
          <ThemeToggle />
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        {content && activeTab === 'games' ? (
          content
        ) : activeTab === 'dashboard' ? (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Recent Games</h3>
              <RecentGames onViewAll={() => setActiveTab('games')} />
            </div>

            <div className="dashboard-card">
              <h3>Team Standings</h3>
              <Leaderboard />
            </div>

            <div className="dashboard-card">
              <h3>Statistics</h3>
              <p>Track player performance</p>
              <div className="coming-soon">Coming Soon...</div>
            </div>

            {isManager && (
              <div className="dashboard-card manager-only">
                <h3>Manager Tools</h3>
                <p>Add games, update stats, manage team</p>
                <div className="coming-soon">Coming Soon...</div>
              </div>
            )}
          </div>
        ) : activeTab === 'games' ? (
          <GamesPanel />
        ) : activeTab === 'admin' ? (
          <AdminPanel />
        ) : null}
      </main>
    </div>
  );
};

export default Dashboard;