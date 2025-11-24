const { MenuPart, MenuChoice, Guest } = require('../models');

// Helper to format menu part for API response
function formatMenuPartForApi(menuPart, index) {
  return {
    id: menuPart._id.toString(),
    course: menuPart.course,
    label: menuPart.label,
    options: (menuPart.options || []).map((option, optIndex) => ({
      id: option._id.toString(),
      label: option.label,
      image: option.image || null,
      description: option.description
    }))
  };
}

// Guest: list menu parts and options
async function listMenu(req, res, next) {
  try {
    const menuParts = await MenuPart.find({}).sort({ course: 1, createdAt: 1 });
    const formatted = menuParts.map(part => formatMenuPartForApi(part));
    res.json(formatted);
  } catch (e) {
    next(e);
  }
}

// Guest: get menu selections per party member
async function getMenuChoices(req, res, next) {
  try {
    const guestId = req.user.id;
    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    // Get existing menu choices
    let menuChoice = await MenuChoice.findOne({ guestId });
    
    // Build party member list including primary guest
    const partyMembers = [
      { 
        partyGuestId: `primary-${guestId}`, 
        name: guest.name || 'Primary Guest',
        adult: true,
        primary: true 
      }
    ];
    
    // Add additional party members
    if (guest.partyMembers && guest.partyMembers.length > 0) {
      guest.partyMembers.forEach(member => {
        partyMembers.push({
          partyGuestId: member.id || `member-${member._id}`,
          name: member.name,
          adult: member.adult !== false,
          primary: false
        });
      });
    }
    
    // If no menu choices exist, create default structure
    if (!menuChoice) {
      menuChoice = await MenuChoice.create({
        guestId,
        partyChoices: partyMembers.map(member => ({
          partyGuestId: member.partyGuestId,
          choices: [],
          specialRequest: null,
          specialRequestDetail: null
        }))
      });
    }
    
    // Format response
    const formattedChoices = menuChoice.partyChoices.map(choice => {
      const partyMember = partyMembers.find(pm => pm.partyGuestId === choice.partyGuestId);
      return {
        partyGuestId: choice.partyGuestId,
        choices: choice.choices || [],
        specialRequest: choice.specialRequest,
        specialRequestDetail: choice.specialRequestDetail,
        memberName: partyMember ? partyMember.name : 'Unknown'
      };
    });
    
    res.json(formattedChoices);
  } catch (e) {
    next(e);
  }
}

// Guest: update menu selections
async function updateMenuChoices(req, res, next) {
  try {
    const guestId = req.user.id;
    const { choices } = req.body;
    
    if (!Array.isArray(choices)) {
      return res.status(400).json({ error: 'Choices must be an array' });
    }
    
    // Validate choices structure
    for (const choice of choices) {
      if (!choice.partyGuestId || !Array.isArray(choice.choices)) {
        return res.status(400).json({ error: 'Invalid choice structure' });
      }
      
      for (const item of choice.choices) {
        if (!item.menuPartId) {
          return res.status(400).json({ error: 'menuPartId is required for each choice' });
        }
      }
      
      if (choice.specialRequest && !['vegan', 'vegetarian', 'nut allergy', 'other'].includes(choice.specialRequest)) {
        return res.status(400).json({ error: 'Invalid specialRequest value' });
      }
    }
    
    // Update or create menu choices
    const menuChoice = await MenuChoice.findOneAndUpdate(
      { guestId },
      { 
        partyChoices: choices.map(choice => ({
          partyGuestId: choice.partyGuestId,
          choices: choice.choices,
          specialRequest: choice.specialRequest || null,
          specialRequestDetail: choice.specialRequestDetail || null
        }))
      },
      { upsert: true, new: true }
    );
    
    res.json(menuChoice.partyChoices);
  } catch (e) {
    next(e);
  }
}

// Admin: get menu overview per guest
async function getMenuChoicesOverview(req, res, next) {
  try {
    const menuChoices = await MenuChoice.find({}).populate('guestId', 'name email').lean();
    
    const overview = [];
    
    for (const menuChoice of menuChoices) {
      const guest = menuChoice.guestId;
      if (!guest) continue;
      
      for (const partyChoice of menuChoice.partyChoices) {
        overview.push({
          guestId: guest._id.toString(),
          guestName: guest.name || 'Unknown Guest',
          partyGuestId: partyChoice.partyGuestId,
          partyGuestName: partyChoice.partyGuestId.startsWith('primary-') ? guest.name : 'Party Member',
          choices: partyChoice.choices || [],
          specialRequest: partyChoice.specialRequest,
          specialRequestDetail: partyChoice.specialRequestDetail
        });
      }
    }
    
    res.json(overview);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listMenu,
  getMenuChoices,
  updateMenuChoices,
  getMenuChoicesOverview
};