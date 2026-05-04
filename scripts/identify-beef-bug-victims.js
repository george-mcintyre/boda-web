#!/usr/bin/env node
/*
  Identify likely victims of the cooking-preference save-rejection bug.

  Background:
    Between commit 2d9bcbd (Apr 27 2026, removed "medium" force-default) and
    commit 500e638 (May 4 2026, this fix), any guest who selected the beef
    main course received an HTTP 400 from the menu-choices PUT and their
    entire menu save was rejected, including any other selections in the
    same payload. The error toast told them "cooking preference required",
    but the affected option appeared to already show "medium" selected,
    so most users did not understand they needed to actively re-pick.

  Why we can't recover deterministically:
    The rejected request body was never persisted. The server returned 400
    before reaching findOneAndUpdate. Vercel function logs by default do
    not capture POST/PUT bodies, and the controller does not log them
    either. So we cannot reconstruct exactly which option each guest tried.

  What this script DOES:
    Lists every party-member main-course selection currently saved, broken
    down by which option was chosen. Highlights guests likely to have hit
    the bug:
      (a) Guests with NO main course saved (despite main being required).
      (b) Guests whose MenuChoice updatedAt predates 2d9bcbd
          (2026-04-27 17:48 UTC) — they have not successfully saved since
          the bug window opened.
      (c) Guests whose current main is the fish option but who interacted
          recently (these may have tried beef and then "settled" once they
          saw the error).

  Output:
    A grouped report you can use to target outreach. Read-only — never
    modifies the database.

  Usage:
    node scripts/identify-beef-bug-victims.js
    node scripts/identify-beef-bug-victims.js --json    # machine-readable

  Uses env: MONGODB_URI, MONGODB_DB.
*/
const mongoose = require('../server/node_modules/mongoose');
const { MenuChoice, CourseOption, Course, Guest } = require('../server/models');
const { MONGODB_URI, MONGODB_DB } = require('../server/config/env');

const args = new Set(process.argv.slice(2));
const jsonOutput = args.has('--json');
const showHelp = args.has('--help') || args.has('-h');

// 2d9bcbd commit timestamp (Apr 27 2026 19:48:39 +0200 = 17:48:39 UTC)
const BUG_WINDOW_OPENED = new Date('2026-04-27T17:48:39Z');

if (showHelp) {
  console.log(`Usage:
  node scripts/identify-beef-bug-victims.js          # human-readable report
  node scripts/identify-beef-bug-victims.js --json   # JSON output
`);
  process.exit(0);
}

function pickLabel(localized) {
  if (!localized) return '(no label)';
  if (localized instanceof Map) return localized.get('en') || localized.values().next().value || '(no label)';
  return localized.en || Object.values(localized)[0] || '(no label)';
}

async function main() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI not configured');
  if (!jsonOutput) console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  if (!jsonOutput) console.log('Connected.\n');

  // Match the server's actual validation rule (menuController.js):
  //   course.selectionRequired && option.allowsCookingPreference
  // Only options on a required course can trigger the bug; orphan options
  // pointing at deleted courses are skipped server-side and so are skipped here.
  const requiredCourses = await Course.find({ selectionRequired: true }).lean();
  if (requiredCourses.length === 0) throw new Error('No selectionRequired course found');
  const requiredCourseIds = new Set(requiredCourses.map(c => c._id.toString()));

  const allOptions = await CourseOption.find({}).lean();
  const optionsById = new Map(allOptions.map(o => [o._id.toString(), o]));

  const beefOptions = allOptions.filter(o =>
    o.allowsCookingPreference &&
    requiredCourseIds.has(o.courseId?.toString())
  );
  const beefIds = new Set(beefOptions.map(o => o._id.toString()));
  const fishOptions = allOptions.filter(o =>
    requiredCourseIds.has(o.courseId?.toString()) &&
    !o.allowsCookingPreference &&
    !o.isVegetarian
  );
  const fishIds = new Set(fishOptions.map(o => o._id.toString()));

  const guests = await Guest.find({}).lean();
  const guestsById = new Map(guests.map(g => [g._id.toString(), g]));

  const menuChoices = await MenuChoice.find({}).lean();

  const noMainSaved = [];
  const fishSelected = [];
  const beefSelected = [];
  const veggieSelected = [];
  const otherSelected = [];
  const staleNoChoiceFile = [];

  for (const mc of menuChoices) {
    const guest = guestsById.get(mc.guestId.toString());
    const guestName = guest?.name || '(unknown)';
    const guestEmail = guest?.email || '';
    const updatedAt = mc.updatedAt;
    const isStale = updatedAt && updatedAt < BUG_WINDOW_OPENED;

    for (const pc of (mc.partyChoices || [])) {
      const mainChoice = (pc.choices || []).find(c => requiredCourseIds.has(c.courseId?.toString()));
      const memberId = pc.partyGuestId;
      const isPrimary = memberId === mc.guestId.toString();
      const memberLabel = isPrimary
        ? `${guestName} (primary)`
        : `${guestName} → party member ${memberId}`;

      const entry = {
        guestId: mc.guestId.toString(),
        guestName,
        guestEmail,
        memberId,
        memberLabel,
        menuChoiceUpdatedAt: updatedAt,
        currentMainOptionId: mainChoice?.optionId?.toString() || null,
        currentMainLabel: mainChoice ? pickLabel(optionsById.get(mainChoice.optionId.toString())?.label) : null,
        cookingPreference: mainChoice?.cookingPreference || null,
        isStale: !!isStale
      };

      if (!mainChoice) {
        noMainSaved.push(entry);
      } else {
        const optId = mainChoice.optionId.toString();
        if (beefIds.has(optId)) beefSelected.push(entry);
        else if (fishIds.has(optId)) fishSelected.push(entry);
        else {
          const opt = optionsById.get(optId);
          if (opt?.isVegetarian) veggieSelected.push(entry);
          else otherSelected.push(entry);
        }
      }

      if (isStale && !mainChoice) staleNoChoiceFile.push(entry);
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      bugWindowOpenedAt: BUG_WINDOW_OPENED.toISOString(),
      summary: {
        totalMenuChoiceDocs: menuChoices.length,
        noMainSaved: noMainSaved.length,
        beefSelected: beefSelected.length,
        fishSelected: fishSelected.length,
        veggieSelected: veggieSelected.length,
        otherSelected: otherSelected.length
      },
      noMainSaved,
      fishSelected,
      beefSelected,
      veggieSelected,
      otherSelected
    }, null, 2));
    await mongoose.connection.close();
    return;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' Beef-bug victim identification report');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Bug window opened: ${BUG_WINDOW_OPENED.toISOString()}`);
  console.log(`Bug window closed: ${new Date().toISOString()} (this fix)`);
  console.log('');
  console.log(`MenuChoice documents:                 ${menuChoices.length}`);
  console.log(`Bug-triggering options on required courses: ${beefOptions.length} (${beefOptions.map(o => pickLabel(o.label)).join(', ') || 'none'})`);
  console.log(`Non-bug options on required courses (fishlike): ${fishOptions.length} (${fishOptions.map(o => pickLabel(o.label)).join(', ') || 'none'})`);
  console.log('');
  console.log(`Party members with no main saved:    ${noMainSaved.length}  ← HIGH suspicion`);
  console.log(`Party members on fish:                ${fishSelected.length}  ← MEDIUM suspicion`);
  console.log(`Party members on beef:                ${beefSelected.length}  (saved successfully — these are fine)`);
  console.log(`Party members on vegetarian/vegan:    ${veggieSelected.length}`);
  console.log(`Party members on other:               ${otherSelected.length}`);
  console.log('');

  const dump = (title, list) => {
    console.log(`── ${title} ────────────────────────────────────────────`);
    if (list.length === 0) { console.log('  (none)\n'); return; }
    for (const e of list) {
      const stamp = e.menuChoiceUpdatedAt
        ? new Date(e.menuChoiceUpdatedAt).toISOString().slice(0, 16).replace('T', ' ')
        : '(no timestamp)';
      const stale = e.isStale ? ' [STALE: pre-bug-window]' : '';
      const cur = e.currentMainLabel ? ` → ${e.currentMainLabel}` : '';
      console.log(`  ${stamp}${stale}  ${e.memberLabel}${cur}  <${e.guestEmail}>`);
    }
    console.log('');
  };

  dump('NO MAIN COURSE SAVED — likely tried beef and got rejected', noMainSaved);
  dump('Currently on FISH — possibly settled here after beef rejection', fishSelected);
  dump('Currently on BEEF — saved fine, no action needed', beefSelected);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' Recommended outreach:');
  console.log('  1. Contact "no main saved" guests directly — most likely victims.');
  console.log('  2. Send a softer note to "on fish" guests asking them to confirm.');
  console.log('  3. The "on beef" group is fine, no need to message them.');
  console.log('═══════════════════════════════════════════════════════════════');

  await mongoose.connection.close();
}

main().catch(err => {
  console.error('\nError:', err.message);
  if (err.stack) console.error(err.stack);
  mongoose.connection.close().finally(() => process.exit(1));
});
