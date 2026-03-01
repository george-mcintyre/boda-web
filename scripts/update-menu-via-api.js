#!/usr/bin/env node
/**
 * Menu Update Script - Using Admin API Only
 * 
 * This script updates menu data through the Admin API (no direct DB connection).
 * Safe for production use.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Parse command line arguments
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force') || args.has('-y');

// Load menu data
const menuDataPath = path.join(__dirname, 'menu-structure.json');
let menuData;

try {
  menuData = JSON.parse(fs.readFileSync(menuDataPath, 'utf8'));
} catch (e) {
  console.error('Failed to load menu data from menu-structure.json:', e.message);
  process.exit(1);
}

// Helper: Make API request
async function apiRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${method} ${endpoint} failed: ${response.status} ${text}`);
  }
  
  return response.json();
}

// Step 1: Login to get admin token
async function login() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables required');
    console.error('Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node update-menu-via-api.js');
    process.exit(1);
  }
  
  console.log('Logging in as admin...');
  const result = await apiRequest('POST', '/api/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  
  if (result.type !== 'admin') {
    console.error('ERROR: Login succeeded but user is not an admin');
    process.exit(1);
  }
  
  console.log('✓ Admin login successful');
  return result.token;
}

// Step 2: Get existing menu courses
async function getExistingCourses(token) {
  console.log('\nFetching existing menu courses...');
  const courses = await apiRequest('GET', '/api/admin/courseData', null, token);
  console.log(`✓ Found ${courses.length} existing courses`);
  return courses;
}

// Step 3: Delete all existing courses and options
async function deleteExistingMenu(token, courses) {
  if (dryRun) {
    console.log('\n[DRY RUN] Would delete:');
    for (const course of courses) {
      const optionCount = course.options ? course.options.length : 0;
      console.log(`  - Course: ${course.label} (${optionCount} options)`);
    }
    return;
  }
  
  console.log(`\nDeleting ${courses.length} existing courses...`);
  for (const course of courses) {
    await apiRequest('DELETE', `/api/admin/courseData/${course.id}`, null, token);
    console.log(`  ✓ Deleted: ${course.label}`);
  }
}

// Step 4: Create new courses
async function createCourses(token, coursesData) {
  if (dryRun) {
    console.log('\n[DRY RUN] Would create:');
    for (const course of coursesData) {
      console.log(`  - Course: ${course.label.en} (${course.options.length} options)`);
    }
    return {};
  }
  
  console.log(`\nCreating ${coursesData.length} new courses...`);
  const courseIdMap = {};
  
  for (const courseData of coursesData) {
    // Create course
    const newCourse = await apiRequest('POST', '/api/admin/courseData?lang=en', {
      course: courseData.course,
      label: courseData.label.en,
      selectionRequired: courseData.selectionRequired
    }, token);
    
    courseIdMap[courseData.course] = newCourse.id;
    console.log(`  ✓ Created: ${courseData.label.en} (ID: ${newCourse.id})`);
    
    // Update labels for other languages
    for (const lang of ['es', 'fr', 'de']) {
      await apiRequest('PUT', `/api/admin/courseData/${newCourse.id}?lang=${lang}`, {
        course: courseData.course,
        label: courseData.label[lang],
        selectionRequired: courseData.selectionRequired
      }, token);
    }
  }
  
  return courseIdMap;
}

// Step 5: Create menu options for each course
async function createOptions(token, coursesData, courseIdMap) {
  if (dryRun) {
    console.log('\n[DRY RUN] Would create menu options (skipped in dry run)');
    return;
  }
  
  console.log('\nCreating menu options...');
  
  for (const courseData of coursesData) {
    const courseId = courseIdMap[courseData.course];
    
    for (const option of courseData.options) {
      // Create option (English first)
      const newOption = await apiRequest('POST', `/api/admin/courseData/${courseId}/options?lang=en`, {
        label: option.label.en,
        description: option.description.en,
        image: null, // Images uploaded separately
        isVegan: option.isVegan || false,
        isVegetarian: option.isVegetarian || false,
        isSpicy: option.isSpicy || false,
        containsGluten: option.containsGluten || false,
        containsEggs: option.containsEggs || false,
        containsFish: option.containsFish || false,
        containsShellfish: option.containsShellfish || false,
        containsSoy: option.containsSoy || false,
        containsSesame: option.containsSesame || false,
        containsLactose: option.containsLactose || false,
        containsNuts: option.containsNuts || false
      }, token);
      
      console.log(`  ✓ Created: ${option.label.en}`);
      
      // Update labels/descriptions for other languages
      for (const lang of ['es', 'fr', 'de']) {
        await apiRequest('PUT', `/api/admin/courseData/${courseId}/options/${newOption.id}?lang=${lang}`, {
          label: option.label[lang],
          description: option.description[lang],
          image: null,
          isVegan: option.isVegan || false,
          isVegetarian: option.isVegetarian || false,
          isSpicy: option.isSpicy || false,
          containsGluten: option.containsGluten || false,
          containsEggs: option.containsEggs || false,
          containsFish: option.containsFish || false,
          containsShellfish: option.containsShellfish || false,
          containsSoy: option.containsSoy || false,
          containsSesame: option.containsSesame || false,
          containsLactose: option.containsLactose || false,
          containsNuts: option.containsNuts || false
        }, token);
      }
    }
  }
}

// Step 6: Confirm before proceeding
async function confirmProduction() {
  if (force) {
    return true;
  }
  
  if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
    return true; // No confirmation needed for local
  }
  
  console.log('\n⚠️  WARNING: You are about to update PRODUCTION menu data');
  console.log(`   Target: ${API_BASE_URL}`);
  console.log('   This will DELETE all existing courses and options');
  console.log('   User data (guests, admins, choices, messages, gifts) will NOT be affected');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\nType "YES" to proceed: ', (answer) => {
      rl.close();
      resolve(answer === 'YES');
    });
  });
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Wedding Menu Update Script (Admin API)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Target API: ${API_BASE_URL}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log('');
  
  try {
    // Login
    const token = await login();
    
    // Get existing menu
    const existingCourses = await getExistingCourses(token);
    
    // Confirm
    if (!dryRun) {
      const confirmed = await confirmProduction();
      if (!confirmed) {
        console.log('\nAborted by user');
        process.exit(0);
      }
    }
    
    // Delete existing menu
    await deleteExistingMenu(token, existingCourses);
    
    // Create new courses
    const courseIdMap = await createCourses(token, menuData.courses);
    
    // Create menu options
    await createOptions(token, menuData.courses, courseIdMap);
    
    console.log('\n═══════════════════════════════════════════════════════');
    if (dryRun) {
      console.log('  DRY RUN COMPLETE - No changes made');
    } else {
      console.log('  ✓ MENU UPDATE COMPLETE');
      console.log('');
      console.log('  Next steps:');
      console.log('  1. Upload images using /tmp/boda-menu-data/upload-images.js');
      console.log('  2. Verify in Admin UI');
    }
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
