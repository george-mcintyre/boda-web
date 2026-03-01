const { Schema, model } = require('mongoose');

const tableAssignmentSchema = new Schema({
  tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  partyMemberName: { type: String, default: null }
}, { timestamps: true });

// A person (guest + optional party member) can only be assigned to one table
tableAssignmentSchema.index({ guestId: 1, partyMemberName: 1 }, { unique: true });

module.exports = model('TableAssignment', tableAssignmentSchema);
