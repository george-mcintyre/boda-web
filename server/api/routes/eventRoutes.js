const router = require('express').Router();
const { locale } = require('../../middleware/locale');
const { listAgenda } = require('../../controllers/eventController');

// Public agenda endpoint with language negotiation
router.get('/agenda', locale, listAgenda);

module.exports = router;
