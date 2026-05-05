 require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://taskflow-client.up.railway.app', // update with your Railway URL
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── API Routes ────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes    = require('./routes/tasks');
const { standalone: taskStandalone } = require('./routes/tasks');
const dashboardCtrl = require('./controllers/dashboardController');
const { authenticate } = require('./middleware/auth');

app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', (req, res, next) => {
  req.params.projectId = req.params.projectId; next();
}, taskRoutes);
app.use('/api/tasks',    taskStandalone);
app.get('/api/dashboard', authenticate, dashboardCtrl.stats);

// ── Serve React build (production) ───────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuild));
  app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  TaskFlow API running on port ${PORT}`));

module.exports = app;
