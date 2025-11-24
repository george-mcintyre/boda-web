const { Schema, model } = require('mongoose');

const courseSchema = new Schema({
  course: { 
    type: String, 
    enum: ['starter', 'main', 'dessert', 'drinks'], 
    required: true 
  },
  label: { type: String, required: true }
}, { timestamps: true });

module.exports = model('Course', courseSchema);