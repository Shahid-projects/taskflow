const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool   = require('../config/database');

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899'];

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/signup
exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hash  = await bcrypt.hash(password, 10);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, avatar_color) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hash, color]
    );

    const user  = { id: result.insertId, name: name.trim(), email: email.toLowerCase(), role: 'member', avatar_color: color };
    const token = signToken(user.id);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok   = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    const token = signToken(user.id);

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ user: req.user });
};

// GET /api/auth/users  (admin only — for assigning tasks)
exports.listUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar_color, created_at FROM users ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
