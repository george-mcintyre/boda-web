const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

const courseSchema = new Schema({
  course: { 
    type: String, 
    enum: ['welcome_cocktails', 'starter', 'main', 'dessert', 'late_night_snacks', 'drinks'],
    required: true 
  },
  label: { ...LocalizedString, required: true },
  // Selection Required flag - determines if guests need to choose one option or all are provided
  selectionRequired: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = model('Course', courseSchema);