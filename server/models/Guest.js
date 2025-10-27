const { Schema, model } = require('mongoose');

// Canonical English field names; avoid aliases to prevent ambiguity
const guestSchema = new Schema({
  name: { type: String, alias: 'nombre' },
  email: { type: String, unique: true, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending', alias: 'estado' },
  companions: { type: Number, default: 0 },
  specialMenu: { type: String, default: '' },
  message: { type: String, default: '' },
}, { timestamps: true });

module.exports = model('Guest', guestSchema);
