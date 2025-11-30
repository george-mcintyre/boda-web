const fs = require('fs');
const path = require('path');
const { Event, EventChoice } = require('../models');
const { localize, getLang, mergeLocalizedString } = require('../utils/localized');

// Format event for API response according to README specification
function formatEventForApi(event, lang = 'en') {
  // Format image data for display
  let imageData = null;
  if (event.image && event.image.data) {
    // Database-stored image with populated data
    const base64Data = event.image.data.toString('base64');
    imageData = `data:${event.image.contentType};base64,${base64Data}`;
  } else if (typeof event.image === 'string' && event.image.startsWith('/')) {
    // Legacy URL-based image
    imageData = event.image;
  } else if (event.image && event.image._id) {
    // Image reference (will be populated separately in admin calls)
    if (event.image.data) {
      const base64Data = event.image.data.toString('base64');
      imageData = `data:${event.image.contentType};base64,${base64Data}`;
    }
  }

  return {
    id: event._id.toString(),
    name: localize(event.name, lang),
    date: event.date ? event.date.toISOString() : null,
    end: event.end ? event.end.toISOString() : null,
    locationAddress: event.locationAddress || '',
    locationLatitude: event.locationLatitude || null,
    locationLongitude: event.locationLongitude || null,
    // Legacy location field for backward compatibility
    location: event.location || event.locationAddress || '',
    title: event.title ? localize(event.title, lang) : null,
    description: event.description ? localize(event.description, lang) : null,
    image: imageData,
    sub_events: (event.sub_events || []).map(sub => ({
      name: localize(sub.name, lang),
      date: sub.date ? sub.date.toISOString() : null,
      end: sub.end ? sub.end.toISOString() : null,
      description: localize(sub.description, lang) || null,
      icon: sub.icon
    }))
  };
}

// Guest: List events
async function listEvents(req, res, next) {
  try {
    const lang = getLang(req);
    // Populate image to get the actual image data for base64 conversion
    const events = await Event.find({}).sort({ date: 1, order: 1, createdAt: 1 }).populate('image');
    const items = events.map(event => formatEventForApi(event, lang));
    res.json(items);
  } catch (e) {
    next(e);
  }
}

// Guest: Get event choices
async function getEventChoices(req, res, next) {
  try {
    const { email } = req.user;
    const { Guest } = require('../models');
    const guest = await Guest.findOne({ email });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const eventChoice = await EventChoice.findOne({ guestId: guest._id });
    if (!eventChoice) {
      return res.json([]);
    }

    res.json(eventChoice.partyChoices);
  } catch (e) {
    next(e);
  }
}

// Guest: Update event choices
async function updateEventChoices(req, res, next) {
  try {
    const { email } = req.user;
    const { Guest } = require('../models');
    const guest = await Guest.findOne({ email });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const partyChoices = req.body || [];
    
    // Validate input
    if (!Array.isArray(partyChoices)) {
      return res.status(400).json({ error: 'Party choices must be an array' });
    }

    // Update or create event choices
    const eventChoice = await EventChoice.findOneAndUpdate(
      { guestId: guest._id },
      { partyChoices },
      { upsert: true, new: true }
    );

    res.json(eventChoice.partyChoices);
  } catch (e) {
    next(e);
  }
}

// Admin: List all events
async function listEventsAdmin(req, res, next) {
  try {
    const lang = getLang(req);
    // Populate image to get the actual image data for base64 conversion
    const events = await Event.find({}).sort({ date: 1, order: 1, createdAt: 1 }).populate('image');
    const items = events.map(event => formatEventForApi(event, lang));
    res.json(items);
  } catch (e) {
    next(e);
  }
}

// Admin: Create new event
async function createEvent(req, res, next) {
  try {
    const lang = getLang(req);
    const { name, date, end, location, locationAddress, locationLatitude, locationLongitude, title, description, image, sub_events } = req.body;
        
    const event = await Event.create({
      name: mergeLocalizedString(undefined, name, lang),
      date: date ? new Date(date) : null,
      end: end ? new Date(end) : null,
      location: location || locationAddress || '',
      locationAddress: locationAddress || location || '',
      locationLatitude: locationLatitude ? parseFloat(locationLatitude) : null,
      locationLongitude: locationLongitude ? parseFloat(locationLongitude) : null,
      title: mergeLocalizedString(undefined, title, lang),
      description: mergeLocalizedString(undefined, description, lang),
      image,
      sub_events: (sub_events || []).map(sub => ({
        name: mergeLocalizedString(undefined, sub.name, lang),
        date: sub.date ? new Date(sub.date) : null,
        end: sub.end ? new Date(sub.end) : null,
        description: mergeLocalizedString(undefined, sub.description, lang),
        icon: sub.icon
      }))
    });

    res.status(201).json(formatEventForApi(event));
  } catch (e) {
    next(e);
  }
}

// Admin: Update event
async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, date, end, location, locationAddress, locationLatitude, locationLongitude, title, description, image, sub_events } = req.body;

    const event = await Event.findByIdAndUpdate(id, {
      ...(name && { name: mergeLocalizedString(undefined, name, lang) }),
      ...(date && { date: new Date(date) }),
      ...(end && { end: new Date(end) }),
      ...(location && { location }),
      ...(locationAddress && { locationAddress }),
      ...(locationLatitude && { locationLatitude: parseFloat(locationLatitude) }),
      ...(locationLongitude && { locationLongitude: parseFloat(locationLongitude) }),
      ...(title && { title: mergeLocalizedString(undefined, title, lang) }),
      ...(description && { description: mergeLocalizedString(undefined, description, lang) }),
      ...(image && { image }),
      ...(sub_events && { 
        sub_events: sub_events.map(sub => ({
          name: mergeLocalizedString(undefined, sub.name, lang),
          date: sub.date ? new Date(sub.date) : null,
          end: sub.end ? new Date(sub.end) : null,
          description: mergeLocalizedString(undefined, sub.description, lang),
          icon: sub.icon
        }))
      })
    }, { new: true });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    res.json(formatEventForApi(event, lang));
  } catch (e) {
    next(e);
  }
}

// Admin: Delete event
async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ status: 'ok' });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  // Guest endpoints
  listEvents,
  getEventChoices,
  updateEventChoices,
  // Admin endpoints
  listEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  // Legacy endpoints (for backward compatibility)
  getEvents: listEventsAdmin,
  postEvents: createEvent,
  createEventsItem: createEvent,
  updateEventsItem: updateEvent,
  deleteEventsItem: deleteEvent,
  listEvents: listEvents,
  listEventsGuest: listEvents
};
