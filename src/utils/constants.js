// Shared lists used by validation, forms and filters.
// To add a job type, city or application status, change it here.
const ROLES = { JOB_SEEKER: 'job_seeker', EMPLOYER: 'employer', ADMIN: 'admin' };

const ROLE_LABELS = { job_seeker: 'Job seeker', employer: 'Employer', admin: 'Administrator' };

const JOB_TYPES = ['Full-Time', 'Part-Time', 'Internship', 'Contract'];
const APPLICATION_STATUSES = ['Pending', 'Shortlisted', 'Rejected', 'Hired'];
const JOB_STATUSES = ['active', 'closed'];
const EXPERIENCE_LEVELS = ['Fresher', '1 year', '2 years', '3-5 years', '5+ years'];

const CITIES = [
  'Lahore', 'Islamabad', 'Karachi', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Remote',
];

const INDUSTRIES = [
  'Information Technology', 'Banking & Finance', 'Education', 'Healthcare',
  'Manufacturing', 'Logistics & Supply Chain', 'Retail & E-commerce',
  'Marketing & Media', 'Construction', 'Other',
];

const JOBS_PER_PAGE = 8;
const TABLE_ROWS_PER_PAGE = 15;

module.exports = {
  ROLES, ROLE_LABELS, JOB_TYPES, APPLICATION_STATUSES, JOB_STATUSES, EXPERIENCE_LEVELS,
  CITIES, INDUSTRIES, JOBS_PER_PAGE, TABLE_ROWS_PER_PAGE,
};
