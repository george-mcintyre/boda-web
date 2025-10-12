require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const models = require('../src/models');

function localize(val) {
  if (val == null) return undefined;
  if (typeof val === 'string') return { en: val };
  if (typeof val === 'object') return val; // assume already-localized map
  return undefined;
}

function toMenuOptions(src) {
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
}

(async function migrate() {
  try {
    const uri = process.env.MONGODB_URI; const db = process.env.MONGODB_DB || 'boda-web';
    if (!uri) throw new Error('MONGODB_URI not set');
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri, { dbName: db });
    console.log('✅ Connected');

    console.log('🗑️ Clearing existing collections...');
    await Promise.all(Object.values(models).map(m => m.deleteMany({})));

    const dataDir = path.join(__dirname, '../data');
    const readJson = f => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

    // Load from *.example.json files; support both eventos and agenda naming
    if (fs.existsSync(path.join(dataDir, 'invitados.example.json'))) await models.Guest.insertMany(readJson('invitados.example.json'));
    if (fs.existsSync(path.join(dataDir, 'admin.example.json'))) await models.Admin.insertMany(readJson('admin.example.json'));
    // Transform to i18n-aware documents when inserting (English fields with Spanish fallbacks)
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

    const eventCandidates = [];
    const load = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
    if (fs.existsSync(path.join(dataDir, 'events.example.json'))) {
      const data = load('events.example.json');
      if (Array.isArray(data)) eventCandidates.push(...data);
      else if (Array.isArray(data?.events)) eventCandidates.push(...data.events);
    }
    if (fs.existsSync(path.join(dataDir, 'eventos.example.json'))) {
      const data = load('eventos.example.json');
      if (Array.isArray(data)) eventCandidates.push(...data);
      else if (Array.isArray(data?.eventos)) eventCandidates.push(...data.eventos);
    }
    if (fs.existsSync(path.join(dataDir, 'agenda.example.json'))) {
      const data = load('agenda.example.json');
      if (Array.isArray(data)) eventCandidates.push(...data);
      else if (Array.isArray(data?.agenda)) eventCandidates.push(...data.agenda);
    }
    if (eventCandidates.length) {
      await models.Event.insertMany(eventCandidates.map(wrapEvent));
    }


    if (fs.existsSync(path.join(dataDir, 'mensajes.example.json'))) await models.Message.insertMany(readJson('mensajes.example.json'));
    if (fs.existsSync(path.join(dataDir, 'comentarios.example.json'))) await models.Comment.insertMany(readJson('comentarios.example.json'));

    if (fs.existsSync(path.join(dataDir, 'menu.example.json'))) {
      const src = readJson('menu.example.json');
      await models.Menu.create({
        options: toMenuOptions(src),
      });
    }
    if (fs.existsSync(path.join(dataDir, 'cash-gift-cards.example.json'))) {
      const raw = readJson('cash-gift-cards.example.json');
      const seen = new Set();
      const items = (Array.isArray(raw) ? raw : [])
        .filter(x => x && x.code)
        .filter(x => {
          const k = String(x.code);
          if (seen.has(k)) return false;
          seen.add(k); return true;
        });
      if (items.length) await models.CashGiftCard.insertMany(items);
    }
    if (fs.existsSync(path.join(dataDir, 'config.example.json'))) await models.Config.create(readJson('config.example.json'));

    console.log('🎉 Migration complete');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 DB connection closed');
    process.exit(0);
  }
})();
