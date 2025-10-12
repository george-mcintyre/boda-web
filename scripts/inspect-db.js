#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

(async function inspect() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const dbName = process.env.MONGODB_DB || 'boda-web';
    console.log(`[DB] Connecting to ${uri}/${dbName} ...`);
    await mongoose.connect(uri, { dbName });

    const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
    if (!collections.length) {
      console.log('[DB] No collections found.');
    } else {
      console.log('[DB] Collections:');
      for (const c of collections) {
        console.log(` - ${c.name}`);
      }
    }
  } catch (e) {
    console.error('[DB] Inspect error:', e.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
