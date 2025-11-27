const { Schema, model } = require('mongoose');
const userReactionSchema = new Schema({
  email: { type: String, required: true },
  emoji: { type: String, required: true },
}, { _id: false });

const messageSchema = new Schema({
  name: { type: String, required: true },
  email: String,
  content: { type: String },
  // Single selection per user
  userReactions: { type: [userReactionSchema], default: [] },
}, { timestamps: true });
module.exports = model('Message', messageSchema);
