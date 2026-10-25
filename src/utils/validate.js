// Small input validator used by all controllers.
//
//   const { values, errors, isValid } = validate(req.body, {
//     title: { label: 'Job title', required: true, min: 3, max: 120 },
//   });
//
// Supported rule keys:
//   label, required, type ('text' | 'email' | 'int' | 'date' | 'password' | 'password-any'),
//   min / max (text length), minValue / maxValue (numbers),
//   oneOf (list of allowed values), pattern + patternMessage.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[A-Za-z]/.test(password)
    && /\d/.test(password);
}

function validate(input, schema) {
  const source = input || {};
  const values = {};
  const errors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const label = rule.label || field;
    const type = rule.type || 'text';
    let value = source[field];

    // Passwords keep their spaces; everything else is trimmed.
    const isPassword = type === 'password' || type === 'password-any';
    if (typeof value === 'string' && !isPassword) value = value.trim();

    if (value === undefined || value === null || value === '') {
      if (rule.required) errors[field] = `${label} is required.`;
      values[field] = null;
      continue;
    }

    const text = String(value);

    if (type === 'email') {
      if (!EMAIL_PATTERN.test(text) || text.length > 150) errors[field] = 'Enter a valid email address.';
      else values[field] = text.toLowerCase();
      continue;
    }

    if (type === 'int') {
      const number = Number(text);
      if (!Number.isInteger(number)) errors[field] = `${label} must be a whole number.`;
      else if (rule.minValue !== undefined && number < rule.minValue) errors[field] = `${label} must be at least ${rule.minValue}.`;
      else if (rule.maxValue !== undefined && number > rule.maxValue) errors[field] = `${label} must be ${rule.maxValue} or less.`;
      else values[field] = number;
      continue;
    }

    if (type === 'date') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) errors[field] = `${label} must be a valid date.`;
      else values[field] = text;
      continue;
    }

    if (type === 'password-any') {      // login: any non-empty password is accepted here
      values[field] = text;
      continue;
    }

    if (type === 'password') {          // new passwords must be strong
      if (isStrongPassword(text)) values[field] = text;
      else errors[field] = 'Use at least 8 characters, with at least one letter and one number.';
      continue;
    }

    if (rule.min && text.length < rule.min) errors[field] = `${label} must be at least ${rule.min} characters.`;
    else if (rule.max && text.length > rule.max) errors[field] = `${label} must be ${rule.max} characters or fewer.`;
    else if (rule.oneOf && !rule.oneOf.includes(text)) errors[field] = `Choose a valid option for ${label.toLowerCase()}.`;
    else if (rule.pattern && !rule.pattern.test(text)) errors[field] = rule.patternMessage || `${label} is not valid.`;
    else values[field] = text;
  }

  return { values, errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validate, isStrongPassword };
