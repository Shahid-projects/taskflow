# 🚀 TaskFlow — Team Task Manager

A full-stack project management app with role-based access, Kanban boards, and real-time task tracking.

> **Stack:** Node.js · Express · MySQL · React · Vite · JWT

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | JWT-based signup / login with bcrypt password hashing |
| 👥 Role-Based Access | Global roles (Admin / Member) + per-project roles |
| 📁 Project Management | Create, update, archive projects; manage team members |
| ✅ Task Tracking | Create, assign, update tasks with status + priority |
| 📊 Kanban Board | Drag-free 4-column board (To Do → In Progress → In Review → Done) |
| 📋 List View | Sortable table view with filters |
| 🔔 Overdue Detection | Dashboard highlights tasks past due date |
| 💬 Comments | Per-task comment threads |
| 📈 Dashboard | Stats by status, overdue tasks, project progress |
| 🛡️ RBAC API | Every endpoint checks role and membership |

---

## 🗂 Project Structure

```
taskflow/
├── server/                  # Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js  # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT verify + role guards
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   └── tasks.js
│   │   └── app.js           # Express entry
│   ├── schema.sql            # Full DB schema + seed data
│   ├── .env.example
│   └── package.json
│
├── client/                  # React + Vite SPA
│   ├── src/
│   │   ├── api/client.js    # Axios instance
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectDetailPage.jsx  ← Kanban + List + Team
│   │   │   ├── TaskDetailPage.jsx
│   │   │   ├── MyTasksPage.jsx
│   │   │   └── UsersPage.jsx
│   │   └── components/layout/Layout.jsx
│   ├── vite.config.js
│   └── package.json
│
├── railway.toml              # Railway deploy config
└── package.json              # Root scripts
```

---

## ⚙️ Database Schema

```
users            — id, name, email, password, role (admin|member)
projects         — id, name, description, status, owner_id
project_members  — project_id, user_id, role (admin|member)
tasks            — id, title, description, status, priority, project_id, assignee_id, due_date
task_comments    — id, task_id, user_id, body
```

---

## 🔌 REST API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user |
| GET | `/api/auth/users` | Admin | List all users |

### Projects
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/projects` | Auth | List accessible projects |
| POST | `/api/projects` | Auth | Create project |
| GET | `/api/projects/:id` | Member | Get project + members |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Delete project |
| POST | `/api/projects/:id/members` | Project Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/projects/:projectId/tasks` | Member | List tasks (filterable) |
| POST | `/api/projects/:projectId/tasks` | Member | Create task |
| GET | `/api/tasks/my` | Auth | My assigned tasks |
| GET | `/api/tasks/:id` | Auth | Task detail + comments |
| PUT | `/api/tasks/:id` | Creator/Assignee/Admin | Update task |
| PATCH | `/api/tasks/:id/status` | Auth | Quick status update |
| DELETE | `/api/tasks/:id` | Creator/Admin | Delete task |
| POST | `/api/tasks/:id/comments` | Auth | Add comment |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Stats, overdue, project progress |

---

## 🛠 Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0 (via MySQL Workbench)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
npm run install:all
```

### 2. Database Setup (MySQL Workbench)

1. Open MySQL Workbench
2. Connect to your local server
3. Open `server/schema.sql`
4. Click **⚡ Execute** (or Ctrl+Shift+Enter)
5. This creates the `taskflow_db` database with tables and seed data

### 3. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
JWT_SECRET=your_super_secret_key_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskflow_db
CLIENT_URL=http://localhost:5173
```

### 4. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App running at http://localhost:5173
```

### 5. Demo Login

| Email | Password | Role |
|---|---|---|
| `admin@taskflow.com` | `password` | Admin |
| `alice@taskflow.com` | `password` | Member |
| `bob@taskflow.com` | `password` | Member |

> ⚠️ These seeds use a placeholder hash. Update `schema.sql` with real bcrypt hashes for production, or just sign up a new account.

---

## 🚂 Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/taskflow.git
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) → New Project
2. Choose **Deploy from GitHub repo** → select your repo

### 3. Add MySQL Database

1. In your Railway project → **+ New** → **Database** → **MySQL**
2. Railway auto-sets `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

### 4. Run Schema on Railway MySQL

1. In Railway MySQL service → **Connect** tab → copy the connection string
2. Run: `mysql -h HOST -P PORT -u USER -pPASSWORD DATABASE < server/schema.sql`
   Or use **Railway's MySQL GUI** / any MySQL client

### 5. Set Environment Variables

In Railway → your service → **Variables**:

```
JWT_SECRET=your_long_random_secret
NODE_ENV=production
CLIENT_URL=https://your-app.up.railway.app
```

### 6. Deploy

Railway detects `railway.toml` and runs:
- **Build:** `npm run install:all && npm run build` (installs deps + builds React)
- **Start:** `npm start` (serves API + static React files)

Your app will be live at `https://your-app.up.railway.app` 🎉

---

## 🎯 Role-Based Access Summary

| Action | Member | Project Admin | Global Admin |
|---|---|---|---|
| View own projects | ✅ | ✅ | ✅ |
| Create project | ✅ | ✅ | ✅ |
| Add/remove members | ❌ | ✅ | ✅ |
| Create tasks in project | ✅ | ✅ | ✅ |
| Edit any task | ❌ | ✅ | ✅ |
| Delete project | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Access all projects | ❌ | ❌ | ✅ |

---

## 📽 Demo Video Script (2–5 min)

1. **Signup / Login** — Show signup flow, then login as admin
2. **Dashboard** — Walk through stats, overdue tasks, project progress
3. **Create Project** — New project, show it in grid
4. **Add Tasks** — Create tasks with different priorities and assignees
5. **Kanban Board** — Show board, move a task status with the → button
6. **List View** — Filter by status/priority
7. **Task Detail** — Edit task, add a comment
8. **My Tasks** — Login as member, show personal task view
9. **Team Tab** — Show project members

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18 |
| API Framework | Express 4 |
| Database | MySQL 8 via mysql2 |
| Authentication | JWT + bcryptjs |
| Validation | express-validator |
| Frontend | React 18 + Vite 5 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Dates | date-fns |
| Notifications | react-hot-toast |
| Deployment | Railway |

---

## 📄 License

MIT — Free to use for educational and commercial purposes.
