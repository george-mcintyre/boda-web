const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

const ALLOWED_AMOUNTS = [25, 50, 100, 200, 250, 500];

const giftSchema = new Schema({
  type: {
    type: String,
    enum: ['cash', 'cube', 'figurine'],
    default: 'cash',
    required: true,
    index: true,
  },
  title: { ...LocalizedString, required: true },
  description: { ...LocalizedString, required: true },
  amount: { type: Number, enum: ALLOWED_AMOUNTS },
  amountOptions: {
    type: [{ type: Number, enum: ALLOWED_AMOUNTS }],
    default: undefined,
  },
  available: { type: Number, required: true, min: 0 },
  image: {
    type: Schema.Types.ObjectId,
    ref: 'GiftImage',
  },
  cubeId: { type: Number, min: 1, max: 38 },
  figurineId: { type: Number, min: 1, max: 4 },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

giftSchema.path('amount').validate(function (value) {
  if (this.type === 'cash') return typeof value === 'number';
  return value === undefined || value === null;
}, '`amount` is required for cash gifts and must be absent for non-cash gifts');

giftSchema.path('amountOptions').validate(function (value) {
  if (this.type === 'cube' || this.type === 'figurine') {
    return Array.isArray(value) && value.length > 0;
  }
  return value === undefined || value === null || value.length === 0;
}, '`amountOptions` is required for cube and figurine gifts and must be empty for cash gifts');

giftSchema.path('cubeId').validate(function (value) {
  if (this.type === 'cube') {
    return Number.isInteger(value) && value >= 1 && value <= 38;
  }
  return value === undefined || value === null;
}, '`cubeId` is required for cube gifts (1..38) and must be absent for non-cube gifts');

giftSchema.path('figurineId').validate(function (value) {
  if (this.type === 'figurine') {
    return Number.isInteger(value) && value >= 1 && value <= 4;
  }
  return value === undefined || value === null;
}, '`figurineId` is required for figurine gifts (1..4) and must be absent for non-figurine gifts');

giftSchema.index(
  { type: 1, cubeId: 1 },
  { unique: true, partialFilterExpression: { type: 'cube' } }
);

giftSchema.index(
  { type: 1, figurineId: 1 },
  { unique: true, partialFilterExpression: { type: 'figurine' } }
);

module.exports = model('Gift', giftSchema);
