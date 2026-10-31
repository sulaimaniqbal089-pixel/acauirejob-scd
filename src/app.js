// Express application setup for Milestone 1:
// Middleware, static assets, sessions, CSRF protection, view locals, routes, and error handling.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const env = require('./config/env');
const { pool } = require('./config/database');
const { securityHeaders } = require('./middleware/security');
const { csrfProtection } = require('./middleware/csrfMiddleware');
const loadUser = require('./middleware/loadUser');
const { viewLocals } = require('./middleware/viewLocals');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.disable('x-powered-by');

app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

// Static files (CSS, client JS, favicon, svgs)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Cookie sessions stored in MySQL
app.use(session({
  name: 'acquirejobs.sid',
  secret: env.sessionSecret,
  store: new MySQLStore({ createDatabaseTable: true }, pool),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use(csrfProtection);
app.use(loadUser);
app.use(viewLocals);

// REST API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));

// HTML pages
app.use('/', require('./routes/pageRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
