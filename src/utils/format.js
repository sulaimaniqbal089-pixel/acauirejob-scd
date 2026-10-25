// Small helpers used by both the server and the EJS views.

// MySQL DATE columns arrive as Date objects (or 'YYYY-MM-DD' text).
// This always returns a Date at local midnight so comparisons are predictable.
function toLocalDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toLocalDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// "2026-11-05" for <input type="date">
function toInputDate(value) {
  const date = toLocalDate(value);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeAgo(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((now - date) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(date);
}

function formatSalary(min, max) {
  const money = (n) => Number(n).toLocaleString('en-US');
  if (min && max) return `PKR ${money(min)} – ${money(max)}`;
  if (min) return `From PKR ${money(min)}`;
  if (max) return `Up to PKR ${money(max)}`;
  return '';
}

function initials(name = '') {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase());
  return letters.join('') || '?';
}

// Picks one of 5 tint colours for a company monogram (see .monogram in components.css).
function tintIndex(name = '') {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return sum % 5;
}

module.exports = { toLocalDate, formatDate, toInputDate, timeAgo, formatSalary, initials, tintIndex };
