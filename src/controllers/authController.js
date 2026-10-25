// /api/auth: register, login, logout and change password.
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/respond');
const { validate } = require('../utils/validate');
const { ROLES } = require('../utils/constants');
const { dashboardPathFor, safeNextPath } = require('../utils/paths');
const { newToken } = require('../middleware/csrfMiddleware');

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', 10);

// Creates a fresh session for the user (prevents session fixation).
function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = userId;
      req.session.csrfToken = newToken();
      return req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
    });
  });
}

const register = asyncHandler(async (req, res) => {
  const { values, errors } = validate(req.body, {
    fullName: { label: 'Full name', required: true, min: 2, max: 100 },
    email: { label: 'Email', type: 'email', required: true },
    password: { label: 'Password', type: 'password', required: true },
    role: { label: 'Account type', required: true, oneOf: [ROLES.JOB_SEEKER, ROLES.EMPLOYER] },
    companyName: { label: 'Company name', max: 150 },
  });

  if (!errors.password && req.body.password !== req.body.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (values.role === ROLES.EMPLOYER && !values.companyName) {
    errors.companyName = 'Company name is required for employers.';
  }
  if (Object.keys(errors).length) throw new AppError(400, 'Please fix the highlighted fields.', errors);

  if (await userModel.findByEmail(values.email)) {
    throw new AppError(409, 'That email is already registered.', { email: 'That email is already registered.' });
  }

  const userId = await userModel.createAccount({
    fullName: values.fullName,
    email: values.email,
    passwordHash: await bcrypt.hash(values.password, 10),
    role: values.role,
    companyName: values.companyName,
  });

  await startSession(req, userId);
  sendSuccess(res, { redirectTo: dashboardPathFor(values.role) }, 'Welcome to AcquireJobs.pk!', 201);
});

const login = asyncHandler(async (req, res) => {
  const { values, errors } = validate(req.body, {
    email: { label: 'Email', type: 'email', required: true },
    password: { label: 'Password', type: 'password-any', required: true },
  });
  if (Object.keys(errors).length) throw new AppError(400, 'Enter your email and password.', errors);

  const user = await userModel.findByEmail(values.email);
  const passwordIsCorrect = await bcrypt.compare(values.password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !passwordIsCorrect) throw new AppError(401, 'Incorrect email or password.');
  if (!user.is_active) throw new AppError(403, 'This account has been deactivated. Contact the administrator.');

  await startSession(req, user.id);
  const next = safeNextPath(req.body.next);
  sendSuccess(res, { redirectTo: next || dashboardPathFor(user.role) }, `Welcome back, ${user.full_name}.`);
});

const logout = asyncHandler(async (req, res) => {
  await new Promise((resolve) => req.session.destroy(resolve));
  res.clearCookie('acquirejobs.sid');
  sendSuccess(res, { redirectTo: '/' }, 'You have been logged out.');
});

const changePassword = asyncHandler(async (req, res) => {
  const { values, errors } = validate(req.body, {
    currentPassword: { label: 'Current password', type: 'password-any', required: true },
    newPassword: { label: 'New password', type: 'password', required: true },
  });
  if (!errors.newPassword && req.body.newPassword !== req.body.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (Object.keys(errors).length) throw new AppError(400, 'Please fix the highlighted fields.', errors);

  const currentHash = await userModel.getPasswordHash(req.user.id);
  if (!(await bcrypt.compare(values.currentPassword, currentHash))) {
    throw new AppError(400, 'Your current password is incorrect.', { currentPassword: 'Your current password is incorrect.' });
  }

  await userModel.updatePassword(req.user.id, await bcrypt.hash(values.newPassword, 10));
  sendSuccess(res, {}, 'Password updated.');
});

module.exports = { register, login, logout, changePassword };
