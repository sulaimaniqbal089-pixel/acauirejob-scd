// SQL for the users table (and the account-creation transaction).
const { query, queryOne, transaction } = require('../config/database');
const { ROLES } = require('../utils/constants');

function findById(id) {
  return queryOne('SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = ?', [id]);
}

// Includes password_hash. Only the login code should use this.
function findByEmail(email) {
  return queryOne('SELECT * FROM users WHERE email = ?', [email]);
}

function getPasswordHash(id) {
  return queryOne('SELECT password_hash FROM users WHERE id = ?', [id]).then((row) => row && row.password_hash);
}

function updatePassword(id, passwordHash) {
  return query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

function updateFullName(id, fullName, connection) {
  const sql = 'UPDATE users SET full_name = ? WHERE id = ?';
  return connection ? connection.query(sql, [fullName, id]) : query(sql, [fullName, id]);
}

// Creates the user AND its empty profile / company in one transaction.
async function createAccount({ fullName, email, passwordHash, role, companyName }) {
  return transaction(async (connection) => {
    const [result] = await connection.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [fullName, email, passwordHash, role]
    );
    const userId = result.insertId;

    if (role === ROLES.JOB_SEEKER) {
      await connection.query('INSERT INTO job_seeker_profiles (user_id) VALUES (?)', [userId]);
    } else if (role === ROLES.EMPLOYER) {
      await connection.query(
        'INSERT INTO companies (user_id, name, contact_email) VALUES (?, ?, ?)',
        [userId, companyName, email]
      );
    }
    return userId;
  });
}

module.exports = { findById, findByEmail, getPasswordHash, updatePassword, updateFullName, createAccount };
