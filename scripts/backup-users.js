#!/usr/bin/env node
/**
 * Backup Users Script
 * 
 * Creates a JSON backup of all critical user data (admins, guests)
 * Run this BEFORE any database operations in production!
 * 
 * Usage:
 *   node scripts/backup-users.js                    # Creates backup-YYYY-MM-DD-HH-mm-ss.json
 *   node scripts/backup-users.js --restore FILE     # Restores from backup file
 */

const mongoose = require('../server/node_modules/mongoose');
const fs = require('fs');
const path = require('path');

const { MONGODB_URI, MONGODB_DB } = require('../server/config/env');
const { Guest, Admin } = require('../server/models');

const args = process.argv.slice(2);
const isRestore = args[0] === '--restore';
const backupFile = args[1];

async function createBackup() {
  console.log('\n=== Creating User Data Backup ===\n');
  
  const guests = await Guest.find({}).lean();
  const admins = await Admin.find({}).lean();
  
  const backup = {
    timestamp: new Date().toISOString(),
    mongodb_uri: MONGODB_URI,
    mongodb_db: MONGODB_DB,
    data: {
      guests: guests,
      admins: admins
    },
    counts: {
      guests: guests.length,
      admins: admins.length
    }
  };
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `backup-users-${timestamp}.json`;
  const filepath = path.join(__dirname, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
  
  console.log(`✓ Backup created: ${filename}`);
  console.log(`  Guests: ${backup.counts.guests}`);
  console.log(`  Admins: ${backup.counts.admins}`);
  console.log(`  Location: ${filepath}\n`);
  
  return filepath;
}

async function restoreBackup(filepath) {
  console.log('\n=== Restoring User Data from Backup ===\n');
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`Backup file not found: ${filepath}`);
  }
  
  const backup = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  console.log(`Backup from: ${backup.timestamp}`);
  console.log(`  Guests in backup: ${backup.counts.guests}`);
  console.log(`  Admins in backup: ${backup.counts.admins}\n`);
  
  // Clear existing data
  console.log('Clearing existing user data...');
  await Guest.deleteMany({});
  await Admin.deleteMany({});
  
  // Restore guests
  if (backup.data.guests.length > 0) {
    await Guest.insertMany(backup.data.guests);
    console.log(`✓ Restored ${backup.data.guests.length} guests`);
  }
  
  // Restore admins
  if (backup.data.admins.length > 0) {
    await Admin.insertMany(backup.data.admins);
    console.log(`✓ Restored ${backup.data.admins.length} admins`);
  }
  
  console.log('\n✅ Restore complete!\n');
}

async function main() {
  try {
    console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
    console.log('✓ Connected.\n');
    
    if (isRestore) {
      if (!backupFile) {
        throw new Error('Please specify backup file: --restore <filename>');
      }
      await restoreBackup(backupFile);
    } else {
      await createBackup();
    }
    
  } catch (e) {
    console.error('\n❌ Failed:', e.message);
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

main();
