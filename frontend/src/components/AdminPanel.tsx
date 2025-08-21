import React, { useState, useEffect } from 'react';
import { adminAPI, User, UserCreateData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateManagerModal from './CreateManagerModal';
import PlayerManagement from './PlayerManagement';
import './PlayerManagement.css';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'players'>('users');
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      await fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleCreateUser = async (userData: UserCreateData) => {
    try {
      await adminAPI.createUser(userData);
      setShowCreateModal(false);
      await fetchUsers(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to create user');
    }
  };

  if (loading) {
    return <div className="admin-panel"><div className="loading">Loading users...</div></div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            Player Management
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="section-header">
            <h3>User Management</h3>
            <button 
              className="create-user-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create User
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>{userItem.id}</td>
                    <td>{userItem.name}</td>
                    <td>{userItem.email}</td>
                    <td className="actions">
                      {userItem.id !== user?.id && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(userItem.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showCreateModal && (
            <CreateManagerModal
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateUser}
            />
          )}
        </>
      )}

      {activeTab === 'players' && <PlayerManagement />}
    </div>
  );
};

export default AdminPanel;