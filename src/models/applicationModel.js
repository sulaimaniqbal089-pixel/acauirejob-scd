// SQL for job applications.
const { query, queryOne } = require('../config/database');

function create({ jobId, seekerId, coverMessage }) {
  return query(
    'INSERT INTO applications (job_id, seeker_id, cover_message) VALUES (?, ?, ?)',
    [jobId, seekerId, coverMessage]
  ).then((result) => result.insertId);
}

function findByJobAndSeeker(jobId, seekerId) {
  return queryOne('SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?', [jobId, seekerId]);
}

// One application with everything the detail pages need.
function findDetail(id) {
  return queryOne(
    `SELECT a.id, a.job_id, a.seeker_id, a.cover_message, a.status, a.created_at, a.updated_at,
            j.title AS job_title, j.location AS job_location, j.employment_type, j.status AS job_status,
            c.id AS company_id, c.name AS company_name, c.user_id AS employer_id,
            u.full_name AS seeker_name, u.email AS seeker_email,
            p.phone, p.city, p.education, p.experience, p.skills, p.summary,
            p.cv_filename, p.cv_original_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN users u ON u.id = a.seeker_id
     LEFT JOIN job_seeker_profiles p ON p.user_id = a.seeker_id
     WHERE a.id = ?`,
    [id]
  );
}

function listBySeeker(seekerId, limit = 100) {
  return query(
    `SELECT a.id, a.status, a.created_at, j.id AS job_id, j.title AS job_title,
            j.location AS job_location, j.employment_type, c.name AS company_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.seeker_id = ?
     ORDER BY a.created_at DESC, a.id DESC LIMIT ?`,
    [seekerId, limit]
  );
}

function listByCompany(companyId, { status, jobId, limit = 200 } = {}) {
  const where = ['j.company_id = ?'];
  const params = [companyId];
  if (status) {
    where.push('a.status = ?');
    params.push(status);
  }
  if (jobId) {
    where.push('a.job_id = ?');
    params.push(jobId);
  }
  return query(
    `SELECT a.id, a.status, a.created_at, j.id AS job_id, j.title AS job_title,
            u.full_name AS seeker_name, u.email AS seeker_email, p.city, p.cv_filename IS NOT NULL AS has_cv
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN users u ON u.id = a.seeker_id
     LEFT JOIN job_seeker_profiles p ON p.user_id = a.seeker_id
     WHERE ${where.join(' AND ')}
     ORDER BY a.created_at DESC, a.id DESC LIMIT ?`,
    [...params, limit]
  );
}

function updateStatus(id, status) {
  return query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
}

async function seekerStats(seekerId) {
  const rows = await query(
    'SELECT status, COUNT(*) AS total FROM applications WHERE seeker_id = ? GROUP BY status',
    [seekerId]
  );
  const byStatus = Object.fromEntries(rows.map((row) => [row.status, row.total]));
  return {
    total: rows.reduce((sum, row) => sum + row.total, 0),
    pending: byStatus.Pending || 0,
    shortlisted: byStatus.Shortlisted || 0,
  };
}

async function companyStats(companyId) {
  const jobs = await queryOne(
    `SELECT COUNT(*) AS total, COALESCE(SUM(status = 'active'), 0) AS active,
            COALESCE(SUM(status = 'closed'), 0) AS closed
     FROM jobs WHERE company_id = ?`,
    [companyId]
  );
  const applications = await queryOne(
    `SELECT COUNT(*) AS total FROM applications a
     JOIN jobs j ON j.id = a.job_id WHERE j.company_id = ?`,
    [companyId]
  );
  return {
    totalJobs: Number(jobs.total),
    activeJobs: Number(jobs.active),
    closedJobs: Number(jobs.closed),
    applications: applications.total,
  };
}

module.exports = {
  create, findByJobAndSeeker, findDetail, listBySeeker, listByCompany,
  updateStatus, seekerStats, companyStats,
};
