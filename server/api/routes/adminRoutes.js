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

// Legacy routes - migrated to adminApi.js namespace
// Gift List (moved to /api/admin/gifts in adminApi.js)
// Cash Gift Cards (legacy - to be removed)
// Agenda/Event schedule (moved to /api/admin/events in adminApi.js)  
// Menu Management (moved to /api/admin/menu in adminApi.js)

// Settings
router.get('/api/config/event/blocked', auth('admin'), adminCtrl.getBlockedEvent);
router.put('/api/config/event/blocked', auth('admin'), adminCtrl.setBlockedEvent);
router.delete('/api/config/event/blocked', auth('admin'), adminCtrl.clearBlockedEvent);

module.exports = router;
