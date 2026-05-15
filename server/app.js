const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { CORS_ORIGIN, NODE_ENV } = require('./config/env');
const routes = require('./api/routes');
const { errorHandler } = require('./middleware/error');
const guestCtrl = require('./controllers/guestController');

const IS_PRODUCTION = NODE_ENV === 'production';
 

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));

// 1. STRIPE WEBHOOK ROUTE (raw body, no JSON parser)
app.post(
  '/api/guest/stripe-webhook',
  express.raw({ type: 'application/json' }),
  guestCtrl.handleStripeWebhook
);

app.use(express.json({ limit: '50mb' }));

// Security headers and CSP (allow current frontend patterns while avoiding eval)
const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // allow inline handlers used in current frontend
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
    "chrome-extension:"
  ],
  "script-src-elem": [
    "'self'",
    "'unsafe-inline'",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
    "chrome-extension:"
  ],
  "script-src-attr": [
    "'unsafe-inline'" // allow inline on* handlers until refactor to addEventListener
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'",
    "https://cdnjs.cloudflare.com",
    "https://unpkg.com",
    "https://fonts.googleapis.com",
  ],
  "style-src-elem": [
    "'self'",
    "'unsafe-inline'",
    "https://cdnjs.cloudflare.com",
    "https://unpkg.com",
    "https://fonts.googleapis.com",
  ],
  "img-src": ["'self'", "data:", "blob:", "https:", "http://staticmap.openstreetmap.de"],
  "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
  "connect-src": ["'self'", "*"],
  "frame-src": ["'self'", "https://*.tile.openstreetmap.org"],
};
// In production we want browsers to silently upgrade any stray http:// to https://.
// In development we serve over http://mcinpro.local:3000 for LAN testing — that directive
// breaks every subresource because the browser tries to upgrade to https://...:3000 which
// the dev server does not speak. Similarly HSTS must be off in dev to avoid poisoning the
// browser's HSTS cache for the dev hostname.
// `useDefaults: true` adds upgrade-insecure-requests automatically, so in dev we must
// explicitly null it out (helmet treats `null` as "remove this directive entirely").
cspDirectives["upgrade-insecure-requests"] = IS_PRODUCTION ? [] : null;

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: cspDirectives,
  },
  strictTransportSecurity: IS_PRODUCTION ? undefined : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.static(path.join(__dirname, '../public')));

app.use(routes);
app.use(errorHandler);

module.exports = { app };