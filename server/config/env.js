try { require('dotenv').config(); } catch (_) { /* dotenv optional at runtime */ }

function required(name, def) {
  const val = process.env[name] ?? def;
  if (val === undefined) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name, def) {
  return process.env[name] ?? def;
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const usingDefaults = [];

let MONGODB_URI;
let JWT_SECRET;

if (NODE_ENV === 'production') {
  MONGODB_URI = required('MONGODB_URI');
  JWT_SECRET = required('JWT_SECRET');
} else {
  MONGODB_URI = optional('MONGODB_URI', 'mongodb://127.0.0.1:27017');
  if (!process.env.MONGODB_URI) usingDefaults.push('MONGODB_URI');
  JWT_SECRET = optional('JWT_SECRET', 'dev-secret-change-me');
  if (!process.env.JWT_SECRET) usingDefaults.push('JWT_SECRET');
}

if (usingDefaults.length) {
  // eslint-disable-next-line no-console
  console.warn('[WARN] Using development defaults for:', usingDefaults.join(', '));
}

module.exports = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT || '3000', 10),
  HTTPS_PORT: parseInt(process.env.HTTPS_PORT || '3443', 10),
  MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB || 'boda-web',
  JWT_SECRET,
  // Stripe key is optional at boot. Specific features will error if missing at runtime.
  STRIPE_SECRET_KEY: optional('STRIPE_SECRET_KEY', ''),
  STRIPE_WEBHOOK_SECRET: optional('STRIPE_WEBHOOK_SECRET', ''),
  APP_URL: optional('APP_URL', ''), // Base URL for callbacks (e.g., https://iluminada-y-george.com), calculated automatically from the request headers if not set
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  // Dev HTTPS support (optional). If DEV_HTTPS=true and CERT/KEY are provided, server will also start HTTPS on HTTPS_PORT.
  DEV_HTTPS: String(process.env.DEV_HTTPS || '').toLowerCase() === 'true',
  SSL_KEY_PATH: optional('SSL_KEY_PATH', ''),
  SSL_CERT_PATH: optional('SSL_CERT_PATH', ''),
  SSL_CA_PATH: optional('SSL_CA_PATH', ''),
  // Email (Brevo) — optional at boot; when missing, email-sending features no-op with a log warning.
  BREVO_API_KEY: optional('BREVO_API_KEY', ''),
  EMAIL_FROM_ADDRESS: optional('EMAIL_FROM_ADDRESS', 'rsvp@george-and-iluminada.com'),
  EMAIL_FROM_NAME: optional('EMAIL_FROM_NAME', 'Iluminada & George'),
  COUPLE_NOTIFICATION_EMAILS: optional('COUPLE_NOTIFICATION_EMAILS', 'rsvp@george-and-iluminada.com'),
};
