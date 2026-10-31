// Turns "page 2, 8 per page, 30 results" into everything the SQL and the view need.
function paginate({ page, perPage, total }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(parseInt(page, 10) || 1, 1), totalPages);
  return {
    page: current,
    perPage,
    total,
    totalPages,
    offset: (current - 1) * perPage,
    hasPrev: current > 1,
    hasNext: current < totalPages,
  };
}

module.exports = { paginate };
