const { Schema, model } = require('mongoose');

const courseOptionSchema = new Schema({
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  label: { type: String, required: true },
  image: { type: String, default: null },
  description: { type: String, default: null }
}, { timestamps: true });

module.exports = model('CourseOption', courseOptionSchema);