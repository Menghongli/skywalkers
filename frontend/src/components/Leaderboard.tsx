import React, { useState, useEffect } from 'react';
import { ladderAPI, LadderEntry } from '../services/api';

const Leaderboard: React.FC = () => {
  const [teams, setTeams] = useState<LadderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagueLadder();
  }, []);

  const fetchLeagueLadder = async () => {
    try {
      setLoading(true);
      
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

  if (loading) return <div className="loading">Loading standings...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="leaderboard-widget">
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
    </div>
  );
};

export default Leaderboard;