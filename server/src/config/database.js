const mysql = require('mysql2/promise');
require('dotenv').config();

// Debug: log what env vars we have (remove after fixing)
console.log('ENV CHECK:', {
  MYSQLHOST:     process.env.MYSQLHOST     || 'NOT SET',
  MYSQLPORT:     process.env.MYSQLPORT     || 'NOT SET',
  MYSQLDATABASE: process.env.MYSQLDATABASE || 'NOT SET',
  DB_HOST:       process.env.DB_HOST       || 'NOT SET',
  MYSQL_URL:     process.env.MYSQL_URL     ? 'SET' : 'NOT SET',
  DATABASE_URL:  process.env.DATABASE_URL  ? 'SET' : 'NOT SET',
});

let pool;

// Try URL-based connection first (Railway provides MYSQL_URL)
const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (mysqlUrl) {
  console.log('Using MYSQL_URL connection string');
  pool = mysql.createPool(mysqlUrl + '?waitForConnections=true&connectionLimit=10');
} else {
  const dbConfig = {
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'railway',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           'Z',
  };
  console.log('Using config connection:', dbConfig.host, dbConfig.port, dbConfig.database);
  pool = mysql.createPool(dbConfig);
}

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;