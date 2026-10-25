// Entry point: checks the database connection, then starts the web server.
const app = require('./src/app');
const env = require('./src/config/env');
const { pool } = require('./src/config/database');

async function start() {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('\nCould not connect to MySQL.');
    console.error(`  ${error.message}`);
    console.error('Check DB_HOST, DB_USER, DB_PASSWORD and DB_NAME in your .env file,');
    console.error('and make sure you ran:  npm run db:setup\n');
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`AcquireJobs.pk is running at http://localhost:${env.port}`);
  });
}

start();
