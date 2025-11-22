const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const adminCtrl = require('../../controllers/adminController');
const messageCtrl = require('../../controllers/messageController');

// Admin base namespace routes

// Events Management (existing functionality)
router.get('/events', auth('admin'), adminCtrl.listEventsAdmin);
router.post('/events', auth('admin'), adminCtrl.createEventsItem);
router.put('/events/:id', auth('admin'), adminCtrl.updateEventsItem);
router.delete('/events/:id', auth('admin'), adminCtrl.deleteEventsItem);

// Guests & Party Management (existing functionality)
router.get('/guests', auth('admin'), guestCtrl.list);
router.post('/guests', auth('admin'), guestCtrl.create);
router.get('/guests/:id', auth('admin'), guestCtrl.getById);
router.put('/guests/:id', auth('admin'), guestCtrl.update);
router.delete('/guests/:id', auth('admin'), guestCtrl.remove);
router.get('/guests/:id/party', auth('admin'), guestCtrl.getPartyByGuestId);
router.put('/guests/:id/party', auth('admin'), guestCtrl.updatePartyByGuestId);

// Menu Definition & Overview (existing functionality)
router.get('/menu', auth('admin'), adminCtrl.listMenus);
router.post('/menu', auth('admin'), adminCtrl.createMenu);
router.put('/menu/:id', auth('admin'), adminCtrl.updateMenu);
router.delete('/menu/:id', auth('admin'), adminCtrl.deleteMenu);

// TODO: Add these in Phase 7
// router.get('/menu-choices', auth('admin'), adminCtrl.getMenuChoices);

// Messages (Admin Console) - use existing functionality
router.get('/messages', auth('admin'), adminCtrl.listMessages);
router.delete('/messages/:id', auth('admin'), adminCtrl.deleteMessage);

// TODO: Add these in Phase 4
// router.post('/messages', auth('admin'), adminCtrl.createMessage);
// router.post('/messages/:id/reaction', auth('admin'), adminCtrl.reactToMessage);
// router.put('/messages/:id', auth('admin'), adminCtrl.updateMessage);

// Gifts Management (existing functionality)
router.get('/gifts', auth('admin'), adminCtrl.listGifts);
router.post('/gifts', auth('admin'), adminCtrl.createGift);
router.put('/gifts/:id', auth('admin'), adminCtrl.updateGift);
router.delete('/gifts/:id', auth('admin'), adminCtrl.deleteGift);

// TODO: Add these in Phase 7
// router.get('/gift-choices', auth('admin'), adminCtrl.getGiftChoices);

// Legacy settings (to be migrated)
router.get('/config/event/blocked', auth('admin'), adminCtrl.getBlockedEvent);
router.put('/config/event/blocked', auth('admin'), adminCtrl.setBlockedEvent);
router.delete('/config/event/blocked', auth('admin'), adminCtrl.clearBlockedEvent);

// TODO: Add these in Phase 7
// Settings / Feature Toggles
// router.get('/settings', auth('admin'), adminCtrl.getSettings);
// router.put('/settings', auth('admin'), adminCtrl.updateSettings);

module.exports = router;