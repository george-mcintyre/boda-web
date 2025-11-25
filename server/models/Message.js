const { Schema, model } = require('mongoose');
// English field names with Spanish aliases for backward compatibility
const userReactionSchema = new Schema({
  email: { type: String, required: true },
  emoji: { type: String, required: true },
}, { _id: false });

const messageSchema = new Schema({
  name: { type: String, required: true },
  email: String,
  content: { type: String, alias: 'contenido' },
  // Legacy: Map of emoji -> array of emails who reacted (kept for backward compatibility). Keys are emoji (safe).
  reactions: { type: Map, of: [String], alias: 'reacciones', default: {} },
  // New: Single selection per user stored as array to avoid '.' in map keys (emails contain dots)
  userReactions: { type: [userReactionSchema], alias: 'reaccionesUsuarios', default: [] },
}, { timestamps: true });
module.exports = model('Message', messageSchema);
