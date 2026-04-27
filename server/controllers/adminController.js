const { Config, Gift, Event, GiftChoice, CourseOptionImage } = require('../models');
const { getAvailableGiftCardImages } = require('../utils/imageUtils');
const { formatEventForApi, formatCourseForApi, formatCourseOptionForApi } = require('../utils/formatters');
const { mergeLocalizedString, localize, getLang } = require('../utils/localized');

async function getGiftChoices(req, res, next) {
  try {
    const giftChoices = await GiftChoice.find({})
      .populate('giftId', 'title amount')
      .populate('guestId', 'name name email')
      .sort({ date: -1 })
      .lean();

    const items = giftChoices.map(choice => ({
      guestId: choice.guestId._id.toString(),
      guestName: choice.guestId.name || choice.guestId.name || choice.guestId.email,
      giftId: choice.giftId._id.toString(),
      amount: choice.giftId.amount,
      date: choice.date.toISOString(),
      message: choice.message
    }));

    res.json(items);
  } catch (e) { next(e); }
}

async function getGiftCardImages(req, res, next) {
  try {
    const images = getAvailableGiftCardImages();
    res.json(images);
  } catch (e) { next(e); }
}

// ========== Events (MongoDB-backed CRUD) ==========
async function listEventsAdmin(req, res, next) {
  const lang = getLang(req);
  try {
    const events = await Event.find({})
      .sort({ date: 1, order: 1, createdAt: 1 })
      .populate('image')
      .lean();
    
    const items = events.map(event => formatEventForApi(event, lang));
    res.json(items);
  } catch (e) { next(e); }
}

async function createEventsItem(req, res, next) {
  try {
    const { name, date, end, location, locationAddress, locationLatitude, locationLongitude, title, description, image, sub_events } = req.body;
    
    // Handle image reference
    let imageRef = undefined;
    if (image && image.imageId) {
      // New format - reference to uploaded image
      imageRef = image.imageId;
    } else if (typeof image === 'string' && image.startsWith('/')) {
      // Legacy URL-based image
      imageRef = image;
    }

    const event = new Event({
      date: date ? new Date(date) : null,
      end: end ? new Date(end) : null,
      location,
      locationAddress: locationAddress || location || '',
      locationLatitude:
        locationLatitude !== undefined && locationLatitude !== null && locationLatitude !== ''
          ? parseFloat(locationLatitude)
          : null,
      locationLongitude:
        locationLongitude !== undefined && locationLongitude !== null && locationLongitude !== ''
          ? parseFloat(locationLongitude)
          : null,
      image: imageRef,
    });

    // Localised fields (one language at a time)
    event.name = mergeLocalizedString(undefined, name, lang);
    event.title = mergeLocalizedString(undefined, title, lang);
    event.description = mergeLocalizedString(undefined, description, lang);

    // Sub-events: also LocalizedString for name/description
    event.sub_events = (sub_events || []).map(sub => ({
      name: mergeLocalizedString(undefined, sub.name, lang),
      date: sub.date ? new Date(sub.date) : null,
      end: sub.end ? new Date(sub.end) : null,
      description: mergeLocalizedString(undefined, sub.description, lang),
      icon: sub.icon,
    }));

    await event.save();
    res.status(201).json(formatEventForApi(event));
  } catch (e) {
    next(e);
  }
}

async function updateEventsItem(req, res, next) {
  try {
    const lang = getLang(req);
    const { id } = req.params;

    const {
      name,
      date,
      end,
      location,
      locationAddress,
      locationLatitude,
      locationLongitude,
      title,
      description,
      image,
      sub_events,
    } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Non-localised scalars
    if (date !== undefined) {
      event.date = date ? new Date(date) : null;
    }
    if (end !== undefined) {
      event.end = end ? new Date(end) : null;
    }
    if (location !== undefined) {
      event.location = location;
    }
    if (locationAddress !== undefined) {
      event.locationAddress = locationAddress;
    }
    if (locationLatitude !== undefined) {
      event.locationLatitude =
        locationLatitude !== null && locationLatitude !== ''
          ? parseFloat(locationLatitude)
          : null;
    }
    if (locationLongitude !== undefined) {
      event.locationLongitude =
        locationLongitude !== null && locationLongitude !== ''
          ? parseFloat(locationLongitude)
          : null;
    }

    // Image
    if (image !== undefined && image !== null && image.imageId !== undefined && image.imageId !== null && image.imageId !== '') {
      event.image = image.imageId;
    }

    // Localised fields
    event.name = mergeLocalizedString(event.name, name, lang);
    event.title = mergeLocalizedString(event.title, title, lang);
    event.description = mergeLocalizedString(event.description, description, lang);

    // Sub-events: keep existing other languages, update current lang
    if (Array.isArray(sub_events)) {
      const existingSubs = Array.isArray(event.sub_events) ? event.sub_events : [];

      event.sub_events = sub_events.map((sub, idx) => {
        const existing = existingSubs[idx] || {};
        const base = existing.toObject ? existing.toObject() : existing;

        return {
          ...base,
          name: mergeLocalizedString(base.name, sub.name, lang),
          description: mergeLocalizedString(base.description, sub.description, lang),
          date: sub.date !== undefined ? (sub.date ? new Date(sub.date) : null) : base.date ?? null,
          end: sub.end !== undefined ? (sub.end ? new Date(sub.end) : null) : base.end ?? null,
          icon: sub.icon !== undefined ? sub.icon : base.icon,
        };
      });
    }

    await event.save();
    res.json(formatEventForApi(event, lang));
  } catch (e) {
    next(e);
  }
}
async function deleteEventsItem(req, res, next) {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

// ========== Settings: Agenda bloqueo (MongoDB) ==========
async function getConfigDoc() {
  let cfg = await Config.findOne();
  if (!cfg) cfg = await Config.create({ defaultLanguage: 'es', otherOptions: {} });
  return cfg;
}

function ensureEventInConfig(cfgObj) {
  cfgObj.otherOptions = cfgObj.otherOptions || {};
  const ev = cfgObj.otherOptions.event || { blocked: false, reason: '', blockedAt: null };
  cfgObj.otherOptions.event = {
    blocked: !!ev.blocked,
    reason: ev.reason || '',
    blockedAt: ev.blockedAt || null,
  };
  // expose top-level event for backward compatibility
  cfgObj.event = cfgObj.otherOptions.event;
  return cfgObj;
}

async function getBlockedEvent(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    const obj = ensureEventInConfig(cfg.toObject());
    // save migration if event was absent
    await Config.updateOne({ _id: cfg._id }, { $set: { otherOptions: obj.otherOptions } });
    res.json(obj);
  } catch (e) { next(e); }
}

async function setBlockedEvent(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    const now = new Date().toISOString();
    const obj = ensureEventInConfig(cfg.toObject());
    const reason = (req.body && req.body.reason) || obj.event.reason || '';
    obj.otherOptions.event.blocked = true;
    obj.otherOptions.event.reason = reason;
    obj.otherOptions.event.blockedAt = obj.otherOptions.event.blockedAt || now;
    await Config.updateOne({ _id: cfg._id }, { $set: { otherOptions: obj.otherOptions } });
    res.json(obj);
  } catch (e) { next(e); }
}

// ========== Settings / Feature Toggles ==========
function settingsPayload(cfg) {
  return {
    guestsEnabled: cfg.guestsEnabled !== undefined ? cfg.guestsEnabled : true,
    eventsEnabled: cfg.eventsEnabled !== undefined ? cfg.eventsEnabled : true,
    menuEnabled: cfg.menuEnabled !== undefined ? cfg.menuEnabled : true,
    messagesEnabled: cfg.messagesEnabled !== undefined ? cfg.messagesEnabled : true,
    giftsEnabled: cfg.giftsEnabled !== undefined ? cfg.giftsEnabled : true,
    seatingEnabled: cfg.seatingEnabled !== undefined ? cfg.seatingEnabled : false
  };
}

async function getSettings(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    res.json(settingsPayload(cfg));
  } catch (e) { next(e); }
}

async function updateSettings(req, res, next) {
  try {
    const { eventsEnabled, guestsEnabled, menuEnabled, messagesEnabled, giftsEnabled, seatingEnabled } = req.body;

    const cfg = await getConfigDoc();
    await Config.updateOne({ _id: cfg._id }, {
      $set: {
        ...(guestsEnabled !== undefined && { guestsEnabled }),
        ...(eventsEnabled !== undefined && { eventsEnabled }),
        ...(menuEnabled !== undefined && { menuEnabled }),
        ...(messagesEnabled !== undefined && { messagesEnabled }),
        ...(giftsEnabled !== undefined && { giftsEnabled }),
        ...(seatingEnabled !== undefined && { seatingEnabled })
      }
    });

    const updatedCfg = await Config.findById(cfg._id);
    res.json(settingsPayload(updatedCfg));
  } catch (e) { next(e); }
}

// ========== Gift Cards (MongoDB CRUD) ==========
async function listGifts(req, res, next) {
    const lang = getLang(req);
    try {
        const gifts = await Gift.find()
            .populate('image')
            .sort({ createdAt: -1 })
            .lean();

        // Get purchase counts for each gift
        const giftIds = gifts.map(gift => gift._id);
        const purchaseCounts = await GiftChoice.aggregate([
            { $match: { giftId: { $in: giftIds } } },
            { $group: { _id: '$giftId', count: { $sum: 1 } } }
        ]);

        // Create a map of giftId to purchase count
        const purchaseCountMap = {};
        purchaseCounts.forEach(item => {
            purchaseCountMap[item._id.toString()] = item.count;
        });

        const items = gifts.map(gift => {
            // Format image data for display
            let imageData = null;
            if (gift.image && gift.image.data) {
                // Database-stored image with populated data
                const base64Data = gift.image.data.toString('base64');
                imageData = `data:${gift.image.contentType};base64,${base64Data}`;
            } else if (gift.image && gift.image._id) {
                // Image reference with populated data
                if (gift.image.data) {
                    const base64Data = gift.image.data.toString('base64');
                    imageData = `data:${gift.image.contentType};base64,${base64Data}`;
                }
            } else if (gift.image && typeof gift.image === 'string' && gift.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(gift.image)) {
                // ObjectId reference - return the ObjectId string for frontend to use API endpoint
                imageData = gift.image;
            }

            return {
                id: gift._id.toString(),
                title: localize(gift.title, lang),
                description: localize(gift.description, lang),
                amount: gift.amount,
                available: gift.available,
                purchased: purchaseCountMap[gift._id.toString()] || 0,
                image: imageData,
                priceDisplay: `€${gift.amount}`
            };
        });
        res.json(items);
    } catch (e) { next(e); }

}

async function createGift(req, res, next) {
  try {
    const lang = getLang(req);
    const { title, description, amount, available, image } = req.body;

    // Validate required fields
    if (!title) {
        return res.status(400).json({ error: 'title is required' });
    }

    if (!description) {
        return res.status(400).json({ error: 'Description is required' });
    }

    if (!amount || ![25, 50, 100, 200, 500].includes(parseInt(amount))) {
        return res.status(400).json({ error: 'Valid amount (€25, €50, €100, €200, or €500) is required' });
    }

    if (available === undefined || available < 0) {
        return res.status(400).json({ error: 'Valid number available is required' });
    }

    // Handle image reference
    let imageRef = undefined;
    if (image && image.imageId) {
        // reference to uploaded image
        imageRef = image.imageId;
    } else {
        return res.status(400).json({ error: 'Valid image is required' });
    }

    const gift = await Gift.create({
        title: mergeLocalizedString(undefined, title, lang),
        description: mergeLocalizedString(undefined, description, lang),
        amount: parseInt(amount),
        available: parseInt(available),
        image: imageRef
    });

    // Populate image for response
    const populatedGift = await Gift.findById(gift._id).populate('image').lean();

    // Format image data for display
    let imageData = null;
    if (populatedGift.image && populatedGift.image.data) {
        const base64Data = populatedGift.image.data.toString('base64');
        imageData = `data:${populatedGift.image.contentType};base64,${base64Data}`;
    }

    res.status(201).json({
        id: gift._id.toString(),
        title: localize(gift.title, lang),
        description: localize(gift.description, lang),
        amount: gift.amount,
        available: gift.available,
        purchased: 0,
        image: imageData,
        priceDisplay: `€${gift.amount}`
    });
  } catch (e) { next(e); }
}

async function updateGift(req, res, next) {
  try {
        const lang = getLang(req);
        const { id } = req.params;
        const { title, description, amount, available, image } = req.body;

        // Validate amount if provided
        if (amount && ![25, 50, 100, 200, 500].includes(parseInt(amount))) {
            return res.status(400).json({ error: 'Valid amount (€25, €50, €100, €200, or €500) is required' });
        }

        // Handle image reference
        let imageRef = undefined;
        if (image !== undefined) {
            if (!image) {
                // Image explicitly set to null/empty, remove it
                imageRef = undefined;
            } else if (image.imageId) {
                // reference to uploaded image
                imageRef = image.imageId;
            }
        }

        const gift = await Gift.findById(id);
        if (!gift) return res.status(404).json({ error: 'Gift not found' });

        if (title !== undefined) gift.title = mergeLocalizedString(gift.title, title, lang);
        if (description !== undefined) gift.description = mergeLocalizedString(gift.description, description, lang);
        if (amount !== undefined) gift.amount = parseInt(amount);
        if (available !== undefined) gift.available = parseInt(available);
        if (imageRef !== undefined) gift.image = imageRef;

        await gift.save();

        if (!gift) return res.status(404).json({ error: 'Gift not found' });

        // Get updated purchase count
        const purchaseCount = await GiftChoice.countDocuments({ giftId: gift._id });

        // Format image data for display
        let imageData = null;
        if (gift.image && gift.image.data) {
            const base64Data = gift.image.data.toString('base64');
            imageData = `data:${gift.image.contentType};base64,${base64Data}`;
        } else if (gift.image && typeof gift.image === 'string' && gift.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(gift.image)) {
            // ObjectId reference - return the ObjectId string for frontend to use API endpoint
            imageData = gift.image;
        }

        res.json({
            id: gift._id.toString(),
            title: localize(gift.title, lang),
            description: localize(gift.description, lang),
            amount: gift.amount,
            available: gift.available,
            purchased: purchaseCount,
            image: imageData,
            priceDisplay: `€${gift.amount}`
        });
    } catch (e) { next(e); }
}

async function deleteGift(req, res, next) {
  try {
    const { id } = req.params;
    await Gift.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

// Image upload for events
async function uploadEventImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' });
    }

    // Validate file size (max 5MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }

    // Read the file and store in database
    const fs = require('fs');
    const imageData = fs.readFileSync(req.file.path);
    const { EventImage } = require('../models');
    
    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Store image in database
    const eventImage = await EventImage.create({
      data: imageData,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

    // Return the image ID and metadata
    res.json({ 
      imageId: eventImage._id.toString(),
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (e) { next(e); }
}

// Image upload for menu options
async function uploadCourseOptionImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' });
    }

    // Validate file size (max 5MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }

    // Read the file and store in database
    const fs = require('fs');
    const imageData = fs.readFileSync(req.file.path);
    
    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Store image in database
    const courseOptionImage = await CourseOptionImage.create({
      data: imageData,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

    // Return the image ID and metadata
    res.json({ 
      imageId: courseOptionImage._id.toString(),
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (e) { next(e); }
}

// Image upload for gifts
async function uploadGiftImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' });
    }

    // Validate file size (max 5MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }

    // Read the file and store in database
    const fs = require('fs');
    const imageData = fs.readFileSync(req.file.path);
    const { GiftImage } = require('../models');

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Store image in database
    const giftImage = await GiftImage.create({
      data: imageData,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

    // Return the image ID and metadata
    res.json({ 
      imageId: giftImage._id.toString(),
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (e) { next(e); }
}

module.exports = {
  // gifts
  listGifts, createGift, updateGift, deleteGift, getGiftChoices, getGiftCardImages, uploadGiftImage,
  // agenda
  listEventsAdmin, createEventsItem, updateEventsItem, deleteEventsItem, uploadEventImage,
  // menu options
  uploadCourseOptionImage,
  // settings
  getSettings, updateSettings,
  formatCourseForApi, formatCourseOptionForApi
};

