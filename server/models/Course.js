const { Schema, model } = require('mongoose');

const courseSchema = new Schema({
  course: { 
    type: String, 
    enum: ['starter', 'main', 'dessert', 'drinks'], 
    required: true 
  },
  label: { type: String, required: true },
  // Selection Required flag - determines if guests need to choose one option or all are provided
  selectionRequired: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = model('Course', courseSchema);