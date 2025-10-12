const { Schema, model } = require('mongoose');
const cashGiftCardSchema = new Schema({
  code: { type: String, unique: true },
  amount: Number,
  used: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = model('CashGiftCard', cashGiftCardSchema);
