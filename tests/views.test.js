// Renders every Phase 1 & Phase 2 page template with sample data and checks the output.
// Catches typos, missing variables and unsafe output without needing MySQL.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');

const { viewLocals } = require('../src/middleware/viewLocals');

const seeker = { id: 2, full_name: 'Ayesha Khan', email: 'ayesha@example.pk', role: 'job_seeker', is_active: 1, created_at: new Date() };
const employer = { id: 3, full_name: 'Hamza Qureshi', email: 'hr@techvista.pk', role: 'employer', is_active: 1, created_at: new Date() };
const admin = { id: 1, full_name: 'Platform Admin', email: 'admin@acquirejobs.pk', role: 'admin', is_active: 1, created_at: new Date() };

const nextWeek = new Date(Date.now() + 7 * 86400000);
const job = {
  id: 7, company_id: 1, company_name: 'Tech Vista Solutions', title: 'Junior Node.js Developer', location: 'Lahore',
  employment_type: 'Full-Time', experience_required: '1 year', salary_min: 70000, salary_max: 100000,
  deadline: nextWeek, status: 'active', is_hidden: 0, created_at: new Date(Date.now() - 2 * 86400000),
  description: 'Build REST APIs.\nSecond line.', requirements: 'JavaScript and SQL.',
  company_industry: 'Information Technology', company_location: 'Lahore', company_website: 'https://techvista.example',
  company_description: 'A software house.', employer_id: 3, application_count: 3,
};
const pagination = { page: 1, perPage: 8, total: 1, totalPages: 1, offset: 0, hasPrev: false, hasNext: false };
const seekerApplication = { id: 11, status: 'Pending', created_at: new Date(), job_id: 7, job_title: job.title, job_location: 'Lahore', employment_type: 'Full-Time', company_name: job.company_name };
const detail = {
  id: 11, job_id: 7, status: 'Pending', created_at: new Date(), updated_at: new Date(), cover_message: 'Hello!',
  job_title: job.title, job_location: 'Lahore', employment_type: 'Full-Time', company_name: job.company_name,
  seeker_name: 'Ayesha Khan', seeker_email: 'ayesha@example.pk', phone: '0300 1234567', city: 'Lahore',
  education: 'BSSE', experience: 'Intern', skills: 'JS', summary: 'Keen learner', cv_original_name: 'Ayesha_CV.pdf', has_cv: true,
};
const profile = {
  user_id: 2, full_name: 'Ayesha Khan', email: 'ayesha@example.pk', phone: '0300 1234567', city: 'Lahore', education: 'BSSE',
  experience: 'Intern', skills: 'JS', summary: 'Keen learner', cv_filename: '2-abc.pdf', cv_original_name: 'Ayesha_CV.pdf', cv_uploaded_at: new Date(),
};

function render(view, user, data = {}, requestPath = '/') {
  const res = { locals: { csrfToken: 'test-token' } };
  viewLocals({ user, path: requestPath }, res, () => {});
  return ejs.renderFile(path.join(__dirname, '..', 'views', `${view}.ejs`), { ...res.locals, ...data });
}

const cases = [
  ['public/home', null, { latestJobs: [job], cities: [{ city: 'Lahore', total: 4 }], openJobCount: 9 }, ['Find work across Pakistan', 'Junior Node.js Developer', 'Lahore', 'Log in']],
  ['public/home', null, { latestJobs: [], cities: [], openJobCount: 0 }, ['No open vacancies right now']],
  ['public/jobs', null, { jobs: [job], pagination, filters: { keyword: 'node', city: 'Lahore', type: '' } }, ['value="node"', '1</strong> vacancy found', 'PKR 70,000 – 100,000']],
  ['public/jobs', null, { jobs: [], pagination: { ...pagination, total: 0 }, filters: { keyword: '', city: '', type: '' } }, ['No jobs match those filters']],
  ['public/job-details', null, { job, isOpen: true, existingApplication: null, hasCv: false }, ['Log in to apply', 'About the role', 'Requirements']],
  ['public/job-details', seeker, { job, isOpen: true, existingApplication: null, hasCv: true }, ['Send application', 'name="jobId"']],
  ['public/job-details', seeker, { job, isOpen: true, existingApplication: null, hasCv: false }, ['Upload your CV']],
  ['public/job-details', seeker, { job, isOpen: true, existingApplication: { id: 11 }, hasCv: true }, ['already applied']],
  ['public/job-details', seeker, { job: { ...job, status: 'closed' }, isOpen: false, existingApplication: null, hasCv: true }, ['closed']],
  ['public/job-details', employer, { job, isOpen: true, existingApplication: null, hasCv: false }, ['Only job seeker accounts']],
  ['public/job-details', admin, { job: { ...job, is_hidden: 1 }, isOpen: false, existingApplication: null, hasCv: false }, ['hidden from the public']],
  ['public/404', null, { message: 'We could not find that page.' }, ['404']],
  ['public/error', seeker, { status: 403, message: 'No access' }, ['You cannot open this page']],
  ['auth/login', null, { next: '/jobs/7' }, ['Log in', 'value="/jobs/7"', 'Demo accounts']],
  ['auth/register', null, { role: 'employer' }, ['Create your account', 'Company name', 'value="employer" checked']],
  ['auth/register', null, { role: 'job_seeker' }, ['value="job_seeker" checked', 'data-show-for="employer" hidden']],
  ['account/settings', seeker, {}, ['Change password', 'ayesha@example.pk'], '/account/settings'],
  ['jobseeker/dashboard', seeker, { section: 'dashboard', profile, stats: { total: 3, pending: 1, shortlisted: 1 }, recentApplications: [seekerApplication], completion: 86 }, ['Welcome, Ayesha', 'Recent applications', '86% complete', 'My applications']],
  ['jobseeker/dashboard', seeker, { section: 'dashboard', profile: { ...profile, cv_filename: null }, stats: { total: 0, pending: 0, shortlisted: 0 }, recentApplications: [], completion: 14 }, ['No applications yet', 'Upload a CV to start applying']],
  ['jobseeker/profile', seeker, { section: 'profile', profile }, ['value="Ayesha Khan"', 'Save profile', 'Professional summary']],
  ['jobseeker/cv', seeker, { section: 'cv', profile }, ['Ayesha_CV.pdf', 'Delete CV', 'Replace CV']],
  ['jobseeker/cv', seeker, { section: 'cv', profile: { ...profile, cv_filename: null, cv_original_name: null } }, ['No CV uploaded', 'Upload CV']],
  ['jobseeker/applications', seeker, { section: 'applications', applications: [seekerApplication] }, ['badge--pending', '/seeker/applications/11']],
  ['jobseeker/application-details', seeker, { section: 'applications', application: detail }, ['not reviewed your application', 'Hello!']],
];

cases.forEach(([view, user, data, expected, requestPath], index) => {
  test(`#${index + 1} renders ${view} (${user ? user.role : 'guest'})`, async () => {
    const html = await render(view, user, data, requestPath);
    assert.ok(html.startsWith('<!DOCTYPE html>'), 'full page layout is present');
    assert.ok(html.includes('</html>'), 'page is closed properly');
    for (const text of expected) assert.ok(html.includes(text), `expected output to contain: ${text}`);
  });
});

test('navigation changes with login state', async () => {
  const guest = await render('public/home', null, { latestJobs: [], cities: [], openJobCount: 0 });
  assert.ok(guest.includes('Sign up') && !guest.includes('Log out'));
  const member = await render('public/home', seeker, { latestJobs: [], cities: [], openJobCount: 0 });
  assert.ok(member.includes('Log out') && member.includes('Account settings') && !member.includes('Sign up'));
});
