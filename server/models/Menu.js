const { Schema, model } = require('mongoose');

const menuOptionSchema = new Schema({
  label: { type: String, required: true },
  image: { type: String, default: null },
  description: { type: String, default: null }
}, { _id: true });

const menuPartSchema = new Schema({
  course: { 
    type: String, 
    enum: ['starter', 'main', 'dessert', 'drinks'], 
    required: true 
  },
  label: { type: String, required: true },
  options: [menuOptionSchema]
}, { timestamps: true });

module.exports = model('MenuPart', menuPartSchema);
