const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const models = require('../models');
const { NODE_ENV } = require('../config/env');

async function ensureCollectionsAndIndexes() {
  const conn = mongoose.connection;
  if (!conn || conn.readyState !== 1) {
    throw new Error('MongoDB is not connected');
  }

  const desired = {
    Admin: models.Admin,
    Guest: models.Guest,
    Event: models.Event,
    Message: models.Message,
    Comment: models.Comment,
    Menu: models.Menu,
    CashGiftCard: models.CashGiftCard,
    Config: models.Config,
  };

  // Map model names to collection names as Mongoose would create them
  // Using Model.collection.name is reliable after initialization
  const desiredCollections = Object.entries(desired).map(([name, Model]) => ({
    modelName: name,
    collectionName: Model.collection.name,
    Model,
  }));

  const existing = await conn.db.listCollections({}, { nameOnly: true }).toArray();
  const existingNames = new Set(existing.map(c => c.name));

  const created = [];
  for (const { collectionName } of desiredCollections) {
    if (!existingNames.has(collectionName)) {
      await conn.db.createCollection(collectionName);
      created.push(collectionName);
    }
  }

  // Ensure indexes for models that declare unique fields etc.
  // createIndexes() will no-op if already present
  await Promise.all(Object.values(desired).map(Model => Model.createIndexes().catch(() => {})));

  // Small console report
  if (created.length) {
    console.log('[DB] Created missing collections:', created.join(', '));
  } else {
    console.log('[DB] All required collections already exist');
  }

  // Return a diagnostic summary
  return {
    created,
    existing: Array.from(existingNames),
    required: desiredCollections.map(d => d.collectionName),
  };
}

async function seedExampleDataIfEmpty() {
  if (NODE_ENV === 'production') {
    console.log('[DB] Skipping example data seeding in production');
    return { seeded: false, reason: 'production' };
  }

  const dataDir = path.join(__dirname, '../data');
  const exists = fname => fs.existsSync(path.join(dataDir, fname));
  const read = fname => JSON.parse(fs.readFileSync(path.join(dataDir, fname), 'utf8'));

  const localize = (val) => {
    if (val == null) return undefined;
    if (typeof val === 'string') return { en: val };
    if (typeof val === 'object') return val;
    return undefined;
  };

  const toMenuOptions = (src) => {
    if (Array.isArray(src?.options)) return src.options.map(o => ({ name: localize(o.name), description: localize(o.description) }));
    if (Array.isArray(src?.opciones)) return src.opciones.map(o => ({ name: localize(o.nombre), description: localize(o.descripcion) }));
    const catsEs = ['entrantes', 'principales', 'postres', 'bebidas'];
    const catsEn = ['starters', 'mains', 'desserts', 'drinks'];
    const collected = [];
    for (const c of [...catsEn, ...catsEs]) {
      if (Array.isArray(src?.[c])) {
        for (const item of src[c]) {
          const name = item.name ?? item.nombre;
          const description = item.description ?? item.descripcion;
          collected.push({ name: localize(name), description: localize(description) });
        }
      }
    }
    return collected;
  };

  const actions = [];

  const counts = await Promise.all([
    models.Admin.countDocuments(),
    models.Guest.countDocuments(),
    models.Event.countDocuments(),
    models.Message.countDocuments(),
    models.Comment.countDocuments(),
    models.Menu.countDocuments(),
    models.CashGiftCard.countDocuments(),
    models.Config.countDocuments(),
  ]);

  const [cAdmin, cGuest, cEvent, cMsg, cCom, cMenu, cCard, cCfg] = counts;

  if (cAdmin === 0 && exists('admin.example.json')) {
    await models.Admin.insertMany(read('admin.example.json'));
    actions.push('Admin');
  }
  if (cGuest === 0 && exists('invitados.example.json')) {
    await models.Guest.insertMany(read('invitados.example.json'));
    actions.push('Guest');
  }
  if (cEvent === 0) {
    const wrapEvent = (e) => ({
      date: e.date ? new Date(e.date) : (e.fecha ? new Date(e.fecha) : undefined),
      time: e.time ?? e.hora,
      day: localize(e.day ?? e.dia),
      title: localize(e.title ?? e.titulo),
      description: localize(e.description ?? e.descripcion),
      venue: localize(e.venue ?? e.lugar),
      address: localize(e.address ?? e.direccion),
      order: e.order ?? e.orden,
      location: e.location ?? e.ubicacion,
    });
    const candidates = [];
    if (exists('events.example.json')) {
      const data = read('events.example.json');
      if (Array.isArray(data)) candidates.push(...data);
      else if (Array.isArray(data?.events)) candidates.push(...data.events);
    }
    if (exists('eventos.example.json')) {
      const data = read('eventos.example.json');
      if (Array.isArray(data)) candidates.push(...data);
      else if (Array.isArray(data?.eventos)) candidates.push(...data.eventos);
    }
    if (exists('agenda.example.json')) {
      const data = read('agenda.example.json');
      if (Array.isArray(data)) candidates.push(...data);
      else if (Array.isArray(data?.agenda)) candidates.push(...data.agenda);
    }
    if (candidates.length) {
      const mapped = candidates.map(wrapEvent);
      await models.Event.insertMany(mapped);
      actions.push('Event');
    }
  }
  if (cMsg === 0 && exists('mensajes.example.json')) {
    await models.Message.insertMany(read('mensajes.example.json'));
    actions.push('Message');
  }
  if (cCom === 0 && exists('comentarios.example.json')) {
    await models.Comment.insertMany(read('comentarios.example.json'));
    actions.push('Comment');
  }
  if (cMenu === 0 && exists('menu.example.json')) {
    const src = read('menu.example.json');
    const mapped = {
      options: toMenuOptions(src),
    };
    await models.Menu.create(mapped);
    actions.push('Menu');
  }
  if (cCard === 0 && exists('cash-gift-cards.example.json')) {
    const raw = read('cash-gift-cards.example.json');
    const seen = new Set();
    const items = (Array.isArray(raw) ? raw : [])
      .filter(x => x && x.code)
      .filter(x => {
        const k = String(x.code);
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
    if (items.length) {
      await models.CashGiftCard.insertMany(items);
      actions.push('CashGiftCard');
    }
  }
  if (cCfg === 0 && exists('config.example.json')) {
    await models.Config.create(read('config.example.json'));
    actions.push('Config');
  }

  if (actions.length) {
    console.log('[DB] Seeded example data for:', actions.join(', '));
    return { seeded: true, collections: actions };
  }
  console.log('[DB] No example data seeding needed');
  return { seeded: false };
}

module.exports = { ensureCollectionsAndIndexes, seedExampleDataIfEmpty };
