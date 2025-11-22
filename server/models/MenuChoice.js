const { Schema, model } = require('mongoose');

const menuChoiceItemSchema = new Schema({
  menuPartId: { type: String, required: true },
  optionId: { type: String, default: null }
}, { _id: false });

const partyMemberMenuChoiceSchema = new Schema({
  partyGuestId: { type: String, required: true },
  choices: [menuChoiceItemSchema],
  specialRequest: { 
    type: String, 
    enum: ['vegan', 'vegetarian', 'nut allergy', 'other', null], 
    default: null 
  },
  specialRequestDetail: { type: String, default: null }
}, { _id: false });

const menuChoiceSchema = new Schema({
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  partyChoices: [partyMemberMenuChoiceSchema]
}, { timestamps: true });

module.exports = model('MenuChoice', menuChoiceSchema);