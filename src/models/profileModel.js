// SQL for job seeker profiles and CV file details.
const { query, queryOne, transaction } = require('../config/database');
const userModel = require('./userModel');

function getByUserId(userId) {
  return queryOne(
    `SELECT u.id AS user_id, u.full_name, u.email, p.phone, p.city, p.education,
            p.experience, p.skills, p.summary, p.cv_filename, p.cv_original_name, p.cv_uploaded_at
     FROM users u
     LEFT JOIN job_seeker_profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
}

function update(userId, { fullName, phone, city, education, experience, skills, summary }) {
  return transaction(async (connection) => {
    await userModel.updateFullName(userId, fullName, connection);
    await connection.query(
      `UPDATE job_seeker_profiles
       SET phone = ?, city = ?, education = ?, experience = ?, skills = ?, summary = ?
       WHERE user_id = ?`,
      [phone, city, education, experience, skills, summary, userId]
    );
  });
}

function saveCv(userId, filename, originalName) {
  return query(
    'UPDATE job_seeker_profiles SET cv_filename = ?, cv_original_name = ?, cv_uploaded_at = NOW() WHERE user_id = ?',
    [filename, originalName, userId]
  );
}

function clearCv(userId) {
  return query(
    'UPDATE job_seeker_profiles SET cv_filename = NULL, cv_original_name = NULL, cv_uploaded_at = NULL WHERE user_id = ?',
    [userId]
  );
}

module.exports = { getByUserId, update, saveCv, clearCv };
