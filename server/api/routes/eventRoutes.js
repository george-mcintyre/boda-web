const router = require('express').Router();
const { locale } = require('../../middleware/locale');
const { auth } = require('../../auth/middleware');
const { listAgenda, getEventos, postEventos } = require('../../controllers/eventController');

// Public agenda endpoint with language negotiation
router.get('/agenda', locale, listAgenda);

// Simple Eventos admin endpoints (file-backed)
router.get('/eventos', getEventos);
router.post('/eventos', auth('admin'), postEventos);

module.exports = router;
