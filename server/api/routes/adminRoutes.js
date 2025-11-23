const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const adminCtrl = require('../../controllers/adminController');
const messageCtrl = require('../../controllers/messageController');

// Guests
router.get('/api/admin/guests', auth('admin'), guestCtrl.list);
router.post('/api/admin/guests', auth('admin'), guestCtrl.create);
router.put('/api/admin/guests/:id', auth('admin'), guestCtrl.update);
router.delete('/api/admin/guests/:id', auth('admin'), guestCtrl.remove);

// Messages
router.get('/api/admin/messages', auth('admin'), messageCtrl.listAdminMessages);
router.delete('/api/admin/messages/:id', auth('admin'), messageCtrl.deleteAdminMessage);

module.exports = router;
