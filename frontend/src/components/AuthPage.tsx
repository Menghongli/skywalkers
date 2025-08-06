import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './AuthPage.css';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSwitchToRegister = () => {
    setIsLogin(false);
    setShowSuccess(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
    setShowSuccess(false);
  };

  const handleRegistrationSuccess = () => {
    setShowSuccess(true);
    setIsLogin(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🏀 Skywalkers Basketball</h1>
          <p>Track games, stats, and team progress</p>
        </div>

        {showSuccess && (
          <div className="success-message">
            Registration successful! Please log in with your new account.
          </div>
        )}

        <div className="auth-form-container">
          {isLogin ? (
            <Login onSwitchToRegister={handleSwitchToRegister} />
          ) : (
            <Register 
              onSwitchToLogin={handleSwitchToLogin}
              onRegistrationSuccess={handleRegistrationSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;