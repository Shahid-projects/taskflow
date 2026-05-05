const pool = require('../config/database');

// GET /api/dashboard
exports.stats = async (req, res) => {
  try {
    const userId  = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // ── Task counts by status ─────────────────────────────────
    let taskCountSql, taskCountParams;
    if (isAdmin) {
      taskCountSql    = 'SELECT status, COUNT(*) AS cnt FROM tasks GROUP BY status';
      taskCountParams = [];
    } else {
      taskCountSql    = `SELECT t.status, COUNT(*) AS cnt FROM tasks t
                         JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
                         GROUP BY t.status`;
      taskCountParams = [userId];
    }
    const [taskCounts] = await pool.query(taskCountSql, taskCountParams);
    const byStatus = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    taskCounts.forEach(r => { byStatus[r.status] = r.cnt; });

    // ── Overdue tasks ─────────────────────────────────────────
    let overdueSql, overdueParams;
    if (isAdmin) {
      overdueSql    = `SELECT t.*, u.name AS assignee_name, u.avatar_color AS assignee_color, p.name AS project_name
                       FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id JOIN projects p ON p.id = t.project_id
                       WHERE t.due_date < CURDATE() AND t.status != 'done' ORDER BY t.due_date ASC LIMIT 10`;
      overdueParams = [];
    } else {
      overdueSql    = `SELECT t.*, u.name AS assignee_name, u.avatar_color AS assignee_color, p.name AS project_name
                       FROM tasks t
                       JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
                       LEFT JOIN users u ON u.id = t.assignee_id JOIN projects p ON p.id = t.project_id
                       WHERE t.due_date < CURDATE() AND t.status != 'done' ORDER BY t.due_date ASC LIMIT 10`;
      overdueParams = [userId];
    }
    const [overdue] = await pool.query(overdueSql, overdueParams);

    // ── My assigned tasks (upcoming) ──────────────────────────
    const [myTasks] = await pool.query(
      `SELECT t.*, p.name AS project_name FROM tasks t JOIN projects p ON p.id = t.project_id
       WHERE t.assignee_id = ? AND t.status != 'done' ORDER BY t.due_date ASC LIMIT 5`, [userId]
    );

    // ── Project overview ──────────────────────────────────────
    let projectsSql, projectsParams;
    if (isAdmin) {
      projectsSql    = `SELECT p.id, p.name, p.status,
                         SUM(t.status = 'done')        AS done,
                         SUM(t.status != 'done')       AS remaining,
                         COUNT(t.id)                   AS total
                        FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
                        GROUP BY p.id ORDER BY p.created_at DESC LIMIT 6`;
      projectsParams = [];
    } else {
      projectsSql    = `SELECT p.id, p.name, p.status,
                         SUM(t.status = 'done')        AS done,
                         SUM(t.status != 'done')       AS remaining,
                         COUNT(t.id)                   AS total
                        FROM projects p
                        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
                        LEFT JOIN tasks t ON t.project_id = p.id
                        GROUP BY p.id ORDER BY p.created_at DESC LIMIT 6`;
      projectsParams = [userId];
    }
    const [projects] = await pool.query(projectsSql, projectsParams);

    // ── Total members (admin only) ────────────────────────────
    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) AS total_users FROM users');

    res.json({ byStatus, overdue, myTasks, projects, total_users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
