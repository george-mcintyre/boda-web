const { Message } = require('../models');

// Build reaction counts and user reaction status from userReactions array
function formatReactionsForApi(message, currentUserEmail) {
  const userReactions = message.userReactions || [];
  const reactionMap = {};
  
  // Count reactions by emoji and track if current user reacted
  userReactions.forEach(userReaction => {
    const { emoji, email } = userReaction;
    if (!reactionMap[emoji]) {
      reactionMap[emoji] = { count: 0, reacted: false };
    }
    reactionMap[emoji].count += 1;
    if (email === currentUserEmail) {
      reactionMap[emoji].reacted = true;
    }
  });
  
  // Convert to array format
  return Object.entries(reactionMap).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    reacted: data.reacted
  }));
}

// Helper to format a message for API response
function formatMessageForApi(message, currentUserEmail = null) {
  const reactions = formatReactionsForApi(message, currentUserEmail);
  
  return {
    id: message._id.toString(),
    body: message.content || message.body || '',
    createdAt: message.createdAt.toISOString(),
    author: message.name || message.author || null,
    reactions
  };
}

// Guest: list messages with pagination
async function listGuestMessages(req, res, next) {
  try {
    const { cursor, limit = 10 } = req.query;
    const query = Message.find({}).sort({ createdAt: -1 });
    
    if (cursor) {
      query.where({ _id: { $lt: cursor } });
    }
    
    const items = await query.limit(parseInt(limit) + 1).lean();
    const hasMore = items.length > limit;
    const itemsToReturn = hasMore ? items.slice(0, limit) : items;
    
    const currentUserEmail = req.user?.email || null;
    const formattedItems = itemsToReturn.map(message => 
      formatMessageForApi(message, currentUserEmail)
    );
    
    const response = {
      items: formattedItems,
      nextCursor: hasMore ? itemsToReturn[itemsToReturn.length - 1]._id.toString() : null
    };
    
    res.json(response);
  } catch (e) {
    next(e);
  }
}

// Admin: list messages with pagination
async function listAdminMessages(req, res, next) {
  try {
    const { cursor, limit = 10 } = req.query;
    const query = Message.find({}).sort({ createdAt: -1 });
    
    if (cursor) {
      query.where({ _id: { $lt: cursor } });
    }
    
    const items = await query.limit(parseInt(limit) + 1).lean();
    const hasMore = items.length > limit;
    const itemsToReturn = hasMore ? items.slice(0, limit) : items;
    
    const currentUserEmail = req.user?.email || null;
    const formattedItems = itemsToReturn.map(message => 
      formatMessageForApi(message, currentUserEmail)
    );
    
    const response = {
      items: formattedItems,
      nextCursor: hasMore ? itemsToReturn[itemsToReturn.length - 1]._id.toString() : null
    };
    
    res.json(response);
  } catch (e) {
    next(e);
  }
}

// Guest: create a message
async function createGuestMessage(req, res, next) {
  try {
    const { body } = req.body || {};
    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const name = req.user?.name || req.user?.nombre || 'Guest';
    const email = req.user?.email || '';
    
    const message = await Message.create({ 
      name, 
      email, 
      content: body
    });
    
    const response = formatMessageForApi(message, email);
    res.status(201).json(response);
  } catch (e) { 
    next(e); 
  }
}

// Admin: create a message
async function createAdminMessage(req, res, next) {
  try {
    const { body } = req.body || {};
    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const message = await Message.create({ 
      content: body,
      author: 'admin',
      name: 'admin'
    });
    
    const response = formatMessageForApi(message, req.user?.email || '');
    res.status(201).json(response);
  } catch (e) { 
    next(e); 
  }
}

// Helper to normalize various userReactions shapes to array of {email, emoji}
function toUserReactionsArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(x => x && x.email && x.emoji);
  if (val instanceof Map) return Array.from(val.entries()).map(([email, emoji]) => ({ email, emoji })).filter(x => x.email && x.emoji);
  if (typeof val === 'object') return Object.entries(val).map(([email, emoji]) => ({ email, emoji })).filter(x => x.email && x.emoji);
  return [];
}

// Guest: set/toggle single reaction selection
async function reactGuest(req, res, next) {
  try {
    const id = req.params.id;
    const { emoji } = req.body || {};
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'emoji is required' });
    }
    const email = req.user?.email || '';
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const doc = await Message.findById(id);
    if (!doc) return res.status(404).json({ error: 'Message not found' });

    // Ensure userReactions array exists
    if (!doc.userReactions) doc.userReactions = [];

    // Normalize userReactions to array form
    let ura = toUserReactionsArray(doc.userReactions);

    const idx = ura.findIndex(x => String(x.email) === String(email));
    let newSelection = null;
    if (idx !== -1) {
      if (ura[idx].emoji === emoji) {
        // toggle off
        ura.splice(idx, 1);
        newSelection = null;
      } else {
        ura[idx].emoji = emoji;
        newSelection = emoji;
      }
    } else {
      ura.push({ email, emoji });
      newSelection = emoji;
    }

    // Assign back to document
    doc.userReactions = ura;
    await doc.save();

    res.json({ status: 'ok' });
  } catch (e) { 
    next(e); 
  }
}

// Admin: set/toggle single reaction selection
async function reactAdmin(req, res, next) {
  try {
    const id = req.params.id;
    const { emoji } = req.body || {};
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'emoji is required' });
    }
    const email = req.user?.email || '';
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const doc = await Message.findById(id);
    if (!doc) return res.status(404).json({ error: 'Message not found' });

    // Ensure userReactions array exists
    if (!doc.userReactions) doc.userReactions = [];

    // Normalize userReactions to array form
    let ura = toUserReactionsArray(doc.userReactions);

    const idx = ura.findIndex(x => String(x.email) === String(email));
    let newSelection = null;
    if (idx !== -1) {
      if (ura[idx].emoji === emoji) {
        // toggle off
        ura.splice(idx, 1);
        newSelection = null;
      } else {
        ura[idx].emoji = emoji;
        newSelection = emoji;
      }
    } else {
      ura.push({ email, emoji });
      newSelection = emoji;
    }

    // Assign back to document
    doc.userReactions = ura;
    await doc.save();

    res.json({ status: 'ok' });
  } catch (e) { 
    next(e); 
  }
}

// Admin: update a message
async function updateAdminMessage(req, res, next) {
  try {
    const id = req.params.id;
    const { body } = req.body || {};
    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await Message.findByIdAndUpdate(
      id,
      { content: body },
      { new: true }
    );

    if (!message) return res.status(404).json({ error: 'Message not found' });

    const response = formatMessageForApi(message, req.user?.email || '');
    res.json(response);
  } catch (e) { 
    next(e); 
  }
}

// Admin: delete a message
async function deleteAdminMessage(req, res, next) {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ status: 'ok' });
  } catch (e) { 
    next(e); 
  }
}

module.exports = {
  listGuestMessages,
  listAdminMessages,
  createGuestMessage,
  createAdminMessage,
  reactGuest,
  reactAdmin,
  updateAdminMessage,
  deleteAdminMessage
};
