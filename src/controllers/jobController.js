// /api/jobs: public search and details, plus employer create / edit / close / reopen.
const jobModel = require('../models/jobModel');
const companyModel = require('../models/companyModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/respond');
const { validate } = require('../utils/validate');
const { toInputDate, toLocalDate } = require('../utils/format');
const {
  ROLES, CITIES, JOB_TYPES, JOB_STATUSES, EXPERIENCE_LEVELS, JOBS_PER_PAGE,
} = require('../utils/constants');

// Reads the search filters from the URL, ignoring values that are not on our lists.
function readSearchFilters(query) {
  const text = (value) => (typeof value === 'string' ? value.trim().slice(0, 100) : '');
  return {
    keyword: text(query.keyword),
    city: CITIES.includes(query.city) ? query.city : '',
    type: JOB_TYPES.includes(query.type) ? query.type : '',
    page: query.page,
  };
}

// Loads a job and checks that the logged-in employer owns it.
async function getOwnedJob(req) {
  const job = await jobModel.findById(req.params.id);
  if (!job) throw new AppError(404, 'Job not found.');
  if (job.employer_id !== req.user.id) throw new AppError(403, 'You can only manage your own jobs.');
  return job;
}

// Hidden jobs can only be seen by their owner and by admins.
function canSeeJob(job, user) {
  if (!job.is_hidden) return true;
  return Boolean(user) && (user.role === ROLES.ADMIN || user.id === job.employer_id);
}

function validateJobInput(body) {
  const result = validate(body, {
    title: { label: 'Job title', required: true, min: 3, max: 120 },
    description: { label: 'Job description', required: true, min: 20, max: 5000 },
    requirements: { label: 'Requirements', required: true, min: 10, max: 3000 },
    location: { label: 'Location', required: true, oneOf: CITIES },
    employmentType: { label: 'Employment type', required: true, oneOf: JOB_TYPES },
    experienceRequired: { label: 'Experience', required: true, oneOf: EXPERIENCE_LEVELS },
    salaryMin: { label: 'Minimum salary', type: 'int', minValue: 0, maxValue: 10000000 },
    salaryMax: { label: 'Maximum salary', type: 'int', minValue: 0, maxValue: 10000000 },
    deadline: { label: 'Application deadline', type: 'date' },
  });

  const { values, errors } = result;
  if (values.salaryMin !== null && values.salaryMax !== null && values.salaryMax < values.salaryMin) {
    errors.salaryMax = 'Maximum salary must be at least the minimum salary.';
  }
  if (values.deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (toLocalDate(values.deadline) < today) errors.deadline = 'The deadline cannot be in the past.';
  }
  result.isValid = Object.keys(errors).length === 0;
  return result;
}

const list = asyncHandler(async (req, res) => {
  const filters = readSearchFilters(req.query);
  const { jobs, pagination } = await jobModel.search({ ...filters, perPage: JOBS_PER_PAGE });
  sendSuccess(res, { jobs, pagination });
});

const getOne = asyncHandler(async (req, res) => {
  const job = await jobModel.findById(req.params.id);
  if (!job || !canSeeJob(job, req.user)) throw new AppError(404, 'Job not found.');
  sendSuccess(res, { job: { ...job, deadline: toInputDate(job.deadline), is_open: jobModel.isOpen(job) } });
});

const listMine = asyncHandler(async (req, res) => {
  const company = await companyModel.getByUserId(req.user.id);
  sendSuccess(res, { jobs: await jobModel.listByCompany(company.id) });
});

const create = asyncHandler(async (req, res) => {
  const { values, errors, isValid } = validateJobInput(req.body);
  if (!isValid) throw new AppError(400, 'Please fix the highlighted fields.', errors);

  const company = await companyModel.getByUserId(req.user.id);
  const id = await jobModel.create(company.id, values);
  sendSuccess(res, { id, redirectTo: '/employer/jobs' }, 'Job published.', 201);
});

const update = asyncHandler(async (req, res) => {
  const job = await getOwnedJob(req);
  const { values, errors, isValid } = validateJobInput(req.body);
  if (!isValid) throw new AppError(400, 'Please fix the highlighted fields.', errors);

  await jobModel.update(job.id, values);
  sendSuccess(res, { redirectTo: '/employer/jobs' }, 'Job updated.');
});

const setStatus = asyncHandler(async (req, res) => {
  const job = await getOwnedJob(req);
  const status = req.body.status;
  if (!JOB_STATUSES.includes(status)) throw new AppError(400, 'Status must be active or closed.');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (status === 'active' && job.deadline && toLocalDate(job.deadline) < today) {
    throw new AppError(400, 'The deadline has passed. Edit the job and set a new deadline before reopening.');
  }

  await jobModel.setStatus(job.id, status);
  sendSuccess(res, {}, status === 'active' ? 'Job reopened.' : 'Job closed.');
});

module.exports = { list, getOne, listMine, create, update, setStatus, readSearchFilters, canSeeJob };
