import React, { useState, useEffect } from 'react';
import { ladderAPI, LadderEntry } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<LadderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagueLadder();
  }, []);

  const fetchLeagueLadder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ladder data from API
      const ladderData = await ladderAPI.getLadder(10);
      setTeams(ladderData);
      
    } catch (err) {
      setError('Failed to load league ladder');
      console.error('Error fetching league ladder:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLadder = async () => {
    try {
      setUpdating(true);
      setError(null);
      setUpdateSuccess(null);
      
      await ladderAPI.updateLadder();
      setUpdateSuccess('Ladder updated successfully');
      
      // Refresh the ladder data after a short delay
      setTimeout(() => {
        fetchLeagueLadder();
        setUpdateSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update ladder');
      console.error('Error updating ladder:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading">Loading standings...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="leaderboard-widget">
      <div className="leaderboard-header">
        <h3>Team Standings</h3>
      </div>
      
      {updateSuccess && (
        <div className="success-message">
          <span style={{ fontSize: '14px', marginRight: '8px' }}>✅</span>
          {updateSuccess}
        </div>
      )}
      {teams.length === 0 ? (
        <div className="no-players">
          <p>No completed games yet.</p>
        </div>
      ) : (
        <div className="league-ladder-table">
          <div className="ladder-header">
            <div className="pos">POS</div>
            <div className="team-name">TEAM</div>
            <div className="stat">W</div>
            <div className="stat">D</div>
            <div className="stat">L</div>
            <div className="stat">%</div>
          </div>
          
          {teams.slice(0, 6).map((team, index) => (
            <div key={team.team_name} className={`ladder-row ${team.team_name === 'Skywalkers' ? 'skywalkers-row' : ''}`}>
              <div className="pos">
                {index === 0 ? (
                  <span className="trophy">🥇</span>
                ) : index === 1 ? (
                  <span className="trophy">🥈</span>
                ) : index === 2 ? (
                  <span className="trophy">🥉</span>
                ) : (
                  <span className="rank">
                    {team.position}
                  </span>
                )}
              </div>
              
              <div className="team-name">
                {team.team_name}
                {team.team_name === 'Skywalkers' && (
                  <span className="our-team">🏀</span>
                )}
              </div>
              
              <div className="stat">{team.wins}</div>
              <div className="stat">{team.draws}</div>
              <div className="stat">{team.losses}</div>
              <div className="stat">{(team.win_percentage * 100).toFixed(0)}%</div>
            </div>
          ))}
          
          {teams.length > 6 && (
            <div className="more-teams">
              +{teams.length - 6} more teams
            </div>
          )}
        </div>
      )}
      
      {isAuthenticated && (
        <button 
          onClick={handleUpdateLadder} 
          disabled={updating || loading}
          className="btn-primary"
          style={{ marginTop: '16px', width: '100%' }}
        >
          {updating ? (
            <>
              <span style={{ 
                display: 'inline-block', 
                marginRight: '8px',
                animation: 'spin 1s linear infinite'
              }}>
                ⟳
              </span>
              Updating Ladder...
            </>
          ) : (
            'Update Ladder'
          )}
        </button>
      )}
    </div>
  );
};

export default Leaderboard;