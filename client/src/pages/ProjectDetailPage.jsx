import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import './ProjectDetail.css';

const STATUSES = ['todo','in_progress','in_review','done'];
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', in_review:'In Review', done:'Done' };
const PRIORITIES = ['low','medium','high','critical'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [showTask, setShowTask] = useState(false);
  const [filter, setFilter]   = useState({ status: '', priority: '' });
  const [form, setForm]       = useState({ title:'', description:'', priority:'medium', assignee_id:'', due_date:'' });
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState('board');

  const loadTasks = () => {
    const params = {};
    if (filter.status)   params.status   = filter.status;
    if (filter.priority) params.priority = filter.priority;
    api.get(`/projects/${id}/tasks`, { params }).then(r => setTasks(r.data));
  };

  useEffect(() => {
    api.get(`/projects/${id}`).then(r => setProject(r.data)).catch(() => navigate('/projects'));
    if (isAdmin) api.get('/auth/users').then(r => setUsers(r.data));
  }, [id]);

  useEffect(() => { loadTasks(); }, [id, filter]);

  const canManage = isAdmin || project?.members?.find(m => m.id === user.id)?.project_role === 'admin';

  const createTask = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/projects/${id}/tasks`, form);
      toast.success('Task created');
      setShowTask(false);
      setForm({ title:'', description:'', priority:'medium', assignee_id:'', due_date:'' });
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const updateStatus = async (taskId, status) => {
    try {
      const updated = await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks(ts => ts.map(t => t.id === taskId ? updated.data : t));
    } catch { toast.error('Failed to update status'); }
  };

  const tasksByStatus = status => tasks.filter(t => t.status === status);

  if (!project) return <div className="page-loader"><div className="spinner" /></div>;

  const memberMap = {};
  (project.members || []).forEach(m => { memberMap[m.id] = m; });
  const assignableUsers = isAdmin ? users : (project.members || []);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <button className="btn-icon" style={{ marginBottom: 4 }} onClick={() => navigate('/projects')}>← Back</button>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowTask(true)}>+ Add Task</button>
        )}
      </div>

      {/* ── Sub-tabs ─────────────────────────────────────── */}
      <div className="tabs">
        <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Kanban Board</button>
        <button className={`tab ${tab === 'list'  ? 'active' : ''}`} onClick={() => setTab('list')}>List</button>
        <button className={`tab ${tab === 'team'  ? 'active' : ''}`} onClick={() => setTab('team')}>Team ({project.members?.length || 0})</button>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      {tab !== 'team' && (
        <div className="filters">
          <select className="form-input filter-select" value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select className="form-input filter-select" value={filter.priority}
            onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          {(filter.status || filter.priority) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status:'', priority:'' })}>Clear</button>
          )}
        </div>
      )}

      {/* ── Board ────────────────────────────────────────── */}
      {tab === 'board' && (
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <span className={`badge status-${status}`}>{STATUS_LABELS[status]}</span>
                <span className="text-xs text-muted">{tasksByStatus(status).length}</span>
              </div>
              <div className="kanban-cards">
                {tasksByStatus(status).map(t => (
                  <TaskCard key={t.id} task={t} onStatusChange={updateStatus}
                    onClick={() => navigate(`/tasks/${t.id}`)} />
                ))}
                {tasksByStatus(status).length === 0 && (
                  <div className="kanban-empty">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── List ─────────────────────────────────────────── */}
      {tab === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {tasks.length === 0 ? (
            <div className="empty"><div className="empty-icon">✓</div>No tasks</div>
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} className="task-table-row" onClick={() => navigate(`/tasks/${t.id}`)}>
                    <td className="font-medium">{t.title}</td>
                    <td><span className={`badge status-${t.status}`}>{STATUS_LABELS[t.status]}</span></td>
                    <td><span className={`badge priority-${t.priority}`}>{t.priority}</span></td>
                    <td>
                      {t.assignee_name ? (
                        <div className="flex items-center gap-2">
                          <div className="avatar" style={{ width:22, height:22, fontSize:'0.6rem', background: t.assignee_color }}>
                            {t.assignee_name.slice(0,2).toUpperCase()}
                          </div>
                          <span className="text-sm">{t.assignee_name}</span>
                        </div>
                      ) : <span className="text-muted text-sm">—</span>}
                    </td>
                    <td className={`text-sm ${t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'done' ? 'overdue-text' : 'text-muted'}`}>
                      {t.due_date ? format(parseISO(t.due_date), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Team ─────────────────────────────────────────── */}
      {tab === 'team' && (
        <div className="members-grid">
          {(project.members || []).map(m => (
            <div key={m.id} className="card member-card">
              <div className="avatar" style={{ width:44, height:44, fontSize:'1rem', background: m.avatar_color }}>
                {m.name.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-muted">{m.email}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <span className="badge status-in_progress">{m.project_role}</span>
                  <span className="badge status-todo">{m.global_role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Task Modal ─────────────────────────────── */}
      {showTask && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTask(false)}>
          <div className="modal">
            <h3 className="modal-title">New Task</h3>
            <form onSubmit={createTask} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="Implement login page" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Task details..." />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority}
                    onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.due_date}
                    onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-input" value={form.assignee_id}
                  onChange={e => setForm(f => ({...f, assignee_id: e.target.value}))}>
                  <option value="">Unassigned</option>
                  {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3" style={{ justifyContent:'flex-end', marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onClick }) {
  const NEXT = { todo:'in_progress', in_progress:'in_review', in_review:'done', done:'todo' };
  return (
    <div className="kanban-card" onClick={onClick}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
        <button className="btn-icon btn-sm" title="Move to next status"
          onClick={e => { e.stopPropagation(); onStatusChange(task.id, NEXT[task.status]); }}>
          →
        </button>
      </div>
      <div className="kanban-card-title">{task.title}</div>
      {task.description && <div className="kanban-card-desc">{task.description}</div>}
      <div className="kanban-card-footer">
        {task.assignee_name ? (
          <div className="flex items-center gap-2">
            <div className="avatar" style={{ width:20, height:20, fontSize:'0.55rem', background: task.assignee_color }}>
              {task.assignee_name.slice(0,2).toUpperCase()}
            </div>
            <span className="text-xs text-muted">{task.assignee_name.split(' ')[0]}</span>
          </div>
        ) : <span className="text-xs text-muted">Unassigned</span>}
        {task.due_date && (
          <span className={`text-xs ${isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'overdue-text' : 'text-muted'}`}>
            📅 {format(parseISO(task.due_date), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}
