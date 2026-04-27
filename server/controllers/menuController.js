const { MenuChoice, Guest, Course, CourseOption } = require('../models');
const { formatCourseForApi, formatCourseOptionForApi } = require('../utils/formatters');
const { generateSelectionIconHTML, generateDietaryIconsHTML } = require('../utils/menuIcons');
const { getLang, mergeLocalizedString, localize } = require('../utils/localized');

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assignImageRef(option, field, value) {
  if (value === undefined) return;
  if (value === null || value === '') {
    option[field] = null;
    return;
  }
  if (typeof value === 'object' && value.imageId) {
    option[field] = value.imageId;
    return;
  }
  if (typeof value === 'string' && OBJECT_ID_RE.test(value)) {
    option[field] = value;
  }
}

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
    const lang = getLang(req);
    const courses = await Course.find({}).sort({ course: 1, createdAt: 1 });
    const menuData = [];
    
    for (const course of courses) {
      const options = await CourseOption.find({ courseId: course._id })
        .populate('image')
        .populate('imageCloseup')
        .sort({ createdAt: 1 });
      
      menuData.push({
        id: course._id.toString(),
        course: course.course,
        label: localize(course.label, lang),
        selectionRequired: course.selectionRequired !== undefined ? course.selectionRequired : true,
        options: options.map(option => {
          // Debug logging for vegan field
          if (option.label && option.label.en && option.label.en.includes('Gazpacho')) {
            console.log('[CONTROLLER DEBUG] Before formatting:', {
              label: option.label.en,
              isVegan: option.isVegan,
              isVegetarian: option.isVegetarian,
              type_isVegan: typeof option.isVegan
            });
          }
          
          const formattedOption = formatCourseOptionForApi(option, lang);
          
          // Debug after formatting
          if (option.label && option.label.en && option.label.en.includes('Gazpacho')) {
            console.log('[CONTROLLER DEBUG] After formatting:', {
              label: formattedOption.label,
              isVegan: formattedOption.isVegan,
              isVegetarian: formattedOption.isVegetarian
            });
          }
          
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
    const lang = getLang(req);
    const { course, label, selectionRequired } = req.body;

    const newCourse = new Course({
      course,
      selectionRequired:
        selectionRequired !== undefined ? selectionRequired : true,
    });

    // Localised label: one language at a time
    newCourse.label = mergeLocalizedString(undefined, label, lang);

    await newCourse.save();
    res.status(201).json(formatCourseForApi(newCourse));
  } catch (e) {
    next(e);
  }
}

async function updateCourse(req, res, next) {
  try {
    const lang = getLang(req);
    const { id } = req.params;
    const { course, label, selectionRequired } = req.body;

    const existing = await Course.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Non-localised bits
    if (course !== undefined) {
      existing.course = course;
    }
    if (selectionRequired !== undefined) {
      existing.selectionRequired = selectionRequired;
    }

    // Localised label
    existing.label = mergeLocalizedString(existing.label, label, lang);

    await existing.save();
    res.json(formatCourseForApi(existing));
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
    const lang = getLang(req);
    const { courseId } = req.params;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const options = await CourseOption.find({ courseId })
      .populate('image')
      .populate('imageCloseup')
      .sort({ createdAt: 1 });
    const formatted = options.map(option => formatCourseOptionForApi(option, lang));
    res.json(formatted);
  } catch (e) { 
    next(e); 
  }
}

// Admin: get specific course option by ID (for editing)
async function getCourseOptionById(req, res, next) {
  try {
    const lang = getLang(req);
    const { courseId, optionId } = req.params;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const option = await CourseOption.findOne({ _id: optionId, courseId })
      .populate('image')
      .populate('imageCloseup');
    if (!option) {
      return res.status(404).json({ error: 'Course option not found' });
    }

    // If your formatCourseOptionForApi already handles LocalizedString → string
    // based on some lang, you can extend it. For now we just pass the doc through.
    res.json(formatCourseOptionForApi(option, lang));
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
        partyGuestId: `${guestId}`, 
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
          specialRequests: [],  // Fixed: was specialRequest, now specialRequests
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
        specialRequest: choice.specialRequests || [],  // Fixed: map specialRequests to specialRequest for API compatibility
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

        const [course, option] = await Promise.all([
          Course.findById(item.courseId),
          CourseOption.findById(item.optionId)
        ]);
        if (course && option && course.selectionRequired && option.allowsCookingPreference) {
          const validPreferences = ['rare', 'medium-rare', 'medium', 'well-done'];
          if (!item.cookingPreference || !validPreferences.includes(item.cookingPreference)) {
            const optionName = option.label instanceof Map
              ? (option.label.get('en') || option.label.values().next().value || '')
              : (option.label?.en || Object.values(option.label || {})[0] || '');
            return res.status(400).json({ errorCode: 'cookingPreference.required' });
          }
        }
      }

      // Validate specialRequest - supports both string (legacy) and array (new) formats
      if (choice.specialRequest) {
        if (Array.isArray(choice.specialRequest)) {
          for (const sr of choice.specialRequest) {
            if (!sr.name || typeof sr.selected !== 'boolean') {
              return res.status(400).json({ error: 'Invalid specialRequest format - each item must have name and selected' });
            }
            if (!allowedDietaryOptions.includes(sr.name)) {
              return res.status(400).json({ error: `Invalid specialRequest option: ${sr.name}` });
            }
          }
        } else {
          return res.status(400).json({ error: 'specialRequest must be an array' });
        }
      }
    }  
    
    // Update or create menu choices
    const partyChoicesToSave = choices.map(choice => ({
      partyGuestId: choice.partyGuestId,
      choices: (choice.choices || []).map(item => ({
        courseId: item.courseId,
        optionId: item.optionId,
        cookingPreference: item.cookingPreference || null
      })),
      specialRequests: choice.specialRequest || [],
      specialRequestDetail: choice.specialRequestDetail || ''
    }));

    const menuChoice = await MenuChoice.findOneAndUpdate(
      { guestId },
      { partyChoices: partyChoicesToSave },
      { upsert: true, new: true }
    );
    
    res.json(menuChoice.partyChoices);
  } catch (e) {
    next(e);
  }
}

// Admin: create course option (one language at a time)
async function createCourseOption(req, res, next) {
  try {
    const lang = getLang(req);
    const { courseId } = req.params;
    const {
      label,
      description,
      image,
      imageCloseup,
      ...rest
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const option = new CourseOption({
      courseId,
      ...rest,
    });

    option.label = mergeLocalizedString(undefined, label, lang);
    option.description = mergeLocalizedString(undefined, description, lang);

    assignImageRef(option, 'image', image);
    assignImageRef(option, 'imageCloseup', imageCloseup);

    await option.save();
    res.status(201).json(formatCourseOptionForApi(option));
  } catch (e) {
    next(e);
  }
}

// Admin: update course option
async function updateCourseOption(req, res, next) {
  try {
    const lang = getLang(req);
    const { courseId, optionId } = req.params;
    const {
      label,
      description,
      image,
      imageCloseup,
      ...rest
    } = req.body;

    const option = await CourseOption.findOne({ _id: optionId, courseId });
    if (!option) {
      return res.status(404).json({ error: 'Course option not found' });
    }

    Object.assign(option, rest);
    assignImageRef(option, 'image', image);
    assignImageRef(option, 'imageCloseup', imageCloseup);

    option.label = mergeLocalizedString(option.label, label, lang);
    option.description = mergeLocalizedString(option.description, description, lang);

    await option.save();
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