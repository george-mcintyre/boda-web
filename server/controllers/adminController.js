const fs = require('fs');
const path = require('path');
const { Message, Menu, Config, CashGiftCard, Event } = require('../models');

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
    const items = await Message.find({}).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) { next(e); }
}

async function deleteMessage(req, res, next) {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
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
function toEventPayload(body = {}) {
  // Accept Spanish or English keys
  const evento = body.evento ?? body.titulo ?? body.title ?? body.nombre;
  const descripcion = body.descripcion ?? body.description;
  const lugar = body.lugar ?? body.venue;
  const fecha = body.fecha ?? body.date;
  const hora = body.hora ?? body.time;
  const order = body.orden ?? body.order;
  const mapOrUndef = (v) => {
    if (v == null || v === '') return undefined;
    if (typeof v === 'object') return v; // already localized
    return { en: String(v) };
  };
  const payload = {
    title: mapOrUndef(evento),
    description: mapOrUndef(descripcion),
    venue: mapOrUndef(lugar),
    date: fecha ? new Date(fecha) : undefined,
    time: hora != null ? String(hora) : undefined,
    order: order != null ? Number(order) : undefined,
  };
  // remove undefined keys so updates don't unset unintentionally
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  return payload;
}

function presentEvent(doc) {
  if (!doc) return null;
  const asStr = (m) => {
    if (!m) return '';
    if (typeof m === 'string') return m;
    if (m && typeof m.get === 'function') return m.get('es') || m.get('en') || '';
    if (m && typeof m === 'object') return m.es || m.en || '';
    return '';
  };
  return {
    id: String(doc._id || doc.id),
    evento: asStr(doc.title),
    descripcion: asStr(doc.description),
    lugar: asStr(doc.venue),
    fecha: doc.date ? new Date(doc.date).toISOString().slice(0, 10) : '',
    hora: doc.time || '',
    orden: doc.order ?? undefined,
  };
}

async function listEventsAdmin(req, res, next) {
  try {
    const items = await Event.find({}).sort({ order: 1, createdAt: 1 }).lean();
    res.json(items.map(presentEvent));
  } catch (e) { next(e); }
}

async function createEventsItem(req, res, next) {
  try {
    const payload = toEventPayload(req.body || {});
    const created = await Event.create(payload);
    res.status(201).json(presentEvent(created));
  } catch (e) { next(e); }
}

async function updateEventsItem(req, res, next) {
  try {
    const id = req.params.id;
    const payload = toEventPayload(req.body || {});
    const updated = await Event.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ error: 'Agenda item not found' });
    res.json(presentEvent(updated));
  } catch (e) { next(e); }
}

async function deleteEventsItem(req, res, next) {
  try {
    const id = req.params.id;
    await Event.findByIdAndDelete(id);
    res.json({ ok: true });
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
  listMessages, deleteMessage,
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
