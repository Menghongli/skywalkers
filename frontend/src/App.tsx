import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import EmailVerification from './components/EmailVerification';
import './App.css';
// @ts-ignore - type resolver sometimes misses freshly added files in certain editors
import GameDetails from './components/GameDetails';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <AuthPage />} />
        <Route path="/games" element={isAuthenticated ? <Dashboard initialTab="games" /> : <AuthPage />} />
        <Route
          path="/games/:id"
          element={
            isAuthenticated ? (
              <Dashboard content={<GameDetails />} />
            ) : (
              <AuthPage />
            )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
