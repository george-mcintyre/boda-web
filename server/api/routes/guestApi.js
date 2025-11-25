const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const messageCtrl = require('../../controllers/messageController');
const eventCtrl = require('../../controllers/eventController');

// Guest Profile (existing functionality - just renamed route)
router.get('/profile', auth('guest'), guestCtrl.getMe);

// Party Management
router.get('/party', auth('guest'), guestCtrl.getParty);
router.put('/party', auth('guest'), guestCtrl.updateParty);

// Events
router.get('/events', auth('guest'), eventCtrl.listEvents);
router.get('/event-choices', auth('guest'), eventCtrl.getEventChoices);
router.put('/event-choices', auth('guest'), eventCtrl.updateEventChoices);

// Messages
router.get('/messages', auth('guest'), messageCtrl.listGuestMessages);
router.post('/messages', auth('guest'), messageCtrl.createGuestMessage);
router.post('/messages/:id/reaction', auth('guest'), messageCtrl.reactGuest);

// Menu
router.get('/menu', auth('guest'), require('../../controllers/menuController').listCourses);
router.get('/menu/:courseId/menu-choices', auth('guest'), require('../../controllers/menuController').listCourseOptions);
router.put('/menu/:courseId/menu-choices/:optionId', auth('guest'), require('../../controllers/menuController').updateCourseOption);

// Gifts
router.get('/gifts', auth('guest'), guestCtrl.getGifts);
router.get('/gift-choices', auth('guest'), guestCtrl.getGiftChoices);
router.post('/create-payment-session', auth('guest'), guestCtrl.createPaymentSession);

module.exports = router;