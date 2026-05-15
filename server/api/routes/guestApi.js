const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const messageCtrl = require('../../controllers/messageController');
const eventCtrl = require('../../controllers/eventController');

// Guest Profile (existing functionality - just renamed route)
router.get('/profile', auth('guest'), guestCtrl.getMe);
router.put('/me/lang', auth('guest'), guestCtrl.updateMyLang);

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

// Day Menus (for informational pages - Welcome Cocktails, Wedding Brunch)
router.get('/day-menus', auth('guest'), guestCtrl.getDayMenus);
router.get('/banquet-chef', auth('guest'), guestCtrl.getBanquetChefProfile);

// Chef Profile image serving endpoint (guest-accessible)
router.get('/chef-profiles/:id/image', async (req, res, next) => {
  try {
    const { ChefProfileImage } = require('../../models');
    const image = await ChefProfileImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageBuffer = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Content-Length', String(imageBuffer.length));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  } catch (e) {
    next(e);
  }
});

// Day Menu image serving endpoint (guest-accessible)
router.get('/day-menus/images/:id', async (req, res, next) => {
  try {
    const { DayMenuImage } = require('../../models');
    const image = await DayMenuImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageBuffer = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Content-Length', String(imageBuffer.length));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  } catch (e) {
    next(e);
  }
});

// Gifts
router.get('/gifts', auth('guest'), guestCtrl.getGifts);
router.get('/gift-choices', auth('guest'), guestCtrl.getGiftChoices);
router.post('/create-payment-session', auth('guest'), guestCtrl.createPaymentSession);

// Table Assignments (for seating plan)
router.get('/table-assignments', auth('guest'), guestCtrl.getTableAssignments);
router.get('/table-companions/:tableNumber', auth('guest'), guestCtrl.getTableCompanions);
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

module.exports = router;