import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const EmailVerification: React.FC = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(response.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Verification failed');
      }
    };

    verifyEmail();
  }, [location, navigate]);

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h2>Email Verification</h2>
        
        {status === 'verifying' && (
          <div className="verification-status">
            <div className="spinner"></div>
            <p>Verifying your email...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="verification-status success">
            <div className="success-icon">✓</div>
            <p>{message}</p>
            <p>Redirecting to login...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="verification-status error">
            <div className="error-icon">✗</div>
            <p>{message}</p>
            <button onClick={() => navigate('/')}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;