#!/usr/bin/env node
/*
  Seed cube gifts into MongoDB.
  Usage:
    node scripts/seed-cubes.js
  Idempotent: re-running preserves `available` (sold state) and inserts only missing cubes.
  Safe to run in production.
  Uses env: MONGODB_URI, MONGODB_DB
*/
const mongoose = require('../server/node_modules/mongoose');
const { MONGODB_URI, MONGODB_DB } = require('../server/config/env');
const { ensureCollectionsAndIndexes, seedCubeGiftsIfNeeded } = require('../server/bootstrap/initDb');

async function main() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI not configured');
  console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log('Connected.');

  await ensureCollectionsAndIndexes();
  const result = await seedCubeGiftsIfNeeded();
  console.log('[SEED-CUBES] Result:', result);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('[SEED-CUBES] Failed:', err);
  process.exit(1);
});
