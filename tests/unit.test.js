// Unit tests for Milestone 1 helpers and validation.
const test = require('node:test');
const assert = require('node:assert/strict');

const { validate, isStrongPassword } = require('../src/utils/validate');
const format = require('../src/utils/format');
const { isJobOpen } = require('../src/utils/jobRules');
const { dashboardPathFor, safeNextPath } = require('../src/utils/paths');
const { CITIES, JOB_TYPES, APPLICATION_STATUSES } = require('../src/utils/constants');

test('isStrongPassword requires 8+ characters, a letter and a number', () => {
  assert.equal(isStrongPassword('Password1'), true);
  assert.equal(isStrongPassword('short1'), false);
  assert.equal(isStrongPassword('onlyletters'), false);
  assert.equal(isStrongPassword('12345678'), false);
});

test('validate trims text, lowercases email and reports missing required fields', () => {
  const schema = {
    name: { label: 'Name', required: true, min: 2 },
    email: { label: 'Email', type: 'email', required: true },
    city: { label: 'City', oneOf: CITIES },
  };
  const ok = validate({ name: '  Ali  ', email: 'ALI@Example.PK', city: 'Lahore' }, schema);
  assert.equal(ok.isValid, true);
  assert.deepEqual(ok.values, { name: 'Ali', email: 'ali@example.pk', city: 'Lahore' });

  const bad = validate({ name: '', email: 'not-an-email', city: 'Atlantis' }, schema);
  assert.equal(bad.isValid, false);
  assert.match(bad.errors.name, /required/);
  assert.match(bad.errors.email, /valid email/);
  assert.ok(bad.errors.city);
});

test('validate handles numbers, dates and optional fields', () => {
  const schema = {
    min: { label: 'Minimum salary', type: 'int', minValue: 0 },
    deadline: { label: 'Deadline', type: 'date' },
  };
  assert.deepEqual(validate({}, schema).values, { min: null, deadline: null });
  assert.equal(validate({ min: '50000' }, schema).values.min, 50000);
  assert.ok(validate({ min: '12.5' }, schema).errors.min);
  assert.ok(validate({ min: '-5' }, schema).errors.min);
  assert.ok(validate({ deadline: '31/12/2026' }, schema).errors.deadline);
  assert.equal(validate({ deadline: '2026-12-31' }, schema).values.deadline, '2026-12-31');
});

test('validate password types: strong for new passwords, anything for login', () => {
  assert.ok(validate({ p: 'weak' }, { p: { type: 'password', required: true } }).errors.p);
  assert.equal(validate({ p: 'Strong123' }, { p: { type: 'password' } }).isValid, true);
  assert.equal(validate({ p: ' x ' }, { p: { type: 'password-any', required: true } }).values.p, ' x ');
});

test('validate enforces max length and patterns', () => {
  const schema = { phone: { label: 'Phone', pattern: /^[0-9+\-\s()]{7,20}$/, patternMessage: 'bad phone' }, bio: { label: 'Bio', max: 5 } };
  assert.equal(validate({ phone: '0300 1234567' }, schema).isValid, true);
  assert.equal(validate({ phone: 'abc' }, schema).errors.phone, 'bad phone');
  assert.match(validate({ bio: 'too long' }, schema).errors.bio, /5 characters/);
});

test('format helpers', () => {
  assert.equal(format.formatSalary(70000, 100000), 'PKR 70,000 – 100,000');
  assert.equal(format.formatSalary(50000, null), 'From PKR 50,000');
  assert.equal(format.formatSalary(null, null), '');
  assert.equal(format.initials('Tech Vista Solutions'), 'TV');
  assert.equal(format.toInputDate('2026-11-05'), '2026-11-05');
  assert.equal(format.toInputDate(new Date(2026, 10, 5)), '2026-11-05');
  assert.equal(format.formatDate('2026-11-05'), '5 Nov 2026');
  const now = new Date('2026-10-25T12:00:00');
  assert.equal(format.timeAgo(new Date('2026-10-25T11:00:00'), now), '1 hour ago');
  assert.equal(format.timeAgo(new Date('2026-10-22T12:00:00'), now), '3 days ago');
  assert.ok(format.tintIndex('Any Company') >= 0 && format.tintIndex('Any Company') <= 4);
});

test('isJobOpen: active, visible and before the deadline', () => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(isJobOpen({ status: 'active', is_hidden: 0, deadline: null }), true);
  assert.equal(isJobOpen({ status: 'active', is_hidden: 0, deadline: tomorrow }), true);
  assert.equal(isJobOpen({ status: 'active', is_hidden: 0, deadline: yesterday }), false);
  assert.equal(isJobOpen({ status: 'closed', is_hidden: 0, deadline: null }), false);
  assert.equal(isJobOpen({ status: 'active', is_hidden: 1, deadline: null }), false);
  assert.equal(isJobOpen(null), false);
});

test('redirect helpers', () => {
  assert.equal(dashboardPathFor('employer'), '/employer/dashboard');
  assert.equal(dashboardPathFor('admin'), '/admin/dashboard');
  assert.equal(dashboardPathFor('nonsense'), '/');
  assert.equal(safeNextPath('/jobs/5'), '/jobs/5');
  assert.equal(safeNextPath('//evil.example'), null);
  assert.equal(safeNextPath('https://evil.example'), null);
  assert.equal(safeNextPath(undefined), null);
});

test('constants match the specification', () => {
  assert.deepEqual(JOB_TYPES, ['Full-Time', 'Part-Time', 'Internship', 'Contract']);
  assert.deepEqual(APPLICATION_STATUSES, ['Pending', 'Shortlisted', 'Rejected', 'Hired']);
  ['Lahore', 'Islamabad', 'Karachi', 'Rawalpindi', 'Faisalabad'].forEach((city) => assert.ok(CITIES.includes(city)));
});
