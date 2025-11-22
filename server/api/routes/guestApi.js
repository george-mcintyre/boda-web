const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const messageCtrl = require('../../controllers/messageController');
const adminCtrl = require('../../controllers/adminController');

// Guest Profile (existing functionality - just renamed route)
router.get('/profile', auth('guest'), guestCtrl.getMe);

// Party Management
router.get('/party', auth('guest'), guestCtrl.getParty);
router.put('/party', auth('guest'), guestCtrl.updateParty);

// Events (use existing admin event listing for now)
router.get('/events', auth('guest'), adminCtrl.listEventsAdmin);

// TODO: Add these in Phase 3
// router.get('/event-choices', auth('guest'), guestCtrl.getEventChoices);
// router.put('/event-choices', auth('guest'), guestCtrl.updateEventChoices);

// Messages (use existing message controller)
router.get('/messages', auth('guest'), messageCtrl.list);
router.post('/messages', auth('guest'), messageCtrl.create);
router.post('/messages/:id/reaction', auth('guest'), messageCtrl.react);

// TODO: Add these in Phase 5
// Menu
// router.get('/menu', auth('guest'), adminCtrl.listMenus);
// router.get('/menu-choices', auth('guest'), guestCtrl.getMenuChoices);
// router.put('/menu-choices', auth('guest'), guestCtrl.updateMenuChoices);

// TODO: Add these in Phase 6
// Gifts
// router.get('/gifts', auth('guest'), adminCtrl.listGifts);
// router.get('/gift-choices', auth('guest'), guestCtrl.getGiftChoices);
// router.post('/create-payment-session', auth('guest'), guestCtrl.createPaymentSession);

module.exports = router;