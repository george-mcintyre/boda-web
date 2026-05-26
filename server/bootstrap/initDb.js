const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const models = require('../models');
const { NODE_ENV } = require('../config/env');
const { EJSON } = require('bson');
const { seedCubes } = require('./seedCubes');
const { seedFigurines } = require('./seedFigurines');

async function ensureCollectionsAndIndexes() {
  const conn = mongoose.connection;
  if (!conn || conn.readyState !== 1) {
    throw new Error('MongoDB is not connected');
  }

  const desired = {
    Admin: models.Admin,
    Config: models.Config,
    ChefProfile: models.ChefProfile,
    ChefProfileImage: models.ChefProfileImage,
    Course: models.Course,
    CourseOption: models.CourseOption,
    CourseOptionImage: models.CourseOptionImage,
    DayMenu: models.DayMenu,
    DayMenuImage: models.DayMenuImage,
    Event: models.Event,
    EventChoice: models.EventChoice,
    EventImage: models.EventImage,
    Gift: models.Gift,
    GiftChoice: models.GiftChoice,
    GiftImage: models.GiftImage,
    Guest: models.Guest,
    MenuChoice: models.MenuChoice,
    Message: models.Message,
    Table: models.Table,
    TableAssignment: models.TableAssignment,
  };

  // Map model names to collection names as Mongoose would create them
  // Using Model.collection.name is reliable after initialization
  const desiredCollections = Object.entries(desired).map(([name, Model]) => ({
    modelName: name,
    collectionName: Model.collection.name,
    Model,
  }));

  const existing = await conn.db.listCollections({}, { nameOnly: true }).toArray();
  const existingNames = new Set(existing.map(c => c.name));

  const created = [];
  for (const { collectionName } of desiredCollections) {
    if (!existingNames.has(collectionName)) {
      await conn.db.createCollection(collectionName);
      created.push(collectionName);
    }
  }

  // Ensure indexes for models that declare unique fields etc.
  // createIndexes() will no-op if already present
  await Promise.all(Object.values(desired).map(Model => Model.createIndexes().catch(() => {})));

  // Small console report
  if (created.length) {
    console.log('[DB] Created missing collections:', created.join(', '));
  } else {
    console.log('[DB] All required collections already exist');
  }

  // Return a diagnostic summary
  return {
    created,
    existing: Array.from(existingNames),
    required: desiredCollections.map(d => d.collectionName),
  };
}

async function seedExampleDataIfEmpty() {
  if (NODE_ENV === 'production') {
    console.log('[DB] Skipping example data seeding in production');
    return { seeded: false, reason: 'production' };
  }

  const dataDir = path.join(__dirname, '../data');

  if (!fs.existsSync(dataDir)) {
    console.log('[DB] No example data directory found:', dataDir);
    return { seeded: false, reason: 'no-data-dir' };
  }

  console.log('[DB] Seeding database with example data from', dataDir);

  // Only needed if you have weird names you *don’t* want to follow the generic rule
  const explicitModelMap = {
    // Example:
    // GiftChoices: 'GiftChoice',
  };

  // Plural file base -> singular model name, preserving case
  const toModelName = (base) => {
    if (explicitModelMap[base]) return explicitModelMap[base];

    if (base.endsWith('ies')) {
      // Stories -> Story
      return base.slice(0, -3) + 'y';
    }
    if (base.endsWith('s')) {
      // Configs -> Config, Events -> Event, GiftChoices -> GiftChoice,
      // CourseOptions -> CourseOption, CourseOptionImages -> CourseOptionImage, etc.
      return base.slice(0, -1);
    }
    return base;
  };

  // Optional: preferred load order by **model name**
  const preferredOrder = [
    // 'Config',
    // 'Course',
    // 'Event',
    // 'Gift',
    // 'GiftChoice',
    // 'Guest',
    // ...
  ];

  const allFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

  const fileModelPairs = allFiles.map(file => {
    const base = path.basename(file, '.json'); // e.g. "CourseOptionImages"
    const modelName = toModelName(base);       // -> "CourseOptionImage"
    return { file, modelName };
  });

  const orderedPairs = preferredOrder.length
    ? [
        ...preferredOrder
          .map(name => fileModelPairs.find(p => p && p.modelName === name))
          .filter(Boolean),
        ...fileModelPairs.filter(p => !preferredOrder.includes(p.modelName)),
      ]
    : fileModelPairs;

  const seededModels = [];

  for (const { file, modelName } of orderedPairs) {
    const Model = models[modelName];

    if (!Model) {
      console.warn(
        `[DB] No model found for file "${file}" (expected models.${modelName}), skipping`
      );
      continue;
    }

    const count = await Model.countDocuments();
    if (count > 0) {
      console.log(
        `[DB] ${modelName} already has ${count} documents, skipping "${file}"`
      );
      continue;
    }

    const fullPath = path.join(dataDir, file);

    let docs;
    try {
      const text = fs.readFileSync(fullPath, 'utf8');
      docs = EJSON.parse(text); // handles $oid, $date, etc.
    } catch (err) {
      console.error(`[DB] Failed to read/parse "${file}":`, err.message);
      continue;
    }

    if (!docs || (Array.isArray(docs) && docs.length === 0)) {
      console.log(`[DB] No documents in "${file}", skipping`);
      continue;
    }

    try {
      if (Array.isArray(docs)) {
        await Model.insertMany(docs);
      } else {
        await Model.create(docs);
      }
      console.log(`[DB] Seeded ${modelName} from "${file}"`);
      seededModels.push(modelName);
    } catch (err) {
      console.error(
        `[DB] Failed to seed ${modelName} from "${file}":`,
        err.message
      );
    }
  }

  if (seededModels.length) {
    console.log('[DB] Seeded example data for:', seededModels.join(', '));
    return { seeded: true, collections: seededModels };
  }

  console.log('[DB] No example data seeding needed');
  return { seeded: false };
}

async function seedCubeGiftsIfNeeded() {
  try {
    const result = await seedCubes();
    if (result.inserted > 0) {
      console.log(`[DB] Cube gifts: inserted ${result.inserted} (total ${result.total})`);
    } else if (result.skipped > 0) {
      console.log(`[DB] Cube gifts: ${result.skipped} already present, skipping seed`);
    }
    return result;
  } catch (err) {
    console.error('[DB] Failed to seed cube gifts:', err.message);
    throw err;
  }
}

async function seedFigurineGiftsIfNeeded() {
  try {
    const result = await seedFigurines();
    if (result.inserted > 0) {
      console.log(`[DB] Figurine gifts: inserted ${result.inserted} (total ${result.total})`);
    } else if (result.skipped > 0) {
      console.log(`[DB] Figurine gifts: ${result.skipped} already present, skipping seed`);
    }
    return result;
  } catch (err) {
    console.error('[DB] Failed to seed figurine gifts:', err.message);
    throw err;
  }
}

const CASH_GIFT_AMOUNT_OPTIONS = [25, 50, 100, 200, 500];

async function migrateCashGiftsToAmountOptions() {
  const Gift = models.Gift;
  const result = await Gift.updateMany(
    {
      $and: [
        { $or: [{ type: 'cash' }, { type: { $exists: false } }] },
        { $or: [{ amountOptions: { $exists: false } }, { amountOptions: { $size: 0 } }] },
      ],
    },
    {
      $set: { amountOptions: CASH_GIFT_AMOUNT_OPTIONS },
      $unset: { amount: '' },
    }
  );
  if (result.modifiedCount > 0) {
    console.log(`[DB] Migrated ${result.modifiedCount} cash gift(s) to amountOptions=[${CASH_GIFT_AMOUNT_OPTIONS.join(', ')}]`);
  } else {
    console.log('[DB] No cash gifts needed amountOptions migration');
  }
  return result;
}

async function migrateGuestsAddLang() {
  const Guest = models.Guest;
  const result = await Guest.updateMany(
    { lang: { $exists: false } },
    { $set: { lang: 'en' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[DB] Set lang='en' on ${result.modifiedCount} existing guest(s)`);
  } else {
    console.log('[DB] No guests needed lang migration');
  }
  return result;
}

async function migrateGiftChoiceStripeIndexToSparse() {
  const GiftChoice = models.GiftChoice;
  const coll = GiftChoice.collection;

  // First: scrub explicit null stripeSessionId fields from any cash purchases
  // created before this migration. Sparse indexes ignore documents where the
  // field is ABSENT but not where it is present-and-null, so we have to unset
  // them or two cash purchases would still collide on a unique-sparse index.
  const nullScrub = await coll.updateMany(
    { stripeSessionId: null },
    { $unset: { stripeSessionId: '' } }
  );
  if (nullScrub.modifiedCount > 0) {
    console.log(`[DB] Unset explicit null stripeSessionId on ${nullScrub.modifiedCount} GiftChoice document(s)`);
  }

  const indexes = await coll.indexes();
  const existing = indexes.find(idx => idx.name === 'stripeSessionId_1');
  if (!existing) {
    await GiftChoice.createIndexes().catch(() => {});
    return;
  }
  if (existing.sparse) {
    console.log('[DB] GiftChoice.stripeSessionId index already sparse');
    return;
  }
  console.log('[DB] Dropping non-sparse GiftChoice.stripeSessionId index so it can be recreated as sparse-unique');
  await coll.dropIndex('stripeSessionId_1');
  await GiftChoice.createIndexes();
  console.log('[DB] Recreated GiftChoice.stripeSessionId index as sparse-unique');
}

module.exports = {
  ensureCollectionsAndIndexes,
  seedExampleDataIfEmpty,
  seedCubeGiftsIfNeeded,
  seedFigurineGiftsIfNeeded,
  migrateCashGiftsToAmountOptions,
  migrateGuestsAddLang,
  migrateGiftChoiceStripeIndexToSparse,
};
