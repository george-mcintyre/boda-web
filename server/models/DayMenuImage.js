const { Schema, model } = require('mongoose');

const dayMenuImageSchema = new Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'daymenuimages'
});

module.exports = model('DayMenuImage', dayMenuImageSchema);
