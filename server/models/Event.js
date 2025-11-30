const { Schema, model } = require('mongoose');
const { LocalizedString } = require('./LocalizedString');

// Sub-event schema for events within events
const subEventSchema = new Schema({
  name: { ...LocalizedString, required: true },
  date: { type: Date, required: true },
  end: { type: Date },
  description: { ...LocalizedString },
  icon: { 
    type: String, 
    enum: ['ceremony', 'cocktails', 'reception', 'dancing'],
    required: true 
  }
}, { _id: false });


const eventSchema = new Schema({
  name: { ...LocalizedString, required: true },            // Event name
  date: { type: Date, required: true },              // Start date/time
  end: { type: Date },                               // End date/time
  
  // Location fields (separate components)
  locationAddress: { type: String },                 // Street address
  locationLatitude: { type: Number },                // Latitude coordinate
  locationLongitude: { type: Number },               // Longitude coordinate
    
  title: { ...LocalizedString },                     // Localized title
  description: { ...LocalizedString },               // Localized description
  image: { 
    type: Schema.Types.ObjectId,                     // Reference to Image model
    ref: 'EventImage'                                // Reference to EventImage collection
  },                                                 // Reference to stored image

  // Sub-events within the main event
  sub_events: [subEventSchema],
}, { timestamps: true });

module.exports = model('Event', eventSchema);
