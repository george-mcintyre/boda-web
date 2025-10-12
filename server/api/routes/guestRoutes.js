const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const ctrl = require('../../controllers/guestController');

// Guest: own profile (keeping Spanish path for compatibility)
router.get('/invitado', auth('guest'), ctrl.getMe);

// Admin CRUD (keeping Spanish paths for compatibility)
router.get('/invitados', auth('admin'), ctrl.list);
router.post('/invitados', auth('admin'), ctrl.create);
router.put('/invitados/:id', auth('admin'), ctrl.update);
router.delete('/invitados/:id', auth('admin'), ctrl.remove);

module.exports = router;
