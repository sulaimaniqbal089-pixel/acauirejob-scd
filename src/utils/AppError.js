// An error we throw on purpose (wrong input, no permission, not found...).
// The error middleware turns it into a clean JSON response or error page.
class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // optional { fieldName: 'message' } for forms
  }
}

module.exports = AppError;
