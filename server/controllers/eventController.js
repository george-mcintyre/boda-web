const fs = require('fs');
const path = require('path');
const { Event } = require('../models');
const { localizeEvent } = require('../utils/i18n');

async function listAgenda(req, res, next) {
  try {
    const events = await Event.find({}).sort({ fecha: 1, orden: 1, createdAt: 1 }).lean();
    const items = events.map(e => localizeEvent(e, req.lang, req.defaultLang));
    res.json(items);
  } catch (e) {
    next(e);
  }
}

// ===== Simple file-backed Eventos API (used by admin UI) =====
const DATA_DIR = path.join(__dirname, '..', 'data');
const EVENTOS_FILE = path.join(DATA_DIR, 'eventos.json');
const EVENTOS_EXAMPLE = path.join(DATA_DIR, 'eventos.example.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EVENTOS_FILE)) {
    if (fs.existsSync(EVENTOS_EXAMPLE)) {
      fs.copyFileSync(EVENTOS_EXAMPLE, EVENTOS_FILE);
    } else {
      fs.writeFileSync(EVENTOS_FILE, JSON.stringify({ eventos: [] }, null, 2));
    }
  }
}

function readEventos() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(EVENTOS_FILE, 'utf8');
    const json = JSON.parse(raw);
    if (!json || typeof json !== 'object' || !Array.isArray(json.eventos)) {
      return { eventos: [] };
    }
    return { eventos: json.eventos };
  } catch (e) {
    return { eventos: [] };
  }
}

function writeEventos(payload) {
  ensureDataFile();
  const tmp = EVENTOS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
  fs.renameSync(tmp, EVENTOS_FILE);
}

async function getEventos(req, res) {
  const data = readEventos();
  res.json(data);
}

async function postEventos(req, res) {
  const body = req.body || {};
  if (!body || !Array.isArray(body.eventos)) {
    return res.status(400).json({ error: 'Invalid payload: expected { eventos: [...] }' });
  }
  try {
    writeEventos({ eventos: body.eventos });
    res.json({ ok: true, count: body.eventos.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save eventos' });
  }
}

module.exports = { listAgenda, getEventos, postEventos };
