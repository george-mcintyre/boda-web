const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

const dayMenuSectionSchema = new Schema({
  title: { ...LocalizedString, required: true },
  content: { ...LocalizedString, required: true },
  image: {
    type: Schema.Types.ObjectId,
    ref: 'DayMenuImage'
  }
}, { _id: false });

const dayMenuSchema = new Schema({
  day: {
    type: String,
    enum: ['day1', 'day3'],
    required: true,
    unique: true
  },
  sections: {
    type: [dayMenuSectionSchema],
    validate: [arr => arr.length <= 3, 'Maximum 3 sections allowed']
  },
  chefProfile: {
    type: Schema.Types.ObjectId,
    ref: 'ChefProfile'
  }
}, { timestamps: true });

module.exports = model('DayMenu', dayMenuSchema);
