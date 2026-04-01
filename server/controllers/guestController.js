const mongoose = require('mongoose');
const guestService = require('../services/guestService');
const { Guest, Gift, GiftChoice, ChefProfile, DayMenu, Table, TableAssignment } = require('../models');
const stripe = require('../config/stripe');
const { APP_URL } = require('../config/env');
const { getLang, localize } = require('../utils/localized');

async function getMe(req, res, next) {
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });
    res.json({ name: me.name, email: me.email, partyMembers: me.partyMembers, specialMenu: me.specialMenu, message: me.message });
  } catch (e) { next(e); }
}

// Party management for the current authenticated guest
async function getParty(req, res, next) {
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });
    
    let needsSave = false;
    (me.partyMembers || []).forEach(member => {
      if (!member.id) {
        member.id = new mongoose.Types.ObjectId().toString();
        needsSave = true;
      }
    });
    if (needsSave) await me.save();

    const party = [
      {
        id: me._id.toString(),
        name: me.name,
        adult: me.adult,
        primary: true
      },
      ...(me.partyMembers || []).map(member => ({
        id: member.id,
        name: member.name,
        adult: member.adult !== false
      }))
    ];
    
    res.json(party);
  } catch (e) { next(e); }
}

async function updateParty(req, res, next) {
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });
    
    const partyMembers = req.body || [];
    
    // Validate input
    if (!Array.isArray(partyMembers)) {
      return res.status(400).json({ error: 'Party members must be an array' });
    }
    
    const oldNames = new Set((me.partyMembers || []).map(m => m.name));
    
    // Process party members (excluding primary guest who is handled separately)
    const myId = me._id.toString();
    // 1) Find the member that corresponds to "me"
    const meMember = partyMembers.find(
      member => member.id && member.id.toString() === myId
    );

    if (meMember) {
      me.name = meMember.name; // Update my name if provided
      me.adult = meMember.adult; // Update adult status if provided
    }

    const processedMembers = partyMembers
     .filter(member => member.id !== myId)
     .map(member => ({
       id: member.id || new mongoose.Types.ObjectId().toString(),
       name: member.name,
       adult: member.adult !== false
     }));
    
    const newNames = new Set(processedMembers.map(m => m.name));
    const removedNames = [...oldNames].filter(n => !newNames.has(n));
    
    me.partyMembers = processedMembers;
    await me.save();
    
    if (removedNames.length) {
      await TableAssignment.deleteMany({ guestId: me._id, partyMemberName: { $in: removedNames } });
    }
    
    // Return the full party including primary guest
    const party = [
      {
        id: me._id.toString(),
        name: me.name,
        adult: me.adult,
        primary: true
      },
      ...processedMembers
    ];
    
    res.json(party);
  } catch (e) { next(e); }
}

// Admin party management for any guest
async function getPartyByGuestId(req, res, next) {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    
    let needsSave = false;
    (guest.partyMembers || []).forEach(member => {
      if (!member.id) {
        member.id = new mongoose.Types.ObjectId().toString();
        needsSave = true;
      }
    });
    if (needsSave) await guest.save();

    const party = [
      {
        id: guest._id.toString(),
        name: guest.name,
        adult: guest.adult,
        primary: true
      },
      ...(guest.partyMembers || []).map(member => ({
        id: member.id,
        name: member.name,
        adult: member.adult !== false
      }))
    ];
    
    res.json(party);
  } catch (e) { next(e); }
}

async function updatePartyByGuestId(req, res, next) {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    
    const partyMembers = req.body || [];
    
    // Validate input
    if (!Array.isArray(partyMembers)) {
      return res.status(400).json({ error: 'Party members must be an array' });
    }
    
    const oldNames = new Set((guest.partyMembers || []).map(m => m.name));
    
    const processedMembers = partyMembers.map(member => ({
      id: member.id || new mongoose.Types.ObjectId().toString(),
      name: member.name,
      adult: member.adult !== false
    }));
    
    const newNames = new Set(processedMembers.map(m => m.name));
    const removedNames = [...oldNames].filter(n => !newNames.has(n));
    
    guest.partyMembers = processedMembers;
    await guest.save();
    
    if (removedNames.length) {
      await TableAssignment.deleteMany({ guestId: guest._id, partyMemberName: { $in: removedNames } });
    }
    
    // Return the full party including primary guest
    const party = [
      {
        id: guest._id.toString(),
        name: guest.name,
        adult: guest.adult, // Use actual adult status from database
        primary: true
      },
      ...processedMembers
    ];
    
    res.json(party);
  } catch (e) { next(e); }
}

// Helper method for admin to get single guest by ID
async function getById(req, res, next) {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    res.json({
      id: guest._id.toString(),
      name: guest.name,
      email: guest.email,
      adult: guest.adult !== false // Default to true if not specified
    });
  } catch (e) { next(e); }
}

async function list(req, res, next) { try { res.json(await guestService.list()); } catch (e) { next(e); } }
async function create(req, res, next) { try { res.status(201).json(await guestService.create(req.body)); } catch (e) { next(e); } }
async function update(req, res, next) { try { res.json(await guestService.update(req.params.id, req.body)); } catch (e) { next(e); } }
async function remove(req, res, next) { try { await guestService.remove(req.params.id); res.status(204).end(); } catch (e) { next(e); } }

async function bulkUpload(req, res, next) {
  try {
    const { guests } = req.body;
    
    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ error: 'Invalid guests data' });
    }

    const results = await guestService.bulkCreate(guests);
    res.status(200).json(results);
  } catch (e) { 
    next(e); 
  }
}

// ========== Guest Gift Functions ==========
async function getGifts(req, res, next) {
  const lang = getLang(req);
  try {
    // Sort by amount (price) ascending as per requirements
    const gifts = await Gift.find().sort({ amount: 1 }).lean();
    
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
      const title = localize(gift.title, lang);
      const description = localize(gift.description, lang);
      const purchased = purchaseCountMap[gift._id.toString()] || 0;
      const stock = gift.available - purchased;
      
      // Generate image URL - gift.image could be an ObjectId reference or a number
      let imageUrl;
      if (gift.image) {
        imageUrl = `/api/guest/gifts/${gift._id}/image`;
      } else {
        throw new Error('Cannot find image for gift');
      }
      
      return {
        id: gift._id.toString(),
        title: String(title),
        description: String(description),
        amount: gift.amount,
        available: gift.available,
        purchased: purchased,
        stock: stock,
        image: gift.image,
        imageUrl: imageUrl,
        priceDisplay: `€${gift.amount}`
      };
    });
    res.json(items);
  } catch (e) { next(e); }
}

async function getGiftChoices(req, res, next) {
  const lang = getLang(req);
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });

    const giftChoices = await GiftChoice.find({ guestId: me._id })
      .populate('giftId', 'title amount description image')
      .sort({ date: -1 })
      .lean();

    const items = giftChoices.map(choice => {
      const gift = choice.giftId;
      
      // Generate image URL for the gift
      let imageUrl = `/api/guest/gifts/${gift._id}/image`;
      
      return {
        id: choice._id.toString(),
        giftId: gift._id.toString(),
        giftTitle: localize(gift.title, lang),
        giftAmount: gift.amount,
        giftDescription: localize(gift.description, lang),
        giftImageUrl: imageUrl,
        date: choice.date.toISOString(),
        message: choice.message
      };
    });

    res.json(items);
  } catch (e) { next(e); }
}

async function createPaymentSession(req, res, next) {
  try {
    const lang = getLang(req);
    const { giftId, message } = req.body;

    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });

    const gift = await Gift.findById(giftId).lean();
    if (!gift || !gift.enabled) {
      return res.status(404).json({ error: 'Gift not found or not available' });
    }

    // Stock check (same logic as before)
    const purchaseCount = await GiftChoice.countDocuments({ giftId: gift._id });
    const stock = gift.available - purchaseCount;
    if (stock <= 0) {
      return res.status(400).json({ error: 'Gift is out of stock' });
    }

    // Localised title/description – IMPORTANT: turn into plain strings
    const title = String(localize(gift.title, lang));
    const descRaw = localize(gift.description, lang);
    const description = String(
      descRaw || `Wedding gift: ${title}`
    );

    let imagePath;
    if (gift.image) {
      imagePath = `/api/guest/gifts/${gift._id.toString()}/image`;
    } else {
        return res.status(400).json({ error: 'Cannot find image for gift' });
    }

    // Stripe needs absolute URLs for images + redirects
    const baseUrlFromReq = `${req.protocol}://${req.get('host')}`;
    const baseUrl =
      typeof APP_URL === 'string' && APP_URL.trim().length > 0
        ? APP_URL
        : baseUrlFromReq;
    const imageUrl = `${baseUrl}${imagePath}`;

    const safeMessage = typeof message === 'string' ? message : '';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: gift.amount * 100,    // € → cents
            product_data: {
              name: title,                     // e.g. “Honeymoon Accommodation”
              description,                     // localised description
              images: [imageUrl],              // same visual as your card
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${baseUrl}/guests.html?tab=gifts&payment=success&giftId=${giftId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/guests.html?tab=gifts&payment=cancelled&session_id={CHECKOUT_SESSION_ID}`,

      customer_email: me.email,

      // So you can rebuild the “donated gifts” cards after payment
      metadata: {
        giftId: gift._id.toString(),
        giftTitle: title,
        giftAmount: String(gift.amount),
        giftImageUrl: imageUrl,
        guestId: me._id.toString(),
        guestEmail: me.email,
        guestName: me.name || '',
        message: safeMessage,
        lang,
      },
    });

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (e) {
    console.error('Stripe session creation error:', e);
    next(e);
  }
}

// Stripe webhook handler for payment confirmation
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!endpointSecret) {
      return res.status(400).send('Webhook Error: SECRET NOT SET');
    }

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid') {
      return res.json({ received: true });
    }

    try {
      const { giftId, guestId, message } = session.metadata || {};

      const existing = await GiftChoice.findOne({ stripeSessionId: session.id });
      if (existing) {
        console.log('GiftChoice already exists for session', session.id);
        return res.json({ received: true });
      }

      await GiftChoice.create({
        giftId,
        guestId,
        message: message || null,
        date: new Date(),
        stripeSessionId: session.id,
      });

      console.log(`Gift choice created for guest ${guestId}, gift ${giftId}`);
    } catch (err) {
      console.error('Error creating gift choice after payment:', err);
      return res.status(500).send('Webhook handler error');
    }
  }

  res.json({ received: true });
}

// Day Menu endpoints for guest-facing info pages
async function getDayMenus(req, res, next) {
  const lang = getLang(req);
  try {
    const dayMenus = await DayMenu.find()
      .populate('chefProfile')
      .populate('sections.image')
      .lean();

    const result = dayMenus.map(menu => {
      const sections = (menu.sections || []).map(section => ({
        title: localize(section.title, lang),
        content: localize(section.content, lang),
        imageUrl: section.image ? `/api/guest/day-menus/images/${section.image._id || section.image}` : null
      }));

      let chefProfile = null;
      if (menu.chefProfile) {
        chefProfile = {
          name: localize(menu.chefProfile.name, lang),
          bio: localize(menu.chefProfile.bio, lang),
          imageUrl: menu.chefProfile.image ? `/api/guest/chef-profiles/${menu.chefProfile.image}/image` : null
        };
      }

      return {
        day: menu.day,
        sections,
        chefProfile
      };
    });

    res.json(result);
  } catch (e) { next(e); }
}

// Get chef profile for banquet menu
async function getBanquetChefProfile(req, res, next) {
  const lang = getLang(req);
  try {
    const chefProfile = await ChefProfile.findOne({ menuType: 'banquet' })
      .lean();

    if (!chefProfile) {
      return res.json(null);
    }

    res.json({
      name: localize(chefProfile.name, lang),
      bio: localize(chefProfile.bio, lang),
      imageUrl: chefProfile.image ? `/api/guest/chef-profiles/${chefProfile.image.toString()}/image` : null
    });
  } catch (e) { next(e); }
}

// Get table assignments for the authenticated guest's party
async function getTableAssignments(req, res, next) {
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });

    const Table = require('../models/Table');
    const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const [assignments, fixedTable] = await Promise.all([
      TableAssignment.find({ guestId: me._id }).populate('tableId', 'number name isHeadTable fixedGuests').lean(),
      Table.findOne({ 'fixedGuests.name': { $regex: new RegExp(me.name.split(' ')[0], 'i') } }).lean()
    ]);

    let fixedSeat = null;
    let fixedTableNumber = null;
    if (fixedTable) {
      const myName = norm(me.name);
      const fixedIdx = fixedTable.fixedGuests.findIndex(fg => {
        const fn = norm(typeof fg === 'string' ? fg : (fg.name || fg));
        return myName.includes(fn) || fn.includes(myName);
      });
      if (fixedIdx >= 0) {
        fixedSeat = fixedIdx + 1;
        fixedTableNumber = fixedTable.number;
      }
    }

    const items = assignments.map(a => {
      const tableNum = a.tableId ? a.tableId.number : null;
      const fc = a.tableId && a.tableId.fixedGuests ? a.tableId.fixedGuests.length : 0;
      const isFixedOnThisTable = !a.partyMemberName && tableNum === fixedTableNumber && fixedSeat != null;
      return {
        tableNumber: tableNum,
        tableName: a.tableId ? a.tableId.name : null,
        isHeadTable: a.tableId ? a.tableId.isHeadTable : false,
        partyMemberName: a.partyMemberName || null,
        seatNumber: isFixedOnThisTable ? fixedSeat : (a.seatNumber ? a.seatNumber + fc : null)
      };
    });

    if (fixedSeat != null && !items.some(i => i.tableNumber === fixedTableNumber && !i.partyMemberName)) {
      items.push({
        tableNumber: fixedTable.number,
        tableName: fixedTable.name || null,
        isHeadTable: fixedTable.isHeadTable || false,
        partyMemberName: null,
        seatNumber: fixedSeat
      });
    }

    res.json(items);
  } catch (e) { next(e); }
}

// Get all people assigned to a specific table (by table number)
async function getTableCompanions(req, res, next) {
  try {
    const tableNumber = parseInt(req.params.tableNumber, 10);
    if (isNaN(tableNumber)) return res.status(400).json({ error: 'Invalid table number' });

    const Table = require('../models/Table');
    const table = await Table.findOne({ number: tableNumber }).lean();
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const assignments = await TableAssignment.find({ tableId: table._id })
      .populate('guestId', 'name partyMembers')
      .lean();

    // Build list: start with fixedGuests (e.g. bride/groom on Head Table)
    const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const fixedNames = new Set((table.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg))));
    const fixedCount = (table.fixedGuests || []).length;
    const companions = (table.fixedGuests || []).map((fg, i) => ({
      name: typeof fg === 'string' ? fg : (fg.name || fg),
      seatNumber: i + 1
    }));
    for (const a of assignments) {
      if (!a.guestId) continue;
      if (a.partyMemberName) {
        const memberNames = (a.guestId.partyMembers || []).map(m => m.name);
        if (!memberNames.includes(a.partyMemberName)) continue;
      }
      const displayName = a.partyMemberName || a.guestId.name;
      if (!fixedNames.has(norm(a.guestId.name))) {
        companions.push({ name: displayName, seatNumber: a.seatNumber ? a.seatNumber + fixedCount : null });
      }
    }

    res.json({
      tableNumber,
      tableName: table.name || null,
      isHeadTable: table.isHeadTable || false,
      companions
    });
  } catch (e) { next(e); }
}


module.exports = {
  getMe,
  getParty,
  updateParty,
  getPartyByGuestId,
  updatePartyByGuestId,
  getById,
  list,
  create,
  update,
  remove,
  bulkUpload,
  getGifts,
  getGiftChoices,
  createPaymentSession,
  handleStripeWebhook,
  getDayMenus,
  getBanquetChefProfile,
  getTableAssignments,
  getTableCompanions
};
