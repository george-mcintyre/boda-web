const { Schema, model } = require('mongoose');

const LocalizedString = { type: Map, of: String, default: undefined };

const menuOptionSchema = new Schema({
  label: LocalizedString,
  image: { type: String, default: null },
  description: { type: Map, of: String, default: undefined }
}, { _id: false });

const menuPartSchema = new Schema({
  course: { 
    type: String, 
    enum: ['starter', 'main', 'dessert', 'drinks'], 
    required: true 
  },
  label: LocalizedString,
  options: [menuOptionSchema]
}, { _id: false });

const menuSchema = new Schema({
  parts: [menuPartSchema],
}, { timestamps: true });

module.exports = model('Menu', menuSchema);
