const mysql = require('mysql2/promise');
require('dotenv').config();

// Support both Railway-style env vars and local .env vars
const dbConfig = {
  host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
  port:     process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
  user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'taskflow_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'Z',
};

const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log(`✅  MySQL connected → ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
