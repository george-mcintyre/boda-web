#!/usr/bin/env node
/*
  Clean stray cookingPreference values from MenuChoice documents.

  Background:
    Commit ab0a470 introduced `cookingPreference` on individual menu choices
    with a Mongoose schema default of 'medium'. Combined with controller code
    that force-defaulted to 'medium' on save, this caused EVERY saved choice
    (fish, vegetarian, welcome cocktails, etc.) to receive a spurious
    cookingPreference of 'medium', not just beef. The admin views then
    rendered "(Medium)" on courses where it makes no sense.

    The schema default and controller fallback have since been changed to
    null, so future saves are clean. This script repairs ALREADY-saved data.

  What it does:
    For every MenuChoice → partyChoice → individual choice:
      - Look up the referenced CourseOption by optionId
      - If the CourseOption does NOT have allowsCookingPreference: true,
        AND the choice has a cookingPreference value, unset it.
    Choices on options that legitimately allow cooking preference are left
    untouched, preserving real beef preferences.

  Usage:
    node scripts/clean-stray-cooking-preferences.js              # dry-run by default (lists what would change)
    node scripts/clean-stray-cooking-preferences.js --apply      # actually performs the updates
    node scripts/clean-stray-cooking-preferences.js --apply --force   # skip confirmation prompt

  Uses env: MONGODB_URI, MONGODB_DB (or dev defaults when NODE_ENV!=='production').
*/
const mongoose = require('../server/node_modules/mongoose');
const readline = require('readline');
const { MenuChoice, CourseOption } = require('../server/models');
const { MONGODB_URI, MONGODB_DB } = require('../server/config/env');

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const force = args.has('--force') || args.has('-y');
const showHelp = args.has('--help') || args.has('-h');

if (showHelp) {
  console.log(`Usage:
  node scripts/clean-stray-cooking-preferences.js              # dry-run (default, shows what would change)
  node scripts/clean-stray-cooking-preferences.js --apply      # apply the changes (with confirmation prompt)
  node scripts/clean-stray-cooking-preferences.js --apply --force   # apply without confirmation
`);
  process.exit(0);
}

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

function looksLikeProductionUri(uri) {
  return uri && (uri.includes('mongodb.net') || uri.includes('cloud.mongodb.com'));
}

async function main() {
  if (looksLikeProductionUri(MONGODB_URI)) {
    console.warn('⚠️  This appears to be a production/cloud MongoDB URI:');
    console.warn(`    ${MONGODB_URI.replace(/:[^:@]+@/, ':***@')}`);
    if (apply && process.env.ALLOW_PRODUCTION_WRITE !== 'true') {
      throw new Error('Refusing to apply changes to production. Set ALLOW_PRODUCTION_WRITE=true to override.');
    }
    if (apply) {
      console.warn('⚠️  ALLOW_PRODUCTION_WRITE is set. Proceeding with production write...\n');
    }
  }

  if (!MONGODB_URI) throw new Error('MONGODB_URI not configured');
  console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log('Connected.\n');

  const optionsAllowingCookingPreference = await CourseOption.find({ allowsCookingPreference: true }, { _id: 1, label: 1 }).lean();
  const allowedOptionIds = new Set(optionsAllowingCookingPreference.map(o => o._id.toString()));

  console.log(`Found ${optionsAllowingCookingPreference.length} course option(s) that legitimately allow a cooking preference:`);
  optionsAllowingCookingPreference.forEach(o => {
    const label = o.label && (o.label.en || Object.values(o.label)[0]) || '(no label)';
    console.log(`  - ${label} (${o._id})`);
  });
  console.log('');

  const menuChoices = await MenuChoice.find({}).lean();
  console.log(`Scanning ${menuChoices.length} MenuChoice document(s)...\n`);

  const strays = [];
  let totalChoices = 0;

  for (const mc of menuChoices) {
    for (const partyChoice of (mc.partyChoices || [])) {
      for (const choice of (partyChoice.choices || [])) {
        totalChoices++;
        if (!choice.cookingPreference) continue;
        const optionIdStr = choice.optionId && choice.optionId.toString();
        if (!optionIdStr) continue;
        if (allowedOptionIds.has(optionIdStr)) continue;
        strays.push({
          menuChoiceId: mc._id,
          partyGuestId: partyChoice.partyGuestId,
          courseId: choice.courseId,
          optionId: choice.optionId,
          currentValue: choice.cookingPreference
        });
      }
    }
  }

  console.log(`Total individual choices scanned: ${totalChoices}`);
  console.log(`Stray cookingPreference values found: ${strays.length}\n`);

  if (strays.length === 0) {
    console.log('Nothing to clean. Exiting.');
    await mongoose.connection.close();
    return;
  }

  console.log('Stray entries (these would be unset):');
  strays.forEach((s, i) => {
    console.log(`  ${i + 1}. MenuChoice ${s.menuChoiceId} → partyGuest ${s.partyGuestId}, optionId ${s.optionId}, value="${s.currentValue}"`);
  });
  console.log('');

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to actually unset these values.');
    await mongoose.connection.close();
    return;
  }

  const confirmed = await askConfirm(`About to unset ${strays.length} stray cookingPreference value(s). Proceed? [y/N] `);
  if (!confirmed) {
    console.log('Cancelled.');
    await mongoose.connection.close();
    return;
  }

  let updatedDocs = 0;
  for (const mc of menuChoices) {
    const optionIdsToClean = strays
      .filter(s => s.menuChoiceId.toString() === mc._id.toString())
      .map(s => s.optionId);
    if (optionIdsToClean.length === 0) continue;

    const result = await MenuChoice.updateOne(
      { _id: mc._id },
      { $unset: { 'partyChoices.$[].choices.$[choice].cookingPreference': '' } },
      { arrayFilters: [{ 'choice.optionId': { $in: optionIdsToClean }, 'choice.cookingPreference': { $ne: null } }] }
    );
    if (result.modifiedCount > 0) updatedDocs += result.modifiedCount;
  }

  console.log(`\n✅ Cleanup complete. Modified ${updatedDocs} MenuChoice document(s).`);
  await mongoose.connection.close();
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  if (err.stack) console.error(err.stack);
  mongoose.connection.close().finally(() => process.exit(1));
});
