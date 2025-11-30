#!/usr/bin/env node
/*
  Migrate data from old MongoDB strings to new MongoDB LocalizedString schema.
  Usage:
    node scripts/migrate.js                # migrate data from old MongoDB strings to new MongoDB LocalizedString schema
*/
const mongoose = require('../server/node_modules/mongoose');
const { Course, CourseOption, Event, Gift } = require('../server/models/index.js');

function wrap(value) {
  if (typeof value === 'string') return { en: value };
  return value;
}

async function migrateEvents() {
  console.log('Migrating events...');
  const events = await Event.find({
    $or: [
      { name: { $type: 'string' } },
      { title: { $type: 'string' } },
      { description: { $type: 'string' } },
      { 'sub_events.name': { $type: 'string' } },
      { 'sub_events.description': { $type: 'string' } },
    ],
  });
  console.log(`Found ${events.length} events to migrate`);
  for (const ev of events) {
    let dirty = false;

    if (typeof ev.name === 'string') {
      ev.name = wrap(ev.name);
      dirty = true;
    }
    if (typeof ev.title === 'string') {
      ev.title = wrap(ev.title);
      dirty = true;
    }
    if (typeof ev.description === 'string') {
      ev.description = wrap(ev.description);
      dirty = true;
    }

    if (Array.isArray(ev.sub_events)) {
      ev.sub_events = ev.sub_events.map(se => {
        const copy = se.toObject ? se.toObject() : { ...se };
        if (typeof copy.name === 'string') copy.name = wrap(copy.name);
        if (typeof copy.description === 'string') copy.description = wrap(copy.description);
        return copy;
      });
      dirty = true;
    }

    if (dirty) await ev.save();
  }
  console.log(`Migrated ${events.length} events`);
}

async function migrateCourses() {
  console.log('Migrating courses...');
  const courses = await Course.find({
    $or: [
      { label: { $type: 'string' } },
    ],
  });
  console.log(`Found ${courses.length} courses to migrate`);
  for (const course of courses) {
    let dirty = false;

    if (typeof course.label === 'string') {
      course.label = wrap(course.label);
      dirty = true;
    }

    if (dirty) await course.save();
  }
  console.log(`Migrated ${courses.length} courses`);
}

async function migrateCourseOptions() {
  console.log('Migrating course options...');
  const courseOptions = await CourseOption.find({
    $or: [
      { label: { $type: 'string' } },
      { description: { $type: 'string' } },
    ],
  });
  console.log(`Found ${courseOptions.length} course options to migrate`);
  for (const courseOption of courseOptions) {
    let dirty = false;

    if (typeof courseOption.label === 'string') {
      courseOption.label = wrap(courseOption.label);
      dirty = true;
    }
    if (typeof courseOption.description === 'string') {
      courseOption.description = wrap(courseOption.description);
      dirty = true;
    }

    if (dirty) await courseOption.save();
  }
  console.log(`Migrated ${courseOptions.length} course options`);
}

async function migrateGifts() {
  console.log('Migrating gifts...');
  const gifts = await Gift.find({
    $or: [
      { title: { $type: 'string' } },
      { description: { $type: 'string' } },
    ],
  });
  console.log(`Found ${gifts.length} gifts to migrate`);
  for (const gift of gifts) {
    let dirty = false;

    if (typeof gift.title === 'string') {
      gift.title = wrap(gift.title);
      dirty = true;
    }
    if (typeof gift.description === 'string') {
      gift.description = wrap(gift.description);
      dirty = true;
    }

    if (dirty) await gift.save();
  }
  console.log(`Migrated ${gifts.length} gifts`);
}

(async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  await migrateEvents();
  await migrateCourses();
  await migrateCourseOptions();
  await migrateGifts();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
})();
