require('dotenv').config();

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
  MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB || 'boda-web',
  JWT_SECRET,
  // Stripe key is optional at boot. Specific features will error if missing at runtime.
  STRIPE_SECRET_KEY: optional('STRIPE_SECRET_KEY', ''),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
