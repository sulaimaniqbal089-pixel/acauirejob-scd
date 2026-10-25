// npm run db:setup
// Creates the database (if missing) and all tables from database/schema.sql.
// Safe to run more than once: it never deletes existing data.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { db } = require('../src/config/env');

async function setup() {
  if (!/^[A-Za-z0-9_]+$/.test(db.database)) {
    throw new Error('DB_NAME may only contain letters, numbers and underscores.');
  }

  const connection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${db.database}\``);
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schema);
    console.log(`Database "${db.database}" is ready. Next step: npm run db:seed`);
  } finally {
    await connection.end();
  }
}

setup().catch((error) => {
  console.error('\nDatabase setup failed:', error.message);
  console.error('Check DB_HOST, DB_USER and DB_PASSWORD in your .env file.\n');
  process.exit(1);
});
