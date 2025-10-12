const { Schema, model } = require('mongoose');
const configSchema = new Schema({
  defaultLanguage: { type: String, default: 'es', alias: 'idiomaPorDefecto' },
  otherOptions: { type: Schema.Types.Mixed, alias: 'otrasOpciones' },
}, { timestamps: true });
module.exports = model('Config', configSchema);
