const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

// ── Verify JWT ────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar_color FROM users WHERE id = ?',
      [payload.id]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── Require admin role ────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ── Require project membership (or global admin) ──────────────
const requireProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id || req.params.id;
  if (req.user.role === 'admin') return next(); // global admins bypass

  const [rows] = await pool.query(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, req.user.id]
  );
  if (!rows.length) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  req.memberRole = rows[0].role;
  next();
};

// ── Require project-level admin ───────────────────────────────
const requireProjectAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  if (req.user.role === 'admin') return next();

  const [rows] = await pool.query(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, req.user.id]
  );
  if (!rows.length || rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Project admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireProjectMember, requireProjectAdmin };
