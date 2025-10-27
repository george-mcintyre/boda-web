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
async function list() { return Guest.find().sort({ createdAt: -1 }); }
async function create(data) { return Guest.create(normalizeGuestInput(data)); }
async function update(id, data) { return Guest.findByIdAndUpdate(id, normalizeGuestInput(data), { new: true }); }
async function remove(id) { return Guest.findByIdAndDelete(id); }

module.exports = { getByEmail, list, create, update, remove };
