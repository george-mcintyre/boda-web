const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const adminCtrl = require('../../controllers/adminController');
const messageCtrl = require('../../controllers/messageController');
const adminExpCtrl = require('../../controllers/adminExpansionController');
const multer = require('multer');
const os = require('os');

// Configure multer for event image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir()); // Temporary upload directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

// Admin base namespace routes

// Events Management (existing functionality)
router.get('/events', auth('admin'), adminCtrl.listEventsAdmin);
router.post('/events', auth('admin'), adminCtrl.createEventsItem);
router.put('/events/:id', auth('admin'), adminCtrl.updateEventsItem);
router.delete('/events/:id', auth('admin'), adminCtrl.deleteEventsItem);
router.post('/events/upload-image', auth('admin'), upload.single('image'), adminCtrl.uploadEventImage);

// Event image serving endpoints
router.get('/events/:eventId/image', auth('admin'), async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { Event, EventImage } = require('../../models');
    const event = await Event.findById(eventId).populate('image');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Handle both new format (EventImage reference) and legacy format (URL)
    if (event.image.data && event.image.contentType) {
      // New format - database-stored image
      const imgData = Buffer.isBuffer(event.image.data) ? event.image.data : Buffer.from(event.image.data.buffer || event.image.data);
      res.setHeader('Content-Type', event.image.contentType);
      res.setHeader('Content-Length', imgData.length);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(imgData);
    } else if (typeof event.image === 'string' && event.image.startsWith('/')) {
      // Legacy format - redirect to file system
      res.redirect(event.image);
    } else {
      return res.status(404).json({ error: 'Image not found' });
    }
  } catch (e) {
    next(e);
  }
});

router.get('/events/:eventId/image/thumbnail', auth('admin'), async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { Event, EventImage } = require('../../models');
    const event = await Event.findById(eventId).populate('image');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Handle both formats
    if (event.image.data && event.image.contentType) {
      // New format - for now return full image (could implement thumbnail generation)
      const imgData = Buffer.isBuffer(event.image.data) ? event.image.data : Buffer.from(event.image.data.buffer || event.image.data);
      res.setHeader('Content-Type', event.image.contentType);
      res.setHeader('Content-Length', imgData.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(imgData);
    } else if (typeof event.image === 'string' && event.image.startsWith('/')) {
      // Legacy format - redirect to file system
      res.redirect(event.image);
    } else {
      return res.status(404).json({ error: 'Image not found' });
    }
  } catch (e) {
    next(e);
  }
});

// Direct image serving by image ID
router.get('/images/:imageId', auth('admin'), async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const { EventImage } = require('../../models');
    const image = await EventImage.findById(imageId);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imgData = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data.buffer || image.data);
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Content-Length', imgData.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imgData);
  } catch (e) {
    next(e);
  }
});

// Guests & Party Management (existing functionality)
router.get('/guests', auth('admin'), guestCtrl.list);
router.post('/guests', auth('admin'), guestCtrl.create);
router.post('/guests/bulk-upload', auth('admin'), guestCtrl.bulkUpload);
router.get('/guests/:id', auth('admin'), guestCtrl.getById);
router.put('/guests/:id', auth('admin'), guestCtrl.update);
router.delete('/guests/:id', auth('admin'), guestCtrl.remove);
router.get('/guests/:id/party', auth('admin'), guestCtrl.getPartyByGuestId);
router.put('/guests/:id/party', auth('admin'), guestCtrl.updatePartyByGuestId);

router.get('/messages', auth('admin'), messageCtrl.listAdminMessages);
router.post('/messages', auth('admin'), messageCtrl.createAdminMessage);
router.post('/messages/:id/reaction', auth('admin'), messageCtrl.reactAdmin);
router.put('/messages/:id', auth('admin'), messageCtrl.updateAdminMessage);
router.delete('/messages/:id', auth('admin'), messageCtrl.deleteAdminMessage);

// Email test endpoint (for previewing buyer/couple emails without a real purchase)
router.post('/email/test', auth('admin'), adminCtrl.testEmail);

// Gifts Management (existing functionality)
router.get('/gifts', auth('admin'), adminCtrl.listGifts);
router.post('/gifts', auth('admin'), adminCtrl.createGift);
router.put('/gifts/:id', auth('admin'), adminCtrl.updateGift);
router.delete('/gifts/:id', auth('admin'), adminCtrl.deleteGift);

// Gift image upload
router.post('/gifts/upload-image', auth('admin'), upload.single('image'), adminCtrl.uploadGiftImage);

// Gift card images (legacy - will be removed)
router.get('/gift-images', auth('admin'), adminCtrl.getGiftCardImages);

// Gift image serving endpoints
router.get('/gifts/:giftId/image', auth('admin'), async (req, res, next) => {
  try {
    const { giftId } = req.params;
    const { Gift, GiftImage } = require('../../models');
    const gift = await Gift.findById(giftId).populate('image');
    
    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    if (!gift.image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Handle both new format (GiftImage reference) and legacy format (URL)
    if (gift.image.data && gift.image.contentType) {
      // New format - database-stored image
      const imgData = Buffer.isBuffer(gift.image.data) ? gift.image.data : Buffer.from(gift.image.data.buffer || gift.image.data);
      res.setHeader('Content-Type', gift.image.contentType);
      res.setHeader('Content-Length', imgData.length);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(imgData);
    } else if (typeof gift.image === 'string' && gift.image.startsWith('/')) {
      // Legacy format - redirect to file system
      res.redirect(gift.image);
    } else {
      return res.status(404).json({ error: 'Image not found' });
    }
  } catch (e) {
    next(e);
  }
});

router.get('/gifts/:giftId/image/thumbnail', auth('admin'), async (req, res, next) => {
  try {
    const { giftId } = req.params;
    const { Gift, GiftImage } = require('../../models');
    const gift = await Gift.findById(giftId).populate('image');
    
    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    if (!gift.image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Handle both formats
    if (gift.image.data && gift.image.contentType) {
      // New format - for now return full image (could implement thumbnail generation)
      const imgData = Buffer.isBuffer(gift.image.data) ? gift.image.data : Buffer.from(gift.image.data.buffer || gift.image.data);
      res.setHeader('Content-Type', gift.image.contentType);
      res.setHeader('Content-Length', imgData.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(imgData);
    } else if (typeof gift.image === 'string' && gift.image.startsWith('/')) {
      // Legacy format - redirect to file system
      res.redirect(gift.image);
    } else {
      return res.status(404).json({ error: 'Image not found' });
    }
  } catch (e) {
    next(e);
  }
});

// Direct image serving by image ID
router.get('/gift-images/:imageId', auth('admin'), async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const { GiftImage } = require('../../models');
    const image = await GiftImage.findById(imageId);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imgData = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data.buffer || image.data);
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Content-Length', imgData.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imgData);
  } catch (e) {
    next(e);
  }
});

// Gift choices overview
router.get('/gift-choices', auth('admin'), adminCtrl.getGiftChoices);

// Settings / Feature Toggles - GET is public, PUT requires admin
router.get('/settings', adminCtrl.getSettings);
router.put('/settings', auth('admin'), adminCtrl.updateSettings);

// ========== Admin Expansion Routes ==========

// Guest Summary
router.get('/guest-summary', auth('admin'), adminExpCtrl.getGuestSummary);

// Chef Profiles
router.get('/chef-profiles', auth('admin'), adminExpCtrl.listChefProfiles);
router.post('/chef-profiles', auth('admin'), adminExpCtrl.createChefProfile);
router.put('/chef-profiles/:id', auth('admin'), adminExpCtrl.updateChefProfile);
router.delete('/chef-profiles/:id', auth('admin'), adminExpCtrl.deleteChefProfile);
router.post('/chef-profiles/upload-image', auth('admin'), upload.single('image'), adminExpCtrl.uploadChefProfileImage);
router.get('/chef-profiles/:id/image', auth('admin'), adminExpCtrl.getChefProfileImage);

// Day Menus
router.get('/day-menus', auth('admin'), adminExpCtrl.listDayMenus);
router.get('/day-menus/:id', auth('admin'), adminExpCtrl.getDayMenu);
router.post('/day-menus', auth('admin'), adminExpCtrl.createDayMenu);
router.put('/day-menus/:id', auth('admin'), adminExpCtrl.updateDayMenu);
router.delete('/day-menus/:id', auth('admin'), adminExpCtrl.deleteDayMenu);
router.post('/day-menus/upload-image', auth('admin'), upload.single('image'), adminExpCtrl.uploadDayMenuImage);
router.get('/day-menus/:dayMenuId/image', auth('admin'), adminExpCtrl.getDayMenuImage);
router.get('/day-menus/:dayMenuId/section-image/:sectionIndex', auth('admin'), adminExpCtrl.getDayMenuSectionImage);

// Tables
router.get('/tables', auth('admin'), adminExpCtrl.listTables);
router.post('/tables', auth('admin'), adminExpCtrl.createTable);
router.put('/tables/:id', auth('admin'), adminExpCtrl.updateTable);
router.delete('/tables/:id', auth('admin'), adminExpCtrl.deleteTable);
router.post('/tables/seed', auth('admin'), adminExpCtrl.seedTables);

// Table Assignments
router.get('/table-assignments', auth('admin'), adminExpCtrl.listTableAssignments);
router.post('/table-assignments', auth('admin'), adminExpCtrl.createTableAssignment);
router.put('/table-assignments/:id', auth('admin'), adminExpCtrl.updateTableAssignment);
router.delete('/table-assignments/:id', auth('admin'), adminExpCtrl.deleteTableAssignment);
router.post('/table-assignments/bulk', auth('admin'), adminExpCtrl.bulkAssignTables);

// Seating plan QR code (static public URL — no auth needed, used in admin <img> tags)
router.get('/seating-qr', async (req, res, next) => {
  try {
    const QRCode = require('qrcode');
    const url = 'https://george-and-iluminada.com/guests.html?tab=menu&seating=show';
    const buffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 360,
      margin: 2,
      color: { dark: '#8B5A96', light: '#FDFBF7' }
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

// Menu Responses
router.get('/menu-responses', auth('admin'), adminExpCtrl.getMenuResponses);

// Gift Purchases
router.get('/gift-purchases', auth('admin'), adminExpCtrl.getGiftPurchases);
router.get('/gift-purchases/descriptors.json', auth('admin'), adminExpCtrl.getGiftPurchaseDescriptorsBundle);
router.get('/gift-purchases/:id/descriptor.json', auth('admin'), adminExpCtrl.getGiftPurchaseDescriptor);
router.delete('/gift-purchases/:id', auth('admin'), adminExpCtrl.undoGiftPurchase);

// Event Choices (for table assignment filtering)
router.get('/event-choices', auth('admin'), adminExpCtrl.getAdminEventChoices);
router.put('/event-choices/:guestId', auth('admin'), adminExpCtrl.updateAdminEventChoices);

// Guests without choices/party
router.get('/guests-without-event-choices', auth('admin'), adminExpCtrl.getGuestsWithoutEventChoices);
router.get('/guests-without-menu-choices', auth('admin'), adminExpCtrl.getGuestsWithoutMenuChoices);
router.get('/guests-without-party', auth('admin'), adminExpCtrl.getGuestsWithoutParty);

router.get('/guest-list-print', auth('admin'), adminExpCtrl.getGuestListPrint);
router.get('/banquet-seating-print', auth('admin'), adminExpCtrl.getBanquetSeatingPrint);
router.post('/table-seats/reorder', auth('admin'), adminExpCtrl.reorderTableSeats);

router.get('/venue-print-token', auth('admin'), adminExpCtrl.getVenuePrintTokenInfo);
router.post('/venue-print-token/rotate', auth('admin'), adminExpCtrl.rotateVenuePrintToken);

module.exports = router;