const { Schema, model } = require('mongoose');

// Generic localized string as a Map of language code → text
const LocalizedString = { type: Map, of: String, default: undefined };

const eventSchema = new Schema({
  // Core timing
  date: { type: Date, alias: 'fecha' },              // ISO date for the calendar day (if provided)
  time: { type: String, alias: 'hora' },             // free-form time label (not localized)
  // Localized labels/content
  day: { ...LocalizedString, alias: 'dia' },     // e.g., { es: "6 de Junio", en: "June 6" }
  title: { ...LocalizedString, alias: 'titulo' },  // e.g., { es: "Ceremonia", en: "Ceremony" }
  description: { ...LocalizedString, alias: 'descripcion' },
  venue: { ...LocalizedString, alias: 'lugar' },   // venue name
  address: { ...LocalizedString, alias: 'direccion' },
  // Ordering when displayed
  order: { type: Number, alias: 'orden' },

  // Backward-compatibility: keep legacy field so old data doesn't break completely
  location: { type: String, alias: 'ubicacion' },
}, { timestamps: true });

module.exports = model('Event', eventSchema);
