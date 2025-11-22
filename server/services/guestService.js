const { Guest } = require('../models');

function normalizeGuestInput(data = {}) {
  const out = { ...data };
  // Map legacy Spanish keys to canonical English ones
  if (out.acompanantes != null) out.companions = Number(out.acompanantes);
  if (out['acompañantes'] != null) out.companions = Number(out['acompañantes']);
  if (out.menuEspecial != null) out.specialMenu = out.menuEspecial;
  if (out.seleccionMenu != null) out.specialMenu = out.seleccionMenu;
  if (out.mensaje != null) out.message = out.mensaje;
  if (out.notas != null && (out.message == null || out.message === '')) out.message = out.notas;
  // Clean legacy keys to avoid unknown paths on strict schemas in future
  delete out.acompanantes; delete out['acompañantes']; delete out.menuEspecial; delete out.seleccionMenu; delete out.mensaje; delete out.notas;
  return out;
}

async function getByEmail(email) { return Guest.findOne({ email }); }
async function list() { 
  const guests = await Guest.find().sort({ createdAt: -1 }).lean();
  const items = guests.map(guest => ({
    id: guest._id.toString(),
    name: guest.name,
    email: guest.email
  }));
  return { items, nextCursor: null }; // TODO: Implement proper pagination later
}
async function create(data) { 
  const guest = await Guest.create(normalizeGuestInput(data));
  return {
    id: guest._id.toString(),
    name: guest.name,
    email: guest.email
  };
}

async function update(id, data) { 
  const guest = await Guest.findByIdAndUpdate(id, normalizeGuestInput(data), { new: true });
  if (!guest) return null;
  return {
    id: guest._id.toString(),
    name: guest.name,
    email: guest.email
  };
}

async function remove(id) { 
  await Guest.findByIdAndDelete(id);
}

module.exports = { getByEmail, list, create, update, remove };
