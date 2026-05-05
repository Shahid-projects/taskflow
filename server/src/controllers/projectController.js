const { validationResult } = require('express-validator');
const pool = require('../config/database');

// GET /api/projects
exports.list = async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await pool.query(`
        SELECT p.*, u.name AS owner_name,
               COUNT(DISTINCT pm.user_id) AS member_count,
               COUNT(DISTINCT t.id)       AS task_count
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC`);
    } else {
      [rows] = await pool.query(`
        SELECT p.*, u.name AS owner_name, pm2.role AS my_role,
               COUNT(DISTINCT pm.user_id) AS member_count,
               COUNT(DISTINCT t.id)       AS task_count
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        JOIN project_members pm2 ON pm2.project_id = p.id AND pm2.user_id = ?
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC`, [req.user.id]);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/projects
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, description } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name.trim(), description || null, req.user.id]
    );
    const projectId = result.insertId;

    // Add creator as admin member
    await conn.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, "admin")',
      [projectId, req.user.id]
    );

    await conn.commit();

    const [[project]] = await conn.query(`
      SELECT p.*, u.name AS owner_name, 0 AS member_count, 0 AS task_count
      FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?`, [projectId]);

    res.status(201).json(project);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/projects/:id
exports.get = async (req, res) => {
  try {
    const [[project]] = await pool.query(`
      SELECT p.*, u.name AS owner_name FROM projects p
      JOIN users u ON u.id = p.owner_id WHERE p.id = ?`, [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role AS global_role, u.avatar_color, pm.role AS project_role
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ?`, [req.params.id]);

    res.json({ ...project, members });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/projects/:id
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, description, status } = req.body;
  try {
    await pool.query(
      'UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description || null, status || 'active', req.params.id]
    );
    const [[project]] = await pool.query(
      'SELECT p.*, u.name AS owner_name FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?',
      [req.params.id]
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/projects/:id
exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res) => {
  const { user_id, role = 'member' } = req.body;
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
      [req.params.id, user_id, role]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
