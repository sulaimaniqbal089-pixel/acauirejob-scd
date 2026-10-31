// Tests for access control, CSRF protection and error responses (no database needed).
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-for-unit-tests-only';

const { requireLogin, requireRole } = require('../src/middleware/authMiddleware');
const { csrfProtection } = require('../src/middleware/csrfMiddleware');
const { errorHandler } = require('../src/middleware/errorMiddleware');
const AppError = require('../src/utils/AppError');

const fakeRes = () => {
  const res = { locals: {}, statusCode: 200, body: null, redirectedTo: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.redirect = (url) => { res.redirectedTo = url; return res; };
  return res;
};
const run = (middleware, req, res = fakeRes()) => {
  let nextArg = 'not-called';
  const list = Array.isArray(middleware) ? middleware : [middleware];
  for (const fn of list) {
    let called = false;
    fn(req, res, (arg) => { called = true; nextArg = arg; });
    if (!called || nextArg) break;
  }
  return { res, nextArg };
};

test('requireLogin sends visitors to the login page, and API callers a 401', () => {
  const page = run(requireLogin, { user: null, originalUrl: '/seeker/dashboard' });
  assert.equal(page.res.redirectedTo, '/login?next=%2Fseeker%2Fdashboard');

  const api = run(requireLogin, { user: null, originalUrl: '/api/profile' });
  assert.equal(api.nextArg.status, 401);
});

test('requireRole lets the right role in and blocks the others with 403', () => {
  const employerOnly = requireRole('employer');
  assert.equal(run(employerOnly, { user: { role: 'employer' }, originalUrl: '/api/company' }).nextArg, undefined);
  assert.equal(run(employerOnly, { user: { role: 'job_seeker' }, originalUrl: '/api/company' }).nextArg.status, 403);
  assert.equal(run(employerOnly, { user: { role: 'admin' }, originalUrl: '/api/company' }).nextArg.status, 403);
  assert.equal(run(employerOnly, { user: null, originalUrl: '/api/company' }).nextArg.status, 401);
});

test('CSRF: GET passes, write requests need the matching token', () => {
  const session = {};
  const get = run(csrfProtection, { method: 'GET', session, get: () => undefined });
  assert.equal(get.nextArg, undefined);
  assert.ok(session.csrfToken, 'a token is created for the session');
  assert.equal(get.res.locals.csrfToken, session.csrfToken);

  const noToken = run(csrfProtection, { method: 'POST', session, get: () => undefined });
  assert.equal(noToken.nextArg.status, 403);

  const wrong = run(csrfProtection, { method: 'DELETE', session, get: () => 'wrong-token-value' });
  assert.equal(wrong.nextArg.status, 403);

  const good = run(csrfProtection, { method: 'PATCH', session, get: () => session.csrfToken });
  assert.equal(good.nextArg, undefined);
});

test('error handler returns consistent JSON for API requests and hides internal errors', () => {
  const res = fakeRes();
  errorHandler(new AppError(400, 'Bad input', { email: 'Invalid' }), { originalUrl: '/api/auth/login' }, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: 'Bad input', errors: { email: 'Invalid' } });

  const silent = console.error; console.error = () => {};
  const crash = fakeRes();
  errorHandler(new Error('SQL syntax error near ...'), { originalUrl: '/api/jobs' }, crash, () => {});
  console.error = silent;
  assert.equal(crash.statusCode, 500);
  assert.ok(!crash.body.message.includes('SQL'), 'internal details must not leak');

  const tooBig = fakeRes();
  errorHandler(Object.assign(new Error('File too large'), { code: 'LIMIT_FILE_SIZE' }), { originalUrl: '/api/profile/cv' }, tooBig, () => {});
  assert.equal(tooBig.statusCode, 400);
  assert.match(tooBig.body.errors.cv, /2 MB/);
});
