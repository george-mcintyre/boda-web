const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

const giftSchema = new Schema({
  title: { ...LocalizedString, required: true },
  description: { ...LocalizedString, required: true },
  amount: { type: Number, required: true, enum: [25, 50, 100, 200, 500] },
  available: { type: Number, required: true, min: 0 },
  image: { 
    type: Schema.Types.ObjectId,                      // Reference to GiftImage model
    ref: 'GiftImage'                                  // Reference to GiftImage collection
  },
  enabled: { type: Boolean, default: true } // Hidden field for soft delete
}, { timestamps: true });

module.exports = model('Gift', giftSchema);