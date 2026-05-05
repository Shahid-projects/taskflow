import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { format, isPast, parseISO } from 'date-fns';
import './Dashboard.css';

const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', in_review:'In Review', done:'Done' };
const STATUS_COLORS = { todo:'var(--todo)', in_progress:'var(--in-progress)', in_review:'var(--in-review)', done:'var(--done)' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
  }, []);

  if (!data) return <div className="page-loader"><div className="spinner" /></div>;

  const { byStatus, overdue, myTasks, projects, total_users } = data;
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Good to see you, {user.name.split(' ')[0]} 👋</p>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="dash-stats">
        {Object.entries(byStatus).map(([k, v]) => (
          <div key={k} className="stat-card" style={{ '--accent': STATUS_COLORS[k] }}>
            <div className="stat-label">{STATUS_LABELS[k]}</div>
            <div className="stat-value">{v}</div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: total ? `${(v/total)*100}%` : 0 }} />
            </div>
          </div>
        ))}
        <div className="stat-card" style={{ '--accent': 'var(--violet)' }}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{total_users}</div>
          <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '100%' }} /></div>
        </div>
      </div>

      <div className="dash-grid">
        {/* ── Projects ──────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3 className="font-semibold">Projects</h3>
            <Link to="/projects" className="text-sm" style={{ color: 'var(--indigo)' }}>View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty"><div className="empty-icon">◫</div>No projects yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map(p => {
                const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                return (
                  <Link to={`/projects/${p.id}`} key={p.id} className="project-row">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs text-muted">{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted">{p.done}/{p.total} tasks done</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── My Tasks ──────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3 className="font-semibold">My Tasks</h3>
            <Link to="/tasks/my" className="text-sm" style={{ color: 'var(--indigo)' }}>View all →</Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="empty"><div className="empty-icon">✓</div>No tasks assigned</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myTasks.map(t => (
                <Link to={`/tasks/${t.id}`} key={t.id} className="task-row">
                  <span className={`badge status-${t.status}`}>{STATUS_LABELS[t.status]}</span>
                  <span className="text-sm truncate">{t.title}</span>
                  {t.due_date && (
                    <span className={`text-xs ${isPast(parseISO(t.due_date)) ? 'overdue-text' : 'text-muted'}`}>
                      {format(parseISO(t.due_date), 'MMM d')}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Overdue ──────────────────────────────── */}
        <div className="card dash-overdue">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3 className="font-semibold">Overdue Tasks</h3>
            <span className="badge priority-critical">{overdue.length}</span>
          </div>
          {overdue.length === 0 ? (
            <div className="empty"><div className="empty-icon">🎉</div>No overdue tasks!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overdue.map(t => (
                <Link to={`/tasks/${t.id}`} key={t.id} className="task-row overdue-row">
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-xs text-muted">{t.project_name}</div>
                  </div>
                  <span className="text-xs overdue-text">
                    {format(parseISO(t.due_date), 'MMM d')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
