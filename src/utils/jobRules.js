// The rule for "can people still apply for this job?" lives here so SQL-free code can use it.
// (jobModel.js has the matching SQL version, OPEN_JOB_SQL. Keep the two in sync.)
const { toLocalDate } = require('./format');

function isJobOpen(job) {
  if (!job || job.status !== 'active' || job.is_hidden) return false;
  if (!job.deadline) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toLocalDate(job.deadline) >= today;
}

module.exports = { isJobOpen };
