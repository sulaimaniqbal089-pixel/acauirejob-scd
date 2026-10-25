// Milestone 1 Page Controller: renders the public homepage.
// Job listings and candidate dashboards are part of upcoming milestones.

const home = (req, res) => {
  res.render('public/home', {
    title: 'Find a job in Pakistan',
    latestJobs: [],
    cities: [],
    openJobCount: 0,
  });
};

module.exports = { home };
