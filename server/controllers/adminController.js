const { Message, Config, Gift, Event, GiftChoice, Course, CourseOption, CourseOptionImage, GiftImage } = require('../models');
const { getAvailableGiftCardImages } = require('../utils/imageUtils');
const { generateDietaryIconsHTML, generateSelectionIconHTML } = require('../utils/menuIcons');

// Format event for API response according to README specification
function formatEventForApi(event) {
  // Helper function to extract string value from either Map or plain object
  const getStringValue = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // Handle Map objects (newer format)
      if (typeof value.get === 'function') {
        return value.get('en') || value.get('es') || value.get('default') || '';
      }
      // Handle plain objects (legacy format)
      return value.en || value.es || value.default || '';
    }
    return null;
  };

  // Format image data for display
  let imageData = null;
  if (event.image && event.image.data) {
    // Database-stored image with populated data
    const base64Data = event.image.data.toString('base64');
    imageData = `data:${event.image.contentType};base64,${base64Data}`;
  } else if (typeof event.image === 'string' && event.image.startsWith('/')) {
    // Legacy URL-based image
    imageData = event.image;
  } else if (event.image && event.image._id) {
    // Image reference with populated data
    if (event.image.data) {
      const base64Data = event.image.data.toString('base64');
      imageData = `data:${event.image.contentType};base64,${base64Data}`;
    }
  } else if (event.image && typeof event.image === 'string' && event.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(event.image)) {
    // ObjectId reference - return the ObjectId string for frontend to use API endpoint
    imageData = event.image;
  }

  return {
    id: event._id.toString(),
    name: event.name,
    date: event.date ? event.date.toISOString() : null,
    end: event.end ? event.end.toISOString() : null,
    locationAddress: event.locationAddress || '',
    locationLatitude: event.locationLatitude || null,
    locationLongitude: event.locationLongitude || null,
    // Legacy location field for backward compatibility
    location: event.location || event.locationAddress || '',
    title: getStringValue(event.title),
    description: getStringValue(event.description),
    image: imageData,
    sub_events: (event.sub_events || []).map(sub => ({
      name: sub.name,
      date: sub.date ? sub.date.toISOString() : null,
      end: sub.end ? sub.end.toISOString() : null,
      description: sub.description || null,
      icon: sub.icon
    }))
  };
}

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
  try {
    const events = await Event.find({})
      .sort({ date: 1, order: 1, createdAt: 1 })
      .populate('image')
      .lean();
    
    const items = events.map(formatEventForApi);
    res.json(items);
  } catch (e) { next(e); }
}

async function createEventsItem(req, res, next) {
  try {
    const { name, date, end, location, locationAddress, locationLatitude, locationLongitude, title, description, image, sub_events } = req.body;
    
    // Convert strings to localized maps if needed
    const convertToMap = (value) => {
      if (!value) return undefined;
      if (typeof value === 'string') return { en: value };
      if (typeof value === 'object') return value;
      return undefined;
    };

    // Handle image reference
    let imageRef = undefined;
    if (image && image.imageId) {
      // New format - reference to uploaded image
      imageRef = image.imageId;
    } else if (typeof image === 'string' && image.startsWith('/')) {
      // Legacy URL-based image
      imageRef = image;
    }
    
    const event = await Event.create({
      name,
      date: date ? new Date(date) : null,
      end: end ? new Date(end) : null,
      location,
      locationAddress: locationAddress || location || '',
      locationLatitude: locationLatitude ? parseFloat(locationLatitude) : null,
      locationLongitude: locationLongitude ? parseFloat(locationLongitude) : null,
      title: convertToMap(title),
      description: convertToMap(description),
      image: imageRef,
      sub_events: (sub_events || []).map(sub => ({
        name: sub.name,
        date: sub.date ? new Date(sub.date) : null,
        end: sub.end ? new Date(sub.end) : null,
        description: sub.description, // Keep sub-event description as plain string
        icon: sub.icon
      }))
    });

    res.status(201).json(formatEventForApi(event));
  } catch (e) { next(e); }
}

async function updateEventsItem(req, res, next) {
  try {
    const { id } = req.params;
    const { name, date, end, location, locationAddress, locationLatitude, locationLongitude, title, description, image, sub_events } = req.body;

    // Convert strings to localized maps if needed
    const convertToMap = (value) => {
      if (!value) return undefined;
      if (typeof value === 'string') return { en: value };
      if (typeof value === 'object') return value;
      return undefined;
    };

    // Handle image reference
    let imageRef = undefined;
    if (image !== undefined) {
      if (!image) {
        // Image explicitly set to null/empty, remove it
        imageRef = undefined;
      } else if (image.imageId) {
        // New format - reference to uploaded image
        imageRef = image.imageId;
      } else if (typeof image === 'string' && image.startsWith('/')) {
        // Legacy URL-based image
        imageRef = image;
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(date && { date: new Date(date) }),
      ...(end && { end: new Date(end) }),
      ...(location && { location }),
      ...(locationAddress && { locationAddress }),
      ...(locationLatitude && { locationLatitude: parseFloat(locationLatitude) }),
      ...(locationLongitude && { locationLongitude: parseFloat(locationLongitude) }),
      ...(title && { title: convertToMap(title) }),
      ...(description && { description: convertToMap(description) }),
      ...(sub_events && { 
        sub_events: sub_events.map(sub => ({
          name: sub.name,
          date: sub.date ? new Date(sub.date) : null,
          end: sub.end ? new Date(sub.end) : null,
          description: sub.description, // Keep sub-event description as plain string
          icon: sub.icon
        }))
      })
    };

    // Add image reference to update if provided
    if (imageRef !== undefined) {
      updateData.image = imageRef;
    }

    const event = await Event.findByIdAndUpdate(id, updateData, { new: true });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    res.json(formatEventForApi(event));
  } catch (e) { next(e); }
}

async function deleteEventsItem(req, res, next) {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
}

// ========== Course Management ==========

// Format course for API response
function formatCourseForApi(course) {
  return {
    id: course._id.toString(),
    course: course.course,
    label: course.label,
    selectionRequired: course.selectionRequired !== undefined ? course.selectionRequired : true,
    selectionIcon: generateSelectionIconHTML(course)
  };
}

// Format course option for API response
function formatCourseOptionForApi(option) {
  // Format image data for display
  let imageData = null;
  if (option.image && option.image.data) {
    // Database-stored image with populated data
    const base64Data = option.image.data.toString('base64');
    imageData = `data:${option.image.contentType};base64,${base64Data}`;
  } else if (option.image && option.image._id) {
    // Image reference with populated data
    if (option.image.data) {
      const base64Data = option.image.data.toString('base64');
      imageData = `data:${option.image.contentType};base64,${base64Data}`;
    }
  } else if (option.image && typeof option.image === 'string' && option.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(option.image)) {
    // ObjectId reference - return the ObjectId string for frontend to use API endpoint
    imageData = option.image;
  }

  return {
    id: option._id.toString(),
    courseId: option.courseId.toString(),
    label: option.label,
    image: imageData,
    description: option.description || null,
    // Special Dietary Indicators
    isVegetarian: option.isVegetarian || false,
    containsAllergens: option.containsAllergens || false,
    containsLactose: option.containsLactose || false,
    isSpicy: option.isSpicy || false,
    containsNuts: option.containsNuts || false,
    dietaryIcons: generateDietaryIconsHTML(option)
  };
}

// Course CRUD operations (mimicking guest management)
async function listCourses(req, res, next) {
  try {
    const courses = await Course.find({}).sort({ course: 1, createdAt: 1 });
    const formatted = courses.map(course => formatCourseForApi(course));
    res.json(formatted);
  } catch (e) { 
    next(e); 
  }
}

async function createCourse(req, res, next) {
  try {
    const { course, label, selectionRequired } = req.body;
    
    // Validate required fields
    if (!course || !['starter', 'main', 'dessert', 'drinks'].includes(course)) {
      return res.status(400).json({ error: 'Valid course (starter, main, dessert, drinks) is required' });
    }
    
    if (!label) {
      return res.status(400).json({ error: 'Label is required' });
    }
    
    const newCourse = await Course.create({ 
      course, 
      label, 
      selectionRequired: selectionRequired !== undefined ? selectionRequired : true 
    });
    res.status(201).json(formatCourseForApi(newCourse));
  } catch (e) { 
    next(e); 
  }
}

async function getCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(formatCourseForApi(course));
  } catch (e) { 
    next(e); 
  }
}

async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { course, label, selectionRequired } = req.body;
    
    const updateData = {};
    if (course && ['starter', 'main', 'dessert', 'drinks'].includes(course)) {
      updateData.course = course;
    }
    if (label) {
      updateData.label = label;
    }
    if (selectionRequired !== undefined) {
      updateData.selectionRequired = selectionRequired;
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(formatCourseForApi(updatedCourse));
  } catch (e) { 
    next(e); 
  }
}

async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if course has options
    const optionCount = await CourseOption.countDocuments({ courseId: id });
    if (optionCount > 0) {
      return res.status(400).json({ error: 'Cannot delete course with existing options. Delete options first.' });
    }
    
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ status: 'ok' });
  } catch (e) { 
    next(e); 
  }
}

// Course Options management (mimicking party management)
async function getCourseOptions(req, res, next) {
  try {
    const { courseId } = req.params;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const options = await CourseOption.find({ courseId }).sort({ createdAt: 1 });
    const formatted = options.map(option => formatCourseOptionForApi(option));
    res.json(formatted);
  } catch (e) { 
    next(e); 
  }
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

async function clearBlockedEvent(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    const obj = ensureEventInConfig(cfg.toObject());
    obj.otherOptions.event.blocked = false;
    obj.otherOptions.event.reason = '';
    obj.otherOptions.event.blockedAt = null;
    await Config.updateOne({ _id: cfg._id }, { $set: { otherOptions: obj.otherOptions } });
    res.json(obj);
  } catch (e) { next(e); }
}

// ========== Settings / Feature Toggles ==========
async function getSettings(req, res, next) {
  try {
    const cfg = await getConfigDoc();
    res.json({
      guestsEnabled: cfg.guestsEnabled !== undefined ? cfg.guestsEnabled : true,
      eventsEnabled: cfg.eventsEnabled !== undefined ? cfg.eventsEnabled : true,
      menuEnabled: cfg.menuEnabled !== undefined ? cfg.menuEnabled : true,
      messagesEnabled: cfg.messagesEnabled !== undefined ? cfg.messagesEnabled : true,
      giftsEnabled: cfg.giftsEnabled !== undefined ? cfg.giftsEnabled : true
    });
  } catch (e) { next(e); }
}

async function updateSettings(req, res, next) {
  try {
    const { eventsEnabled, guestsEnabled, menuEnabled, messagesEnabled, giftsEnabled } = req.body;
    
    const cfg = await getConfigDoc();
    await Config.updateOne({ _id: cfg._id }, {
      $set: {
        ...(guestsEnabled !== undefined && { guestsEnabled }),
        ...(eventsEnabled !== undefined && { eventsEnabled }),
        ...(menuEnabled !== undefined && { menuEnabled }),
        ...(messagesEnabled !== undefined && { messagesEnabled }),
        ...(giftsEnabled !== undefined && { giftsEnabled })
      }
    });

    // Return updated settings with defaults for any missing values
    const updatedCfg = await Config.findById(cfg._id);
    res.json({
      guestsEnabled: updatedCfg.guestsEnabled !== undefined ? updatedCfg.guestsEnabled : true,
      eventsEnabled: updatedCfg.eventsEnabled !== undefined ? updatedCfg.eventsEnabled : true,
      menuEnabled: updatedCfg.menuEnabled !== undefined ? updatedCfg.menuEnabled : true,
      messagesEnabled: updatedCfg.messagesEnabled !== undefined ? updatedCfg.messagesEnabled : true,
      giftsEnabled: updatedCfg.giftsEnabled !== undefined ? updatedCfg.giftsEnabled : true
    });
  } catch (e) { next(e); }
}

// ========== Gift Cards (MongoDB CRUD) ==========
async function listGifts(req, res, next) {
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
                name: gift.title, // Using 'name' as per requirements
                title: gift.title,
                description: gift.description,
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
        const { name, title, description, amount, available, image } = req.body;

        // Validate required fields
        if (!title && !name) {
            return res.status(400).json({ error: 'Name/title is required' });
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
            title: title || name,
            description,
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
            name: gift.title,
            title: gift.title,
            description: gift.description,
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
        const { id } = req.params;
        const { name, title, description, amount, available, image } = req.body;

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

        const updateData = {};
        if (title || name) updateData.title = title || name;
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amount = parseInt(amount);
        if (available !== undefined) updateData.available = parseInt(available);
        if (imageRef !== undefined) updateData.image = imageRef;

        const gift = await Gift.findByIdAndUpdate(id, updateData, { new: true }).populate('image');

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
            name: gift.title,
            title: gift.title,
            description: gift.description,
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

