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
async function listMenus(req, res) {
  ensureFile(files.menu, files.menuExample);
  const items = readJson(files.menu, []);
  res.json(withIds(items));
}

async function createMenu(req, res) {
  const items = readJson(files.menu, []);
  const item = { ...req.body, id: nextId(items) };
  items.push(item);
  writeJson(files.menu, items);
  res.status(201).json(item);
}

async function updateMenu(req, res) {
  const items = readJson(files.menu, []);
  const id = req.params.id;
  const idx = items.findIndex(it => String(it.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeJson(files.menu, items);
  res.json(items[idx]);
}

async function deleteMenu(req, res) {
  const items = readJson(files.menu, []);
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

async function getAgendaBloqueo(req, res) {
  const cfg = readConfig();
  res.json(cfg);
}

async function setAgendaBloqueo(req, res) {
  const cfg = readConfig();
  const now = new Date().toISOString();
  cfg.agenda = cfg.agenda || {};
  cfg.agenda.bloqueada = true;
  cfg.agenda.motivoBloqueo = req.body && req.body.motivoBloqueo || cfg.agenda.motivoBloqueo || '';
  cfg.agenda.fechaBloqueo = cfg.agenda.fechaBloqueo || now;
  writeConfig(cfg);
  res.json(cfg);
}

async function clearAgendaBloqueo(req, res) {
  const cfg = readConfig();
  cfg.agenda = cfg.agenda || {};
  cfg.agenda.bloqueada = false;
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
  listMenus, createMenu, updateMenu, deleteMenu,
  // settings
  getAgendaBloqueo, setAgendaBloqueo, clearAgendaBloqueo,
};
