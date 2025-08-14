import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GamesProvider } from './contexts/GamesContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './App.css';
// @ts-ignore - type resolver sometimes misses freshly added files in certain editors
import GameDetails from './components/GameDetails';
import { Analytics } from "@vercel/analytics/react"

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/games" element={<Dashboard initialTab="games" />} />
        <Route path="/games/:id" element={<Dashboard content={<GameDetails />} />} />
        <Route path="/admin" element={isAuthenticated ? <Dashboard initialTab="admin" /> : <AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Analytics />
      <ThemeProvider>
        <AuthProvider>
          <GamesProvider>
            <AppContent />
          </GamesProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
