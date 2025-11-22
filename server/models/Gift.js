const { Schema, model } = require('mongoose');

const giftSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, enum: [25, 50, 100, 200, 500] },
  available: { type: Number, required: true, min: 0 },
  image: { type: Number, required: true, min: 1, max: 30 },
  enabled: { type: Boolean, default: true } // Hidden field for soft delete
}, { timestamps: true });

module.exports = model('Gift', giftSchema);