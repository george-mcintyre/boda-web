const { Schema, model } = require('mongoose');

const giftChoiceSchema = new Schema({
  giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true },
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  date: { type: Date, default: Date.now },
  message: { type: String },
  amount: { type: Number },
  stripeSessionId: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = model('GiftChoice', giftChoiceSchema);