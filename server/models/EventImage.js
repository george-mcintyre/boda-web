const { Schema, model } = require('mongoose');

const eventImageSchema = new Schema({
  data: { type: Buffer, required: true },             // Binary image data
  contentType: { type: String, required: true },      // Image MIME type (e.g., 'image/jpeg')
  originalName: { type: String, required: true },     // Original filename
  size: { type: Number, required: true },             // File size in bytes
  uploadedAt: { type: Date, default: Date.now }       // Upload timestamp
}, { 
  timestamps: true,
  collection: 'eventimages'                           // Explicit collection name
});

module.exports = model('EventImage', eventImageSchema);