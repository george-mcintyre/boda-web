const { Guest, Event, EventChoice, MenuChoice, ChefProfile, ChefProfileImage, DayMenu, DayMenuImage, Table, TableAssignment, GiftChoice, Gift, Course, CourseOption } = require('../models');
const { mergeLocalizedString, localize, getLang } = require('../utils/localized');
const fs = require('fs');
const path = require('path');

// ========== Guest Summary ==========
async function getGuestSummary(req, res, next) {
  try {
    const lang = getLang(req);
    const guests = await Guest.find({}).lean();
    const events = await Event.find({}).sort({ date: 1 }).lean();
    const eventChoices = await EventChoice.find({}).lean();
    const menuChoices = await MenuChoice.find({}).lean();

    // Total guests = primary guests + all their party members
    let totalGuests = 0;
    let totalAdults = 0;
    let totalChildren = 0;
    const guestIds = new Set();

    guests.forEach(g => {
      guestIds.add(g._id.toString());
      // Count primary guest
      totalGuests++;
      if (g.adult !== false) totalAdults++;
      else totalChildren++;
      // Count party members
      if (g.partyMembers && g.partyMembers.length > 0) {
        g.partyMembers.forEach(pm => {
          totalGuests++;
          if (pm.adult !== false) totalAdults++;
          else totalChildren++;
        });
      }
    });

    // Per-event attendance
    const perEventAttendance = events.map(event => {
      let count = 0;
      eventChoices.forEach(ec => {
        if (!guestIds.has(ec.guestId.toString())) return;
        if (ec.partyChoices) {
          ec.partyChoices.forEach(pc => {
            if (pc.choices) {
              pc.choices.forEach(c => {
                if (c.eventId && c.eventId.toString() === event._id.toString() && c.attending) {
                  count++;
                }
              });
            }
          });
        }
      });
      return {
        eventId: event._id.toString(),
        eventName: localize(event.name, lang),
        count
      };
    });

    // Count individuals without menu choices
    // For each guest and party member, check if they have any menu choices
    let individualsWithoutMenuChoices = 0;
    
    guests.forEach(g => {
      const menuChoice = menuChoices.find(mc => mc.guestId.toString() === g._id.toString());
      
      // Check primary guest
      const primaryChoice = menuChoice?.partyChoices?.find(pc => pc.partyGuestId === g._id.toString());
      if (!primaryChoice || !primaryChoice.choices || primaryChoice.choices.length === 0) {
        individualsWithoutMenuChoices++;
      }
      
      // Check each party member
      if (g.partyMembers && g.partyMembers.length > 0) {
        g.partyMembers.forEach(pm => {
          const pmChoice = menuChoice?.partyChoices?.find(pc => pc.partyGuestId === pm.name);
          if (!pmChoice || !pmChoice.choices || pmChoice.choices.length === 0) {
            individualsWithoutMenuChoices++;
          }
        });
      }
    });
    
    const guestsWithoutMenuChoices = individualsWithoutMenuChoices;

    // Guests without party members
    const guestsWithoutPartyMembers = guests.filter(g => !g.partyMembers || g.partyMembers.length === 0).length;

    // Guests without event choices
    const guestsWithEventChoices = new Set(eventChoices.map(ec => ec.guestId.toString()));
    const guestsWithoutEventChoices = guests.filter(g => !guestsWithEventChoices.has(g._id.toString())).length;

    res.json({
      totalGuests,
      totalAdults,
      totalChildren,
      perEventAttendance,
      guestsWithoutMenuChoices,
      guestsWithoutPartyMembers,
      guestsWithoutEventChoices
    });
  } catch (e) { next(e); }
}

// ========== Chef Profiles ==========
async function listChefProfiles(req, res, next) {
  try {
    const lang = getLang(req);
    const profiles = await ChefProfile.find({}).populate('image').lean();
    const items = profiles.map(p => ({
      id: p._id.toString(),
      name: localize(p.name, lang),
      bio: localize(p.bio, lang),
      menuType: p.menuType,
      imageUrl: p.image ? `/api/admin/chef-profiles/${p._id}/image` : null
    }));
    res.json(items);
  } catch (e) { next(e); }
}

async function createChefProfile(req, res, next) {
  try {
    const lang = getLang(req);
    const { name, bio, menuType, image } = req.body;

    if (!name || !menuType) {
      return res.status(400).json({ error: 'name and menuType are required' });
    }

    let imageRef;
    if (image && image.imageId) {
      imageRef = image.imageId;
    }

    const profile = new ChefProfile({ menuType, image: imageRef });
    profile.name = mergeLocalizedString(undefined, name, lang);
    profile.bio = mergeLocalizedString(undefined, bio, lang);
    await profile.save();

    res.status(201).json({
      id: profile._id.toString(),
      name: localize(profile.name, lang),
      bio: localize(profile.bio, lang),
      menuType: profile.menuType,
      imageUrl: profile.image ? `/api/admin/chef-profiles/${profile._id}/image` : null
    });
  } catch (e) { next(e); }
}

async function updateChefProfile(req, res, next) {
  try {
    const lang = getLang(req);
    const { id } = req.params;
    const { name, bio, menuType, image } = req.body;

    const profile = await ChefProfile.findById(id);
    if (!profile) return res.status(404).json({ error: 'ChefProfile not found' });

    if (name !== undefined) { profile.name = mergeLocalizedString(profile.name, name, lang); profile.markModified('name'); }
    if (bio !== undefined) { profile.bio = mergeLocalizedString(profile.bio, bio, lang); profile.markModified('bio'); }
    if (menuType !== undefined) profile.menuType = menuType;
    if (image !== undefined) {
      if (image && image.imageId) profile.image = image.imageId;
      else if (!image) profile.image = undefined;
    }

    await profile.save();
    res.json({
      id: profile._id.toString(),
      name: localize(profile.name, lang),
      bio: localize(profile.bio, lang),
      menuType: profile.menuType,
      imageUrl: profile.image ? `/api/admin/chef-profiles/${profile._id}/image` : null
    });
  } catch (e) { next(e); }
}

async function deleteChefProfile(req, res, next) {
  try {
    const { id } = req.params;
    await ChefProfile.findByIdAndDelete(id);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

async function uploadChefProfileImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' });
    }

    const imageData = fs.readFileSync(req.file.path);
    fs.unlinkSync(req.file.path);

    const img = await ChefProfileImage.create({
      data: imageData,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

    res.json({
      imageId: img._id.toString(),
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (e) { next(e); }
}

async function getChefProfileImage(req, res, next) {
  try {
    const { id } = req.params;
    const profile = await ChefProfile.findById(id).populate('image');
    if (!profile || !profile.image || !profile.image.data) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const imgData = Buffer.isBuffer(profile.image.data) ? profile.image.data : Buffer.from(profile.image.data.buffer || profile.image.data);
    res.setHeader('Content-Type', profile.image.contentType);
    res.setHeader('Content-Length', imgData.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imgData);
  } catch (e) { next(e); }
}

// ========== Day Menus ==========
async function listDayMenus(req, res, next) {
  try {
    const lang = getLang(req);
    const menus = await DayMenu.find({}).populate('chefProfile').lean();
    const items = menus.map(m => ({
      id: m._id.toString(),
      day: m.day,
      sections: (m.sections || []).map((s, i) => ({
        title: localize(s.title, lang),
        content: localize(s.content, lang),
        imageUrl: s.image ? `/api/admin/day-menus/${m._id}/section-image/${i}` : null
      })),
      chefProfile: m.chefProfile ? {
        id: m.chefProfile._id.toString(),
        name: localize(m.chefProfile.name, lang),
        bio: localize(m.chefProfile.bio, lang)
      } : null
    }));
    res.json(items);
  } catch (e) { next(e); }
}

async function getDayMenu(req, res, next) {
  try {
    const lang = getLang(req);
    const { id } = req.params;
    const m = await DayMenu.findById(id).populate('chefProfile').lean();
    if (!m) return res.status(404).json({ error: 'DayMenu not found' });
    res.json({
      id: m._id.toString(),
      day: m.day,
      sections: (m.sections || []).map((s, i) => ({
        title: localize(s.title, lang),
        content: localize(s.content, lang),
        imageUrl: s.image ? `/api/admin/day-menus/${m._id}/section-image/${i}` : null
      })),
      chefProfile: m.chefProfile ? {
        id: m.chefProfile._id.toString(),
        name: localize(m.chefProfile.name, lang),
        bio: localize(m.chefProfile.bio, lang)
      } : null
    });
  } catch (e) { next(e); }
}

async function createDayMenu(req, res, next) {
  try {
    const lang = getLang(req);
    const { day, sections, chefProfile } = req.body;

    if (!day) return res.status(400).json({ error: 'day is required' });

    const menuSections = (sections || []).slice(0, 3).map(s => {
      const sec = {};
      sec.title = mergeLocalizedString(undefined, s.title, lang);
      sec.content = mergeLocalizedString(undefined, s.content, lang);
      if (s.image && s.image.imageId) sec.image = s.image.imageId;
      return sec;
    });

    const menu = await DayMenu.create({
      day,
      sections: menuSections,
      chefProfile: chefProfile || undefined
    });

    res.status(201).json({
      id: menu._id.toString(),
      day: menu.day,
      sections: (menu.sections || []).map((s, i) => ({
        title: localize(s.title, lang),
        content: localize(s.content, lang),
        imageUrl: s.image ? `/api/admin/day-menus/${menu._id}/section-image/${i}` : null
      }))
    });
  } catch (e) { next(e); }
}

async function updateDayMenu(req, res, next) {
  try {
    const lang = getLang(req);
    const { id } = req.params;
    const { day, sections, chefProfile } = req.body;

    const menu = await DayMenu.findById(id);
    if (!menu) return res.status(404).json({ error: 'DayMenu not found' });

    if (day !== undefined) menu.day = day;
    if (chefProfile !== undefined) menu.chefProfile = chefProfile || undefined;

    if (Array.isArray(sections)) {
      const existingSections = Array.isArray(menu.sections) ? menu.sections : [];
      menu.sections = sections.slice(0, 3).map((s, i) => {
        const existing = existingSections[i];
        const base = existing && existing.toObject ? existing.toObject() : (existing || {});
        return {
          title: mergeLocalizedString(base.title, s.title, lang),
          content: mergeLocalizedString(base.content, s.content, lang),
          image: s.image && s.image.imageId ? s.image.imageId : base.image
        };
      });
    }

    await menu.save();
    res.json({
      id: menu._id.toString(),
      day: menu.day,
      sections: (menu.sections || []).map((s, i) => ({
        title: localize(s.title, lang),
        content: localize(s.content, lang),
        imageUrl: s.image ? `/api/admin/day-menus/${menu._id}/section-image/${i}` : null
      }))
    });
  } catch (e) { next(e); }
}

async function deleteDayMenu(req, res, next) {
  try {
    const { id } = req.params;
    await DayMenu.findByIdAndDelete(id);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

async function uploadDayMenuImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type.' });
    }

    const imageData = fs.readFileSync(req.file.path);
    fs.unlinkSync(req.file.path);

    const img = await DayMenuImage.create({
      data: imageData,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

    res.json({
      imageId: img._id.toString(),
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (e) { next(e); }
}

async function getDayMenuImage(req, res, next) {
  try {
    const { dayMenuId } = req.params;
    const img = await DayMenuImage.findById(dayMenuId);
    if (!img || !img.data) return res.status(404).json({ error: 'Image not found' });
    const imgData = Buffer.isBuffer(img.data) ? img.data : Buffer.from(img.data.buffer || img.data);
    res.setHeader('Content-Type', img.contentType);
    res.setHeader('Content-Length', imgData.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imgData);
  } catch (e) { next(e); }
}

async function getDayMenuSectionImage(req, res, next) {
  try {
    const { dayMenuId, sectionIndex } = req.params;
    const menu = await DayMenu.findById(dayMenuId).lean();
    if (!menu) return res.status(404).json({ error: 'DayMenu not found' });
    const idx = parseInt(sectionIndex, 10);
    const section = (menu.sections || [])[idx];
    if (!section || !section.image) return res.status(404).json({ error: 'Section image not found' });
    const img = await DayMenuImage.findById(section.image);
    if (!img || !img.data) return res.status(404).json({ error: 'Image not found' });
    const imgData = Buffer.isBuffer(img.data) ? img.data : Buffer.from(img.data.buffer || img.data);
    res.setHeader('Content-Type', img.contentType);
    res.setHeader('Content-Length', imgData.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imgData);
  } catch (e) { next(e); }
}

// ========== Tables ==========
async function listTables(req, res, next) {
  try {
    const tables = await Table.find({}).sort({ number: 1 }).lean();
    const assignments = await TableAssignment.find({}).populate('guestId', 'name email').lean();

    const items = tables.map(t => {
      const tableAssignments = assignments.filter(a => a.tableId.toString() === t._id.toString());
      // Deduplicate: don't count assignments whose guestName matches a fixedGuest
      const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const fixedNames = new Set((t.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg))));
      const uniqueAssignmentCount = tableAssignments.filter(a => {
        const name = a.guestId ? a.guestId.name : '';
        return !fixedNames.has(norm(name));
      }).length;
      return {
        id: t._id.toString(),
        number: t.number,
        name: t.name,
        capacity: t.capacity,
        isHeadTable: t.isHeadTable,
        fixedGuests: t.fixedGuests || [],
        assignedCount: uniqueAssignmentCount + (t.fixedGuests ? t.fixedGuests.length : 0),
        assignments: tableAssignments
          .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
          .map(a => ({
            id: a._id.toString(),
            guestName: a.guestId ? a.guestId.name : 'Unknown',
            partyMemberName: a.partyMemberName,
            seatNumber: a.seatNumber || null
          }))
      };
    });
    res.json(items);
  } catch (e) { next(e); }
}

async function createTable(req, res, next) {
  try {
    const { number, name, capacity, isHeadTable, fixedGuests } = req.body;
    const table = await Table.create({ number, name, capacity, isHeadTable, fixedGuests });
    res.status(201).json({
      id: table._id.toString(),
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      isHeadTable: table.isHeadTable,
      fixedGuests: table.fixedGuests || []
    });
  } catch (e) { next(e); }
}

async function updateTable(req, res, next) {
  try {
    const { id } = req.params;
    const { number, name, capacity, isHeadTable, fixedGuests } = req.body;
    const table = await Table.findById(id);
    if (!table) return res.status(404).json({ error: 'Table not found' });

    if (number !== undefined) table.number = number;
    if (name !== undefined) table.name = name;
    if (capacity !== undefined) table.capacity = capacity;
    if (isHeadTable !== undefined) table.isHeadTable = isHeadTable;
    if (fixedGuests !== undefined) table.fixedGuests = fixedGuests;

    await table.save();
    res.json({
      id: table._id.toString(),
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      isHeadTable: table.isHeadTable,
      fixedGuests: table.fixedGuests || []
    });
  } catch (e) { next(e); }
}

async function deleteTable(req, res, next) {
  try {
    const { id } = req.params;
    await Table.findByIdAndDelete(id);
    await TableAssignment.deleteMany({ tableId: id });
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

async function seedTables(req, res, next) {
  try {
    const count = await Table.countDocuments();
    if (count > 0) {
      return res.status(400).json({ error: 'Tables already exist. Delete all tables first to re-seed.' });
    }

    const dataPath = path.join(__dirname, '../data/Tables.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    await Table.insertMany(data);
    res.json({ status: 'ok', seeded: data.length });
  } catch (e) { next(e); }
}

// ========== Table Assignments ==========
async function listTableAssignments(req, res, next) {
  try {
    const assignments = await TableAssignment.find({})
      .populate('guestId', 'name email')
      .populate('tableId', 'number name')
      .sort({ seatNumber: 1 })
      .lean();

    const items = assignments.map(a => ({
      id: a._id.toString(),
      tableId: a.tableId ? a.tableId._id.toString() : null,
      tableNumber: a.tableId ? a.tableId.number : null,
      tableName: a.tableId ? a.tableId.name : null,
      guestId: a.guestId ? a.guestId._id.toString() : null,
      guestName: a.guestId ? a.guestId.name : 'Unknown',
      partyMemberName: a.partyMemberName || null,
      seatNumber: a.seatNumber || null
    }));
    res.json(items);
  } catch (e) { next(e); }
}

async function createTableAssignment(req, res, next) {
  try {
    const { tableId, guestId, partyMemberName } = req.body;
    if (!tableId || !guestId) {
      return res.status(400).json({ error: 'tableId and guestId are required' });
    }

    const table = await Table.findById(tableId).lean();
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const currentCount = await TableAssignment.countDocuments({ tableId });
    const fixedCount = (table.fixedGuests || []).length;
    if (currentCount + fixedCount >= table.capacity) {
      return res.status(400).json({ error: `Table is full (${table.capacity}/${table.capacity})` });
    }

    const maxSeat = await TableAssignment.findOne({ tableId }).sort({ seatNumber: -1 }).lean();
    const seatNumber = (maxSeat?.seatNumber || 0) + 1;

    const assignment = await TableAssignment.create({
      tableId,
      guestId,
      partyMemberName: partyMemberName || null,
      seatNumber
    });

    res.status(201).json({
      id: assignment._id.toString(),
      tableId: assignment.tableId.toString(),
      guestId: assignment.guestId.toString(),
      partyMemberName: assignment.partyMemberName,
      seatNumber: assignment.seatNumber
    });
  } catch (e) { next(e); }
}

async function updateTableAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { tableId, guestId, partyMemberName } = req.body;

    const assignment = await TableAssignment.findById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const tableChanged = tableId !== undefined && tableId !== assignment.tableId.toString();

    if (tableChanged) {
      const newTable = await Table.findById(tableId).lean();
      if (!newTable) return res.status(404).json({ error: 'Table not found' });

      const currentCount = await TableAssignment.countDocuments({ tableId });
      const fixedCount = (newTable.fixedGuests || []).length;
      if (currentCount + fixedCount >= newTable.capacity) {
        return res.status(400).json({ error: `Table is full (${newTable.capacity}/${newTable.capacity})` });
      }

      assignment.tableId = tableId;
      const maxSeat = await TableAssignment.findOne({ tableId }).sort({ seatNumber: -1 }).lean();
      assignment.seatNumber = (maxSeat?.seatNumber || 0) + 1;
    }

    if (guestId !== undefined) assignment.guestId = guestId;
    if (partyMemberName !== undefined) assignment.partyMemberName = partyMemberName || null;

    await assignment.save();
    res.json({
      id: assignment._id.toString(),
      tableId: assignment.tableId.toString(),
      guestId: assignment.guestId.toString(),
      partyMemberName: assignment.partyMemberName,
      seatNumber: assignment.seatNumber
    });
  } catch (e) { next(e); }
}

async function deleteTableAssignment(req, res, next) {
  try {
    const { id } = req.params;
    await TableAssignment.findByIdAndDelete(id);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

async function reorderTableSeats(req, res, next) {
  try {
    const { tableId, orderedIds } = req.body;
    if (!tableId || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'tableId and orderedIds array are required' });
    }
    const ops = orderedIds.map((id, idx) =>
      TableAssignment.updateOne({ _id: id, tableId }, { seatNumber: idx + 1 })
    );
    await Promise.all(ops);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

async function bulkAssignTables(req, res, next) {
  try {
    const { assignments: assignList } = req.body;
    if (!Array.isArray(assignList)) {
      return res.status(400).json({ error: 'assignments array is required' });
    }

    const seatCounters = {};
    for (const tid of [...new Set(assignList.map(a => a.tableId))]) {
      const max = await TableAssignment.findOne({ tableId: tid }).sort({ seatNumber: -1 }).lean();
      seatCounters[tid] = max?.seatNumber || 0;
    }

    const results = [];
    for (const a of assignList) {
      try {
        seatCounters[a.tableId] = (seatCounters[a.tableId] || 0) + 1;
        const created = await TableAssignment.create({
          tableId: a.tableId,
          guestId: a.guestId,
          partyMemberName: a.partyMemberName || null,
          seatNumber: seatCounters[a.tableId]
        });
        results.push({ id: created._id.toString(), status: 'ok' });
      } catch (err) {
        results.push({ guestId: a.guestId, error: err.message });
      }
    }
    res.json({ results });
  } catch (e) { next(e); }
}

// ========== Menu Responses ==========
async function getMenuResponses(req, res, next) {
  try {
    const lang = getLang(req);
    const menuChoices = await MenuChoice.find({}).populate('guestId', 'name email').lean();
    const assignments = await TableAssignment.find({}).populate('tableId', 'number name').lean();
    const courses = await Course.find({}).lean();
    const courseOptions = await CourseOption.find({}).lean();

    // Build option label lookup
    const optionLabelMap = {};
    courseOptions.forEach(o => {
      optionLabelMap[o._id.toString()] = localize(o.label, lang);
    });

    // Build assignment lookup: guestId+partyMemberName -> table
    const assignmentMap = {};
    assignments.forEach(a => {
      const key = a.guestId.toString() + '|' + (a.partyMemberName || '');
      assignmentMap[key] = a.tableId ? {
        tableNumber: a.tableId.number,
        tableName: a.tableId.name,
        isHeadTable: a.tableId.isHeadTable || false
      } : null;
    });

    // Group by table
    const tableGroups = {};

    menuChoices.forEach(mc => {
      if (!mc.guestId) return;
      const guestName = mc.guestId.name || mc.guestId.email;

      (mc.partyChoices || []).forEach(pc => {
        const isGuest = pc.partyGuestId === mc.guestId._id.toString();
        const pmName = isGuest ? null : pc.partyGuestId;
        const key = mc.guestId._id.toString() + '|' + (pmName || '');
        const table = assignmentMap[key] || { tableNumber: null, tableName: null, isHeadTable: false };
        const tableKey = table.tableNumber !== null ? String(table.tableNumber) : 'unassigned';

        if (!tableGroups[tableKey]) {
          tableGroups[tableKey] = {
            tableNumber: table.tableNumber,
            tableName: table.tableName || null,
            isHeadTable: table.isHeadTable || false,
            guests: []
          };
        }

        const choices = (pc.choices || []).map(c => ({
          courseId: c.courseId ? c.courseId.toString() : null,
          optionId: c.optionId ? c.optionId.toString() : null,
          optionLabel: c.optionId ? (optionLabelMap[c.optionId.toString()] || '—') : '—'
        }));

        const specialReqs = (pc.specialRequests || []).filter(sr => sr.selected).map(sr => sr.name);

        tableGroups[tableKey].guests.push({
          guestName: isGuest ? guestName : guestName,
          partyMemberName: pmName,
          choices,
          specialRequest: specialReqs.join(', ') || null,
          specialRequestDetail: pc.specialRequestDetail || null
        });
      });
    });

    // Sort: numbered tables first, then unassigned
    const result = Object.values(tableGroups).sort((a, b) => {
      if (a.tableNumber === null) return 1;
      if (b.tableNumber === null) return -1;
      return a.tableNumber - b.tableNumber;
    });

    res.json(result);
  } catch (e) { next(e); }
}

// ========== Gift Purchases ==========
async function getGiftPurchases(req, res, next) {
  try {
    const lang = getLang(req);
    const giftChoices = await GiftChoice.find({})
      .populate('giftId', 'title amount')
      .populate('guestId', 'name email')
      .sort({ date: -1 })
      .lean();

    let totalAmount = 0;
    const purchases = giftChoices.map(choice => {
      const amount = choice.giftId ? choice.giftId.amount : 0;
      totalAmount += amount;
      return {
        guestId: choice.guestId ? choice.guestId._id.toString() : null,
        guestName: choice.guestId ? (choice.guestId.name || choice.guestId.email) : 'Unknown',
        guestEmail: choice.guestId ? choice.guestId.email : null,
        giftId: choice.giftId ? choice.giftId._id.toString() : null,
        giftTitle: choice.giftId ? localize(choice.giftId.title, lang) : 'Unknown',
        giftAmount: amount,
        date: choice.date ? choice.date.toISOString() : null,
        message: choice.message || null
      };
    });

    res.json({ purchases, totalAmount });
  } catch (e) { next(e); }
}

// ========== Event Choices (Admin) ==========
async function getAdminEventChoices(req, res, next) {
  try {
    const eventChoices = await EventChoice.find({}).lean();
    res.json(eventChoices);
  } catch (e) { next(e); }
}


// ========== Guests Without Event Choices ==========
async function getGuestsWithoutEventChoices(req, res, next) {
  try {
    const guests = await Guest.find({}).lean();
    const eventChoices = await EventChoice.find({}).lean();
    const guestsWithEventChoices = new Set(eventChoices.map(ec => ec.guestId.toString()));
    const guestsWithout = guests
      .filter(g => !guestsWithEventChoices.has(g._id.toString()))
      .map(g => ({
        id: g._id.toString(),
        name: g.name,
        email: g.email
      }));
    res.json(guestsWithout);
  } catch (e) { next(e); }
}

// ========== Guests Without Menu Choices ==========
async function getGuestsWithoutMenuChoices(req, res, next) {
  try {
    const guests = await Guest.find({}).lean();
    const menuChoices = await MenuChoice.find({}).lean();
    
    const guestsWithout = [];
    
    guests.forEach(g => {
      const menuChoice = menuChoices.find(mc => mc.guestId.toString() === g._id.toString());
      
      // Check if primary guest has choices
      const primaryChoice = menuChoice?.partyChoices?.find(pc => pc.partyGuestId === g._id.toString());
      const hasChoices = primaryChoice && primaryChoice.choices && primaryChoice.choices.length > 0;
      
      if (!hasChoices) {
        guestsWithout.push({
          id: g._id.toString(),
          name: g.name,
          email: g.email
        });
      }
    });
    
    res.json(guestsWithout);
  } catch (e) { next(e); }
}

// ========== Guests With Incomplete Party Names ==========
async function getGuestsWithoutParty(req, res, next) {
  try {
    const guests = await Guest.find({}).lean();
    const guestsWithIncompleteParty = [];
    
    guests.forEach(g => {
      // Only check if they have party members (at least 1)
      if (g.partyMembers && g.partyMembers.length > 0) {
        const incompleteMembers = [];
        
        g.partyMembers.forEach((pm, index) => {
          const name = pm.name || '';
          // Check if name is blank or follows placeholder pattern like "<anything> - Guest N"
          const isBlank = name.trim() === '';
          // Match pattern: anything followed by " - Guest " and a number
          const isPlaceholder = /\s-\sGuest\s+\d+$/i.test(name.trim());
          
          if (isBlank || isPlaceholder) {
            incompleteMembers.push({
              index: index + 1,
              currentName: name || '(blank)'
            });
          }
        });
        
        if (incompleteMembers.length > 0) {
          guestsWithIncompleteParty.push({
            id: g._id.toString(),
            name: g.name,
            email: g.email,
            totalPartyMembers: g.partyMembers.length,
            incompleteCount: incompleteMembers.length,
            incompleteMembers
          });
        }
      }
    });
    
    res.json(guestsWithIncompleteParty);
  } catch (e) { next(e); }
}

// ========== Printable Guest List ==========
async function getGuestListPrint(req, res, next) {
  try {
    const guests = await Guest.find({}).lean();
    const events = await Event.find({}).sort({ date: 1 }).lean();
    const eventChoices = await EventChoice.find({}).lean();
    const menuChoices = await MenuChoice.find({}).lean();

    const eventIds = events.map(e => e._id.toString());
    const rows = [];

    guests.forEach(g => {
      const guestId = g._id.toString();
      const ec = eventChoices.find(c => c.guestId.toString() === guestId);
      const mc = menuChoices.find(c => c.guestId.toString() === guestId);

      const findPartyChoice = (collection, ...candidates) => {
        const doc = collection === 'ec' ? ec : mc;
        if (!doc?.partyChoices) return null;
        for (const id of candidates) {
          const match = doc.partyChoices.find(p => p.partyGuestId === id)
            || doc.partyChoices.find(p => p.partyGuestId === String(id));
          if (match) return match;
        }
        return null;
      };

      const getAttendance = (...ids) => {
        const pc = findPartyChoice('ec', ...ids);
        return eventIds.map(eid => {
          const choice = pc?.choices?.find(c => c.eventId?.toString() === eid);
          return choice?.attending || false;
        });
      };

      const hasAnyRsvp = (...ids) => {
        const pc = findPartyChoice('ec', ...ids);
        return pc?.choices?.some(c => c.attending) || false;
      };

      const hasMenuChoices = (...ids) => {
        const pc = findPartyChoice('mc', ...ids);
        return pc?.choices?.length > 0;
      };

      const getAllergies = (...ids) => {
        const pc = findPartyChoice('mc', ...ids);
        const badges = (pc?.specialRequests || []).filter(sr => sr.selected).map(sr => sr.name);
        const detail = pc?.specialRequestDetail || '';
        return { badges, detail };
      };

      const attendance = getAttendance(guestId);
      const allergies = getAllergies(guestId);
      rows.push({
        name: g.name,
        principalName: g.name,
        email: g.email || '',
        isChild: g.adult === false,
        isPrincipal: true,
        attendance,
        hasRsvp: hasAnyRsvp(guestId),
        isUnnamed: false,
        hasMenu: hasMenuChoices(guestId),
        allergies
      });

      (g.partyMembers || []).forEach(pm => {
        const candidates = [pm.id, pm.name, `member-${pm.id}`];
        // Also try "null"/"undefined" strings — the guest portal serialises
        // null/undefined member IDs into those literal strings when saving
        // event choices via JSON, so the stored partyGuestId may be "null".
        if (pm.id == null) candidates.push('null', 'undefined');
        const unnamed = /- Guest \d+$/.test(pm.name);
        rows.push({
          name: pm.name,
          principalName: g.name,
          email: '',
          isChild: pm.adult === false,
          isPrincipal: false,
          attendance: getAttendance(...candidates),
          hasRsvp: hasAnyRsvp(...candidates),
          isUnnamed: unnamed,
          hasMenu: hasMenuChoices(...candidates),
          allergies: getAllergies(...candidates)
        });
      });
    });

    rows.sort((a, b) => {
      const pc = a.principalName.localeCompare(b.principalName);
      if (pc !== 0) return pc;
      if (a.isPrincipal && !b.isPrincipal) return -1;
      if (!a.isPrincipal && b.isPrincipal) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      events: events.map(e => ({
        id: e._id.toString(),
        name: e.name,
        date: e.date
      })),
      rows
    });
  } catch (e) { next(e); }
}

// ========== Banquet Seating Print ==========
async function getBanquetSeatingPrint(req, res, next) {
  try {
    const lang = getLang(req);
    const tables = await Table.find({}).sort({ number: 1 }).lean();
    const assignments = await TableAssignment.find({}).populate('guestId', 'name email partyMembers').sort({ seatNumber: 1 }).lean();
    const menuChoices = await MenuChoice.find({}).lean();
    const selectableCourses = await Course.find({ selectionRequired: true }).lean();
    const courseOptions = await CourseOption.find({
      courseId: { $in: selectableCourses.map(c => c._id) }
    }).lean();

    const optionMap = {};
    courseOptions.forEach(o => { optionMap[o._id.toString()] = localize(o.label, lang); });
    const courseMap = {};
    selectableCourses.forEach(c => { courseMap[c._id.toString()] = localize(c.label, lang); });

    const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const findPartyChoice = (mc, ...candidates) => {
      if (!mc?.partyChoices) return null;
      for (const id of candidates) {
        const match = mc.partyChoices.find(p => p.partyGuestId === id)
          || mc.partyChoices.find(p => p.partyGuestId === String(id));
        if (match) return match;
      }
      return null;
    };

    const result = tables.map(t => {
      const tableAssignments = assignments.filter(a => a.tableId.toString() === t._id.toString());
      const fixedNames = new Set((t.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg))));

      const seats = [];

      (t.fixedGuests || []).forEach(fg => {
        const fgName = typeof fg === 'string' ? fg : (fg.name || fg);
        const matchAssign = tableAssignments.find(a => fixedNames.has(norm(a.guestId?.name || '')));
        const guestId = matchAssign?.guestId?._id?.toString();
        const mc = guestId ? menuChoices.find(m => m.guestId.toString() === guestId) : null;
        const pc = mc ? findPartyChoice(mc, guestId) : null;

        const mealChoices = [];
        selectableCourses.forEach(c => {
          const cid = c._id.toString();
          const choice = pc?.choices?.find(ch => ch.courseId?.toString() === cid);
          mealChoices.push({
            course: courseMap[cid],
            selected: choice ? (optionMap[choice.optionId?.toString()] || null) : null
          });
        });

        const badges = (pc?.specialRequests || []).filter(sr => sr.selected).map(sr => sr.name);
        const detail = pc?.specialRequestDetail || '';

        seats.push({
          seat: 0,
          name: fgName,
          isFixed: true,
          mealChoices,
          hasChosen: mealChoices.some(m => m.selected),
          allergies: { badges, detail }
        });
      });

      tableAssignments
        .filter(a => !fixedNames.has(norm(a.guestId?.name || '')))
        .forEach(a => {
          const displayName = a.partyMemberName || (a.guestId ? a.guestId.name : 'Unknown');
          const guestId = a.guestId?._id?.toString();
          const mc = guestId ? menuChoices.find(m => m.guestId.toString() === guestId) : null;

          const pmId = a.partyMemberName || guestId;
          const guest = a.guestId;
          const pmObj = a.partyMemberName && guest?.partyMembers
            ? guest.partyMembers.find(pm => pm.name === a.partyMemberName)
            : null;
          const candidates = a.partyMemberName
            ? [pmObj?.id, a.partyMemberName, `member-${pmObj?.id}`]
            : [guestId];
          const pc = mc ? findPartyChoice(mc, ...candidates) : null;

          const mealChoices = [];
          selectableCourses.forEach(c => {
            const cid = c._id.toString();
            const choice = pc?.choices?.find(ch => ch.courseId?.toString() === cid);
            mealChoices.push({
              course: courseMap[cid],
              selected: choice ? (optionMap[choice.optionId?.toString()] || null) : null
            });
          });

          const badges = (pc?.specialRequests || []).filter(sr => sr.selected).map(sr => sr.name);
          const detail = pc?.specialRequestDetail || '';

          seats.push({
            seat: 0,
            name: displayName,
            isFixed: false,
            mealChoices,
            hasChosen: mealChoices.some(m => m.selected),
            allergies: { badges, detail }
          });
        });

      const emptySeats = Math.max(0, t.capacity - seats.length);
      for (let i = 0; i < emptySeats; i++) {
        seats.push({
          seat: 0,
          name: null,
          isFixed: false,
          mealChoices: selectableCourses.map(c => ({ course: courseMap[c._id.toString()], selected: null })),
          hasChosen: false,
          allergies: { badges: [], detail: '' }
        });
      }

      seats.forEach((s, i) => { s.seat = i + 1; });

      return {
        number: t.number,
        name: t.name,
        isHeadTable: t.isHeadTable,
        capacity: t.capacity,
        filledCount: seats.filter(s => s.name).length,
        seats
      };
    });

    res.json({
      courses: selectableCourses.map(c => ({ id: c._id.toString(), label: courseMap[c._id.toString()] })),
      tables: result
    });
  } catch (e) { next(e); }
}

// ========== Admin Event Choices Update ==========
async function updateAdminEventChoices(req, res, next) {
  try {
    const { guestId } = req.params;
    const { partyChoices } = req.body;

    if (!Array.isArray(partyChoices)) {
      return res.status(400).json({ error: 'partyChoices must be an array' });
    }

    const guest = await Guest.findById(guestId).lean();
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const eventChoice = await EventChoice.findOneAndUpdate(
      { guestId },
      { partyChoices },
      { upsert: true, new: true }
    );

    res.json(eventChoice);
  } catch (e) { next(e); }
}

module.exports = {
  getGuestSummary,
  listChefProfiles, createChefProfile, updateChefProfile, deleteChefProfile,
  uploadChefProfileImage, getChefProfileImage,
  listDayMenus, getDayMenu, createDayMenu, updateDayMenu, deleteDayMenu,
  uploadDayMenuImage, getDayMenuImage, getDayMenuSectionImage,
  listTables, createTable, updateTable, deleteTable, seedTables,
  listTableAssignments, createTableAssignment, updateTableAssignment, deleteTableAssignment, bulkAssignTables,
  reorderTableSeats,
  getMenuResponses,
  getGiftPurchases,
  getAdminEventChoices,
  updateAdminEventChoices,
  getGuestsWithoutEventChoices,
  getGuestsWithoutMenuChoices,
  getGuestsWithoutParty,
  getGuestListPrint,
  getBanquetSeatingPrint
};
