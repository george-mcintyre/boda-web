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

module.exports = { listAgenda };
