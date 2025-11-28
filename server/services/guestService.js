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
  const guests = await Guest.find().sort({ name: 1 }).lean();
  const items = guests.map(guest => ({
    id: guest._id.toString(),
    name: guest.name,
    email: guest.email,
    partySize: 1 + (guest.partyMembers ? guest.partyMembers.length : 0), // 1 for primary guest + party members
    partyMembers: guest.partyMembers || []
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
    email: guest.email,
    adult: guest.adult
  };
}

async function remove(id) { 
  await Guest.findByIdAndDelete(id);
}

async function bulkCreate(guestsData) {
  const results = {
    success: [],
    errors: [],
    skipped: []
  };

  for (const data of guestsData) {
    try {
      // Skip empty rows
      if (!data.name || data.name.trim() === '') {
        results.skipped.push({ data, reason: 'Empty name' });
        continue;
      }

      // Check if guest already exists (only if email is provided)
      if (data.email && data.email.trim() !== '') {
        const existing = await Guest.findOne({ email: data.email });
        if (existing) {
          results.skipped.push({ data, reason: 'Email already exists' });
          continue;
        }
      }

      // Prepare guest data with party members
      const guestInput = {
        name: data.name.trim(),
        email: data.email ? data.email.trim() : '',
        partyMembers: data.partyMembers || []
      };

      // Create the guest with party members
      const guestDoc = await Guest.create(normalizeGuestInput(guestInput));
      
      results.success.push({
        id: guestDoc._id.toString(),
        name: guestDoc.name,
        email: guestDoc.email
      });
    } catch (error) {
      results.errors.push({ 
        data, 
        error: error.message 
      });
    }
  }

  return results;
}

module.exports = { getByEmail, list, create, update, remove, bulkCreate };
