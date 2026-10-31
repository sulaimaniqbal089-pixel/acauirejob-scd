// SQL for jobs: public search, employer management and admin moderation.
const { query, queryOne } = require('../config/database');
const { paginate } = require('../utils/pagination');
const { isJobOpen } = require('../utils/jobRules');

// A job is "open" when the employer has not closed it, the admin has not hidden it,
// and its deadline (if any) has not passed. Used for public listings and applying.
const OPEN_JOB_SQL = `j.status = 'active' AND j.is_hidden = 0 AND (j.deadline IS NULL OR j.deadline >= CURDATE())`;

const LIST_COLUMNS = `j.id, j.title, j.location, j.employment_type, j.experience_required,
  j.salary_min, j.salary_max, j.deadline, j.status, j.is_hidden, j.created_at,
  c.id AS company_id, c.name AS company_name`;

// "%" and "_" are wildcards in LIKE, so we escape them in the user's keyword.
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

async function search({ keyword, city, type, page, perPage }) {
  const where = [OPEN_JOB_SQL];
  const params = [];

  if (keyword) {
    const like = `%${escapeLike(keyword)}%`;
    where.push('(j.title LIKE ? OR c.name LIKE ? OR j.description LIKE ?)');
    params.push(like, like, like);
  }
  if (city) {
    where.push('j.location = ?');
    params.push(city);
  }
  if (type) {
    where.push('j.employment_type = ?');
    params.push(type);
  }

  const whereSql = where.join(' AND ');
  const from = 'FROM jobs j JOIN companies c ON c.id = j.company_id';

  const { total } = await queryOne(`SELECT COUNT(*) AS total ${from} WHERE ${whereSql}`, params);
  const pagination = paginate({ page, perPage, total });
  const jobs = await query(
    `SELECT ${LIST_COLUMNS} ${from} WHERE ${whereSql}
     ORDER BY j.created_at DESC, j.id DESC LIMIT ? OFFSET ?`,
    [...params, pagination.perPage, pagination.offset]
  );
  return { jobs, pagination };
}

function latestOpen(limit) {
  return query(
    `SELECT ${LIST_COLUMNS} FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE ${OPEN_JOB_SQL} ORDER BY j.created_at DESC, j.id DESC LIMIT ?`,
    [limit]
  );
}

function openCityCounts(limit) {
  return query(
    `SELECT j.location AS city, COUNT(*) AS total FROM jobs j
     WHERE ${OPEN_JOB_SQL} GROUP BY j.location ORDER BY total DESC, city LIMIT ?`,
    [limit]
  );
}

async function countOpen() {
  const row = await queryOne(`SELECT COUNT(*) AS total FROM jobs j WHERE ${OPEN_JOB_SQL}`);
  return row.total;
}

function findById(id) {
  return queryOne(
    `SELECT j.*, c.name AS company_name, c.industry AS company_industry,
            c.location AS company_location, c.website AS company_website,
            c.description AS company_description, c.user_id AS employer_id
     FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE j.id = ?`,
    [id]
  );
}

function listByCompany(companyId) {
  return query(
    `SELECT j.id, j.title, j.location, j.employment_type, j.status, j.is_hidden, j.deadline, j.created_at,
            (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
     FROM jobs j WHERE j.company_id = ? ORDER BY j.created_at DESC, j.id DESC`,
    [companyId]
  );
}

async function create(companyId, data) {
  const result = await query(
    `INSERT INTO jobs (company_id, title, description, requirements, location, employment_type,
                       experience_required, salary_min, salary_max, deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [companyId, data.title, data.description, data.requirements, data.location, data.employmentType,
      data.experienceRequired, data.salaryMin, data.salaryMax, data.deadline]
  );
  return result.insertId;
}

function update(id, data) {
  return query(
    `UPDATE jobs SET title = ?, description = ?, requirements = ?, location = ?, employment_type = ?,
                     experience_required = ?, salary_min = ?, salary_max = ?, deadline = ?
     WHERE id = ?`,
    [data.title, data.description, data.requirements, data.location, data.employmentType,
      data.experienceRequired, data.salaryMin, data.salaryMax, data.deadline, id]
  );
}

function setStatus(id, status) {
  return query('UPDATE jobs SET status = ? WHERE id = ?', [status, id]);
}

function setHidden(id, isHidden) {
  return query('UPDATE jobs SET is_hidden = ? WHERE id = ?', [isHidden ? 1 : 0, id]);
}

async function adminList({ search, page, perPage }) {
  const params = [];
  let where = '1 = 1';
  if (search) {
    const like = `%${escapeLike(search)}%`;
    where = '(j.title LIKE ? OR c.name LIKE ?)';
    params.push(like, like);
  }
  const from = 'FROM jobs j JOIN companies c ON c.id = j.company_id';
  const { total } = await queryOne(`SELECT COUNT(*) AS total ${from} WHERE ${where}`, params);
  const pagination = paginate({ page, perPage, total });
  const jobs = await query(
    `SELECT ${LIST_COLUMNS},
            (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
     ${from} WHERE ${where} ORDER BY j.created_at DESC, j.id DESC LIMIT ? OFFSET ?`,
    [...params, pagination.perPage, pagination.offset]
  );
  return { jobs, pagination };
}

function recent(limit) {
  return query(
    `SELECT ${LIST_COLUMNS} FROM jobs j JOIN companies c ON c.id = j.company_id
     ORDER BY j.created_at DESC, j.id DESC LIMIT ?`,
    [limit]
  );
}

module.exports = {
  isOpen: isJobOpen, search, latestOpen, openCityCounts, countOpen, findById, listByCompany,
  create, update, setStatus, setHidden, adminList, recent,
};
