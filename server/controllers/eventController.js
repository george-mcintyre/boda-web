const fs = require('fs');
const path = require('path');
const { Event, EventChoice } = require('../models');
const { localizeEvent } = require('../utils/i18n');

// Format event for API response according to README specification
function formatEventForApi(event) {
  return {
    id: event._id.toString(),
    name: event.name,
    date: event.date ? event.date.toISOString() : null,
    end: event.end ? event.end.toISOString() : null,
    location: event.location,
    title: event.title ? (typeof event.title === 'string' ? event.title : event.title.get('en') || event.title.get('es')) : null,
    description: event.description ? (typeof event.description === 'string' ? event.description : event.description.get('en') || event.description.get('es')) : null,
    image: event.image || null,
    sub_events: (event.sub_events || []).map(sub => ({
      name: sub.name,
      date: sub.date ? sub.date.toISOString() : null,
      end: sub.end ? sub.end.toISOString() : null,
      description: sub.description || null,
      icon: sub.icon
    }))
  };
}

// Guest: List events
async function listEvents(req, res, next) {
  try {
    const events = await Event.find({}).sort({ date: 1, order: 1, createdAt: 1 }).lean();
    const items = events.map(formatEventForApi);
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
    const events = await Event.find({}).sort({ date: 1, order: 1, createdAt: 1 }).lean();
    const items = events.map(formatEventForApi);
    res.json(items);
  } catch (e) {
    next(e);
  }
}

// Admin: Create new event
async function createEvent(req, res, next) {
  try {
    const { name, date, end, location, title, description, image, sub_events } = req.body;
    
    const event = await Event.create({
      name,
      date: date ? new Date(date) : null,
      end: end ? new Date(end) : null,
      location,
      title,
      description,
      image,
      sub_events: (sub_events || []).map(sub => ({
        name: sub.name,
        date: sub.date ? new Date(sub.date) : null,
        end: sub.end ? new Date(sub.end) : null,
        description: sub.description,
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
    const { name, date, end, location, title, description, image, sub_events } = req.body;

    const event = await Event.findByIdAndUpdate(id, {
      ...(name && { name }),
      ...(date && { date: new Date(date) }),
      ...(end && { end: new Date(end) }),
      ...(location && { location }),
      ...(title && { title }),
      ...(description && { description }),
      ...(image && { image }),
      ...(sub_events && { 
        sub_events: sub_events.map(sub => ({
          name: sub.name,
          date: sub.date ? new Date(sub.date) : null,
          end: sub.end ? new Date(sub.end) : null,
          description: sub.description,
          icon: sub.icon
        }))
      })
    }, { new: true });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    res.json(formatEventForApi(event));
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
  postEvents: createEvent
};
