import React from 'react';
import Login from './Login';
import './AuthPage.css';

const AuthPage: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🏀 Skywalkers Basketball</h1>
          <p>Track games, stats, and team progress</p>
        </div>

        <div className="auth-form-container">
          <Login />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;