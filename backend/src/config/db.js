const mongoose = require('mongoose');
const { MONGODB_URI, MONGODB_DB } = require('./env');

async function connectDB() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
}

module.exports = { connectDB };
