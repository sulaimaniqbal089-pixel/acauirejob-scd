// npm run db:seed
// Fills the database with demo data. WARNING: it first deletes all existing
// users, jobs and applications, so only run it on a development database.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { pool, query } = require('../src/config/database');

const ADMIN_PASSWORD = 'Admin@12345';
const DEMO_PASSWORD = 'Password@123';

// ---------------------------------------------------------------- demo data
const employers = [
  { key: 'tech', name: 'Hamza Qureshi', email: 'hr@techvista.pk', company: 'Tech Vista Solutions', industry: 'Information Technology', location: 'Lahore', website: 'https://techvista.example',
    about: 'Tech Vista Solutions is a Lahore software house building web and mobile products for retail and fintech clients across Pakistan and the Gulf. Our team of 40 values clean code, honest estimates and steady growth.' },
  { key: 'edu', name: 'Sana Iqbal', email: 'careers@margallalearning.pk', company: 'Margalla Learning Academy', industry: 'Education', location: 'Islamabad', website: 'https://margallalearning.example',
    about: 'Margalla Learning Academy is a private school and tutoring centre in Islamabad serving students from primary to O-Level. Small classes, qualified teachers and regular parent feedback are the heart of what we do.' },
  { key: 'logi', name: 'Imran Sheikh', email: 'jobs@harbourlogistics.pk', company: 'Karachi Harbour Logistics', industry: 'Logistics & Supply Chain', location: 'Karachi', website: null,
    about: 'Karachi Harbour Logistics moves containers and cargo between the port, warehouses and customers across Sindh and Punjab. We run a 24-hour operation and promote from within.' },
  { key: 'textile', name: 'Nadia Butt', email: 'hr@chenabtextile.pk', company: 'Chenab Textile Mills', industry: 'Manufacturing', location: 'Faisalabad', website: 'https://chenabtextile.example',
    about: 'Chenab Textile Mills is a Faisalabad manufacturer of woven cotton fabric for export. We employ more than 600 people and invest in training for our supervisors and technicians.' },
  { key: 'care', name: 'Kamran Ali', email: 'admin@pindicare.pk', company: 'Pindi Care Hospital', industry: 'Healthcare', location: 'Rawalpindi', website: null,
    about: 'Pindi Care Hospital is a 120-bed general hospital in Rawalpindi providing emergency, maternity and outpatient services to the surrounding community.' },
];

const seekers = [
  { key: 'ayesha', name: 'Ayesha Khan', email: 'ayesha@example.pk', phone: '0300 1234567', city: 'Lahore', education: 'BS Software Engineering, FAST-NUCES Lahore (2026)', experience: 'Six-month web development internship at a Lahore software house. Built a student portal with Node.js and MySQL.', skills: 'JavaScript, Node.js, Express, SQL, HTML, CSS, Git', summary: 'Final-year software engineering student who enjoys building clean, reliable web applications. Looking for a junior backend or full-stack role.' },
  { key: 'bilal', name: 'Bilal Ahmed', email: 'bilal@example.pk', phone: '0321 7654321', city: 'Karachi', education: 'BBA Supply Chain, IBA Karachi (2024)', experience: 'Two years as a warehouse coordinator, tracking inbound shipments and managing a team of six loaders.', skills: 'Inventory control, Excel, Team supervision, SAP basics', summary: 'Organised logistics professional with hands-on warehouse experience and a calm approach to busy shifts.' },
  { key: 'fatima', name: 'Fatima Noor', email: 'fatima@example.pk', phone: '0333 2468101', city: 'Islamabad', education: 'MSc Mathematics, Quaid-i-Azam University (2023)', experience: 'Three years teaching mathematics to O-Level students at a private school.', skills: 'Teaching, Lesson planning, Mathematics, Classroom management', summary: 'Patient mathematics teacher who helps students move from fear of numbers to real confidence.' },
  { key: 'usman', name: 'Usman Raza', email: 'usman@example.pk', phone: '0345 1357924', city: 'Faisalabad', education: 'BSc Textile Engineering, NTU Faisalabad (2021)', experience: 'Four years in weaving and quality control at a textile mill, most recently as shift supervisor.', skills: 'Quality control, Weaving, Production planning, Lean basics', summary: 'Textile engineer with shop-floor experience and a record of reducing fabric defects.' },
  { key: 'hina', name: 'Hina Siddiqui', email: 'hina@example.pk', phone: '0312 9988776', city: 'Rawalpindi', education: 'BS Nursing, Rawalpindi Medical University (2022)', experience: 'Staff nurse in a general ward for two years, including night shifts and emergency cover.', skills: 'Patient care, IV therapy, Record keeping, Urdu and English', summary: 'Registered nurse committed to careful, compassionate patient care.' },
  { key: 'zain', name: 'Zain Abbas', email: 'zain@example.pk', phone: '0302 1122334', city: 'Lahore', education: 'BS Computer Science, UET Lahore (2025)', experience: 'Freelance front-end work for small businesses and a three-month internship in QA testing.', skills: 'React, JavaScript, CSS, Figma, Manual testing', summary: 'Front-end developer with an eye for detail and a growing interest in quality engineering.' },
];

// days = how many days ago the job was posted; deadline = days from now (null = none)
const jobs = [
  { co: 'tech', title: 'Junior Node.js Developer', city: 'Lahore', type: 'Full-Time', exp: '1 year', min: 70000, max: 100000, days: 2, deadline: 25,
    desc: 'Join our backend team and help build REST APIs for retail and fintech clients.\nYou will write and review Express.js code, design MySQL tables and fix bugs alongside senior developers.\nExpect mentoring, code reviews and real production responsibility from your first month.',
    req: 'Good knowledge of JavaScript and Node.js.\nSolid SQL basics (joins, indexes).\nComfortable with Git.\nA degree in Computer Science or Software Engineering.' },
  { co: 'tech', title: 'Frontend Developer (React)', city: 'Lahore', type: 'Full-Time', exp: '2 years', min: 120000, max: 180000, days: 5, deadline: 30,
    desc: 'Build fast, accessible interfaces for our web products in React.\nYou will turn designs into clean components and work closely with our designers and backend team.',
    req: 'Two or more years of React experience.\nStrong HTML and CSS.\nExperience consuming REST APIs.\nAn eye for detail and responsive layouts.' },
  { co: 'tech', title: 'QA Engineer Intern', city: 'Lahore', type: 'Internship', exp: 'Fresher', min: 25000, max: 30000, days: 8, deadline: 14,
    desc: 'A three-month paid internship in our quality team. You will write test cases, run manual tests and learn how automated testing fits into a release.',
    req: 'Currently studying or recently graduated in a computer-related field.\nCareful, curious and good at spotting small problems.\nClear written English.' },
  { co: 'tech', title: 'UI/UX Designer', city: 'Remote', type: 'Contract', exp: '3-5 years', min: 150000, max: 200000, days: 11, deadline: null,
    desc: 'Six-month remote contract to redesign the customer dashboard of one of our fintech clients.\nYou will own research, wireframes and the final interface in Figma.',
    req: 'A portfolio showing web application design.\nExperience with Figma and design systems.\nComfortable presenting your decisions to clients.' },

  { co: 'edu', title: 'Primary School Teacher', city: 'Islamabad', type: 'Full-Time', exp: '2 years', min: 55000, max: 75000, days: 3, deadline: 20,
    desc: 'Teach a class of 25 students in Grades 3 to 5. You will plan lessons, mark work and meet parents each term.\nWe provide curriculum guides, classroom assistants and paid training days.',
    req: 'Bachelor degree with B.Ed. or equivalent.\nTwo years of classroom experience.\nPatience, clear speech and strong English.' },
  { co: 'edu', title: 'Academic Coordinator', city: 'Islamabad', type: 'Full-Time', exp: '3-5 years', min: 95000, max: 130000, days: 9, deadline: 28,
    desc: 'Coordinate timetables, exams and teacher evaluations across our primary and secondary sections.\nYou will report to the principal and support teachers day to day.',
    req: 'Master degree preferred.\nThree to five years in school administration or teaching.\nStrong organisation and communication skills.' },
  { co: 'edu', title: 'Part-Time Mathematics Tutor', city: 'Islamabad', type: 'Part-Time', exp: 'Fresher', min: 30000, max: 40000, days: 6, deadline: null,
    desc: 'Evening classes, Monday to Thursday, for O-Level mathematics students in small groups.\nA good first teaching job for strong maths graduates.',
    req: 'Degree in Mathematics, Statistics or Engineering.\nAble to explain difficult ideas simply.' },

  { co: 'logi', title: 'Logistics Coordinator', city: 'Karachi', type: 'Full-Time', exp: '1 year', min: 65000, max: 90000, days: 1, deadline: 18,
    desc: 'Plan and track daily container movements between the port, our warehouse and customers.\nYou will be the point of contact for drivers, customs agents and clients.',
    req: 'One year in logistics or shipping.\nGood with Excel.\nAble to stay calm when schedules change.' },
  { co: 'logi', title: 'Warehouse Supervisor', city: 'Karachi', type: 'Full-Time', exp: '3-5 years', min: 80000, max: 110000, days: 7, deadline: 22,
    desc: 'Lead a team of 20 on the day shift, from receiving and put-away to dispatch.\nYou will keep stock records accurate and safety rules followed.',
    req: 'Three or more years in a warehouse, at least one as a team lead.\nKnowledge of inventory systems.\nReady to work on-site six days a week.' },
  { co: 'logi', title: 'Data Entry Operator', city: 'Karachi', type: 'Contract', exp: 'Fresher', min: 35000, max: 45000, days: 12, deadline: 10,
    desc: 'Six-month contract entering shipment and invoice details into our tracking system with high accuracy.',
    req: 'Fast and accurate typing in English.\nBasic Excel.\nIntermediate or above.' },

  { co: 'textile', title: 'Production Supervisor', city: 'Faisalabad', type: 'Full-Time', exp: '3-5 years', min: 90000, max: 120000, days: 4, deadline: 27,
    desc: 'Supervise a weaving shift of 45 operators and technicians, keeping output and quality on target.\nYou will work with maintenance and planning to reduce downtime.',
    req: 'Diploma or degree in Textile Engineering.\nThree to five years on a weaving floor.\nProven ability to lead a shift team.' },
  { co: 'textile', title: 'Quality Control Inspector', city: 'Faisalabad', type: 'Full-Time', exp: '1 year', min: 60000, max: 80000, days: 10, deadline: 21,
    desc: 'Inspect finished fabric rolls, record defects and report patterns to production.\nYour findings help us meet export customers\' standards.',
    req: 'One year of experience in textile quality control.\nKnowledge of four-point inspection is a plus.\nGood eyesight and attention to detail.' },
  { co: 'textile', title: 'Accounts Assistant', city: 'Faisalabad', type: 'Part-Time', exp: 'Fresher', min: 40000, max: 50000, days: 14, deadline: null,
    desc: 'Morning shifts supporting our accounts team with vouchers, bank reconciliation and filing.',
    req: 'Studying or completed B.Com or similar.\nBasic accounting knowledge and Excel skills.' },

  { co: 'care', title: 'Staff Nurse', city: 'Rawalpindi', type: 'Full-Time', exp: '2 years', min: 70000, max: 95000, days: 2, deadline: 15,
    desc: 'Provide ward care across rotating day and night shifts in our general medicine department.\nYou will work with doctors, update patient records and support families.',
    req: 'BS Nursing with valid PNC registration.\nTwo years of hospital experience.\nCompassionate and dependable.' },
  { co: 'care', title: 'Front Desk Executive', city: 'Rawalpindi', type: 'Full-Time', exp: 'Fresher', min: 45000, max: 55000, days: 6, deadline: 19,
    desc: 'Welcome patients, manage appointments and answer phone enquiries at our outpatient reception.',
    req: 'Intermediate or above.\nClear spoken English and Urdu.\nFriendly, patient and organised.' },
  { co: 'care', title: 'Pharmacy Assistant', city: 'Rawalpindi', type: 'Full-Time', exp: '1 year', min: 50000, max: 65000, days: 20, deadline: null, status: 'closed',
    desc: 'Assist our pharmacist with dispensing, stock checks and customer questions. This position has been filled.',
    req: 'D.Pharm or equivalent.\nOne year of pharmacy experience.' },
  { co: 'logi', title: 'Earn Rs 100,000 daily from home!!!', city: 'Remote', type: 'Part-Time', exp: 'Fresher', min: null, max: null, days: 0, deadline: null, hidden: true,
    desc: 'Send us your bank details to start earning right now. No skills needed. This is the kind of suspicious posting an administrator should hide.',
    req: 'Bank account and CNIC number.' },
];

// [job title, seeker key, status, days ago, cover message]
const applications = [
  ['Junior Node.js Developer', 'ayesha', 'Shortlisted', 1, 'I recently built a student portal with Node.js and MySQL and would love to grow in a backend team.'],
  ['Frontend Developer (React)', 'zain', 'Pending', 3, 'React is my main tool and I enjoy turning designs into pixel-accurate components.'],
  ['QA Engineer Intern', 'zain', 'Hired', 6, 'My QA internship taught me how much careful testing matters, and I want to learn more.'],
  ['QA Engineer Intern', 'ayesha', 'Rejected', 5, null],
  ['Primary School Teacher', 'fatima', 'Shortlisted', 2, 'I have taught mathematics for three years and enjoy working with younger students.'],
  ['Part-Time Mathematics Tutor', 'fatima', 'Pending', 4, null],
  ['Logistics Coordinator', 'bilal', 'Pending', 1, 'Two years of warehouse coordination have prepared me for this role.'],
  ['Warehouse Supervisor', 'bilal', 'Shortlisted', 5, 'I have led a team of six loaders and want to take on a bigger crew.'],
  ['Production Supervisor', 'usman', 'Pending', 3, 'I currently supervise a weaving shift and want to join a mill with strong export work.'],
  ['Quality Control Inspector', 'usman', 'Hired', 8, null],
  ['Staff Nurse', 'hina', 'Shortlisted', 1, 'I have two years of ward experience including night shifts.'],
  ['Front Desk Executive', 'hina', 'Rejected', 4, null],
  ['Junior Node.js Developer', 'zain', 'Pending', 2, null],
];

// ------------------------------------------------------------------ helpers
const insert = async (sql, params) => (await query(sql, params)).insertId;

// Builds a tiny valid one-page PDF so the CV download can be demonstrated.
function makeDemoPdf(name) {
  const lines = [`${name} - Curriculum Vitae`, 'Demo CV created by the AcquireJobs.pk seed script.'];
  const stream = `BT /F1 18 Tf 72 720 Td (${lines[0]}) Tj 0 -30 Td /F1 12 Tf (${lines[1]}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

async function clearOldData() {
  // Children first, so foreign keys are never violated.
  for (const table of ['applications', 'jobs', 'companies', 'job_seeker_profiles', 'users']) {
    await query(`DELETE FROM ${table}`);
    await query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
  }
  fs.mkdirSync(env.uploadDir, { recursive: true });
  fs.readdirSync(env.uploadDir).filter((file) => file.endsWith('.pdf')).forEach((file) => fs.unlinkSync(path.join(env.uploadDir, file)));
}

// --------------------------------------------------------------------- seed
async function seed() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await clearOldData();

  await insert(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Platform Admin', 'admin@acquirejobs.pk', adminHash, 'admin']
  );

  const companyIds = {};
  for (const [index, employer] of employers.entries()) {
    const userId = await insert(
      'INSERT INTO users (full_name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW() - INTERVAL ? DAY)',
      [employer.name, employer.email, demoHash, 'employer', 30 - index]
    );
    companyIds[employer.key] = await insert(
      `INSERT INTO companies (user_id, name, industry, location, website, description, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, employer.company, employer.industry, employer.location, employer.website, employer.about, employer.email]
    );
  }

  const seekerIds = {};
  for (const [index, seeker] of seekers.entries()) {
    const userId = await insert(
      'INSERT INTO users (full_name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW() - INTERVAL ? DAY)',
      [seeker.name, seeker.email, demoHash, 'job_seeker', 20 - index]
    );
    seekerIds[seeker.key] = userId;

    const cvFile = `${userId}-demo-cv.pdf`;
    fs.writeFileSync(path.join(env.uploadDir, cvFile), makeDemoPdf(seeker.name));
    await insert(
      `INSERT INTO job_seeker_profiles
         (user_id, phone, city, education, experience, skills, summary, cv_filename, cv_original_name, cv_uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, seeker.phone, seeker.city, seeker.education, seeker.experience, seeker.skills, seeker.summary,
        cvFile, `${seeker.name.replace(/\s+/g, '_')}_CV.pdf`]
    );
  }

  const jobIds = {};
  for (const job of jobs) {
    jobIds[job.title] = await insert(
      `INSERT INTO jobs (company_id, title, description, requirements, location, employment_type, experience_required,
                         salary_min, salary_max, deadline, status, is_hidden, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${job.deadline === null ? 'NULL' : 'CURDATE() + INTERVAL ? DAY'}, ?, ?, NOW() - INTERVAL ? DAY)`,
      [companyIds[job.co], job.title, job.desc, job.req, job.city, job.type, job.exp, job.min, job.max,
        ...(job.deadline === null ? [] : [job.deadline]), job.status || 'active', job.hidden ? 1 : 0, job.days]
    );
  }

  for (const [title, seekerKey, status, daysAgo, message] of applications) {
    await insert(
      `INSERT INTO applications (job_id, seeker_id, cover_message, status, created_at)
       VALUES (?, ?, ?, ?, NOW() - INTERVAL ? DAY)`,
      [jobIds[title], seekerIds[seekerKey], message, status, daysAgo]
    );
  }

  console.log('\nDemo data created.\n');
  console.log('  Admin       admin@acquirejobs.pk   /  ' + ADMIN_PASSWORD);
  console.log('  Employer    hr@techvista.pk        /  ' + DEMO_PASSWORD);
  console.log('  Job seeker  ayesha@example.pk      /  ' + DEMO_PASSWORD);
  console.log('\n  (All other demo employers and job seekers also use ' + DEMO_PASSWORD + ')');
  console.log('\nStart the app with: npm run dev\n');
}

seed()
  .catch((error) => {
    console.error('\nSeeding failed:', error.message);
    console.error('Did you run "npm run db:setup" first?\n');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
