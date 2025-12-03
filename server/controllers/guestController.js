const guestService = require('../services/guestService');
const { Guest, Gift, GiftChoice } = require('../models');
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
    
    // Primary guest is automatically added to the party list by the server
    const party = [
      {
        id: me._id.toString(),
        name: me.name,
        adult: me.adult, // Use actual adult status from database
        primary: true
      },
      ...(me.partyMembers || []).map(member => ({
        id: member.id || null,
        name: member.name,
        adult: member.adult !== false // Default to true if not specified
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
     .filter(member => member.id !== myId) // exclude yourself
     .map(member => ({
       id: member.id || null,
       name: member.name,
       adult: member.adult !== false // default to true
     }));
    
    // Update the guest with new party members
    me.partyMembers = processedMembers;
    await me.save();
    
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
    
    // Primary guest is automatically added to the party list by the server
    const party = [
      {
        id: guest._id.toString(),
        name: guest.name,
        adult: guest.adult, // Use actual adult status from database
        primary: true
      },
      ...(guest.partyMembers || []).map(member => ({
        id: member.id || null,
        name: member.name,
        adult: member.adult !== false // Default to true if not specified
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
    
    // Process party members (excluding primary guest who is handled separately)
    const processedMembers = partyMembers.map(member => ({
      id: member.id || null,
      name: member.name,
      adult: member.adult !== false // Default to true if not specified
    }));
    
    // Update the guest with new party members
    guest.partyMembers = processedMembers;
    await guest.save();
    
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
      if (typeof gift.image === 'number') {
        imageUrl = `/assets/images/gift-cards/image_${String(gift.image).padStart(2, '0')}.jpg`;
      } else if (gift.image) {
        // ObjectId reference - use the guest gift image endpoint
        imageUrl = `/api/guest/gifts/${gift._id}/image`;
      } else {
        // Default fallback image
        imageUrl = `/assets/images/gift-cards/image_01.jpg`;
      }
      
      return {
        id: gift._id.toString(),
        title: title,
        description: description,
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
    const { giftId, message } = req.body;
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });

    const gift = await Gift.findById(giftId);
    if (!gift || !gift.enabled) {
      return res.status(404).json({ error: 'Gift not found or not available' });
    }
    
    // Check stock availability
    const purchaseCount = await GiftChoice.countDocuments({ giftId: gift._id });
    const stock = gift.available - purchaseCount;
    if (stock <= 0) {
      return res.status(400).json({ error: 'Gift is out of stock' });
    }

    // Determine base URL for redirects
    const baseUrlFromReq = `${req.protocol}://${req.get('host')}`;
    const baseUrl =
      typeof APP_URL === 'string' && APP_URL.trim().length > 0
        ? APP_URL
        : baseUrlFromReq;
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: String(gift.title),
              description: String(
                gift.description || `Wedding gift: ${gift.title}`
              ),
            },
            unit_amount: gift.amount * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/guests.html?tab=gifts&payment=success&giftId=${giftId}`,
      cancel_url: `${baseUrl}/guests.html?tab=gifts&payment=cancelled`,
      metadata: {
        giftId: giftId,
        guestId: me._id.toString(),
        guestEmail: me.email,
        guestName: me.name,
        message: typeof message === 'string' ? message : ''
      },
      customer_email: me.email,
    });

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (e) {
    next(e);
  }
}

// Stripe webhook handler for payment confirmation
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without webhook secret
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      const { giftId, guestId, message } = session.metadata;
      
      // Create the gift choice record
      await GiftChoice.create({
        giftId: giftId,
        guestId: guestId,
        message: message || null,
        date: new Date()
      });
      
      console.log(`Gift choice created for guest ${guestId}, gift ${giftId}`);
    } catch (err) {
      console.error('Error creating gift choice after payment:', err);
    }
  }

  res.json({ received: true });
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
  handleStripeWebhook
};
