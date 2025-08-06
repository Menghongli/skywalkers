import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './AdminPanel';

const Dashboard: React.FC = () => {
  const { user, logout, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏀 Skywalkers Dashboard</h1>
          {isManager && (
            <nav className="dashboard-nav">
              <button 
                className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </button>
            </nav>
          )}
        </div>
        <div className="user-info">
          <span>Welcome, {user?.name}!</span>
          <span className="role-badge">{isManager ? 'Manager' : 'Player'}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        {activeTab === 'dashboard' ? (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Recent Games</h3>
              <p>View and manage game results</p>
              <div className="coming-soon">Coming Soon...</div>
            </div>

            <div className="dashboard-card">
              <h3>Team Roster</h3>
              <p>Manage players and positions</p>
              <div className="coming-soon">Coming Soon...</div>
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
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

export default Dashboard;