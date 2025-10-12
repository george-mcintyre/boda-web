const { Schema, model } = require('mongoose');

const LocalizedString = { type: Map, of: String, default: undefined };

const optionSchema = new Schema({
  name: { ...LocalizedString, alias: 'nombre' },
  description: { ...LocalizedString, alias: 'descripcion' },
}, { _id: false });

const menuSchema = new Schema({
  options: { type: [optionSchema], alias: 'opciones' },
}, { timestamps: true });

module.exports = model('Menu', menuSchema);
