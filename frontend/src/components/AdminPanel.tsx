import React, { useState, useEffect } from 'react';
import { adminAPI, User, RegisterData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateManagerModal from './CreateManagerModal';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const handleVerifyUser = async (userId: number) => {
    try {
      await adminAPI.verifyUser(userId);
      await fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify user');
    }
  };

  const handleCreateManager = async (managerData: RegisterData) => {
    try {
      await adminAPI.createManager(managerData);
      setShowCreateModal(false);
      await fetchUsers(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to create manager');
    }
  };

  if (loading) {
    return <div className="admin-panel"><div className="loading">Loading users...</div></div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>User Management</h2>
        <button 
          className="create-manager-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Create Manager
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
              <th>Role</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userItem) => (
              <tr key={userItem.id}>
                <td>{userItem.id}</td>
                <td>{userItem.name}</td>
                <td>{userItem.email}</td>
                <td>
                  <span className={`role-badge ${userItem.role}`}>
                    {userItem.role}
                  </span>
                </td>
                <td>
                  <span className={`verification-status ${userItem.is_verified ? 'verified' : 'unverified'}`}>
                    {userItem.is_verified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                </td>
                <td className="actions">
                  {!userItem.is_verified && (
                    <button
                      className="verify-btn"
                      onClick={() => handleVerifyUser(userItem.id)}
                    >
                      Verify
                    </button>
                  )}
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
          onSubmit={handleCreateManager}
        />
      )}
    </div>
  );
};

export default AdminPanel;