const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocalizedString = {
  type: Map,
  of: String,
  default: () => new Map(),
};


// models/common/localizedString.js FOR MIGRATION ONLY!!!
// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const LocalizedString = {
//   type: Schema.Types.Mixed,   // allows string OR object
//   default: undefined,
// };

module.exports = { LocalizedString };
