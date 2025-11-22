const { Schema, model } = require('mongoose');

// Schema for individual event attendance choice
const individualEventChoiceSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  attending: { type: Boolean, default: false }
}, { _id: false });

// Schema for party guest's event choices
const partyEventChoiceSchema = new Schema({
  partyGuestId: { type: String, required: true }, // References party member or primary guest ID
  choices: [individualEventChoiceSchema]
}, { _id: false });

const eventChoiceSchema = new Schema({
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  partyChoices: [partyEventChoiceSchema]
}, { timestamps: true });

module.exports = model('EventChoice', eventChoiceSchema);