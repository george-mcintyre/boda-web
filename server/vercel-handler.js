// server/vercel-handler.js
const { app } = require('./app');
const { connectDB } = require('./config/db');
const { ensureCollectionsAndIndexes, seedExampleDataIfEmpty } = require('./bootstrap/initDb');

let isInitialized = false;

async function init() {
  if (isInitialized) return;
  await connectDB();
  await ensureCollectionsAndIndexes().catch(err =>
    console.warn('[DB] Init warning:', err.message)
  );
  await seedExampleDataIfEmpty().catch(err =>
    console.warn('[DB] Seed warning:', err.message)
  );
  isInitialized = true;
}

// Vercel will call this per request
module.exports = async (req, res) => {
  await init();
  // Express apps are just (req, res) handlers
  return app(req, res);
};
