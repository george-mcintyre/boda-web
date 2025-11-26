const { MenuCourse, MenuChoice, Guest, Course, CourseOption, MenuOptionImage } = require('../models');
const { formatCourseForApi, formatCourseOptionForApi } = require('../controllers/adminController');
const { generateSelectionIconHTML, generateDietaryIconsHTML } = require('../utils/menuIcons');

// Helper to format menu part for API response
function formatMenuCourseForApi(menuPart, index) {
  return {
    id: menuPart._id.toString(),
    course: menuPart.course,
    label: menuPart.label,
    selectionRequired: menuPart.selectionRequired !== undefined ? menuPart.selectionRequired : true,
    selectionIcon: generateSelectionIconHTML(menuPart),
    options: (menuPart.options || []).map((option, optIndex) => {
      // Ensure each option includes dietary icons
      const formattedOption = formatCourseOptionForApi(option);
      // Override the dietaryIcons to ensure they're generated with the latest format
      formattedOption.dietaryIcons = generateDietaryIconsHTML(option);
      return formattedOption;
    })
  };
}

// List courses with options (for both admin and guest interfaces)
async function listCourses(req, res, next) {
  try {
    const courses = await Course.find({}).sort({ course: 1, createdAt: 1 });
    const menuData = [];
    
    for (const course of courses) {
      const options = await CourseOption.find({ courseId: course._id })
        .populate('image')
        .sort({ createdAt: 1 });
      
      menuData.push({
        id: course._id.toString(),
        course: course.course,
        label: course.label,
        selectionRequired: course.selectionRequired !== undefined ? course.selectionRequired : true,
        options: options.map(option => {
          const formattedOption = formatCourseOptionForApi(option);
          // Ensure dietary icons are generated
          formattedOption.dietaryIcons = generateDietaryIconsHTML(option);
          return formattedOption;
        })
      });
    }
    
    res.json(menuData);
  } catch (e) {
    next(e);
  }
}

async function createCourse(req, res, next) {
  try {
    const { course, label, selectionRequired } = req.body;
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

async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { course, label, selectionRequired } = req.body;
    
    const updateData = {};
    if (course) updateData.course = course;
    if (label) updateData.label = label;
    if (selectionRequired !== undefined) updateData.selectionRequired = selectionRequired;
    
    const updatedCourse = await Course.findByIdAndUpdate(id, updateData, { new: true });
    res.json(formatCourseForApi(updatedCourse));
  } catch (e) {
    next(e);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    res.json({ status: 'ok' });
  } catch (e) {
    next(e);
  }
}

// Admin: get course options (for admin interface)
async function listCourseOptions(req, res, next) {
  try {
    const { courseId } = req.params;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const options = await CourseOption.find({ courseId })
      .populate('image')
      .sort({ createdAt: 1 });
    const formatted = options.map(option => formatCourseOptionForApi(option));
    res.json(formatted);
  } catch (e) { 
    next(e); 
  }
}

// Admin: get specific course option by ID (for editing)
async function getCourseOptionById(req, res, next) {
  try {
    const { courseId, optionId } = req.params;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const option = await CourseOption.findOne({ _id: optionId, courseId })
      .populate('image');
    if (!option) {
      return res.status(404).json({ error: 'Course option not found' });
    }
    
    res.json(formatCourseOptionForApi(option));
  } catch (e) { 
    next(e); 
  }
}

// Guest: get menu selections per party member (legacy function)
async function listGuestCourseOption(req, res, next) {
  try {
    const guestId = req.user.id;
    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    // Get existing menu choices
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
    
    let menuChoice = null; 
    try {
      menuChoice = await MenuChoice.findOne({ guestId });
    } catch (e) {}

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
async function updateGuestCourseOption(req, res, next) {
  try {
    const guestId = req.user.id;
    const { choices } = req.body;
    
    if (!Array.isArray(choices)) {
      return res.status(400).json({ error: 'Choices must be an array' });
    }
    
    // Validate choices structure (supports both new and legacy format)
    const allowedDietaryOptions = ['vegan', 'vegetarian', 'nut-allergy', 'nut allergy', 'lactose-intolerant', 'gluten-intolerant', 'other'];
    
    for (const choice of choices) {
      if (!choice.partyGuestId || !Array.isArray(choice.choices)) {
        return res.status(400).json({ error: 'Invalid choice structure' });
      }
      
      for (const item of choice.choices) {
        if (!item.courseId) {
          return res.status(400).json({ error: 'courseId is required for each choice' });
        }
        
        if (!item.optionId) {
          return res.status(400).json({ error: 'optionId is required' });
        }
      }
      
      // Validate specialRequest - supports both string (legacy) and array (new) formats
      if (choice.specialRequest) {
        if (typeof choice.specialRequest === 'string') {
          // Legacy string format
          if (!allowedDietaryOptions.includes(choice.specialRequest)) {
            return res.status(400).json({ error: 'Invalid specialRequest value' });
          }
        } else if (Array.isArray(choice.specialRequest)) {
          // New array format: [{ name: 'vegetarian', selected: true }, ...]
          for (const sr of choice.specialRequest) {
            if (!sr.name || typeof sr.selected !== 'boolean') {
              return res.status(400).json({ error: 'Invalid specialRequest format - each item must have name and selected' });
            }
            if (!allowedDietaryOptions.includes(sr.name)) {
              return res.status(400).json({ error: `Invalid specialRequest option: ${sr.name}` });
            }
          }
        } else {
          return res.status(400).json({ error: 'specialRequest must be a string or array' });
        }
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

async function createCourseOption(req, res, next) {
  try {
    const { courseId } = req.params;
    const { label, image, description, isVegetarian, containsAllergens, containsLactose } = req.body;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (!label) {
      return res.status(400).json({ error: 'Label is required' });
    }
    
    // Handle image reference
    let imageRef = undefined;
    if (image && image.imageId) {
      // New format - reference to uploaded image
      imageRef = image.imageId;
    } else if (typeof image === 'string' && image.length === 24 && /^[0-9a-fA-F]{24}$/.test(image)) {
      // ObjectId string
      imageRef = image;
    }
    
    const option = await CourseOption.create({
      courseId,
      label,
      image: imageRef || null,
      description: description || null,
      isVegetarian: isVegetarian || false,
      containsAllergens: containsAllergens || false,
      containsLactose: containsLactose || false
    });
    
    // Populate image for response
    const populatedOption = await CourseOption.findById(option._id).populate('image');
    res.status(201).json(formatCourseOptionForApi(populatedOption));
  } catch (e) { 
    next(e); 
  }
}

async function updateCourseOption(req, res, next) {
  try {
    const { optionId } = req.params;
    const { label, image, description, isVegetarian, containsAllergens, containsLactose } = req.body;
    
    // Handle image reference
    let imageRef = undefined;
    if (image !== undefined) {
      if (!image) {
        // Image explicitly set to null/empty, remove it
        imageRef = undefined;
      } else if (image.imageId) {
        // New format - reference to uploaded image
        imageRef = image.imageId;
      } else if (typeof image === 'string' && image.length === 24 && /^[0-9a-fA-F]{24}$/.test(image)) {
        // ObjectId string
        imageRef = image;
      }
    }
    
    const updateData = {};
    if (label) updateData.label = label;
    if (imageRef !== undefined) updateData.image = imageRef;
    if (description !== undefined) updateData.description = description;
    if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian;
    if (containsAllergens !== undefined) updateData.containsAllergens = containsAllergens;
    if (containsLactose !== undefined) updateData.containsLactose = containsLactose;
    
    const option = await CourseOption.findByIdAndUpdate(optionId, updateData, { new: true })
      .populate('image');
    if (!option) {
      return res.status(404).json({ error: 'Course option not found' });
    }
    res.json(formatCourseOptionForApi(option));
  } catch (e) { 
    next(e); 
  }
}

async function deleteCourseOption(req, res, next) {
  try {
    const { optionId } = req.params;
    await CourseOption.findByIdAndDelete(optionId);
    res.json({ status: 'ok' });
  } catch (e) {
    next(e);
  }
}

// Admin: get menu overview per guest (supports both new and legacy format)
async function getMenuChoicesOverview(req, res, next) {
  try {
    const menuChoices = await MenuChoice.find({}).populate('guestId', 'name email').lean();
    
    const overview = [];
    
    for (const menuChoice of menuChoices) {
      const guest = menuChoice.guestId;
      if (!guest) continue;
      
      for (const partyChoice of menuChoice.partyChoices) {
        const choices = (partyChoice.choices || []).map(choice => {
          // Handle new format (courseId + optionId)
          if (choice.courseId && choice.optionId) {
            return {
              courseId: choice.courseId.toString(),
              optionId: choice.optionId.toString()
            };
          }
          // Handle legacy format (menuPartId + legacyOptionId)
          if (choice.menuPartId && choice.legacyOptionId) {
            return {
              courseId: choice.menuPartId,
              optionId: choice.legacyOptionId
            };
          }
          return choice;
        });
        
        overview.push({
          guestId: guest._id.toString(),
          guestName: guest.name || 'Unknown Guest',
          partyGuestId: partyChoice.partyGuestId,
          partyGuestName: partyChoice.partyGuestId.startsWith('primary-') ? guest.name : 'Party Member',
          choices: choices,
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
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  listCourseOptions,
  createCourseOption,
  getCourseOptionById,
  updateCourseOption,
  deleteCourseOption,
  listGuestCourseOption,
  updateGuestCourseOption
};