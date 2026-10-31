// /api/profile: job seeker profile and CV (upload, download, delete).
const fs = require('fs');
const path = require('path');
const profileModel = require('../models/profileModel');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/respond');
const { validate } = require('../utils/validate');
const { CITIES } = require('../utils/constants');

// Never send the server-side file name to the browser.
function publicProfile(profile) {
  const { cv_filename: storedName, ...rest } = profile;
  return { ...rest, has_cv: Boolean(storedName) };
}

// Full path of a stored CV. basename() makes path tricks like "../" impossible.
const cvPath = (storedName) => path.join(env.uploadDir, path.basename(storedName));

function removeFile(storedName) {
  if (storedName) fs.unlink(cvPath(storedName), () => {}); // ignore "file already gone"
}

// Used here and by applicationController (employer / admin downloads).
function sendCvFile(res, storedName, originalName) {
  if (!storedName || !fs.existsSync(cvPath(storedName))) throw new AppError(404, 'No CV found.');
  return res.download(cvPath(storedName), originalName || 'cv.pdf');
}

const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, { profile: publicProfile(await profileModel.getByUserId(req.user.id)) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { values, errors, isValid } = validate(req.body, {
    fullName: { label: 'Full name', required: true, min: 2, max: 100 },
    phone: { label: 'Phone number', pattern: /^[0-9+\-\s()]{7,20}$/, patternMessage: 'Enter a valid phone number.' },
    city: { label: 'City', oneOf: CITIES },
    education: { label: 'Education', max: 255 },
    experience: { label: 'Experience', max: 500 },
    skills: { label: 'Skills', max: 500 },
    summary: { label: 'Professional summary', max: 2000 },
  });
  if (!isValid) throw new AppError(400, 'Please fix the highlighted fields.', errors);

  await profileModel.update(req.user.id, values);
  sendSuccess(res, {}, 'Profile saved.');
});

const uploadCv = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'Choose a PDF file to upload.', { cv: 'Choose a PDF file to upload.' });

  // Check the first bytes: a real PDF always starts with "%PDF-".
  const header = Buffer.alloc(5);
  const fd = fs.openSync(req.file.path, 'r');
  fs.readSync(fd, header, 0, 5, 0);
  fs.closeSync(fd);
  if (header.toString() !== '%PDF-') {
    removeFile(req.file.filename);
    throw new AppError(400, 'That file is not a valid PDF.', { cv: 'That file is not a valid PDF.' });
  }

  const old = await profileModel.getByUserId(req.user.id);
  await profileModel.saveCv(req.user.id, req.file.filename, req.file.originalname.slice(0, 200));
  removeFile(old.cv_filename); // one active CV only: delete the replaced file
  sendSuccess(res, {}, 'CV uploaded.', 201);
});

const downloadOwnCv = asyncHandler(async (req, res) => {
  const profile = await profileModel.getByUserId(req.user.id);
  sendCvFile(res, profile.cv_filename, profile.cv_original_name);
});

const deleteCv = asyncHandler(async (req, res) => {
  const profile = await profileModel.getByUserId(req.user.id);
  if (!profile.cv_filename) throw new AppError(404, 'You have not uploaded a CV.');
  await profileModel.clearCv(req.user.id);
  removeFile(profile.cv_filename);
  sendSuccess(res, {}, 'CV deleted.');
});

module.exports = { getProfile, updateProfile, uploadCv, downloadOwnCv, deleteCv, sendCvFile };
