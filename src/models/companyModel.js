// SQL for employer company profiles.
const { query, queryOne } = require('../config/database');

function getByUserId(userId) {
  return queryOne('SELECT * FROM companies WHERE user_id = ?', [userId]);
}

function update(userId, { name, industry, location, website, description, contactEmail }) {
  return query(
    `UPDATE companies
     SET name = ?, industry = ?, location = ?, website = ?, description = ?, contact_email = ?
     WHERE user_id = ?`,
    [name, industry, location, website, description, contactEmail, userId]
  );
}

module.exports = { getByUserId, update };
