const { Schema, model } = require('mongoose');

const specialRequestSchema = new Schema({
  name: { 
    type: String, 
    enum: ['vegetarian', 'lactose-intolerant', 'gluten-intolerant', 'nut-allergy', 'other'], 
    required: true 
  },
  selected: { type: Boolean, default: false }
}, { _id: false });

// Schema for individual menu option choice
const individualMenuOptionChoiceSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  optionId: { type: Schema.Types.ObjectId, ref: 'CourseOption', required: true },
  specialRequests: [specialRequestSchema],
  specialRequestDetail: { type: String, default: '' }
}, { _id: false });

// Schema for party guest's menu choices
const partyMenuChoiceSchema = new Schema({
  partyGuestId: { type: String, required: true }, // References party member or primary guest ID
  choices: [individualMenuOptionChoiceSchema]
}, { _id: false });

const menuChoiceSchema = new Schema({
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  partyChoices: [partyMenuChoiceSchema]
}, { timestamps: true });


module.exports = model('MenuChoice', menuChoiceSchema);