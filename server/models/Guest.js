const { Schema, model } = require('mongoose');

// English field names with Spanish aliases for backward compatibility
const guestSchema = new Schema({
  name: { type: String, alias: 'nombre' },
  email: { type: String, unique: true, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending', alias: 'estado' },
  companions: { type: Number, default: 0, alias: 'acompanantes' },
  specialMenu: { type: String, default: '', alias: 'menuEspecial' },
  message: { type: String, default: '', alias: 'mensaje' },
}, { timestamps: true });

module.exports = model('Guest', guestSchema);
