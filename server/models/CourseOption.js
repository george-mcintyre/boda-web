const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

const courseOptionSchema = new Schema({
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  label: { ...LocalizedString, required: true },
  image: { 
    type: Schema.Types.ObjectId,
    ref: 'CourseOptionImage'
  },
  description: { ...LocalizedString, default: null },
  // Special Dietary Indicators
  isVegetarian: { type: Boolean, default: false },
  containsAllergens: { type: Boolean, default: false },
  containsLactose: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  containsNuts: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = model('CourseOption', courseOptionSchema);