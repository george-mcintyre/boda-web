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

// Guest menu choices (legacy support)
router.get('/menu-choices', auth('guest'), require('../../controllers/menuController').listGuestCourseOption);
router.put('/menu-choices', auth('guest'), require('../../controllers/menuController').updateGuestCourseOption);

// Gifts
router.get('/gifts', auth('guest'), guestCtrl.getGifts);
router.get('/gift-choices', auth('guest'), guestCtrl.getGiftChoices);
router.post('/create-payment-session', auth('guest'), guestCtrl.createPaymentSession);

// Gift image serving endpoint (public - no auth required for CSS background-image loading)
router.get('/gifts/:giftId/image', async (req, res, next) => {
  try {
    const { giftId } = req.params;
    const { Gift } = require('../../models');
    
    // Don't use .lean() to preserve Buffer types
    const gift = await Gift.findById(giftId).populate('image');
    
    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    if (!gift.image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Handle database-stored image (GiftImage reference)
    if (gift.image.data && gift.image.contentType) {
      // Ensure data is a proper Buffer
      const imageBuffer = Buffer.isBuffer(gift.image.data)
        ? gift.image.data
        : Buffer.from(gift.image.data);
      
      res.setHeader('Content-Type', gift.image.contentType);
      res.setHeader('Content-Length', String(imageBuffer.length));
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(imageBuffer);
    } else if (typeof gift.image === 'string' && gift.image.startsWith('/')) {
      // Legacy format - redirect to file system
      res.redirect(gift.image);
    } else {
      return res.status(400).json({ error: 'Invalid image data' });
    }
  } catch (e) {
    next(e);
  }
});

// Stripe webhook (no auth - Stripe calls this directly)
// Note: This needs raw body for signature verification, configured in app.js
router.post('/stripe-webhook', guestCtrl.handleStripeWebhook);

module.exports = router;