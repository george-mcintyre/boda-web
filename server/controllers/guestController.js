const guestService = require('../services/guestService');
const { Guest, Gift, GiftChoice } = require('../models');

async function getMe(req, res, next) {
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });
    res.json({ name: me.name, email: me.email, status: me.status, companions: me.companions, specialMenu: me.specialMenu, message: me.message });
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
        adult: true, // Assuming primary guest is always adult
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
    const processedMembers = partyMembers.map(member => ({
      id: member.id || null,
      name: member.name,
      adult: member.adult !== false // Default to true if not specified
    }));
    
    // Update the guest with new party members
    me.partyMembers = processedMembers;
    await me.save();
    
    // Return the full party including primary guest
    const party = [
      {
        id: me._id.toString(),
        name: me.name,
        adult: true,
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
        adult: true, // Assuming primary guest is always adult
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
        adult: true,
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
      email: guest.email
    });
  } catch (e) { next(e); }
}

async function list(req, res, next) { try { res.json(await guestService.list()); } catch (e) { next(e); } }
async function create(req, res, next) { try { res.status(201).json(await guestService.create(req.body)); } catch (e) { next(e); } }
async function update(req, res, next) { try { res.json(await guestService.update(req.params.id, req.body)); } catch (e) { next(e); } }
async function remove(req, res, next) { try { await guestService.remove(req.params.id); res.status(204).end(); } catch (e) { next(e); } }

// ========== Guest Gift Functions ==========
async function getGifts(req, res, next) {
  try {
    const gifts = await Gift.find({ enabled: true, available: { $gt: 0 } }).sort({ createdAt: -1 }).lean();
    const items = gifts.map(gift => ({
      id: gift._id.toString(),
      title: gift.title,
      description: gift.description,
      amount: gift.amount,
      available: gift.available,
      image: gift.image
    }));
    res.json(items);
  } catch (e) { next(e); }
}

async function getGiftChoices(req, res, next) {
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });

    const giftChoices = await GiftChoice.find({ guestId: me._id })
      .populate('giftId', 'title amount')
      .sort({ date: -1 })
      .lean();

    const items = giftChoices.map(choice => ({
      giftId: choice.giftId._id.toString(),
      date: choice.date.toISOString(),
      message: choice.message
    }));

    res.json(items);
  } catch (e) { next(e); }
}

async function createPaymentSession(req, res, next) {
  try {
    const { giftId, message } = req.body;
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });

    const gift = await Gift.findById(giftId);
    if (!gift || !gift.enabled || gift.available <= 0) {
      return res.status(404).json({ error: 'Gift not found or not available' });
    }

    // Create a record of the gift choice (pending payment)
    const giftChoice = await GiftChoice.create({
      giftId: gift._id,
      guestId: me._id,
      message: message || null
    });

    // TODO: Implement Stripe integration
    // For now, return a mock checkout URL
    const checkoutUrl = `https://checkout.stripe.com/pay/mock_session_${giftChoice._id}`;
    
    res.json({ checkoutUrl });
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
  getGifts,
  getGiftChoices,
  createPaymentSession
};
