const { Schema, model } = require('mongoose');

// Party member schema for individual party members (not including primary guest)
const partyMemberSchema = new Schema({
  id: { type: String }, // Optional ID for existing members, null for new ones
  name: { type: String, required: true },
  adult: { type: Boolean, default: true }
}, { _id: false });

// Canonical English field names; avoid aliases to prevent ambiguity
const guestSchema = new Schema({
  name: { type: String, alias: 'nombre' },
  email: { type: String, unique: true, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending', alias: 'estado' },
  companions: { type: Number, default: 0 }, // Legacy field, maintained for backward compatibility
  partyMembers: [partyMemberSchema], // New field for individual party members
  specialMenu: { type: String, default: '' },
  message: { type: String, default: '' },
}, { timestamps: true });

module.exports = model('Guest', guestSchema);
