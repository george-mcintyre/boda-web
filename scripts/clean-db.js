#!/usr/bin/env node
/*
  Clean MongoDB for this project.
  Usage:
    node scripts/clean-db.js                # delete all documents from known collections (asks to confirm)
    node scripts/clean-db.js --force        # same, no prompt
    node scripts/clean-db.js --drop         # DROP DATABASE (asks to confirm)
    node scripts/clean-db.js --drop --force # DROP DATABASE without prompt

  Uses env: MONGODB_URI, MONGODB_DB (or dev defaults when NODE_ENV!=='production').
*/
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const models = require('../server/models');

const args = new Set(process.argv.slice(2));
const wantDrop = args.has('--drop');
const force = args.has('--force') || args.has('-y');

const { MONGODB_URI, MONGODB_DB, NODE_ENV } = require('../server/config/env');

async function askConfirm(question) {
  if (force) return true;
  if (!process.stdin.isTTY) {
    console.warn('[WARN] Non-interactive shell detected. Use --force to proceed without prompt.');
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => rl.question(question, a => { rl.close(); resolve(a); }));
  return /^y(es)?$/i.test(String(answer).trim());
}

async function main() {
  try {
    if (!MONGODB_URI) throw new Error('MONGODB_URI not configured');
    console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
    console.log('Connected.');

    const db = mongoose.connection.db;

    if (wantDrop) {
      const ok = await askConfirm(`Are you sure you want to DROP the entire database "${MONGODB_DB}" at ${MONGODB_URI}? [y/N] `);
      if (!ok) return console.log('Aborted.');
      const res = await db.dropDatabase();
      console.log('Database dropped:', res);
    } else {
      const list = Object.values(models);
      const countsBefore = await Promise.all(list.map(m => m.estimatedDocumentCount()));
      const names = list.map(m => m.collection.name);

      const summary = names.map((n,i)=>`  - ${n}: ${countsBefore[i]} docs`).join('\n');
      console.log('Collections to clean (delete all documents):\n' + summary);

      const ok = await askConfirm('Proceed to delete all documents from these collections? [y/N] ');
      if (!ok) return console.log('Aborted.');

      const results = [];
      for (const Model of list) {
        const before = await Model.estimatedDocumentCount();
        await Model.deleteMany({});
        const after = await Model.estimatedDocumentCount();
        results.push({ collection: Model.collection.name, before, after });
      }
      console.log('Cleanup complete:\n' + results.map(r => `  - ${r.collection}: ${r.before} -> ${r.after}`).join('\n'));
    }

    if (NODE_ENV !== 'production') {
      console.log('[INFO] NODE_ENV is not production. If you want to repopulate example data, restart the server or run a seed script.');
    }
  } catch (e) {
    console.error('Failed to clean database:', e.message);
    process.exitCode = 1;
  } finally {
    try { await mongoose.connection.close(); } catch (_) {}
  }
}

main();
