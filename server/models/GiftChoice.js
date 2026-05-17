const { Schema, model } = require('mongoose');

const giftChoiceSchema = new Schema({
  giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true },
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  date: { type: Date, default: Date.now },
  message: { type: String },
  giftFrom: { type: String },
  amount: { type: Number },
  lang: { type: String, enum: ['en', 'es', 'fr', 'de'], default: 'en' },
  stripeSessionId: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = model('GiftChoice', giftChoiceSchema);