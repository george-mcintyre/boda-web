#!/usr/bin/env node
/**
 * Fix null party member IDs and repair packed EventChoice/MenuChoice entries.
 *
 * Problem: party members with id=null all share partyGuestId "null" in
 * EventChoice/MenuChoice, packing multiple members' choices into one entry
 * with duplicate eventIds. This causes wrong attendance counts.
 *
 * Usage:
 *   node scripts/fix-null-party-ids.js              # dry run
 *   node scripts/fix-null-party-ids.js --apply       # apply changes
 */
const mongoose = require('../server/node_modules/mongoose');
const { MONGODB_URI, MONGODB_DB } = require('../server/config/env');

const apply = process.argv.includes('--apply');

function isNullId(id) {
  return !id || id === 'null' || id === 'undefined';
}

function isNullPgid(pgid) {
  return pgid === 'null' || pgid === null || pgid === 'undefined' || pgid === undefined;
}

async function main() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI not configured');
  console.log(`Connecting to MongoDB (${MONGODB_DB})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log('Connected.\n');

  const db = mongoose.connection.db;
  const guestsCol = db.collection('guests');
  const ecCol = db.collection('eventchoices');
  const mcCol = db.collection('menuchoices');
  const eventsCol = db.collection('events');

  const events = await eventsCol.find({}).sort({ date: 1 }).toArray();
  const numEvents = events.length;
  console.log(`Found ${numEvents} events.\n`);

  // ── Step 1: Assign unique IDs to party members with null/missing/"null" id ──
  const guests = await guestsCol.find({}).toArray();
  const guestById = {};
  guests.forEach(g => { guestById[g._id.toString()] = g; });

  let totalFixed = 0;

  for (const guest of guests) {
    if (!guest.partyMembers || guest.partyMembers.length === 0) continue;
    let changed = false;

    guest.partyMembers.forEach(pm => {
      if (isNullId(pm.id)) {
        pm.id = new mongoose.Types.ObjectId().toString();
        changed = true;
        totalFixed++;
      }
    });

    if (changed) {
      console.log(`[Guest] ${guest.name}: assigned IDs`);
      guest.partyMembers.forEach(pm => console.log(`   ${pm.name} -> ${pm.id}`));
      if (apply) {
        await guestsCol.updateOne(
          { _id: guest._id },
          { $set: { partyMembers: guest.partyMembers } }
        );
      }
    }
  }
  console.log(`\nTotal party members given new IDs: ${totalFixed}\n`);

  // ── Step 2: Repair EventChoice docs ──
  console.log('=== Repairing EventChoice ===');
  await repairChoiceDocs(ecCol, 'EventChoice', guestById, numEvents);
  await renameNameBasedPgids(ecCol, 'EventChoice', guestById);

  // ── Step 3: Repair MenuChoice docs ──
  const courses = await db.collection('courses').find({}).toArray();
  const numCourses = courses.length;
  console.log(`\nFound ${numCourses} courses.\n=== Repairing MenuChoice ===`);
  await repairChoiceDocs(mcCol, 'MenuChoice', guestById, numCourses);
  await renameNameBasedPgids(mcCol, 'MenuChoice', guestById);

  if (!apply) {
    console.log('\n=== DRY RUN — no changes written. Use --apply to commit. ===');
  } else {
    console.log('\n=== Changes applied. ===');
  }

  await mongoose.connection.close();
}

async function repairChoiceDocs(collection, label, guestById, numItemsPerMember) {
  const docs = await collection.find({}).toArray();
  let splitCount = 0;
  let removedCount = 0;
  let orphanedCount = 0;

  for (const doc of docs) {
    if (!doc.partyChoices) continue;
    const gid = doc.guestId.toString();
    const guest = guestById[gid];

    if (!guest) {
      console.log(`[${label}] ORPHANED: guestId=${gid} — no matching guest`);
      orphanedCount++;
      continue;
    }

    const nullIndices = [];
    doc.partyChoices.forEach((pc, i) => {
      if (isNullPgid(pc.partyGuestId)) nullIndices.push(i);
    });
    if (nullIndices.length === 0) continue;

    const members = (guest.partyMembers || []);
    const membersNeedingAssignment = members.filter(pm => {
      const alreadyHasEntry = doc.partyChoices.some(
        pc => !isNullPgid(pc.partyGuestId) && pc.partyGuestId === pm.id
      );
      return !alreadyHasEntry;
    });

    if (membersNeedingAssignment.length === 0) {
      console.log(`[${label}] ${guest.name}: removing ${nullIndices.length} orphaned null entries`);
      removedCount += nullIndices.length;
      const updated = doc.partyChoices.filter((_, i) => !nullIndices.includes(i));
      if (apply) {
        await collection.updateOne({ _id: doc._id }, { $set: { partyChoices: updated } });
      }
      continue;
    }

    // Collect all null-entry choices into one flat array
    let allNullChoices = [];
    nullIndices.forEach(i => {
      allNullChoices = allNullChoices.concat(doc.partyChoices[i].choices || []);
    });

    // Also collect specialRequests from null entries (MenuChoice)
    let specialRequests = null;
    let specialRequestDetail = null;
    nullIndices.forEach(i => {
      const pc = doc.partyChoices[i];
      if (pc.specialRequests) specialRequests = pc.specialRequests;
      if (pc.specialRequestDetail) specialRequestDetail = pc.specialRequestDetail;
    });

    const numMembers = membersNeedingAssignment.length;
    const expectedChoices = numMembers * numItemsPerMember;

    if (allNullChoices.length !== expectedChoices) {
      console.log(`[${label}] WARNING: ${guest.name} has ${allNullChoices.length} null choices, expected ${expectedChoices} (${numMembers} × ${numItemsPerMember}). Skipping.`);
      continue;
    }

    // Choices are ordered: [member0-item0, member1-item0, ..., member0-item1, ...]
    const newEntries = membersNeedingAssignment.map(() => ({ choices: [] }));

    for (let itemIdx = 0; itemIdx < numItemsPerMember; itemIdx++) {
      for (let mi = 0; mi < numMembers; mi++) {
        const choiceIdx = itemIdx * numMembers + mi;
        newEntries[mi].choices.push(allNullChoices[choiceIdx]);
      }
    }

    const newPartyChoices = membersNeedingAssignment.map((pm, i) => {
      const entry = {
        partyGuestId: pm.id,
        choices: newEntries[i].choices
      };
      if (specialRequests) entry.specialRequests = specialRequests;
      if (specialRequestDetail) entry.specialRequestDetail = specialRequestDetail;
      return entry;
    });

    const updatedPartyChoices = [
      ...doc.partyChoices.filter((_, i) => !nullIndices.includes(i)),
      ...newPartyChoices
    ];

    console.log(`[${label}] ${guest.name}: split ${nullIndices.length} null entries -> ${numMembers} member entries`);
    newPartyChoices.forEach(e => {
      const attending = e.choices.filter(c => c.attending).length;
      const memberName = membersNeedingAssignment.find(m => m.id === e.partyGuestId)?.name || e.partyGuestId;
      console.log(`   ${memberName}: ${attending}/${e.choices.length} attending`);
    });
    splitCount++;

    if (apply) {
      await collection.updateOne({ _id: doc._id }, { $set: { partyChoices: updatedPartyChoices } });
    }
  }

  console.log(`[${label}] Split: ${splitCount}, Orphaned null removed: ${removedCount}, Orphaned docs: ${orphanedCount}`);
}

async function renameNameBasedPgids(collection, label, guestById) {
  const docs = await collection.find({}).toArray();
  let renamedCount = 0;

  for (const doc of docs) {
    if (!doc.partyChoices) continue;
    const gid = doc.guestId.toString();
    const guest = guestById[gid];
    if (!guest) continue;

    const nameToId = {};
    (guest.partyMembers || []).forEach(pm => {
      if (pm.id && pm.name) nameToId[pm.name] = pm.id;
    });

    let changed = false;
    doc.partyChoices.forEach(pc => {
      if (pc.partyGuestId !== gid && nameToId[pc.partyGuestId]) {
        const oldPgid = pc.partyGuestId;
        pc.partyGuestId = nameToId[oldPgid];
        console.log(`[${label}] ${guest.name}: renamed "${oldPgid}" -> ${pc.partyGuestId}`);
        changed = true;
        renamedCount++;
      }
    });

    if (changed && apply) {
      await collection.updateOne({ _id: doc._id }, { $set: { partyChoices: doc.partyChoices } });
    }
  }

  console.log(`[${label}] Renamed name-based entries: ${renamedCount}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
