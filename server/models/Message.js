const { Schema, model } = require('mongoose');
// English field names with Spanish aliases for backward compatibility
const messageSchema = new Schema({
  name: { type: String, alias: 'nombre' },
  email: String,
  content: { type: String, alias: 'contenido' },
  // Map of emoji -> array of emails who reacted
  reactions: { type: Map, of: [String], alias: 'reacciones', default: {} },
}, { timestamps: true });
module.exports = model('Message', messageSchema);
