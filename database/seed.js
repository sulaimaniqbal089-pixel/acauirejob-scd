// npm run db:seed
// Milestone 1: Seeds demo user accounts for authentication testing.
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/config/database');

const ADMIN_PASSWORD = 'Admin@12345';
const DEMO_PASSWORD = 'Password@123';

const insert = async (sql, params) => (await query(sql, params)).insertId;

async function clearOldData() {
  for (const table of ['companies', 'job_seeker_profiles', 'users']) {
    await query(`DELETE FROM ${table}`);
    await query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
  }
}

async function seed() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await clearOldData();

  // 1. Admin
  await insert(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Platform Admin', 'admin@acquirejobs.pk', adminHash, 'admin']
  );

  // 2. Employer
  const employerId = await insert(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Hamza Qureshi', 'hr@techvista.pk', demoHash, 'employer']
  );
  await insert(
    `INSERT INTO companies (user_id, name, industry, location, website, description, contact_email)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      employerId,
      'Tech Vista Solutions',
      'Information Technology',
      'Lahore',
      'https://techvista.example',
      'Tech Vista Solutions is a Lahore software house building modern web applications.',
      'hr@techvista.pk',
    ]
  );

  // 3. Job Seeker
  const seekerId = await insert(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Ayesha Khan', 'ayesha@example.pk', demoHash, 'job_seeker']
  );
  await insert(
    `INSERT INTO job_seeker_profiles (user_id, phone, city, education, experience, skills, summary)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      seekerId,
      '0300 1234567',
      'Lahore',
      'BS Software Engineering, FAST-NUCES Lahore (2026)',
      'Web development experience with Node.js and MySQL.',
      'JavaScript, Node.js, Express, SQL, HTML, CSS, Git',
      'Final-year software engineering student passionate about full-stack web development.',
    ]
  );

  console.log('\nMilestone 1 Demo accounts created successfully:\n');
  console.log('  Admin       admin@acquirejobs.pk   /  ' + ADMIN_PASSWORD);
  console.log('  Employer    hr@techvista.pk        /  ' + DEMO_PASSWORD);
  console.log('  Job seeker  ayesha@example.pk      /  ' + DEMO_PASSWORD);
  console.log('\nStart the development server with: npm run dev\n');
}

seed()
  .catch((error) => {
    console.error('\nSeeding failed:', error.message);
    console.error('Make sure MySQL is running and you executed: npm run db:setup\n');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
