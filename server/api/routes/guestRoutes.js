const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const ctrl = require('../../controllers/guestController');

// Admin CRUD (keeping Spanish paths for compatibility)
router.get('/guests', auth('admin'), ctrl.list);
router.post('/guests', auth('admin'), ctrl.create);
router.put('/guests/:id', auth('admin'), ctrl.update);
router.delete('/guests/:id', auth('admin'), ctrl.remove);

module.exports = router;
