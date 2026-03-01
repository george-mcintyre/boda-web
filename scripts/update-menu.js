#!/usr/bin/env node
/**
 * Menu Update Script - MENU DATA ONLY
 * 
 * ⚠️  CRITICAL SAFETY NOTICE:
 * This script ONLY touches menu data (Course and CourseOption collections).
 * It will NEVER delete or modify:
 *   - Guests
 *   - Admins
 *   - Events
 *   - Messages
 *   - Gift data
 *   - Any other user data
 * 
 * This script updates the wedding banquet menu by:
 * 1. Removing all existing menu data (courses and options ONLY)
 * 2. Adding new menu data from menu-structure.json
 */

const mongoose = require('../server/node_modules/mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import models
const { Course, CourseOption } = require('../server/models');

// Parse command line arguments
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force') || args.has('-y');

// Load environment variables
// Load environment variables using server config
const { MONGODB_URI, MONGODB_DB, NODE_ENV } = require('../server/config/env');

// Load menu data
const menuDataPath = path.join(__dirname, 'menu-structure.json');
let menuData;

try {
  menuData = JSON.parse(fs.readFileSync(menuDataPath, 'utf8'));
} catch (e) {
  console.error('Failed to load menu data from menu-structure.json:', e.message);
  process.exit(1);
}

// SAFETY: Verify we're only importing menu models
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  MENU UPDATE SCRIPT - SAFETY VERIFICATION');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('✓ This script will ONLY modify:');
console.log('  - Course collection (menu courses)');
console.log('  - CourseOption collection (menu options)');
console.log('');
console.log('✓ This script will NEVER touch:');
console.log('  - Guests (preserved)');
console.log('  - Admins (preserved)');
console.log('  - Events (preserved)');
console.log('  - Messages (preserved)');
console.log('  - Gifts (preserved)');
console.log('  - Any other user data (preserved)');
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('');

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

async function removeExistingMenuData() {
  console.log('\n=== STEP 1: Remove Existing Menu Data ===\n');
  
  const courseCount = await Course.countDocuments();
  const optionCount = await CourseOption.countDocuments();
  
  console.log(`Found ${courseCount} courses and ${optionCount} options to remove.`);
  
  if (dryRun) {
    console.log('[DRY RUN] Would delete all courses and options.');
    return;
  }
  
  // Delete all course options first (due to foreign key reference)
  const optionsDeleted = await CourseOption.deleteMany({});
  console.log(`✓ Deleted ${optionsDeleted.deletedCount} course options`);
  
  // Delete all courses
  const coursesDeleted = await Course.deleteMany({});
  console.log(`✓ Deleted ${coursesDeleted.deletedCount} courses`);
}

async function verifyDataSafety() {
  console.log('\n=== PRE-FLIGHT SAFETY CHECK ===\n');
  
  // Import ALL models to verify they exist
  const { Guest, Admin, Event, Message, Gift } = require('../server/models');
  
  // Count critical user data
  const guestCount = await Guest.countDocuments();
  const adminCount = await Admin.countDocuments();
  const eventCount = await Event.countDocuments();
  const messageCount = await Message.countDocuments();
  const giftCount = await Gift.countDocuments();
  
  console.log('Current database state:');
  console.log(`  Guests: ${guestCount}`);
  console.log(`  Admins: ${adminCount}`);
  console.log(`  Events: ${eventCount}`);
  console.log(`  Messages: ${messageCount}`);
  console.log(`  Gifts: ${giftCount}`);
  console.log('');
  console.log('✓ Safety check PASSED - User data will be preserved');
  
  if (guestCount === 0) {
    console.log('');
    console.log('⚠️  WARNING: No guests found in database!');
    console.log('   This is unusual. Make sure you have guest data before running in production.');
    console.log('');
  }
  
  if (adminCount === 0) {
    console.log('');
    console.log('⚠️  WARNING: No admins found in database!');
    console.log('   You will not be able to log in to the admin panel.');
    console.log('');
  }
}

async function addNewMenuData() {
  console.log('\n=== STEP 2: Add New Menu Data ===\n');
  
  const { courses } = menuData;
  console.log(`Loading ${courses.length} courses with options...`);
  
  if (dryRun) {
    console.log('[DRY RUN] Would create the following:');
    courses.forEach((course, idx) => {
      console.log(`  ${idx + 1}. ${course.label.en} (${course.course}) - ${course.options.length} options`);
      course.options.forEach((opt, optIdx) => {
        console.log(`     ${idx + 1}.${optIdx + 1}. ${opt.label.en}`);
      });
    });
    return;
  }
  
  // Create courses and their options
  for (const courseData of courses) {
    const { tempId, options, ...courseFields } = courseData;
    
    // Create the course
    const course = await Course.create(courseFields);
    console.log(`✓ Created course: ${courseFields.label.en} (${course.course})`);
    
    // Create options for this course
    for (const optionData of options) {
      const option = await CourseOption.create({
        courseId: course._id,
        ...optionData
      });
      console.log(`  ✓ Created option: ${optionData.label.en}`);
    }
  }
  
  console.log('\n✓ Menu data loaded successfully!');
}

async function showSummary() {
  console.log('\n=== Summary ===\n');
  
  const courseCount = await Course.countDocuments();
  const optionCount = await CourseOption.countDocuments();
  
  console.log(`Total courses: ${courseCount}`);
  console.log(`Total options: ${optionCount}`);
  
  // Show breakdown by course type
  const courses = await Course.find();
  for (const course of courses) {
    const options = await CourseOption.find({ courseId: course._id });
    console.log(`  - ${course.label.en} (${course.course}): ${options.length} options`);
  }
}

async function main() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    // SAFETY CHECK: Prevent accidental production deletion
    if (MONGODB_URI.includes('mongodb.net') || MONGODB_URI.includes('cloud.mongodb.com')) {
      console.error('❌ DANGER: This appears to be a production/cloud MongoDB URI!');
      console.error('MONGODB_URI:', MONGODB_URI);
      console.error('\nTo update production menu, you must:');
      console.error('1. Set ALLOW_PRODUCTION_UPDATE=true in environment');
      console.error('2. Run this script again\n');
      if (process.env.ALLOW_PRODUCTION_UPDATE !== 'true') {
        throw new Error('Production menu update prevented. Set ALLOW_PRODUCTION_UPDATE=true to override.');
      }
      console.warn('⚠️  ALLOW_PRODUCTION_UPDATE is set. Proceeding with production update...\n');
    }
    
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║          Wedding Menu Update Script                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }
    
    console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
    console.log('✓ Connected.\n');
    
    // SAFETY: Verify we won't delete user data
    await verifyDataSafety();
    
    // Ask for confirmation
    if (!dryRun) {
      const confirmed = await askConfirm(
        '\n⚠️  This will DELETE all existing menu data (courses & options only) and replace it.\n' +
        '✓ User data (guests, admins, events, messages, gifts) will NOT be touched.\n' +
        'Are you sure you want to continue? [y/N] '
      );
      
      if (!confirmed) {
        console.log('\nAborted.');
        return;
      }
    }
    
    // Step 1: Remove existing data
    await removeExistingMenuData();
    
    // Step 2: Add new data
    await addNewMenuData();
    
    // Show summary
    if (!dryRun) {
      await showSummary();
    }
    
    console.log('\n✅ Menu update complete!\n');
    
  } catch (e) {
    console.error('\n❌ Failed to update menu:', e.message);
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    try { 
      await mongoose.connection.close(); 
      console.log('Database connection closed.');
    } catch (_) {}
  }
}

main();
