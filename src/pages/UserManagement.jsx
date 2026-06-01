import { useEffect, useState } from 'react';
import { fetchUsers, updateUserRole, deleteUser } from '../services/userService';
import { useAuth } from '../hooks/useAuth';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { profile: currentUser } = useAuth();

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (window.confirm(`Delete user ${user.email}? This only removes their profile (they cannot log in effectively).`)) {
      try {
        await deleteUser(user.id);
        setUsers(users.filter(u => u.id !== user.id));
      } catch (err) {
        alert('Failed to delete user: ' + err.message);
      }
    }
  };

  if (loading) return <progress className="progress is-primary" max="100">Loading...</progress>;
  if (error) return <div className="notification is-danger">{error}</div>;

  return (
    <div>
      <h1 className="title">User Management</h1>

      {/* Desktop table */}
      <div className="is-hidden-mobile">
        <table className="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <div className="select is-small">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="contributor">Contributor</option>
                      <option value="reviewer">Reviewer</option>
                    </select>
                  </div>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="button is-danger is-small"
                    onClick={() => handleDelete(user)}
                    disabled={user.id === currentUser?.id}
                  >
                    <span className="icon"><i className="fas fa-trash"></i></span>
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="is-hidden-tablet">
        {users.map(user => (
          <div key={user.id} className="card mb-3">
            <div className="card-content">
              <p className="title is-5">{user.email}</p>
              <p className="subtitle is-6">
                Role: 
                <span className="select is-small ml-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="contributor">Contributor</option>
                    <option value="reviewer">Reviewer</option>
                  </select>
                </span>
              </p>
              <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              <button
                className="button is-danger is-small mt-2"
                onClick={() => handleDelete(user)}
                disabled={user.id === currentUser?.id}
              >
                <span className="icon"><i className="fas fa-trash"></i></span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
