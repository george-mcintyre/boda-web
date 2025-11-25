const { Schema, model } = require('mongoose');
const commentSchema = new Schema({
  name: String,
  contenido: String,
}, { timestamps: true });
module.exports = model('Comment', commentSchema);
