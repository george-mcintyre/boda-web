const { Config, Gift, Event, GiftChoice, CourseOptionImage, Guest } = require('../models');
const { getAvailableGiftCardImages } = require('../utils/imageUtils');
const { formatEventForApi, formatCourseForApi, formatCourseOptionForApi } = require('../utils/formatters');
const { mergeLocalizedString, localize, getLang } = require('../utils/localized');
const { loadCubes, resolveCubeFaces } = require('../data/cubes-loader');
const emailService = require('../services/email');
const guestCtrl = require('./guestController');
const adminExp = require('./adminExpansionController');

let cubeFacesByIdCache = null;
function getCubeFacesById() {
  if (!cubeFacesByIdCache) {
    cubeFacesByIdCache = new Map();
    for (const cube of loadCubes()) {
      cubeFacesByIdCache.set(cube.id, resolveCubeFaces(cube));
    }
  }
  return cubeFacesByIdCache;
}

async function getGiftChoices(req, res, next) {
  try {
    const giftChoices = await GiftChoice.find({})
      .populate('giftId', 'title amount amountOptions')
      .populate('guestId', 'name name email')
      .sort({ date: -1 })
      .lean();

    const items = giftChoices.map(choice => {
      const gift = choice.giftId;
      const fallbackAmount = gift.amount
        ?? (Array.isArray(gift.amountOptions) && gift.amountOptions.length
            ? Math.min(...gift.amountOptions)
            : null);
      const amount = Number.isFinite(choice.amount) ? choice.amount : fallbackAmount;
      return {
        guestId: choice.guestId._id.toString(),
        guestName: choice.guestId.name || choice.guestId.name || choice.guestId.email,
        giftId: gift._id.toString(),
        amount,
        date: choice.date.toISOString(),
        message: choice.message,
        giftFrom: choice.giftFrom
      };
    });

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

        const giftIds = gifts.map(gift => gift._id);
        // Aggregate per-gift counts AND revenue, split by payment method.
        // Existing pre-paymentMethod docs are treated as 'stripe' (all historical
        // purchases came through Stripe before this field was added).
        const breakdown = await GiftChoice.aggregate([
            { $match: { giftId: { $in: giftIds } } },
            {
                $group: {
                    _id: '$giftId',
                    count: { $sum: 1 },
                    cashCount: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 1, 0] } },
                    stripeCount: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 0, 1] } },
                    cashAmount: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amount', 0] } },
                    stripeAmount: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 0, '$amount'] } },
                }
            }
        ]);

        const breakdownMap = {};
        breakdown.forEach(item => {
            breakdownMap[item._id.toString()] = item;
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

            const fallbackPrice = gift.amount
                ?? (Array.isArray(gift.amountOptions) && gift.amountOptions.length
                    ? Math.min(...gift.amountOptions)
                    : null);
            const isCube = gift.type === 'cube';
            const faces = isCube ? (getCubeFacesById().get(gift.cubeId) || null) : null;
            const b = breakdownMap[gift._id.toString()] || { count: 0, cashCount: 0, stripeCount: 0, cashAmount: 0, stripeAmount: 0 };
            return {
                id: gift._id.toString(),
                title: localize(gift.title, lang),
                description: localize(gift.description, lang),
                type: gift.type,
                amount: gift.amount,
                amountOptions: gift.amountOptions,
                cubeId: gift.cubeId,
                figurineId: gift.figurineId,
                faces,
                available: gift.available,
                purchased: b.count,
                cashCount: b.cashCount,
                stripeCount: b.stripeCount,
                cashRevenue: b.cashAmount,
                stripeRevenue: b.stripeAmount,
                totalRevenue: b.cashAmount + b.stripeAmount,
                image: imageData,
                priceDisplay: fallbackPrice != null ? `€${fallbackPrice}` : '—'
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

    const createdFallbackPrice = gift.amount
        ?? (Array.isArray(gift.amountOptions) && gift.amountOptions.length
            ? Math.min(...gift.amountOptions)
            : null);
    res.status(201).json({
        id: gift._id.toString(),
        title: localize(gift.title, lang),
        description: localize(gift.description, lang),
        amount: gift.amount,
        amountOptions: gift.amountOptions,
        available: gift.available,
        purchased: 0,
        image: imageData,
        priceDisplay: createdFallbackPrice != null ? `€${createdFallbackPrice}` : '—'
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

        const updatedFallbackPrice = gift.amount
            ?? (Array.isArray(gift.amountOptions) && gift.amountOptions.length
                ? Math.min(...gift.amountOptions)
                : null);
        res.json({
            id: gift._id.toString(),
            title: localize(gift.title, lang),
            description: localize(gift.description, lang),
            amount: gift.amount,
            amountOptions: gift.amountOptions,
            available: gift.available,
            purchased: purchaseCount,
            image: imageData,
            priceDisplay: updatedFallbackPrice != null ? `€${updatedFallbackPrice}` : '—'
        });
    } catch (e) { next(e); }
}

async function listCashPurchases(req, res, next) {
  try {
    const lang = getLang(req);
    const choices = await GiftChoice.find({ paymentMethod: 'cash' })
      .populate('giftId', 'title amount amountOptions type cubeId figurineId description')
      .populate('guestId', 'name email')
      .sort({ date: -1 })
      .lean();

    const items = choices.map(c => {
      const gift = c.giftId || {};
      const guest = c.guestId || {};
      const isCube = gift.type === 'cube';
      return {
        id: c._id.toString(),
        date: c.date ? c.date.toISOString() : null,
        amount: c.amount,
        message: c.message || '',
        giftFrom: c.giftFrom || '',
        guestId: guest._id ? guest._id.toString() : null,
        guestName: guest.name || '',
        guestEmail: guest.email || '',
        giftId: gift._id ? gift._id.toString() : null,
        giftTitle: gift.title ? localize(gift.title, lang) : '',
        giftType: gift.type || 'cash',
        cubeId: isCube && Number.isFinite(gift.cubeId) ? gift.cubeId : null,
        cubeDescriptionSnippet: isCube ? adminExp.buildCubeDescriptionSnippet(gift.description, lang) : null,
      };
    });
    res.json(items);
  } catch (e) { next(e); }
}

async function createCashGiftPurchase(req, res, next) {
  try {
    const lang = getLang(req);
    const { guestEmail, giftId, amount, message, giftFrom, sendEmails } = req.body || {};

    if (!guestEmail || typeof guestEmail !== 'string') {
      return res.status(400).json({ error: 'guestEmail is required' });
    }
    if (!giftId || typeof giftId !== 'string') {
      return res.status(400).json({ error: 'giftId is required' });
    }

    const guest = await Guest.findOne({ email: String(guestEmail).trim().toLowerCase() }).lean();
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    const gift = await Gift.findById(giftId).lean();
    if (!gift || !gift.enabled) {
      return res.status(404).json({ error: 'Gift not found or not available' });
    }

    const purchaseCount = await GiftChoice.countDocuments({ giftId: gift._id });
    const stock = gift.available - purchaseCount;
    if (stock <= 0) {
      return res.status(400).json({ error: 'Gift is out of stock' });
    }

    const giftType = gift.type || 'cash';
    const hasAmountOptions = Array.isArray(gift.amountOptions) && gift.amountOptions.length > 0;
    let chargeAmount;
    if (giftType === 'cube' || giftType === 'figurine' || hasAmountOptions) {
      const options = gift.amountOptions || [];
      const maxOption = options.length ? Math.max(...options) : 0;
      const parsed = Number(amount);
      const isPresetMatch = options.includes(parsed);
      const isCustomAboveMax = Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > maxOption;
      if (!Number.isFinite(parsed) || (!isPresetMatch && !isCustomAboveMax)) {
        return res.status(400).json({
          error: `Invalid amount for ${giftType} gift; must be one of amountOptions or a custom integer amount greater than €${maxOption}`,
          amountOptions: options,
          maxPresetAmount: maxOption,
        });
      }
      chargeAmount = parsed;
    } else {
      chargeAmount = gift.amount;
    }

    const safeMessage = typeof message === 'string'
      ? message.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').slice(0, 240)
      : '';
    const safeGiftFrom = typeof giftFrom === 'string'
      ? giftFrom.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, 80)
      : '';

    const adminId = (req.user && req.user.id) ? req.user.id : null;

    const giftChoice = await GiftChoice.create({
      giftId: gift._id,
      guestId: guest._id,
      message: safeMessage || null,
      giftFrom: safeGiftFrom || null,
      amount: chargeAmount,
      lang: (lang && ['en','es','fr','de'].includes(lang)) ? lang : (guest.lang || 'en'),
      date: new Date(),
      paymentMethod: 'cash',
      stripeSessionId: null,
      anonymous: false,
      anonymousBuyerEmail: null,
      createdByAdminId: adminId,
    });

    if (sendEmails !== false) {
      guestCtrl.sendGiftPurchaseEmails({
        guestId: guest._id,
        giftId: gift._id,
        giftChoice,
        langOverride: giftChoice.lang,
        anonymous: false,
        anonymousBuyerEmail: null,
      }).catch(err => {
        console.error('[email] Cash purchase email dispatch failed:', err && err.message ? err.message : err);
      });
    }

    res.status(201).json({
      id: giftChoice._id.toString(),
      giftId: gift._id.toString(),
      guestId: guest._id.toString(),
      amount: chargeAmount,
      date: giftChoice.date.toISOString(),
    });
  } catch (e) {
    console.error('Cash gift purchase creation error:', e);
    next(e);
  }
}

async function deleteCashGiftPurchase(req, res, next) {
  try {
    const { id } = req.params;
    const choice = await GiftChoice.findById(id);
    if (!choice) return res.status(404).json({ error: 'Purchase not found' });
    if (choice.paymentMethod !== 'cash') {
      return res.status(400).json({ error: 'Only cash purchases can be deleted from this endpoint' });
    }
    await choice.deleteOne();
    res.json({ ok: true });
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

async function testEmail(req, res, next) {
  try {
    const { type = 'buyer', guestEmail, lang } = req.body || {};
    if (!['buyer', 'couple', 'both'].includes(type)) {
      return res.status(400).json({ error: 'type must be one of: buyer, couple, both' });
    }
    const guest = guestEmail
      ? await Guest.findOne({ email: guestEmail }).lean()
      : await Guest.findOne({ email: req.user.email }).lean();
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found for email: ' + (guestEmail || req.user.email) });
    }
    if (lang && ['en', 'es', 'fr', 'de'].includes(lang)) {
      guest.lang = lang;
    }
    const sampleGift = (await Gift.findOne({ type: 'cash' }).lean()) || (await Gift.findOne().lean());
    if (!sampleGift) {
      return res.status(500).json({ error: 'No gifts in database to use for sample' });
    }
    const sampleGiftChoice = {
      amount: 75,
      message: 'Wishing you both a wonderful honeymoon — this is a test email.',
      giftFrom: guest.name || 'Test Sender',
      date: new Date(),
      stripeSessionId: 'test_session_' + Date.now(),
    };

    const results = {};
    if (type === 'buyer' || type === 'both') {
      results.buyer = await emailService.sendGiftConfirmationToBuyer({ guest, gift: sampleGift, giftChoice: sampleGiftChoice })
        .catch(err => ({ error: err.message || String(err) }));
    }
    if (type === 'couple' || type === 'both') {
      results.couple = await emailService.sendGiftNotificationToCouple({ guest, gift: sampleGift, giftChoice: sampleGiftChoice })
        .catch(err => ({ error: err.message || String(err) }));
    }
    res.json({ ok: true, results, guestUsed: { name: guest.name, email: guest.email, lang: guest.lang } });
  } catch (e) { next(e); }
}

module.exports = {
  // gifts
  listGifts, createGift, updateGift, deleteGift, getGiftChoices, getGiftCardImages, uploadGiftImage,
  // cash gift purchases (admin-initiated, no Stripe involvement)
  listCashPurchases, createCashGiftPurchase, deleteCashGiftPurchase,
  // agenda
  listEventsAdmin, createEventsItem, updateEventsItem, deleteEventsItem, uploadEventImage,
  // menu options
  uploadCourseOptionImage,
  // settings
  getSettings, updateSettings,
  // email
  testEmail,
  formatCourseForApi, formatCourseOptionForApi
};

