const fs = require('fs');
const path = require('path');
const { Event } = require('../models');
const { localizeEvent } = require('../utils/i18n');

async function listEvents(req, res, next) {
  try {
    const events = await Event.find({}).sort({ date: 1, order: 1, createdAt: 1 }).lean();
    const items = events.map(e => localizeEvent(e, req.lang, req.defaultLang));
    res.json(items);
  } catch (e) {
    next(e);
  }
}

// ===== Simple file-backed Events API (used by admin UI) =====
const DATA_DIR = path.join(__dirname, '..', 'data');
const EVENTOS_FILE = path.join(DATA_DIR, 'events.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EVENTOS_FILE)) {
    fs.writeFileSync(EVENTOS_FILE, JSON.stringify({ events: [] }, null, 2));
  }
}

function readEventos() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(EVENTOS_FILE, 'utf8');
    const json = JSON.parse(raw);
    if (!json || typeof json !== 'object' || !Array.isArray(json.events)) {
      return { events: [] };
    }
    return { events: json.events };
  } catch (e) {
    return { events: [] };
  }
}

function writeEventos(payload) {
  ensureDataFile();
  const tmp = EVENTOS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
  fs.renameSync(tmp, EVENTOS_FILE);
}

async function getEvents(req, res) {
  const data = readEventos();
  res.json(data);
}

async function postEvents(req, res) {
  const body = req.body || {};
  if (!body || !Array.isArray(body.events)) {
    return res.status(400).json({ error: 'Invalid payload: expected { events: [...] }' });
  }
  try {
    writeEventos({ events: body.events });
    res.json({ ok: true, count: body.events.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save events' });
  }
}

module.exports = { listEvents: listEvents, getEvents, postEvents };
