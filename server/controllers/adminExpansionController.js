const { Guest, Event, EventChoice, MenuChoice, ChefProfile, ChefProfileImage, DayMenu, DayMenuImage, Table, TableAssignment, GiftChoice, Gift, GiftImage, Course, CourseOption, Config } = require('../models');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { mergeLocalizedString, localize, getLang } = require('../utils/localized');
const { loadCubes, resolveCubeFaces, getCubePosition } = require('../data/cubes-loader');
const fs = require('fs');
const path = require('path');

let cubeFacesByIdCache = null;
function getCubeFacesById() {
  if (!cubeFacesByIdCache) {
    cubeFacesByIdCache = new Map();
    for (const cube of loadCubes()) {
      cubeFacesByIdCache.set(cube.id, resolveCubeFaces(cube));
    }
  }
  return cubeFacesByIdCache;
}

let cubePositionByIdCache = null;
function getCubePositionById() {
  if (!cubePositionByIdCache) {
    cubePositionByIdCache = new Map();
    for (const cube of loadCubes()) {
      cubePositionByIdCache.set(cube.id, getCubePosition(cube));
    }
  }
  return cubePositionByIdCache;
}

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

    const validPartyIds = new Map();
    guests.forEach(g => {
      const gid = g._id.toString();
      const ids = new Set([gid]);
      (g.partyMembers || []).forEach(pm => {
        if (pm.id) ids.add(pm.id);
        if (pm.name) ids.add(pm.name);
      });
      validPartyIds.set(gid, ids);
    });

    // Per-event attendance
    const perEventAttendance = events.map(event => {
      let count = 0;
      eventChoices.forEach(ec => {
        const gid = ec.guestId.toString();
        const valid = validPartyIds.get(gid);
        if (!valid) return;
        if (ec.partyChoices) {
          ec.partyChoices.forEach(pc => {
            if (!valid.has(pc.partyGuestId)) return;
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
      const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const fixedNamesList = (t.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg)));
      const isFixedGuest = name => {
        const n = norm(name);
        return fixedNamesList.some(fn => n.includes(fn) || fn.includes(n));
      };
      const nonFixedAssignments = tableAssignments.filter(a => {
        const name = a.guestId ? a.guestId.name : '';
        return !isFixedGuest(name);
      });
      return {
        id: t._id.toString(),
        number: t.number,
        name: t.name,
        capacity: t.capacity,
        isHeadTable: t.isHeadTable,
        fixedGuests: t.fixedGuests || [],
        assignedCount: nonFixedAssignments.length + (t.fixedGuests ? t.fixedGuests.length : 0),
        assignments: nonFixedAssignments
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
      .populate('guestId', 'name email partyMembers')
      .populate('tableId', 'number name')
      .sort({ seatNumber: 1 })
      .lean();

    const staleIds = assignments.filter(a => {
      if (!a.guestId) return true;
      if (!a.partyMemberName) return false;
      const memberNames = (a.guestId.partyMembers || []).map(m => m.name);
      return !memberNames.includes(a.partyMemberName);
    }).map(a => a._id);

    if (staleIds.length) {
      TableAssignment.deleteMany({ _id: { $in: staleIds } }).catch(() => {});
    }

    const staleSet = new Set(staleIds.map(id => id.toString()));
    const items = assignments
      .filter(a => a.guestId && !staleSet.has(a._id.toString()))
      .map(a => ({
        id: a._id.toString(),
        tableId: a.tableId ? a.tableId._id.toString() : null,
        tableNumber: a.tableId ? a.tableId.number : null,
        tableName: a.tableId ? a.tableId.name : null,
        guestId: a.guestId._id.toString(),
        guestName: a.guestId.name,
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

    const existingAssignments = await TableAssignment.find({ tableId }).populate('guestId', 'name').lean();
    const fixedCount = (table.fixedGuests || []).length;
    const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const fixedNamesList = (table.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg)));
    const isFixed = name => { const n = norm(name); return fixedNamesList.some(fn => n.includes(fn) || fn.includes(n)); };
    const nonFixedCount = existingAssignments.filter(a => !isFixed(a.guestId ? a.guestId.name : '')).length;
    const MAX_SEATS = 12;
    const totalOccupied = nonFixedCount + fixedCount;
    if (totalOccupied >= MAX_SEATS) {
      return res.status(400).json({ error: `Table is full (${totalOccupied}/${table.capacity})` });
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

    const oldTableId = assignment.tableId.toString();

    if (tableChanged) {
      const newTable = await Table.findById(tableId).lean();
      if (!newTable) return res.status(404).json({ error: 'Table not found' });

      const existingAssignments = await TableAssignment.find({ tableId }).populate('guestId', 'name').lean();
      const fixedCount = (newTable.fixedGuests || []).length;
      const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const fixedNamesList = (newTable.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg)));
      const isFixed = name => { const n = norm(name); return fixedNamesList.some(fn => n.includes(fn) || fn.includes(n)); };
      const nonFixedCount = existingAssignments.filter(a => !isFixed(a.guestId ? a.guestId.name : '')).length;
      const MAX_SEATS = 12;
      const totalOccupied = nonFixedCount + fixedCount;
      if (totalOccupied >= MAX_SEATS) {
        return res.status(400).json({ error: `Table is full (${totalOccupied}/${newTable.capacity})` });
      }

      assignment.tableId = tableId;
      const currentCount = await TableAssignment.countDocuments({ tableId });
      assignment.seatNumber = currentCount + 1;
    }

    if (guestId !== undefined) assignment.guestId = guestId;
    if (partyMemberName !== undefined) assignment.partyMemberName = partyMemberName || null;

    await assignment.save();

    if (tableChanged) {
      await renumberSeats(oldTableId);
      await renumberSeats(tableId);
      await assignment.constructor.findById(assignment._id).lean().then(a => { if (a) assignment.seatNumber = a.seatNumber; });
    }

    res.json({
      id: assignment._id.toString(),
      tableId: assignment.tableId.toString(),
      guestId: assignment.guestId.toString(),
      partyMemberName: assignment.partyMemberName,
      seatNumber: assignment.seatNumber
    });
  } catch (e) { next(e); }
}

async function renumberSeats(tableId) {
  const assignments = await TableAssignment.find({ tableId }).sort({ seatNumber: 1 }).lean();
  const ops = assignments.map((a, idx) =>
    TableAssignment.updateOne({ _id: a._id }, { seatNumber: idx + 1 })
  );
  if (ops.length) await Promise.all(ops);
}

async function deleteTableAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await TableAssignment.findById(id).lean();
    await TableAssignment.findByIdAndDelete(id);
    if (assignment) await renumberSeats(assignment.tableId);
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
    const guests = await Guest.find({}).lean();
    const tables = await Table.find({}).sort({ number: 1 }).lean();
    const assignments = await TableAssignment.find({}).populate('tableId', 'number name isHeadTable').sort({ seatNumber: 1 }).lean();
    const menuChoices = await MenuChoice.find({}).lean();
    const eventChoices = await EventChoice.find({}).lean();
    const courseOptions = await CourseOption.find({}).lean();

    const optionLabelMap = {};
    courseOptions.forEach(o => {
      optionLabelMap[o._id.toString()] = localize(o.label, lang);
    });

    const guestById = {};
    guests.forEach(g => { guestById[g._id.toString()] = g; });

    const menuChoiceByGuestId = {};
    menuChoices.forEach(mc => {
      if (mc.guestId) menuChoiceByGuestId[mc.guestId.toString()] = mc;
    });

    const eventChoiceByGuestId = {};
    eventChoices.forEach(ec => {
      if (ec.guestId) eventChoiceByGuestId[ec.guestId.toString()] = ec;
    });

    const findPartyChoice = (doc, ...candidates) => {
      if (!doc || !Array.isArray(doc.partyChoices)) return null;
      for (const id of candidates) {
        if (id == null) continue;
        const match = doc.partyChoices.find(p => p.partyGuestId === id || p.partyGuestId === String(id));
        if (match) return match;
      }
      return null;
    };

    const isAttending = (guest, partyMemberName) => {
      const ec = eventChoiceByGuestId[guest._id.toString()];
      if (!ec) return false;
      const guestIdStr = guest._id.toString();
      let candidates;
      if (!partyMemberName) {
        candidates = [guestIdStr];
      } else {
        const pmObj = (guest.partyMembers || []).find(pm => pm.name === partyMemberName);
        candidates = [
          pmObj?.id,
          partyMemberName,
          pmObj?._id ? `member-${pmObj._id}` : null,
          pmObj?._id ? String(pmObj._id) : null
        ];
        if (pmObj && pmObj.id == null) candidates.push('null', 'undefined');
      }
      const pc = findPartyChoice(ec, ...candidates);
      return !!(pc?.choices || []).some(c => c.attending);
    };

    const buildPersonRow = (displayName, guest, partyMemberName, seatNumber, isFixed) => {
      const mc = menuChoiceByGuestId[guest._id.toString()];
      const isPrimary = !partyMemberName;
      let pc = null;
      if (isPrimary) {
        pc = findPartyChoice(mc, guest._id.toString());
      } else {
        const pmObj = (guest.partyMembers || []).find(pm => pm.name === partyMemberName);
        const candidates = [
          pmObj?.id,
          partyMemberName,
          pmObj?._id ? `member-${pmObj._id}` : null,
          pmObj?._id ? String(pmObj._id) : null
        ];
        pc = findPartyChoice(mc, ...candidates);
      }

      const choices = (pc?.choices || []).map(c => ({
        courseId: c.courseId ? c.courseId.toString() : null,
        optionId: c.optionId ? c.optionId.toString() : null,
        optionLabel: c.optionId ? (optionLabelMap[c.optionId.toString()] || '—') : '—',
        cookingPreference: c.cookingPreference || null
      }));
      const specialReqs = (pc?.specialRequests || []).filter(sr => sr.selected).map(sr => sr.name);

      return {
        guestName: displayName,
        partyMemberName: isPrimary ? null : `${guest.name}'s party`,
        seatNumber: seatNumber ?? null,
        isFixed: !!isFixed,
        choices,
        specialRequest: specialReqs.join(', ') || null,
        specialRequestDetail: pc?.specialRequestDetail || null
      };
    };

    const tableGroups = {};
    const ensureGroup = (tableNumber, tableName, isHeadTable) => {
      const tableKey = tableNumber !== null && tableNumber !== undefined ? String(tableNumber) : 'unassigned';
      if (!tableGroups[tableKey]) {
        tableGroups[tableKey] = {
          tableNumber: tableNumber ?? null,
          tableName: tableName || null,
          isHeadTable: !!isHeadTable,
          guests: []
        };
      }
      return tableGroups[tableKey];
    };

    const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const seenAssignments = new Set();
    const fixedGuestNamesByTable = new Map();

    tables.forEach(table => {
      const fixedSet = new Set();
      (table.fixedGuests || []).forEach((fg, idx) => {
        const fgName = typeof fg === 'string' ? fg : (fg.name || '');
        if (!fgName) return;
        fixedSet.add(norm(fgName));
        const fixedSeat = idx + 1;

        const matchedGuest = guests.find(g => norm(g.name) === norm(fgName));
        const group = ensureGroup(table.number, table.name, table.isHeadTable);

        if (matchedGuest) {
          if (!isAttending(matchedGuest, null)) {
            seenAssignments.add(matchedGuest._id.toString() + '|');
            return;
          }
          group.guests.push(buildPersonRow(fgName, matchedGuest, null, fixedSeat, true));
          seenAssignments.add(matchedGuest._id.toString() + '|');
        } else {
          group.guests.push({
            guestName: fgName,
            partyMemberName: null,
            seatNumber: fixedSeat,
            isFixed: true,
            choices: [],
            specialRequest: null,
            specialRequestDetail: null
          });
        }
      });
      fixedGuestNamesByTable.set(table._id.toString(), fixedSet);
    });

    assignments.forEach(a => {
      if (!a.guestId) return;
      const guest = guestById[a.guestId.toString()];
      if (!guest) return;
      const dedupKey = guest._id.toString() + '|' + (a.partyMemberName || '');
      if (seenAssignments.has(dedupKey)) return;

      const tableIdStr = a.tableId ? a.tableId._id.toString() : null;
      const fixedSet = tableIdStr ? fixedGuestNamesByTable.get(tableIdStr) : null;
      const candidateName = a.partyMemberName || guest.name || '';
      if (fixedSet && fixedSet.has(norm(candidateName))) {
        seenAssignments.add(dedupKey);
        return;
      }

      if (!isAttending(guest, a.partyMemberName || null)) {
        seenAssignments.add(dedupKey);
        return;
      }
      const tableNumber = a.tableId ? a.tableId.number : null;
      const tableName = a.tableId ? a.tableId.name : null;
      const isHeadTable = a.tableId ? !!a.tableId.isHeadTable : false;
      const displayName = a.partyMemberName || guest.name || guest.email || 'Unknown';
      const group = ensureGroup(tableNumber, tableName, isHeadTable);
      group.guests.push(buildPersonRow(displayName, guest, a.partyMemberName || null, a.seatNumber || null, false));
      seenAssignments.add(dedupKey);
    });

    guests.forEach(guest => {
      const guestIdStr = guest._id.toString();
      if (!seenAssignments.has(guestIdStr + '|') && isAttending(guest, null)) {
        const mc = menuChoiceByGuestId[guestIdStr];
        const hasPrimaryChoice = mc && Array.isArray(mc.partyChoices)
          && mc.partyChoices.some(p => p.partyGuestId === guestIdStr);
        if (hasPrimaryChoice) {
          const group = ensureGroup(null, null, false);
          group.guests.push(buildPersonRow(guest.name || guest.email || 'Unknown', guest, null, null, false));
        }
      }
      (guest.partyMembers || []).forEach(pm => {
        if (!pm || !pm.name) return;
        if (seenAssignments.has(guestIdStr + '|' + pm.name)) return;
        if (!isAttending(guest, pm.name)) return;
        const group = ensureGroup(null, null, false);
        group.guests.push(buildPersonRow(pm.name, guest, pm.name, null, false));
      });
    });

    const result = Object.values(tableGroups).sort((a, b) => {
      if (a.tableNumber === null) return 1;
      if (b.tableNumber === null) return -1;
      return a.tableNumber - b.tableNumber;
    });

    result.forEach(group => {
      const fixed = group.guests.filter(g => g.isFixed);
      const others = group.guests
        .filter(g => !g.isFixed)
        .sort((a, b) => {
          const aSeat = a.seatNumber == null ? Infinity : a.seatNumber;
          const bSeat = b.seatNumber == null ? Infinity : b.seatNumber;
          if (aSeat !== bSeat) return aSeat - bSeat;
          return (a.guestName || '').localeCompare(b.guestName || '');
        });

      const numbered = [...fixed, ...others];
      numbered.forEach((g, i) => { g.seatNumber = i + 1; });

      if (group.isHeadTable && fixed.length > 0 && others.length > 0) {
        const fixedNumbered = numbered.slice(0, fixed.length);
        const othersNumbered = numbered.slice(fixed.length);
        const leftCount = Math.floor(othersNumbered.length / 2);
        group.guests = [
          ...othersNumbered.slice(0, leftCount),
          ...fixedNumbered,
          ...othersNumbered.slice(leftCount)
        ];
      } else {
        group.guests = numbered;
      }
    });

    res.json(result);
  } catch (e) { next(e); }
}

// ========== Gift Purchases ==========
// Returns ~80 chars of the cube's description, trimmed at a word boundary, with
// an ellipsis. Used by the admin Gift Purchases list to disambiguate the 38
// blocks, which all share the same generic title "A Block for Our Wedding
// Sculpture". The localised description per cubeId lives on gift.description
// (seeded from server/data/cube-text.js — see seedCubes.js).
function buildCubeDescriptionSnippet(localizedDescription, lang, maxLen = 80) {
  const full = localize(localizedDescription, lang);
  if (!full) return '';
  if (full.length <= maxLen) return full;
  const truncated = full.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated;
  return cut.replace(/[\s.,;:!?-]+$/, '') + '…';
}

async function getGiftPurchases(req, res, next) {
  try {
    const lang = getLang(req);
    const giftChoices = await GiftChoice.find({})
      .populate('giftId', 'title amount amountOptions type cubeId description')
      .populate('guestId', 'name email')
      .sort({ date: -1 })
      .lean();

    let totalAmount = 0;
    const purchases = giftChoices.map(choice => {
      const gift = choice.giftId;
      const fallbackAmount = gift
        ? (gift.amount
            ?? (Array.isArray(gift.amountOptions) && gift.amountOptions.length
                ? Math.min(...gift.amountOptions)
                : 0))
        : 0;
      const amount = Number.isFinite(choice.amount) ? choice.amount : fallbackAmount;
      totalAmount += amount;

      const isCube = gift && gift.type === 'cube' && Number.isFinite(gift.cubeId);
      return {
        id: choice._id.toString(),
        guestId: choice.guestId ? choice.guestId._id.toString() : null,
        guestName: choice.guestId ? (choice.guestId.name || choice.guestId.email) : 'Unknown',
        guestEmail: choice.guestId ? choice.guestId.email : null,
        giftId: gift ? gift._id.toString() : null,
        giftType: gift ? gift.type : null,
        cubeId: isCube ? gift.cubeId : null,
        cubeDescriptionSnippet: isCube ? buildCubeDescriptionSnippet(gift.description, lang) : null,
        cubeDescription: isCube ? localize(gift.description, lang) : null,
        cubeFaces: isCube ? (getCubeFacesById().get(gift.cubeId) || null) : null,
        cubePosition: isCube ? (getCubePositionById().get(gift.cubeId) || null) : null,
        giftTitle: gift ? localize(gift.title, lang) : 'Unknown',
        giftAmount: amount,
        date: choice.date ? choice.date.toISOString() : null,
        message: choice.message || null,
        giftFrom: choice.giftFrom || null
      };
    });

    res.json({ purchases, totalAmount });
  } catch (e) { next(e); }
}

async function undoGiftPurchase(req, res, next) {
  try {
    const { id } = req.params;
    const result = await GiftChoice.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'Purchase not found' });
    res.json({ ok: true, deletedId: id });
  } catch (e) { next(e); }
}

const ALLOWED_LANGS = ['en', 'es', 'fr', 'de'];

async function updateGiftPurchase(req, res, next) {
  try {
    const { id } = req.params;
    const update = {};
    if (req.body && typeof req.body.lang === 'string') {
      const lang = req.body.lang.toLowerCase();
      if (!ALLOWED_LANGS.includes(lang)) {
        return res.status(400).json({ error: `lang must be one of ${ALLOWED_LANGS.join(', ')}` });
      }
      update.lang = lang;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No mutable fields provided. Currently supported: lang' });
    }
    const result = await GiftChoice.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!result) return res.status(404).json({ error: 'Purchase not found' });
    res.json({ ok: true, id, updated: update });
  } catch (e) { next(e); }
}

// ========== Print Artefact Descriptors ==========
// One self-contained JSON per purchase, embedding everything the local print
// script (scripts/print/render-artefacts.js) needs to render the printer-ready
// PDFs: guest details, gift details (localised in all 4 languages), the
// buyer's message, the signer, and base64-embedded image data. The descriptor
// is the source of truth: the local script never needs to call the API or
// fetch any URL — it can be re-run months later from a saved descriptor.
//
// IMPORTANT: The schemaVersion field is the contract between this server
// builder and scripts/print/render-artefacts.js. Bump it on breaking changes.
const DESCRIPTOR_SCHEMA_VERSION = 1;
const COUPLE_NAMES = 'Iluminada & George';

function slugify(s) {
  return String(s || 'unknown')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'unknown';
}

function toFourLangs(localized) {
  const get = (lang) => localize(localized, lang) || '';
  return { en: get('en'), es: get('es'), fr: get('fr'), de: get('de') };
}

// Reads a static asset under public/ and returns it as a base64 data URI.
// Returns null if the file is missing — the print script should treat a null
// dataUri as "render a placeholder" rather than crash, so a single missing
// asset doesn't block the whole batch.
function readStaticAssetAsDataUri(absoluteUrl) {
  if (!absoluteUrl || typeof absoluteUrl !== 'string' || !absoluteUrl.startsWith('/')) return null;
  const publicRoot = path.join(__dirname, '..', '..', 'public');
  const filePath = path.join(publicRoot, absoluteUrl);
  if (!filePath.startsWith(publicRoot)) return null;
  try {
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeByExt = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
    const mime = mimeByExt[ext] || 'application/octet-stream';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (_e) {
    return null;
  }
}

/*
 * Print-aware variant of readStaticAssetAsDataUri.
 *
 * For images that appear on the printed gift-card artefacts (gift note,
 * thank-you note, honeymoon card), we prefer an AI-upscaled high-DPI
 * version stored under .../print-hires/<filename> when it exists, so the
 * printed PDF uses ~300 DPI image data even though the live web site
 * keeps using the small, fast-loading originals at the canonical path.
 *
 * The print-hires directory is gitignored (the files are 10-20 MB each
 * and only matter at print time), so this fallback safely degrades to
 * the original whenever the hi-res copy isn't available — for example
 * when running render-artefacts.js on a machine that hasn't run the
 * upscale step. scripts/upscale-gift-card-images.sh produces them.
 */
function readPrintAssetAsDataUri(absoluteUrl) {
  if (!absoluteUrl || typeof absoluteUrl !== 'string' || !absoluteUrl.startsWith('/')) return null;
  const dir = path.posix.dirname(absoluteUrl);
  const file = path.posix.basename(absoluteUrl);
  const hires = readStaticAssetAsDataUri(path.posix.join(dir, 'print-hires', file));
  return hires || readStaticAssetAsDataUri(absoluteUrl);
}

function cubeFacesToDataUris(faces) {
  if (!faces || typeof faces !== 'object') return null;
  const out = {};
  for (const key of Object.keys(faces)) {
    const v = faces[key];
    if (v === 'white' || v === 'mirror') out[key] = v;
    else out[key] = readStaticAssetAsDataUri(v);
  }
  return out;
}

async function buildGiftImageDataUri(giftImageRef) {
  if (!giftImageRef) return null;
  try {
    const id = (giftImageRef._id || giftImageRef).toString();
    const img = await GiftImage.findById(id).lean();
    if (!img || !img.data) return null;
    return `data:${img.contentType || 'image/jpeg'};base64,${img.data.toString('base64')}`;
  } catch (_e) {
    return null;
  }
}

async function buildCombinedDescriptor(choice) {
  const gift = choice.giftId;
  if (!gift) return null;
  const guest = choice.guestId;

  const fallbackAmount = gift.amount
    ?? (Array.isArray(gift.amountOptions) && gift.amountOptions.length
        ? Math.min(...gift.amountOptions)
        : 0);
  const amount = Number.isFinite(choice.amount) ? choice.amount : fallbackAmount;

  const isCash = gift.type === 'cash';
  const isCube = gift.type === 'cube' && Number.isFinite(gift.cubeId);
  const isFigurine = gift.type === 'figurine' && Number.isFinite(gift.figurineId);

  const giftTitleLocalised = toFourLangs(gift.title);
  const giftDescriptionLocalised = toFourLangs(gift.description);

  const cashImageDataUri = isCash ? await buildGiftImageDataUri(gift.image) : null;
  const cubeFacesData = isCube ? cubeFacesToDataUris(getCubeFacesById().get(gift.cubeId)) : null;
  const figurineThumbDataUri = isFigurine
    ? (readStaticAssetAsDataUri(`/assets/figurines/figurine-${gift.figurineId}/thumb.png`)
        || readStaticAssetAsDataUri(`/assets/figurines/figurine-${gift.figurineId}/thumb.webp`))
    : null;

  const giftNoteCoverDataUri = readPrintAssetAsDataUri('/assets/images/gift-cards/gift-note-cover.jpg');
  const coupleInsideDataUri = readPrintAssetAsDataUri('/assets/images/gift-cards/couple-inside-transparent.png');

  const purchaseId = choice._id.toString();
  const guestName = guest ? (guest.name || guest.email || 'Unknown') : 'Unknown';
  const signerName = (choice.giftFrom && choice.giftFrom.trim()) || guestName;
  const message = choice.message || '';

  const giftBlock = {
    type: gift.type,
    title: giftTitleLocalised,
    description: giftDescriptionLocalised,
    amount,
    imageDataUri: cashImageDataUri,
    cubeId: isCube ? gift.cubeId : null,
    cubeFaces: cubeFacesData,
    cubePosition: isCube ? (getCubePositionById().get(gift.cubeId) || null) : null,
    figurineId: isFigurine ? gift.figurineId : null,
    figurineThumbDataUri,
  };

  const artefacts = {
    giftNote: {
      coverImageDataUri: giftNoteCoverDataUri,
    },
    thankYouNote: {
      coupleImageDataUri: coupleInsideDataUri,
    },
  };
  if (isCash) {
    artefacts.honeymoonCard = {
      imageDataUri: cashImageDataUri,
    };
  }

  return {
    schemaVersion: DESCRIPTOR_SCHEMA_VERSION,
    purchaseId,
    generatedAt: new Date().toISOString(),
    guest: {
      name: guestName,
      email: guest ? (guest.email || null) : null,
      slug: slugify(guestName),
      lang: (guest && guest.lang) || 'en',
    },
    purchase: {
      date: choice.date ? choice.date.toISOString() : null,
      message,
      signerName,
      amount,
      lang: (choice.lang && ['en','es','fr','de'].includes(choice.lang)) ? choice.lang : 'en',
    },
    gift: giftBlock,
    couple: { names: COUPLE_NAMES },
    artefacts,
  };
}

async function getGiftPurchaseDescriptor(req, res, next) {
  try {
    const { id } = req.params;
    const choice = await GiftChoice.findById(id)
      .populate('giftId', 'title description amount amountOptions type cubeId figurineId image')
      .populate('guestId', 'name email')
      .lean();
    if (!choice) return res.status(404).json({ error: 'Purchase not found' });
    const descriptor = await buildCombinedDescriptor(choice);
    if (!descriptor) return res.status(404).json({ error: 'Gift no longer exists for this purchase' });
    const filename = `purchase-${descriptor.purchaseId}-${descriptor.guest.slug}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(descriptor, null, 2));
  } catch (e) { next(e); }
}

async function getGiftPurchaseDescriptorsBundle(_req, res, next) {
  try {
    const choices = await GiftChoice.find({})
      .populate('giftId', 'title description amount amountOptions type cubeId figurineId image')
      .populate('guestId', 'name email')
      .sort({ date: -1 })
      .lean();

    const descriptors = [];
    for (const choice of choices) {
      const d = await buildCombinedDescriptor(choice);
      if (d) descriptors.push(d);
    }

    const bundle = {
      schemaVersion: DESCRIPTOR_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: descriptors.length,
      descriptors,
    };
    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="wedding-print-bundle-${today}.json"`);
    res.send(JSON.stringify(bundle, null, 2));
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
    const eventChoices = await EventChoice.find({}).lean();
    const guests = await Guest.find({}).lean();
    const selectableCourses = await Course.find({ selectionRequired: true }).lean();
    const courseOptions = await CourseOption.find({
      courseId: { $in: selectableCourses.map(c => c._id) }
    }).lean();

    const optionMap = {};
    courseOptions.forEach(o => { optionMap[o._id.toString()] = localize(o.label, lang); });
    const courseMap = {};
    selectableCourses.forEach(c => { courseMap[c._id.toString()] = localize(c.label, lang); });

    const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const eventChoiceByGuestId = {};
    eventChoices.forEach(ec => { if (ec.guestId) eventChoiceByGuestId[ec.guestId.toString()] = ec; });

    const findPartyChoice = (doc, ...candidates) => {
      if (!doc?.partyChoices) return null;
      for (const id of candidates) {
        if (id == null) continue;
        const match = doc.partyChoices.find(p => p.partyGuestId === id)
          || doc.partyChoices.find(p => p.partyGuestId === String(id));
        if (match) return match;
      }
      return null;
    };

    const isAttending = (guest, partyMemberName) => {
      const ec = eventChoiceByGuestId[guest._id.toString()];
      if (!ec) return false;
      const guestIdStr = guest._id.toString();
      let candidates;
      if (!partyMemberName) {
        candidates = [guestIdStr];
      } else {
        const pmObj = (guest.partyMembers || []).find(pm => pm.name === partyMemberName);
        candidates = [
          pmObj?.id,
          partyMemberName,
          pmObj?._id ? `member-${pmObj._id}` : null,
          pmObj?._id ? String(pmObj._id) : null
        ];
        if (pmObj && pmObj.id == null) candidates.push('null', 'undefined');
      }
      const pc = findPartyChoice(ec, ...candidates);
      return !!(pc?.choices || []).some(c => c.attending);
    };

    const buildMealChoices = (pc) => {
      const mealChoices = [];
      selectableCourses.forEach(c => {
        const cid = c._id.toString();
        const choice = pc?.choices?.find(ch => ch.courseId?.toString() === cid);
        mealChoices.push({
          course: courseMap[cid],
          selected: choice ? (optionMap[choice.optionId?.toString()] || null) : null,
          cookingPreference: choice?.cookingPreference || null
        });
      });
      return mealChoices;
    };

    const result = tables.map(t => {
      const tableAssignments = assignments.filter(a => a.tableId.toString() === t._id.toString());
      const fixedNames = new Set((t.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg))));

      const fixedSeats = [];
      const otherSeats = [];

      (t.fixedGuests || []).forEach(fg => {
        const fgName = typeof fg === 'string' ? fg : (fg.name || fg);
        const matchedGuest = guests.find(g => norm(g.name) === norm(fgName));
        if (matchedGuest && !isAttending(matchedGuest, null)) return;

        const mc = matchedGuest ? menuChoices.find(m => m.guestId.toString() === matchedGuest._id.toString()) : null;
        const pc = matchedGuest && mc ? findPartyChoice(mc, matchedGuest._id.toString()) : null;
        const mealChoices = buildMealChoices(pc);
        const badges = (pc?.specialRequests || []).filter(sr => sr.selected).map(sr => sr.name);
        const detail = pc?.specialRequestDetail || '';

        fixedSeats.push({
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
          const guest = a.guestId;
          if (!guest) return;
          if (!isAttending(guest, a.partyMemberName || null)) return;

          const displayName = a.partyMemberName || guest.name || 'Unknown';
          const guestId = guest._id.toString();
          const mc = menuChoices.find(m => m.guestId.toString() === guestId);
          const pmObj = a.partyMemberName && guest.partyMembers
            ? guest.partyMembers.find(pm => pm.name === a.partyMemberName)
            : null;
          const candidates = a.partyMemberName
            ? [pmObj?.id, a.partyMemberName, pmObj?._id ? `member-${pmObj._id}` : null, pmObj?._id ? String(pmObj._id) : null]
            : [guestId];
          const pc = mc ? findPartyChoice(mc, ...candidates) : null;

          const mealChoices = buildMealChoices(pc);
          const badges = (pc?.specialRequests || []).filter(sr => sr.selected).map(sr => sr.name);
          const detail = pc?.specialRequestDetail || '';

          otherSeats.push({
            seat: 0,
            name: displayName,
            isFixed: false,
            mealChoices,
            hasChosen: mealChoices.some(m => m.selected),
            allergies: { badges, detail }
          });
        });

      const numbered = [...fixedSeats, ...otherSeats];
      numbered.forEach((s, i) => { s.seat = i + 1; });

      let ordered;
      if (t.isHeadTable && fixedSeats.length > 0 && otherSeats.length > 0) {
        const fixedNumbered = numbered.slice(0, fixedSeats.length);
        const othersNumbered = numbered.slice(fixedSeats.length);
        const leftCount = Math.floor(othersNumbered.length / 2);
        ordered = [
          ...othersNumbered.slice(0, leftCount),
          ...fixedNumbered,
          ...othersNumbered.slice(leftCount)
        ];
      } else {
        ordered = numbered;
      }

      const emptySeats = Math.max(0, t.capacity - ordered.length);
      for (let i = 0; i < emptySeats; i++) {
        ordered.push({
          seat: ordered.length + 1,
          name: null,
          isFixed: false,
          mealChoices: selectableCourses.map(c => ({ course: courseMap[c._id.toString()], selected: null })),
          hasChosen: false,
          allergies: { badges: [], detail: '' }
        });
      }

      return {
        number: t.number,
        name: t.name,
        isHeadTable: t.isHeadTable,
        capacity: t.capacity,
        filledCount: ordered.filter(s => s.name).length,
        seats: ordered
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

function buildVenuePrintUrl(req, token) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  return `${proto}://${host}/venue-print-seating.html?token=${token}`;
}

async function buildVenuePrintQrPayload(req, token) {
  const url = buildVenuePrintUrl(req, token);
  const dataUrl = await QRCode.toDataURL(url, {
    type: 'image/png',
    width: 360,
    margin: 2,
    color: { dark: '#8B5A96', light: '#FDFBF7' }
  });
  return { url, qrDataUrl: dataUrl };
}

async function rotateVenuePrintToken(req, res, next) {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    await Config.findOneAndUpdate({}, { venuePrintToken: token }, { upsert: true, new: true });
    const payload = await buildVenuePrintQrPayload(req, token);
    res.json({ token, ...payload });
  } catch (e) { next(e); }
}

async function getVenuePrintTokenInfo(req, res, next) {
  try {
    const config = await Config.findOne({}).lean();
    if (!config || !config.venuePrintToken) {
      return res.json({ hasToken: false });
    }
    const payload = await buildVenuePrintQrPayload(req, config.venuePrintToken);
    res.json({ hasToken: true, ...payload });
  } catch (e) { next(e); }
}

async function getVenuePrintSeating(req, res, next) {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ error: 'Token required' });
    const config = await Config.findOne({}).lean();
    if (!config || !config.venuePrintToken) return res.status(401).json({ error: 'Invalid token' });
    if (config.venuePrintToken !== token) return res.status(401).json({ error: 'Invalid token' });
    req.query.lang = 'es';
    return getBanquetSeatingPrint(req, res, next);
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
  getGiftPurchaseDescriptor,
  getGiftPurchaseDescriptorsBundle,
  undoGiftPurchase,
  updateGiftPurchase,
  getAdminEventChoices,
  updateAdminEventChoices,
  getGuestsWithoutEventChoices,
  getGuestsWithoutMenuChoices,
  getGuestsWithoutParty,
  getGuestListPrint,
  getBanquetSeatingPrint,
  rotateVenuePrintToken,
  getVenuePrintTokenInfo,
  getVenuePrintSeating
};
