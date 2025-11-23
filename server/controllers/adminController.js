const fs = require('fs');
const path = require('path');
const { Message, Menu, Config, CashGiftCard, Event, Gift, GiftChoice } = require('../models');
const { getAvailableGiftCardImages, isValidImageNumber } = require('../utils/imageUtils');

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



// ========== Gifts (MongoDB-backed) ==========
async function listGifts(req, res, next) {
  try {
    const gifts = await Gift.find({ enabled: true }).sort({ createdAt: -1 }).lean();
    
    // Get purchase counts for each gift
    const giftIds = gifts.map(gift => gift._id);
    const purchaseCounts = await GiftChoice.aggregate([
      { $match: { giftId: { $in: giftIds } } },
      { $group: { _id: '$giftId', count: { $sum: 1 } } }
    ]);
    
    // Create a map of giftId to purchase count
    const purchaseCountMap = {};
    purchaseCounts.forEach(item => {
      purchaseCountMap[item._id.toString()] = item.count;
    });
    
    const items = gifts.map(gift => ({
      id: gift._id.toString(),
      name: gift.title, // Using 'name' as per requirements
      title: gift.title,
      description: gift.description,
      amount: gift.amount,
      available: gift.available,
      purchased: purchaseCountMap[gift._id.toString()] || 0,
      image: gift.image,
      imageUrl: `/assets/images/gift-cards/image_${String(gift.image).padStart(2, '0')}.jpg`,
      priceDisplay: `€${gift.amount}`
    }));
    res.json(items);
  } catch (e) { next(e); }
}

async function createGift(req, res, next) {
  try {
    const { name, title, description, amount, available, image } = req.body;
    
    // Validate required fields
    if (!title && !name) {
      return res.status(400).json({ error: 'Name/title is required' });
    }
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    if (!amount || ![25, 50, 100, 200, 500].includes(parseInt(amount))) {
      return res.status(400).json({ error: 'Valid amount (€25, €50, €100, €200, or €500) is required' });
    }
    
    if (available === undefined || available < 0) {
      return res.status(400).json({ error: 'Valid number available is required' });
    }
    
    if (!image || !isValidImageNumber(parseInt(image))) {
      return res.status(400).json({ error: 'Valid image number (1-30) is required' });
    }
    
    const gift = await Gift.create({ 
      title: title || name, 
      description, 
      amount: parseInt(amount), 
      available: parseInt(available), 
      image: parseInt(image) 
    });
    res.status(201).json({
      id: gift._id.toString(),
      name: gift.title,
      title: gift.title,
      description: gift.description,
      amount: gift.amount,
      available: gift.available,
      purchased: 0,
      image: gift.image,
      imageUrl: `/assets/images/gift-cards/image_${String(gift.image).padStart(2, '0')}.jpg`,
      priceDisplay: `€${gift.amount}`
    });
  } catch (e) { next(e); }
}

async function updateGift(req, res, next) {
  try {
    const { id } = req.params;
    const { name, title, description, amount, available, image } = req.body;
    
    // Validate image number if provided
    if (image && !isValidImageNumber(parseInt(image))) {
      return res.status(400).json({ error: 'Valid image number (1-30) is required' });
    }
    
    // Validate amount if provided
    if (amount && ![25, 50, 100, 200, 500].includes(parseInt(amount))) {
      return res.status(400).json({ error: 'Valid amount (€25, €50, €100, €200, or €500) is required' });
    }
    
    const gift = await Gift.findByIdAndUpdate(id, {
      ...(title || name) && { title: title || name },
      ...(description && { description }),
      ...(amount && { amount: parseInt(amount) }),
      ...(available !== undefined && { available: parseInt(available) }),
      ...(image && { image: parseInt(image) })
    }, { new: true });

    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    
    // Get updated purchase count
    const purchaseCount = await GiftChoice.countDocuments({ giftId: gift._id });

    res.json({
      id: gift._id.toString(),
      name: gift.title,
      title: gift.title,
      description: gift.description,
      amount: gift.amount,
      available: gift.available,
      purchased: purchaseCount,
      image: gift.image,
      imageUrl: `/assets/images/gift-cards/image_${String(gift.image).padStart(2, '0')}.jpg`,
      priceDisplay: `€${gift.amount}`
    });
  } catch (e) { next(e); }
}

async function deleteGift(req, res, next) {
  try {
    const { id } = req.params;
    // Soft delete by setting enabled to false
    const gift = await Gift.findByIdAndUpdate(id, { enabled: false }, { new: true });
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

async function getGiftChoices(req, res, next) {
  try {
    const giftChoices = await GiftChoice.find({})
      .populate('giftId', 'title amount')
      .populate('guestId', 'nombre name email')
      .sort({ date: -1 })
      .lean();

    const items = giftChoices.map(choice => ({
      guestId: choice.guestId._id.toString(),
      guestName: choice.guestId.nombre || choice.guestId.name || choice.guestId.email,
      giftId: choice.giftId._id.toString(),
      amount: choice.giftId.amount,
      date: choice.date.toISOString(),
      message: choice.message
    }));

    res.json(items);
  } catch (e) { next(e); }
}

async function getGiftCardImages(req, res, next) {
  try {
    const images = getAvailableGiftCardImages();
    res.json(images);
  } catch (e) { next(e); }
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

// ========== Settings / Feature Toggles ==========
async function getSettings(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    res.json({
      eventsEnabled: cfg.eventsEnabled,
      guestsEnabled: cfg.guestsEnabled,
      menuEnabled: cfg.menuEnabled,
      messagesEnabled: cfg.messagesEnabled,
      giftsEnabled: cfg.giftsEnabled
    });
  } catch (e) { next(e); }
}

async function updateSettings(req, res, next) {
  try {
    const { eventsEnabled, guestsEnabled, menuEnabled, messagesEnabled, giftsEnabled } = req.body;
    
    const cfg = await getConfigDoc();
    await Config.updateOne({ _id: cfg._id }, {
      $set: {
        ...(eventsEnabled !== undefined && { eventsEnabled }),
        ...(guestsEnabled !== undefined && { guestsEnabled }),
        ...(menuEnabled !== undefined && { menuEnabled }),
        ...(messagesEnabled !== undefined && { messagesEnabled }),
        ...(giftsEnabled !== undefined && { giftsEnabled })
      }
    });

    // Return updated settings
    const updatedCfg = await Config.findById(cfg._id);
    res.json({
      eventsEnabled: updatedCfg.eventsEnabled,
      guestsEnabled: updatedCfg.guestsEnabled,
      menuEnabled: updatedCfg.menuEnabled,
      messagesEnabled: updatedCfg.messagesEnabled,
      giftsEnabled: updatedCfg.giftsEnabled
    });
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
  // gifts (DB-backed)
  listGifts, createGift, updateGift, deleteGift, getGiftChoices, getGiftCardImages,
  // agenda (DB-backed)
  listEventsAdmin, createEventsItem, updateEventsItem, deleteEventsItem,
  // menu (DB-backed)
  listMenus, createMenu, updateMenu, deleteMenu,
  // settings (DB-backed)
  getBlockedEvent, setBlockedEvent, clearBlockedEvent,
  getSettings, updateSettings,
  // cash gift cards (DB-backed) - Legacy, to be removed in Phase 8
  listCashGiftCards, createCashGiftCard, updateCashGiftCard, deleteCashGiftCard,
};
