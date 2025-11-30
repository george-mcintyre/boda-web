// server/models/LocalizedString.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// e.g. "mixed" during migrations, "map" for normal app use
const mode = process.env.LOCALIZEDSTRING_SCHEMA_MODE || 'map';

let LocalizedString;

if (mode === 'mixed') {
  // Relaxed type: accepts string *or* object
  LocalizedString = {
    type: Schema.Types.Mixed,
    default: undefined,
  };
} else {
  // Final type: proper LocalizedString as Map<String>
  LocalizedString = {
    type: Map,
    of: String,
    default: undefined,
  };
}

module.exports = { LocalizedString };
