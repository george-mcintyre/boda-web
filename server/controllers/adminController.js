const fs = require('fs');
const path = require('path');
const { Message, Menu, Config, CashGiftCard, Event } = require('../models');

// Format event for API response according to README specification
function formatEventForApi(event) {
  return {
    id: event._id.toString(),
    name: event.name,
    date: event.date ? event.date.toISOString() : null,
    end: event.end ? event.end.toISOString() : null,
    location: event.location,
    title: event.title ? (typeof event.title === 'string' ? event.title : event.title.get('en') || event.title.get('es')) : null,
    description: event.description ? (typeof event.description === 'string' ? event.description : event.description.get('en') || event.description.get('es')) : null,
    image: event.image || null,
    sub_events: (event.sub_events || []).map(sub => ({
      name: sub.name,
      date: sub.date ? sub.date.toISOString() : null,
      end: sub.end ? sub.end.toISOString() : null,
      description: sub.description || null,
      icon: sub.icon
    }))
  };
}

// Data dir and helpers
const DATA_DIR = path.join(__dirname, '..', 'data');
const files = {
  gifts: path.join(DATA_DIR, 'gifts.json'),
  agenda: path.join(DATA_DIR, 'agenda.json'),
  menu: path.join(DATA_DIR, 'menu.json'),
  config: path.join(DATA_DIR, 'config.json'),
};

function ensureFile(file, example) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) {
    if (example && fs.existsSync(example)) {
      fs.copyFileSync(example, file);
    } else {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
    }
  }
}

function readJson(file, fallback) {
  ensureFile(file);
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJson(file, payload) {
  ensureFile(file);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
  fs.renameSync(tmp, file);
}

// ========== Messages (MongoDB) ==========
async function listMessages(req, res, next) {
  try {
    const { cursor, limit = 10 } = req.query;
    const query = Message.find({}).sort({ createdAt: -1 });
    
    if (cursor) {
      query.where({ _id: { $lt: cursor } });
    }
    
    const items = await query.limit(parseInt(limit) + 1).lean();
    const hasMore = items.length > limit;
    const itemsToReturn = hasMore ? items.slice(0, limit) : items;
    
    const formattedItems = itemsToReturn.map(message => ({
      id: message._id.toString(),
      body: message.content || message.body,
      createdAt: message.createdAt.toISOString(),
      author: message.author || null,
      reactions: (message.reactions || []).map(reaction => ({
        emoji: reaction.emoji,
        count: reaction.count || 0,
        reacted: false // Admin reactions will be handled separately
      }))
    }));
    
    const response = {
      items: formattedItems,
      nextCursor: hasMore ? itemsToReturn[itemsToReturn.length - 1]._id.toString() : null
    };
    
    res.json(response);
  } catch (e) { next(e); }
}

async function createMessage(req, res, next) {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Message body is required' });
    
    const message = await Message.create({
      content: body,
      body: body, // backward compatibility
      author: 'admin'
    });
    
    res.status(201).json({
      id: message._id.toString(),
      body: message.content || message.body,
      createdAt: message.createdAt.toISOString(),
      author: message.author,
      reactions: []
    });
  } catch (e) { next(e); }
}

async function reactToMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji is required' });
    
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    // Initialize reactions array if it doesn't exist
    if (!message.reactions) message.reactions = [];
    
    // Find existing reaction
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      existingReaction.count = (existingReaction.count || 0) + 1;
    } else {
      message.reactions.push({ emoji, count: 1 });
    }
    
    await message.save();
    
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

async function updateMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Message body is required' });
    
    const message = await Message.findByIdAndUpdate(
      id,
      { 
        content: body,
        body: body // backward compatibility
      },
      { new: true }
    );
    
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    res.json({
      id: message._id.toString(),
      body: message.content || message.body,
      createdAt: message.createdAt.toISOString(),
      author: message.author,
      reactions: (message.reactions || []).map(reaction => ({
        emoji: reaction.emoji,
        count: reaction.count || 0,
        reacted: false
      }))
    });
  } catch (e) { next(e); }
}

async function deleteMessage(req, res, next) {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

// ========== Gift List (file-backed) ==========
function withIds(arr) {
  return (arr || []).map((it, idx) => ({ id: it.id || String(idx + 1), ...it }));
}

function nextId(arr) {
  let max = 0;
  (arr || []).forEach(it => { const n = parseInt(it.id, 10); if (!isNaN(n) && n > max) max = n; });
  return String(max + 1);
}

async function listGifts(req, res) {
  ensureFile(files.gifts);
  const items = readJson(files.gifts, []);
  res.json(withIds(items));
}

async function createGift(req, res) {
  const items = readJson(files.gifts, []);
  const item = { ...req.body, id: nextId(items) };
  items.push(item);
  writeJson(files.gifts, items);
  res.status(201).json(item);
}

async function updateGift(req, res) {
  const items = readJson(files.gifts, []);
  const id = req.params.id;
  const idx = items.findIndex(it => String(it.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Gift not found' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeJson(files.gifts, items);
  res.json(items[idx]);
}

async function deleteGift(req, res) {
  const items = readJson(files.gifts, []);
  const id = req.params.id;
  const filtered = items.filter(it => String(it.id) !== String(id));
  writeJson(files.gifts, filtered);
  res.json({ ok: true });
}

// ========== Events (MongoDB-backed CRUD) ==========
async function listEventsAdmin(req, res, next) {
  try {
    const events = await Event.find({}).sort({ date: 1, order: 1, createdAt: 1 }).lean();
    const items = events.map(formatEventForApi);
    res.json(items);
  } catch (e) { next(e); }
}

async function createEventsItem(req, res, next) {
  try {
    const { name, date, end, location, title, description, image, sub_events } = req.body;
    
    // Convert strings to localized maps if needed
    const convertToMap = (value) => {
      if (!value) return undefined;
      if (typeof value === 'string') return { en: value };
      if (typeof value === 'object') return value;
      return undefined;
    };
    
    const event = await Event.create({
      name,
      date: date ? new Date(date) : null,
      end: end ? new Date(end) : null,
      location,
      title: convertToMap(title),
      description: convertToMap(description),
      image,
      sub_events: (sub_events || []).map(sub => ({
        name: sub.name,
        date: sub.date ? new Date(sub.date) : null,
        end: sub.end ? new Date(sub.end) : null,
        description: convertToMap(sub.description),
        icon: sub.icon
      }))
    });

    res.status(201).json(formatEventForApi(event));
  } catch (e) { next(e); }
}

async function updateEventsItem(req, res, next) {
  try {
    const { id } = req.params;
    const { name, date, end, location, title, description, image, sub_events } = req.body;

    // Convert strings to localized maps if needed
    const convertToMap = (value) => {
      if (!value) return undefined;
      if (typeof value === 'string') return { en: value };
      if (typeof value === 'object') return value;
      return undefined;
    };

    const event = await Event.findByIdAndUpdate(id, {
      ...(name && { name }),
      ...(date && { date: new Date(date) }),
      ...(end && { end: new Date(end) }),
      ...(location && { location }),
      ...(title && { title: convertToMap(title) }),
      ...(description && { description: convertToMap(description) }),
      ...(image && { image }),
      ...(sub_events && { 
        sub_events: sub_events.map(sub => ({
          name: sub.name,
          date: sub.date ? new Date(sub.date) : null,
          end: sub.end ? new Date(sub.end) : null,
          description: convertToMap(sub.description),
          icon: sub.icon
        }))
      })
    }, { new: true });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    res.json(formatEventForApi(event));
  } catch (e) { next(e); }
}

async function deleteEventsItem(req, res, next) {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

// ========== Menu (MongoDB-backed CRUD) ==========
function toOptionPayload(body) {
  const nombre = body?.nombre ?? body?.name ?? '';
  const descripcion = body?.descripcion ?? body?.description ?? '';
  const mapOrUndef = (v) => {
    if (v == null || v === '') return undefined;
    if (typeof v === 'object') return v; // already localized
    return { en: String(v) };
  };
  return { name: mapOrUndef(nombre), description: mapOrUndef(descripcion) };
}

async function getMenuDoc() {
  let doc = await Menu.findOne();
  if (!doc) doc = await Menu.create({ options: [] });
  return doc;
}

function presentOptions(options) {
  const arr = Array.isArray(options) ? options : [];
  return arr.map((opt, idx) => {
    const asStr = (m) => {
      if (!m) return '';
      if (typeof m === 'string') return m;
      if (m && typeof m.get === 'function') return m.get('es') || m.get('en') || '';
      if (m && typeof m === 'object') return m.es || m.en || '';
      return '';
    };
    return {
      id: String(idx + 1),
      nombre: asStr(opt.name),
      descripcion: asStr(opt.description),
    };
  });
}

async function listMenus(req, res, next) {
  try {
    const doc = await getMenuDoc();
    res.json(presentOptions(doc.options));
  } catch (e) { next(e); }
}

async function createMenu(req, res, next) {
  try {
    const doc = await getMenuDoc();
    const payload = toOptionPayload(req.body || {});
    doc.options.push(payload);
    await doc.save();
    const items = presentOptions(doc.options);
    res.status(201).json(items[items.length - 1]);
  } catch (e) { next(e); }
}

async function updateMenu(req, res, next) {
  try {
    const id = String(req.params.id || '');
    const doc = await getMenuDoc();
    const idx = presentOptions(doc.options).findIndex(it => it.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
    const payload = toOptionPayload(req.body || {});
    doc.options[idx] = { ...doc.options[idx].toObject?.() ?? doc.options[idx], ...payload };
    await doc.save();
    res.json(presentOptions(doc.options)[idx]);
  } catch (e) { next(e); }
}

async function deleteMenu(req, res, next) {
  try {
    const id = String(req.params.id || '');
    const doc = await getMenuDoc();
    const idx = presentOptions(doc.options).findIndex(it => it.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
    doc.options.splice(idx, 1);
    await doc.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
}

// ========== Settings: Agenda bloqueo (MongoDB) ==========
async function getConfigDoc() {
  let cfg = await Config.findOne();
  if (!cfg) cfg = await Config.create({ defaultLanguage: 'es', otherOptions: {} });
  return cfg;
}

function ensureEventInConfig(cfgObj) {
  cfgObj.otherOptions = cfgObj.otherOptions || {};
  const ev = cfgObj.otherOptions.event || { blocked: false, reason: '', blockedAt: null };
  cfgObj.otherOptions.event = {
    blocked: !!ev.blocked,
    reason: ev.reason || '',
    blockedAt: ev.blockedAt || null,
  };
  // expose top-level event for backward compatibility
  cfgObj.event = cfgObj.otherOptions.event;
  return cfgObj;
}

async function getBlockedEvent(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    const obj = ensureEventInConfig(cfg.toObject());
    // save migration if event was absent
    await Config.updateOne({ _id: cfg._id }, { $set: { otherOptions: obj.otherOptions } });
    res.json(obj);
  } catch (e) { next(e); }
}

async function setBlockedEvent(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    const now = new Date().toISOString();
    const obj = ensureEventInConfig(cfg.toObject());
    const reason = (req.body && req.body.reason) || obj.event.reason || '';
    obj.otherOptions.event.blocked = true;
    obj.otherOptions.event.reason = reason;
    obj.otherOptions.event.blockedAt = obj.otherOptions.event.blockedAt || now;
    await Config.updateOne({ _id: cfg._id }, { $set: { otherOptions: obj.otherOptions } });
    res.json(obj);
  } catch (e) { next(e); }
}

async function clearBlockedEvent(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    const obj = ensureEventInConfig(cfg.toObject());
    obj.otherOptions.event.blocked = false;
    obj.otherOptions.event.reason = '';
    obj.otherOptions.event.blockedAt = null;
    await Config.updateOne({ _id: cfg._id }, { $set: { otherOptions: obj.otherOptions } });
    res.json(obj);
  } catch (e) { next(e); }
}

// ========== Cash Gift Cards (MongoDB CRUD) ==========
async function listCashGiftCards(req, res, next) {
  try {
    const items = await CashGiftCard.find({}).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) { next(e); }
}

async function createCashGiftCard(req, res, next) {
  try {
    const { code, amount, used } = req.body || {};
    const item = await CashGiftCard.create({ code, amount, used });
    res.status(201).json(item);
  } catch (e) { next(e); }
}

async function updateCashGiftCard(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await CashGiftCard.findByIdAndUpdate(id, req.body || {}, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Cash gift card not found' });
    res.json(updated);
  } catch (e) { next(e); }
}

async function deleteCashGiftCard(req, res, next) {
  try {
    const { id } = req.params;
    await CashGiftCard.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = {
  // messages
  listMessages, createMessage, reactToMessage, updateMessage, deleteMessage,
  // gifts (still file-backed)
  listGifts, createGift, updateGift, deleteGift,
  // agenda (DB-backed)
  listEventsAdmin, createEventsItem, updateEventsItem, deleteEventsItem,
  // menu (DB-backed)
  listMenus, createMenu, updateMenu, deleteMenu,
  // settings (DB-backed)
  getBlockedEvent, setBlockedEvent, clearBlockedEvent,
  // cash gift cards (DB-backed)
  listCashGiftCards, createCashGiftCard, updateCashGiftCard, deleteCashGiftCard,
};
