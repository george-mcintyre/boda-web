const { Message } = require('../models');

function buildReaccionesFromUserReactions(userReactions) {
  const map = {};
  if (!userReactions) return map;
  // Accept array of {email, emoji}, Map<email, emoji>, or plain object { email: emoji }
  if (Array.isArray(userReactions)) {
    for (const it of userReactions) {
      if (!it || !it.email || !it.emoji) continue;
      if (!map[it.emoji]) map[it.emoji] = [];
      map[it.emoji].push(it.email);
    }
    return map;
  }
  const entries = userReactions instanceof Map ? Array.from(userReactions.entries()) : Object.entries(userReactions);
  for (const [email, emoji] of entries) {
    if (!emoji) continue;
    if (!map[emoji]) map[emoji] = [];
    map[emoji].push(email);
  }
  return map;
}

function sanitizeReacciones(obj) {
  // Ensure output reacciones shape: { emoji: [emails] }
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (Array.isArray(v)) out[k] = v;
  }
  return out;
}

// Public: list messages
async function list(req, res, next) {
  try {
    const items = await Message.find({}).sort({ createdAt: -1 }).lean();
    const mapped = (items || []).map(it => {
      // Prefer userReactions -> derive reacciones
      const userReactions = it.userReactions || it.reaccionesUsuarios || null;
      let reacciones;
      if (userReactions && ((userReactions instanceof Map && userReactions.size) || Object.keys(userReactions).length)) {
        reacciones = buildReaccionesFromUserReactions(userReactions);
      } else {
        reacciones = sanitizeReacciones(it.reacciones || it.reactions || {});
      }
      return { ...it, reacciones };
    });
    res.json(mapped);
  } catch (e) {
    next(e);
  }
}

// Guest: create a message
async function create(req, res, next) {
  try {
    const body = req.body || {};
    const content = body.content || body.mensaje || body.text || '';
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }
    // If authenticated as guest, use token info; otherwise allow anonymous name/email from body
    const name = (req.user && (req.user.name || req.user.nombre)) || body.name || body.nombre || 'Guest';
    const email = (req.user && req.user.email) || body.email || '';
    const item = await Message.create({ name, email, content });
    const obj = item.toObject();
    obj.reacciones = {};
    res.status(201).json(obj);
  } catch (e) { next(e); }
}

// Helper to normalize various userReactions shapes to array of {email, emoji}
function toUserReactionsArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(x => x && x.email && x.emoji);
  if (val instanceof Map) return Array.from(val.entries()).map(([email, emoji]) => ({ email, emoji })).filter(x => x.email && x.emoji);
  if (typeof val === 'object') return Object.entries(val).map(([email, emoji]) => ({ email, emoji })).filter(x => x.email && x.emoji);
  return [];
}

// Guest: set/toggle single reaction selection
async function react(req, res, next) {
  try {
    const id = req.params.id;
    const { emoji } = req.body || {};
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'emoji is required' });
    }
    const email = (req.user && req.user.email) || '';
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const doc = await Message.findById(id);
    if (!doc) return res.status(404).json({ error: 'Message not found' });

    // Ensure structures exist
    if (!doc.reactions) doc.reactions = new Map();

    // Normalize userReactions to array form
    let ura = toUserReactionsArray(doc.userReactions);

    // Migrate from legacy reactions map if user has no entry yet
    const hasEntry = ura.some(x => String(x.email) === String(email));
    if (!hasEntry && doc.reactions && doc.reactions instanceof Map) {
      for (const [emo, list] of doc.reactions.entries()) {
        if (Array.isArray(list) && list.includes(email)) {
          ura.push({ email, emoji: emo });
          break;
        }
      }
    }

    const idx = ura.findIndex(x => String(x.email) === String(email));
    let newSelection = null;
    if (idx !== -1) {
      if (ura[idx].emoji === emoji) {
        // toggle off
        ura.splice(idx, 1);
        newSelection = null;
      } else {
        ura[idx].emoji = emoji;
        newSelection = emoji;
      }
    } else {
      ura.push({ email, emoji });
      newSelection = emoji;
    }

    // Assign back to document
    doc.userReactions = ura;

    // Sync legacy reactions map: remove email from all, then add to selected
    if (!(doc.reactions instanceof Map)) {
      // If reactions came as plain object from lean or similar, convert to Map
      const tmp = new Map();
      for (const [k, v] of Object.entries(doc.reactions || {})) tmp.set(k, Array.isArray(v) ? v : []);
      doc.reactions = tmp;
    }
    for (const [emo, list] of doc.reactions.entries()) {
      if (Array.isArray(list)) {
        const filtered = list.filter(e => String(e) !== String(email));
        doc.reactions.set(emo, filtered);
      }
    }
    if (newSelection) {
      const arr = Array.isArray(doc.reactions.get(newSelection)) ? doc.reactions.get(newSelection) : [];
      if (!arr.includes(email)) arr.push(email);
      doc.reactions.set(newSelection, arr);
    }

    await doc.save();

    const out = doc.toObject();
    const reacciones = buildReaccionesFromUserReactions(out.userReactions || out.reaccionesUsuarios) || sanitizeReacciones(out.reacciones || out.reactions || {});
    res.json({ ok: true, reacciones });
  } catch (e) { next(e); }
}

// Admin: delete a message (auth applied in route)
async function remove(req, res, next) {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, react, remove };
