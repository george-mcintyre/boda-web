#!/usr/bin/env node
/*
  Seed example data into MongoDB for this project (non-production).
  Usage:
    node scripts/seed-db.js           # seeds only if collections are empty
    node scripts/seed-db.js --force   # forces cleaning then seeding (non-prod only)

  Uses env: MONGODB_URI, MONGODB_DB, NODE_ENV
*/
const mongoose = require('../server/node_modules/mongoose');
const { NODE_ENV, MONGODB_URI, MONGODB_DB } = require('../server/config/env');
const { ensureCollectionsAndIndexes, seedExampleDataIfEmpty } = require('../server/bootstrap/initDb');
const models = require('../server/models');

const args = new Set(process.argv.slice(2));
const force = args.has('--force') || args.has('-f');

async function main(){
  if (!MONGODB_URI) throw new Error('MONGODB_URI not configured');
  if (NODE_ENV === 'production') {
    console.log('[SEED] Skipping: NODE_ENV=production');
    return;
  }
  console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log('Connected.');

  await ensureCollectionsAndIndexes();

  if (force) {
    // Clean all known collections first
    const list = Object.values(models);
    for (const Model of list) {
      await Model.deleteMany({});
    }
    console.log('[SEED] Cleaned all known collections');
  }

  const res = await seedExampleDataIfEmpty();
  console.log('[SEED] Result:', res);
}

main().catch(err => { console.error('[SEED] Failed:', err.message); process.exitCode = 1; }).finally(async()=>{
  try { await mongoose.connection.close(); } catch(_) {}
});
