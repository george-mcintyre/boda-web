const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const adminCtrl = require('../../controllers/adminController');

// Guests
router.get('/api/admin/guests', auth('admin'), guestCtrl.list);
router.post('/api/admin/guests', auth('admin'), guestCtrl.create);
router.put('/api/admin/guests/:id', auth('admin'), guestCtrl.update);
router.delete('/api/admin/guests/:id', auth('admin'), guestCtrl.remove);

// Messages
router.get('/api/admin/messages', auth('admin'), adminCtrl.listMessages);
router.delete('/api/admin/messages/:id', auth('admin'), adminCtrl.deleteMessage);

// Gift List
router.get('/api/admin/gifts', auth('admin'), adminCtrl.listGifts);
router.post('/api/admin/gifts', auth('admin'), adminCtrl.createGift);
router.put('/api/admin/gifts/:id', auth('admin'), adminCtrl.updateGift);
router.delete('/api/admin/gifts/:id', auth('admin'), adminCtrl.deleteGift);

// Agenda/Event schedule
router.get('/api/admin/events', auth('admin'), adminCtrl.listEventsAdmin);
router.post('/api/admin/events', auth('admin'), adminCtrl.createEventsItem);
router.put('/api/admin/events/:id', auth('admin'), adminCtrl.updateEventsItem);
router.delete('/api/admin/events/:id', auth('admin'), adminCtrl.deleteEventsItem);

// Menu Management
router.get('/api/admin/menu', auth('admin'), adminCtrl.listMenus);
router.post('/api/admin/menu', auth('admin'), adminCtrl.createMenu);
router.put('/api/admin/menu/:id', auth('admin'), adminCtrl.updateMenu);
router.delete('/api/admin/menu/:id', auth('admin'), adminCtrl.deleteMenu);

// Cash Gift Cards
router.get('/api/admin/cash-gift-cards', auth('admin'), adminCtrl.listCashGiftCards);
router.post('/api/admin/cash-gift-cards', auth('admin'), adminCtrl.createCashGiftCard);
router.put('/api/admin/cash-gift-cards/:id', auth('admin'), adminCtrl.updateCashGiftCard);
router.delete('/api/admin/cash-gift-cards/:id', auth('admin'), adminCtrl.deleteCashGiftCard);

// Settings
router.get('/api/config/event/blocked', auth('admin'), adminCtrl.getBlockedEvent);
router.put('/api/config/event/blocked', auth('admin'), adminCtrl.setBlockedEvent);
router.delete('/api/config/event/blocked', auth('admin'), adminCtrl.clearBlockedEvent);

module.exports = router;
