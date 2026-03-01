const { Schema, model } = require('mongoose');

const fixedGuestSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, required: true }
}, { _id: false });

const tableSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  name: { type: String },
  capacity: { type: Number, required: true, default: 10 },
  isHeadTable: { type: Boolean, default: false },
  fixedGuests: [fixedGuestSchema]
}, { timestamps: true });

module.exports = model('Table', tableSchema);
