import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import './TaskDetail.css';

const STATUSES   = ['todo','in_progress','in_review','done'];
const PRIORITIES = ['low','medium','high','critical'];
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', in_review:'In Review', done:'Done' };

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [task,    setTask]    = useState(null);
  const [users,   setUsers]   = useState([]);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({});
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);

  const load = () => api.get(`/tasks/${id}`).then(r => { setTask(r.data); setForm(r.data); });

  useEffect(() => {
    load();
    if (isAdmin) api.get('/auth/users').then(r => setUsers(r.data));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/tasks/${id}`, {
        title: form.title, description: form.description,
        status: form.status, priority: form.priority,
        assignee_id: form.assignee_id || null, due_date: form.due_date || null,
      });
      setTask(data); setEditing(false);
      toast.success('Task updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('Task deleted');
    navigate(-1);
  };

  const postComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    const { data } = await api.post(`/tasks/${id}/comments`, { body: comment });
    setTask(t => ({ ...t, comments: [...(t.comments || []), data] }));
    setComment('');
  };

  if (!task) return <div className="page-loader"><div className="spinner" /></div>;

  const canEdit = isAdmin || task.creator_id === user.id || task.assignee_id === user.id;

  return (
    <div className="task-detail">
      {/* ── Back ──────────────────────────────────────────── */}
      <button className="btn-icon" style={{ marginBottom: 12 }} onClick={() => navigate(-1)}>← Back</button>

      <div className="task-detail-grid">
        {/* ── Main ────────────────────────────────────────── */}
        <div>
          <div className="card">
            {editing ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={form.title}
                    onChange={e => setForm(f => ({...f, title:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" style={{ minHeight:100 }} value={form.description || ''}
                    onChange={e => setForm(f => ({...f, description:e.target.value}))} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status}
                      onChange={e => setForm(f => ({...f, status:e.target.value}))}>
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={form.priority}
                      onChange={e => setForm(f => ({...f, priority:e.target.value}))}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input className="form-input" type="date" value={form.due_date?.slice(0,10) || ''}
                      onChange={e => setForm(f => ({...f, due_date:e.target.value}))} />
                  </div>
                  {isAdmin && (
                    <div className="form-group">
                      <label className="form-label">Assignee</label>
                      <select className="form-input" value={form.assignee_id || ''}
                        onChange={e => setForm(f => ({...f, assignee_id:e.target.value}))}>
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-3" style={{ justifyContent:'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={save} disabled={saving}>
                    {saving ? <span className="spinner" /> : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between" style={{ marginBottom:16 }}>
                  <div className="flex gap-2 items-center">
                    <span className={`badge status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                    <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={deleteTask}>Delete</button>
                    </div>
                  )}
                </div>
                <h2 style={{ fontSize:'1.2rem', fontWeight:700, letterSpacing:'-0.02em', marginBottom:10 }}>
                  {task.title}
                </h2>
                {task.description
                  ? <p style={{ color:'var(--txt-2)', fontSize:'0.9rem', lineHeight:1.6 }}>{task.description}</p>
                  : <p style={{ color:'var(--txt-3)', fontSize:'0.85rem', fontStyle:'italic' }}>No description</p>
                }
              </>
            )}
          </div>

          {/* ── Comments ────────────────────────────────── */}
          <div className="card" style={{ marginTop:14 }}>
            <h3 className="font-semibold" style={{ marginBottom:14 }}>
              Comments ({task.comments?.length || 0})
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
              {(task.comments || []).map(c => (
                <div key={c.id} className="comment">
                  <div className="avatar" style={{ background: c.avatar_color }}>
                    {c.user_name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.user_name}</span>
                      <span className="text-xs text-muted">{format(new Date(c.created_at),'MMM d, h:mm a')}</span>
                    </div>
                    <p style={{ fontSize:'0.875rem', marginTop:4, color:'var(--txt-2)' }}>{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={postComment} className="flex gap-2">
              <input className="form-input" style={{ flex:1 }} value={comment}
                onChange={e => setComment(e.target.value)} placeholder="Add a comment..." />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!comment.trim()}>Post</button>
            </form>
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <h4 className="font-semibold text-sm" style={{ marginBottom:14, color:'var(--txt-2)', textTransform:'uppercase', letterSpacing:'.05em' }}>Details</h4>
            <dl className="task-details-list">
              <dt>Project</dt>
              <dd><Link to={`/projects/${task.project_id}`} style={{ color:'var(--indigo)' }}>{task.project_name}</Link></dd>
              <dt>Assignee</dt>
              <dd>
                {task.assignee_name ? (
                  <div className="flex items-center gap-2">
                    <div className="avatar" style={{ width:22, height:22, fontSize:'0.6rem', background:task.assignee_color }}>
                      {task.assignee_name.slice(0,2).toUpperCase()}
                    </div>
                    {task.assignee_name}
                  </div>
                ) : '—'}
              </dd>
              <dt>Creator</dt>
              <dd>{task.creator_name}</dd>
              <dt>Due Date</dt>
              <dd>{task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '—'}</dd>
              <dt>Created</dt>
              <dd>{format(new Date(task.created_at), 'MMM d, yyyy')}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
