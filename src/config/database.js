// The single MySQL connection pool used by the whole application.
const mysql = require('mysql2/promise');
const { db } = require('./env');

const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

// pool.query() still uses "?" placeholders, so values are always escaped
// by the driver (user input is never concatenated into SQL text).
// We use query() instead of execute() because execute() has a known problem
// with numeric LIMIT/OFFSET placeholders on MySQL 8.
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Runs several statements as one unit: all succeed, or none are saved.
async function transaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, query, queryOne, transaction };
