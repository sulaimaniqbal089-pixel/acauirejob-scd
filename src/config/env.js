// Reads settings from the .env file in one place.
// Every other file imports this module instead of touching process.env.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'acquirejobs',
  },
  uploadDir: path.join(__dirname, '..', '..', 'uploads', 'cvs'),
  maxCvSizeMb: 2,
};

if (!env.sessionSecret || env.sessionSecret.length < 16) {
  console.error('\nSESSION_SECRET is missing or too short.');
  console.error('Copy .env.example to .env and set SESSION_SECRET to a long random string.\n');
  process.exit(1);
}

module.exports = env;
