const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

const courseSchema = new Schema({
  course: { 
    type: String, 
    enum: ['starter', 'main', 'dessert', 'drinks'], 
    required: true 
  },
  label: { ...LocalizedString, required: true },
  // Selection Required flag - determines if guests need to choose one option or all are provided
  selectionRequired: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = model('Course', courseSchema);