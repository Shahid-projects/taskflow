import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { format, isPast, parseISO } from 'date-fns';

const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', in_review:'In Review', done:'Done' };

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { api.get('/tasks/my').then(r => setTasks(r.data)); }, []);

  const grouped = {
    overdue:     tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'done'),
    todo:        tasks.filter(t => t.status === 'todo' && !(t.due_date && isPast(parseISO(t.due_date)))),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    in_review:   tasks.filter(t => t.status === 'in_review'),
    done:        tasks.filter(t => t.status === 'done'),
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <div className="empty-icon">🎉</div>
          <p>No tasks assigned to you yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grouped.overdue.length > 0 && (
            <Section title="⚠️ Overdue" tasks={grouped.overdue} navigate={navigate} isOverdue />
          )}
          {grouped.in_progress.length > 0 && (
            <Section title="In Progress" tasks={grouped.in_progress} navigate={navigate} />
          )}
          {grouped.in_review.length > 0 && (
            <Section title="In Review" tasks={grouped.in_review} navigate={navigate} />
          )}
          {grouped.todo.length > 0 && (
            <Section title="To Do" tasks={grouped.todo} navigate={navigate} />
          )}
          {grouped.done.length > 0 && (
            <Section title="Done" tasks={grouped.done} navigate={navigate} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, tasks, navigate, isOverdue }) {
  return (
    <div>
      <h3 style={{ fontSize:'0.85rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em',
        color: isOverdue ? 'var(--rose)' : 'var(--txt-2)', marginBottom:10 }}>
        {title} · {tasks.length}
      </h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {tasks.map((t, i) => (
          <div key={t.id}
            onClick={() => navigate(`/tasks/${t.id}`)}
            style={{
              display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
              borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
              cursor:'pointer', transition:'background .1s',
            }}
            onMouseOver={e => e.currentTarget.style.background='var(--surface)'}
            onMouseOut={e  => e.currentTarget.style.background=''}
          >
            <span className={`badge status-${t.status}`}>{STATUS_LABELS[t.status]}</span>
            <span className={`badge priority-${t.priority}`}>{t.priority}</span>
            <div style={{ flex:1 }}>
              <div className="font-medium text-sm">{t.title}</div>
              <div className="text-xs text-muted">{t.project_name}</div>
            </div>
            {t.due_date && (
              <span className={`text-xs ${isOverdue ? 'overdue-text' : 'text-muted'}`}>
                {format(parseISO(t.due_date), 'MMM d')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
