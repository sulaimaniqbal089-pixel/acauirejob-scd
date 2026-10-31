// /api/applications: apply, track, review and change status.
const applicationModel = require('../models/applicationModel');
const companyModel = require('../models/companyModel');
const jobModel = require('../models/jobModel');
const profileModel = require('../models/profileModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/respond');
const { validate } = require('../utils/validate');
const { ROLES, APPLICATION_STATUSES } = require('../utils/constants');
const { sendCvFile } = require('./profileController');

// Loads an application and checks the logged-in user may see it:
//   - the job seeker who applied, - the employer who owns the job, - any admin.
async function getAccessibleApplication(req) {
  const application = await applicationModel.findDetail(req.params.id);
  if (!application) throw new AppError(404, 'Application not found.');

  const { user } = req;
  const allowed = user.role === ROLES.ADMIN
    || (user.role === ROLES.JOB_SEEKER && application.seeker_id === user.id)
    || (user.role === ROLES.EMPLOYER && application.employer_id === user.id);
  if (!allowed) throw new AppError(403, 'You do not have access to this application.');
  return application;
}

// Removes server-only fields before sending an application to the browser.
function publicApplication(application) {
  const { cv_filename: storedName, ...rest } = application;
  return { ...rest, has_cv: Boolean(storedName) };
}

const apply = asyncHandler(async (req, res) => {
  const { values, errors, isValid } = validate(req.body, {
    jobId: { label: 'Job', type: 'int', required: true, minValue: 1 },
    coverMessage: { label: 'Cover message', max: 1000 },
  });
  if (!isValid) throw new AppError(400, 'Please fix the highlighted fields.', errors);

  const job = await jobModel.findById(values.jobId);
  if (!job || job.is_hidden) throw new AppError(404, 'Job not found.');
  if (!jobModel.isOpen(job)) throw new AppError(400, 'This vacancy is closed and no longer accepts applications.');

  const profile = await profileModel.getByUserId(req.user.id);
  if (!profile.cv_filename) {
    throw new AppError(400, 'Upload your CV before applying.', { coverMessage: 'Upload your CV before applying.' });
  }
  if (await applicationModel.findByJobAndSeeker(job.id, req.user.id)) {
    throw new AppError(409, 'You have already applied for this job.');
  }

  try {
    const id = await applicationModel.create({ jobId: job.id, seekerId: req.user.id, coverMessage: values.coverMessage });
    sendSuccess(res, { id }, 'Application sent. Good luck!', 201);
  } catch (error) {
    // Two clicks at the same moment: the UNIQUE key in the database stops the second one.
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'You have already applied for this job.');
    throw error;
  }
});

const listMine = asyncHandler(async (req, res) => {
  sendSuccess(res, { applications: await applicationModel.listBySeeker(req.user.id) });
});

const listForEmployer = asyncHandler(async (req, res) => {
  const company = await companyModel.getByUserId(req.user.id);
  const status = APPLICATION_STATUSES.includes(req.query.status) ? req.query.status : '';
  const jobId = parseInt(req.query.job, 10) || null;
  sendSuccess(res, { applications: await applicationModel.listByCompany(company.id, { status, jobId }) });
});

const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, { application: publicApplication(await getAccessibleApplication(req)) });
});

const updateStatus = asyncHandler(async (req, res) => {
  const application = await getAccessibleApplication(req); // employer ownership is checked here
  if (!APPLICATION_STATUSES.includes(req.body.status)) {
    throw new AppError(400, `Status must be one of: ${APPLICATION_STATUSES.join(', ')}.`);
  }
  await applicationModel.updateStatus(application.id, req.body.status);
  sendSuccess(res, {}, `Marked as ${req.body.status}.`);
});

const downloadCv = asyncHandler(async (req, res) => {
  const application = await getAccessibleApplication(req);
  sendCvFile(res, application.cv_filename, application.cv_original_name);
});

module.exports = { apply, listMine, listForEmployer, getOne, updateStatus, downloadCv, getAccessibleApplication, publicApplication };
