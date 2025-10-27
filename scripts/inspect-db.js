#!/usr/bin/env node
const mongoose = require('../server/node_modules/mongoose');
const { MONGODB_URI, MONGODB_DB } = require('../server/config/env');

(async function inspect() {
  try {
    const uri = MONGODB_URI;
    const dbName = MONGODB_DB;
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
