// Talks to the REST API. Every page uses AJ.api(url, { method, body }).
// - sends the CSRF token the server put in the page (<meta name="csrf-token">)
// - sends JSON, or FormData for file uploads
// - throws an ApiError (with field errors) when the server says no
(function () {
  class ApiError extends Error {
    constructor(message, status, errors) {
      super(message);
      this.status = status;
      this.errors = errors || {};
    }
  }

  function csrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
  }

  async function api(url, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json', 'X-CSRF-Token': csrfToken() };
    let payload = body;

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, { method, headers, body: payload, credentials: 'same-origin' });
    } catch (networkError) {
      throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
    }

    let json = null;
    try { json = await response.json(); } catch (parseError) { /* not JSON */ }

    if (!response.ok || !json || json.success === false) {
      throw new ApiError((json && json.message) || 'Something went wrong. Please try again.', response.status, json && json.errors);
    }
    return json;
  }

  window.AJ = window.AJ || {};
  window.AJ.api = api;
  window.AJ.ApiError = ApiError;
})();
