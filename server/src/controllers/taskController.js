const { validationResult } = require('express-validator');
const pool = require('../config/database');

const taskSelect = `
  SELECT t.*,
         u_a.name AS assignee_name, u_a.avatar_color AS assignee_color,
         u_c.name AS creator_name,
         p.name   AS project_name
  FROM tasks t
  JOIN projects p         ON p.id = t.project_id
  LEFT JOIN users u_a     ON u_a.id = t.assignee_id
  JOIN users u_c          ON u_c.id = t.creator_id`;

// GET /api/projects/:projectId/tasks
exports.listByProject = async (req, res) => {
  try {
    const { status, priority, assignee_id } = req.query;
    let sql    = `${taskSelect} WHERE t.project_id = ?`;
    const vals = [req.params.projectId];

    if (status)      { sql += ' AND t.status = ?';      vals.push(status); }
    if (priority)    { sql += ' AND t.priority = ?';    vals.push(priority); }
    if (assignee_id) { sql += ' AND t.assignee_id = ?'; vals.push(assignee_id); }

    sql += ' ORDER BY FIELD(t.priority,"critical","high","medium","low"), t.due_date ASC';

    const [rows] = await pool.query(sql, vals);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tasks/my   — tasks assigned to current user
exports.myTasks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${taskSelect} WHERE t.assignee_id = ? ORDER BY t.due_date ASC`, [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/projects/:projectId/tasks
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, description, priority, assignee_id, due_date } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, priority, assignee_id, due_date, project_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, priority || 'medium',
       assignee_id || null, due_date || null, req.params.projectId, req.user.id]
    );
    const [[task]] = await pool.query(`${taskSelect} WHERE t.id = ?`, [result.insertId]);
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tasks/:id
exports.get = async (req, res) => {
  try {
    const [[task]] = await pool.query(`${taskSelect} WHERE t.id = ?`, [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const [comments] = await pool.query(
      `SELECT tc.*, u.name AS user_name, u.avatar_color
       FROM task_comments tc JOIN users u ON u.id = tc.user_id
       WHERE tc.task_id = ? ORDER BY tc.created_at ASC`, [req.params.id]
    );
    res.json({ ...task, comments });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/tasks/:id
exports.update = async (req, res) => {
  const { title, description, status, priority, assignee_id, due_date } = req.body;
  try {
    await pool.query(
      `UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=? WHERE id=?`,
      [title, description || null, status, priority, assignee_id || null, due_date || null, req.params.id]
    );
    const [[task]] = await pool.query(`${taskSelect} WHERE t.id = ?`, [req.params.id]);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/tasks/:id/status
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const VALID = ['todo','in_progress','in_review','done'];
  if (!VALID.includes(status)) return res.status(422).json({ error: 'Invalid status' });

  try {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    const [[task]] = await pool.query(`${taskSelect} WHERE t.id = ?`, [req.params.id]);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/tasks/:id
exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/tasks/:id/comments
exports.addComment = async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(422).json({ error: 'Comment body required' });
  try {
    const [r] = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, body.trim()]
    );
    const [[comment]] = await pool.query(
      'SELECT tc.*, u.name AS user_name, u.avatar_color FROM task_comments tc JOIN users u ON u.id = tc.user_id WHERE tc.id = ?',
      [r.insertId]
    );
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
