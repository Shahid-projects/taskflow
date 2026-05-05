-- ============================================================
-- TaskFlow - Team Task Manager Database Schema
-- Compatible with MySQL Workbench 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS taskflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskflow_db;

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(191)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,
  role         ENUM('admin','member') NOT NULL DEFAULT 'member',
  avatar_color VARCHAR(7)    NOT NULL DEFAULT '#6366f1',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- ─── PROJECTS ───────────────────────────────────────────────
CREATE TABLE projects (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  description TEXT,
  status      ENUM('active','archived') NOT NULL DEFAULT 'active',
  owner_id    INT UNSIGNED  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id),
  INDEX idx_status (status)
);

-- ─── PROJECT MEMBERS (junction) ──────────────────────────────
CREATE TABLE project_members (
  project_id  INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  role        ENUM('admin','member') NOT NULL DEFAULT 'member',
  joined_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- ─── TASKS ───────────────────────────────────────────────────
CREATE TABLE tasks (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  description TEXT,
  status      ENUM('todo','in_progress','in_review','done') NOT NULL DEFAULT 'todo',
  priority    ENUM('low','medium','high','critical')        NOT NULL DEFAULT 'medium',
  project_id  INT UNSIGNED  NOT NULL,
  assignee_id INT UNSIGNED  NULL,
  creator_id  INT UNSIGNED  NOT NULL,
  due_date    DATE          NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (creator_id)  REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_project  (project_id),
  INDEX idx_assignee (assignee_id),
  INDEX idx_status   (status),
  INDEX idx_due_date (due_date)
);

-- ─── TASK COMMENTS ───────────────────────────────────────────
CREATE TABLE task_comments (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id    INT UNSIGNED  NOT NULL,
  user_id    INT UNSIGNED  NOT NULL,
  body       TEXT          NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task (task_id)
);

-- ─── SEED DATA ───────────────────────────────────────────────
-- Default admin user  (password: Admin@123)
INSERT INTO users (name, email, password, role, avatar_color) VALUES
('Admin User',  'admin@taskflow.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',  '#6366f1'),
('Alice Johnson','alice@taskflow.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', '#10b981'),
('Bob Martinez', 'bob@taskflow.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', '#f59e0b');

INSERT INTO projects (name, description, owner_id) VALUES
('Website Redesign', 'Full redesign of the company website with modern UI/UX', 1),
('Mobile App v2',    'Next major version of the mobile application',           1);

INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'admin'), (1, 2, 'member'), (1, 3, 'member'),
(2, 1, 'admin'), (2, 2, 'member');

INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, creator_id, due_date) VALUES
('Design new homepage',    'Create wireframes and mockups',          'in_progress', 'high',   1, 2, 1, DATE_ADD(CURDATE(), INTERVAL 7  DAY)),
('Set up CI/CD pipeline',  'Configure GitHub Actions for deployment','todo',        'medium', 1, 3, 1, DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
('Write API documentation','Document all REST endpoints with examples','done',      'low',    1, 2, 1, DATE_SUB(CURDATE(), INTERVAL 2  DAY)),
('Implement auth flow',    'JWT-based login and registration',       'in_review',   'critical',2, 3, 1, DATE_ADD(CURDATE(), INTERVAL 3  DAY)),
('Push notifications',     'Integrate FCM for push notifications',   'todo',        'medium', 2, 2, 1, DATE_SUB(CURDATE(), INTERVAL 1  DAY));


