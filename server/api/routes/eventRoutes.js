const router = require('express').Router();
const { locale } = require('../../middleware/locale');
const { auth } = require('../../auth/middleware');
const { listEvents, getEvents, postEvents } = require('../../controllers/eventController');

// Public agenda endpoint with language negotiation
router.get('/event', locale, listEvents);

// Simple Event admin endpoints
router.get('/events', getEvents);
router.post('/events', auth('admin'), postEvents);

module.exports = router;
