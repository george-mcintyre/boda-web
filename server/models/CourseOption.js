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
  imageCloseup: {
    type: Schema.Types.ObjectId,
    ref: 'CourseOptionImage'
  },
  description: { ...LocalizedString, default: null },
  // Dietary Flags
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  
  // Specific Allergen Flags
  containsGluten: { type: Boolean, default: false },
  containsEggs: { type: Boolean, default: false },
  containsFish: { type: Boolean, default: false },
  containsShellfish: { type: Boolean, default: false },
  containsSoy: { type: Boolean, default: false },
  containsSesame: { type: Boolean, default: false },
  containsLactose: { type: Boolean, default: false },
  containsNuts: { type: Boolean, default: false },
  
  // Deprecated - replaced by specific allergen flags above
  containsAllergens: { type: Boolean, default: false },

  // Cooking preference
  allowsCookingPreference: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = model('CourseOption', courseOptionSchema);