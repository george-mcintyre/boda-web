const { Schema, model } = require('mongoose');

const courseOptionSchema = new Schema({
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  label: { type: String, required: true },
  image: { 
    type: Schema.Types.ObjectId,
    ref: 'CourseOptionImage'
  },
  description: { type: String, default: null },
  // Special Dietary Indicators
  isVegetarian: { type: Boolean, default: false },
  containsAllergens: { type: Boolean, default: false },
  containsLactose: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = model('CourseOption', courseOptionSchema);