const fs = require('fs');
const path = require('path');
const { Message } = require('../models');

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

// ========== Events (file-backed CRUD) ==========
async function listEventsAdmin(req, res) {
  ensureFile(files.events);
  const items = readJson(files.events, []);
  res.json(withIds(items));
}

async function createEventsItem(req, res) {
  const items = readJson(files.events, []);
  const item = { ...req.body, id: nextId(items) };
  items.push(item);
  writeJson(files.events, items);
  res.status(201).json(item);
}

async function updateEventsItem(req, res) {
  const items = readJson(files.events, []);
  const id = req.params.id;
  const idx = items.findIndex(it => String(it.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Agenda item not found' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeJson(files.events, items);
  res.json(items[idx]);
}

async function deleteEventsItem(req, res) {
  const items = readJson(files.events, []);
  const id = req.params.id;
  const filtered = items.filter(it => String(it.id) !== String(id));
  writeJson(files.events, filtered);
  res.json({ ok: true });
}

// ========== Menu (file-backed CRUD) ==========
function normalizeMenu(data) {
  // Accept either an array of menu items or an object of categories -> items
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const result = [];
    for (const [tipo, list] of Object.entries(data)) {
      if (!Array.isArray(list)) continue;
      list.forEach((it, idx) => {
        // Try to pick Spanish or English name/description if nested
        const nombre = it.nombre || (it.name && (it.name.es || it.name.en)) || it.name || '';
        const descripcion = it.descripcion || (it.description && (it.description.es || it.description.en)) || it.description || '';
        const id = it.id || `${tipo}_${idx + 1}`; // ensure uniqueness across categories
        result.push({ id, nombre, descripcion, tipo, ...it });
      });
    }
    return result;
  }
  return [];
}

async function listMenus(req, res) {
  ensureFile(files.menu);
  const raw = readJson(files.menu, []);
  const items = normalizeMenu(raw);
  res.json(withIds(items));
}

async function createMenu(req, res) {
  const raw = readJson(files.menu, []);
  const items = normalizeMenu(raw);
  const item = { ...req.body };
  // If no id provided, generate a numeric one using nextId over current numeric ids
  if (!item.id) item.id = nextId(items);
  items.push(item);
  writeJson(files.menu, items);
  res.status(201).json(item);
}

async function updateMenu(req, res) {
  const raw = readJson(files.menu, []);
  const items = normalizeMenu(raw);
  const id = req.params.id;
  const idx = items.findIndex(it => String(it.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeJson(files.menu, items);
  res.json(items[idx]);
}

async function deleteMenu(req, res) {
  const raw = readJson(files.menu, []);
  const items = normalizeMenu(raw);
  const id = req.params.id;
  const filtered = items.filter(it => String(it.id) !== String(id));
  writeJson(files.menu, filtered);
  res.json({ ok: true });
}

// ========== Settings: Agenda bloqueo ==========
function readConfig() {
  ensureFile(files.config);
  const cfg = readJson(files.config, {});
  return (cfg && typeof cfg === 'object') ? cfg : {};
}

function writeConfig(cfg) { writeJson(files.config, cfg || {}); }

async function getBlockedEvent(req, res) {
  const cfg = readConfig();
  // Migrate legacy cfg.agenda -> cfg.event (English-only)
  let migrated = false;
  if (!cfg.event && cfg.agenda) {
    cfg.event = {
      blocked: !!(cfg.events.blocked ),
      reason: cfg.events.reason ?? '',
      blockedAt: cfg.events.blockedAt ?? null,
    };
    delete cfg.agenda;
    migrated = true;
  }
  cfg.event = cfg.event || { blocked: false, reason: '', blockedAt: null };
  if (migrated) writeConfig(cfg);
  res.json(cfg);
}

async function setBlockedEvent(req, res) {
  const cfg = readConfig();
  const now = new Date().toISOString();
  cfg.event = cfg.event || {};
  const reason = (req.body && req.body.reason) || cfg.event.reason || '';
  cfg.event.blocked = true;
  cfg.event.reason = reason;
  cfg.event.blockedAt = cfg.event.blockedAt || now;
  // Remove any legacy agenda key to avoid duplication
  if (cfg.agenda) delete cfg.agenda;
  writeConfig(cfg);
  res.json(cfg);
}

async function clearBlockedEvent(req, res) {
  const cfg = readConfig();
  cfg.event = cfg.event || {};
  cfg.event.blocked = false;
  cfg.event.reason = '';
  cfg.event.blockedAt = null;
  if (cfg.agenda) delete cfg.agenda;
  writeConfig(cfg);
  res.json(cfg);
}

module.exports = {
  // messages
  listMessages, deleteMessage,
  // gifts
  listGifts, createGift, updateGift, deleteGift,
  // agenda
  listEventsAdmin, createEventsItem, updateEventsItem, deleteEventsItem,
  // menu
  listMenus, createMenu, updateMenu, deleteMenu,
  // settings
  getBlockedEvent, setBlockedEvent, clearBlockedEvent,
};
