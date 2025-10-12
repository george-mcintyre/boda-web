const { Schema, model } = require('mongoose');
const messageSchema = new Schema({
  nombre: String,
  email: String,
  contenido: String,
}, { timestamps: true });
module.exports = model('Message', messageSchema);
