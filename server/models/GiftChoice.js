const { Schema, model } = require('mongoose');

const giftChoiceSchema = new Schema({
  giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true },
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  date: { type: Date, default: Date.now },
  message: { type: String },
  giftFrom: { type: String },
  amount: { type: Number },
  lang: { type: String, enum: ['en', 'es', 'fr', 'de'], default: 'en' },
  paymentMethod: { type: String, enum: ['stripe', 'cash'], default: 'stripe', required: true, index: true },
  stripeSessionId: { type: String, unique: true, sparse: true, default: null },
  anonymous: { type: Boolean, default: false, index: true },
  anonymousBuyerEmail: { type: String, default: null },
  createdByAdminId: { type: Schema.Types.ObjectId, ref: 'Admin', default: null }
}, { timestamps: true });

module.exports = model('GiftChoice', giftChoiceSchema);