// Handles CV uploads with Multer: PDF only, 2 MB maximum, random file names.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const AppError = require('../utils/AppError');

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  // The stored name is random so nobody can guess another user's CV URL
  // and the original name can never escape the upload folder.
  filename: (req, file, cb) => cb(null, `${req.user.id}-${crypto.randomBytes(12).toString('hex')}.pdf`),
});

function onlyPdf(req, file, cb) {
  const isPdf = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdf) return cb(null, true);
  return cb(new AppError(400, 'Only PDF files are accepted.', { cv: 'Only PDF files are accepted.' }));
}

const upload = multer({
  storage,
  fileFilter: onlyPdf,
  limits: { fileSize: env.maxCvSizeMb * 1024 * 1024, files: 1 },
});

module.exports = { uploadCv: upload.single('cv') };
