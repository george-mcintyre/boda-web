const { Schema, model } = require('mongoose');

// Party member schema for individual party members (not including primary guest)
const partyMemberSchema = new Schema({
  id: { type: String }, // Optional ID for existing members, null for new ones
  name: { type: String, required: true },
  adult: { type: Boolean, default: true }
}, { _id: false });

// Canonical English field names; avoid aliases to prevent ambiguity
const guestSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  adult: { type: Boolean, default: true },
  partyMembers: [partyMemberSchema],
  specialMenu: { type: String, default: '' }
}, { timestamps: true });

module.exports = model('Guest', guestSchema);
