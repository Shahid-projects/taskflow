import { useEffect, useState } from 'react';
import api from '../api/client';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => { api.get('/auth/users').then(r => setUsers(r.data)); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="task-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ background: u.avatar_color }}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="text-muted text-sm">{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'priority-critical' : 'status-in_progress'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="text-muted text-sm">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
