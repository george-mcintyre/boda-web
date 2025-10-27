const fs = require('fs');
const path = require('path');
const { Message } = require('../models');

// Data dir and helpers
const DATA_DIR = path.join(__dirname, '..', 'data');
const files = {
  regalos: path.join(DATA_DIR, 'regalos.json'),
  regalosExample: path.join(DATA_DIR, 'regalos.example.json'),
  agenda: path.join(DATA_DIR, 'agenda.json'),
  agendaExample: path.join(DATA_DIR, 'agenda.example.json'),
  menu: path.join(DATA_DIR, 'menu.json'),
  menuExample: path.join(DATA_DIR, 'menu.example.json'),
  config: path.join(DATA_DIR, 'config.json'),
  configExample: path.join(DATA_DIR, 'config.example.json'),
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
  ensureFile(files.regalos, files.regalosExample);
  const items = readJson(files.regalos, []);
  res.json(withIds(items));
}

async function createGift(req, res) {
  const items = readJson(files.regalos, []);
  const item = { ...req.body, id: nextId(items) };
  items.push(item);
  writeJson(files.regalos, items);
  res.status(201).json(item);
}

async function updateGift(req, res) {
  const items = readJson(files.regalos, []);
  const id = req.params.id;
  const idx = items.findIndex(it => String(it.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Gift not found' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeJson(files.regalos, items);
  res.json(items[idx]);
}

async function deleteGift(req, res) {
  const items = readJson(files.regalos, []);
  const id = req.params.id;
  const filtered = items.filter(it => String(it.id) !== String(id));
  writeJson(files.regalos, filtered);
  res.json({ ok: true });
}

// ========== Agenda (file-backed CRUD) ==========
async function listAgendaAdmin(req, res) {
  ensureFile(files.agenda, files.agendaExample);
  const items = readJson(files.agenda, []);
  res.json(withIds(items));
}

async function createAgendaItem(req, res) {
  const items = readJson(files.agenda, []);
  const item = { ...req.body, id: nextId(items) };
  items.push(item);
  writeJson(files.agenda, items);
  res.status(201).json(item);
}

async function updateAgendaItem(req, res) {
  const items = readJson(files.agenda, []);
  const id = req.params.id;
  const idx = items.findIndex(it => String(it.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Agenda item not found' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeJson(files.agenda, items);
  res.json(items[idx]);
}

async function deleteAgendaItem(req, res) {
  const items = readJson(files.agenda, []);
  const id = req.params.id;
  const filtered = items.filter(it => String(it.id) !== String(id));
  writeJson(files.agenda, filtered);
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
  ensureFile(files.menu, files.menuExample);
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
  ensureFile(files.config, files.configExample);
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
      blocked: !!(cfg.agenda.blocked ?? cfg.agenda.bloqueada),
      reason: cfg.agenda.reason ?? cfg.agenda.motivoBloqueo ?? '',
      blockedAt: cfg.agenda.blockedAt ?? cfg.agenda.fechaBloqueo ?? null,
    };
    delete cfg.agenda;
    migrated = true;
  }
  cfg.event = cfg.event || { blocked: false, reason: '', blockedAt: null };
  if (migrated) writeConfig(cfg);
  res.json(cfg);
}

async function setAgendaBloqueo(req, res) {
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

async function clearAgendaBloqueo(req, res) {
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
  listAgendaAdmin, createAgendaItem, updateAgendaItem, deleteAgendaItem,
  // menu
  listMenus, createMenu: createMenu, updateMenu, deleteMenu,
  // settings
  getBlockedEvent, setBlockedEvent: setAgendaBloqueo, clearBlockedEvent: clearAgendaBloqueo,
};
