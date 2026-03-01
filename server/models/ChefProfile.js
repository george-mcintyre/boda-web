const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

const chefProfileSchema = new Schema({
  name: { ...LocalizedString, required: true },
  bio: { ...LocalizedString, required: true },
  image: {
    type: Schema.Types.ObjectId,
    ref: 'ChefProfileImage'
  },
  menuType: {
    type: String,
    enum: ['banquet', 'day1', 'day3'],
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = model('ChefProfile', chefProfileSchema);
