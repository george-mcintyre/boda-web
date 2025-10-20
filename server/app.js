const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { CORS_ORIGIN } = require('./config/env');
const routes = require('./api/routes');
const { errorHandler } = require('./middleware/error');

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Security headers and CSP (allow current frontend patterns while avoiding eval)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'", // allow inline handlers used in current frontend
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      "script-src-elem": [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://fonts.googleapis.com"
      ],
      "style-src-elem": [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://fonts.googleapis.com"
      ],
      "img-src": ["'self'", "data:", "https:"],
      "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "*"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve a tiny inline SVG as favicon to avoid 404s during development
app.get('/favicon.ico', (req, res) => {
  res.type('image/svg+xml').send(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#8B5A96"/><stop offset="1" stop-color="#D4A5A5"/></linearGradient></defs><rect width="64" height="64" rx="12" ry="12" fill="url(#g)"/><path fill="#fff" d="M32 47c-1 0-2-.4-2.8-1.2l-12-12c-3.1-3.1-3.1-8.2 0-11.3 3.1-3.1 8.2-3.1 11.3 0l3.5 3.5 3.5-3.5c3.1-3.1 8.2-3.1 11.3 0 3.1 3.1 3.1 8.2 0 11.3l-12 12c-.8.8-1.8 1.2-2.8 1.2z"/></svg>'
  );
});

app.use(express.static(path.join(__dirname, '../public')));

// Serve protected/admin views (HTML) from server/views
const viewsDir = path.join(__dirname, 'views');
app.get(['/admin.html', '/admin'], (req, res) => {
  res.sendFile(path.join(viewsDir, 'admin.html'));
});
app.get(['/admin-login.html', '/admin-login'], (req, res) => {
  const loginPath = path.join(viewsDir, 'admin-login.html');
  res.sendFile(loginPath);
});

app.use(routes);
app.use(errorHandler);

module.exports = { app };