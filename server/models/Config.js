const { Schema, model } = require('mongoose');
const configSchema = new Schema({
  defaultLanguage: { type: String, default: 'es', alias: 'idiomaPorDefecto' },
  // Feature toggles for frontend
  eventsEnabled: { type: Boolean, default: true },
  giftsEnabled: { type: Boolean, default: true },
  guestsEnabled: { type: Boolean, default: true },
  menuEnabled: { type: Boolean, default: true },
  messagesEnabled: { type: Boolean, default: true },
  seatingEnabled: { type: Boolean, default: false },
  venuePrintToken: { type: String, default: null },
}, { timestamps: true });
module.exports = model('Config', configSchema);
