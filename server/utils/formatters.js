const { localize } = require('./localized');
const { generateDietaryIconsHTML, generateSelectionIconHTML } = require('./menuIcons');

// Format event for API response according to README specification
function formatEventForApi(event, lang = 'en') {

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
    name: localize(event.name, lang),
    date: event.date ? event.date.toISOString() : null,
    end: event.end ? event.end.toISOString() : null,
    locationAddress: event.locationAddress || '',
    locationLatitude: event.locationLatitude || null,
    locationLongitude: event.locationLongitude || null,
    // Legacy location field for backward compatibility
    location: event.location || event.locationAddress || '',
    title: localize(event.title, lang),
    description: localize(event.description, lang),
    image: imageData,
    sub_events: (event.sub_events || []).map(sub => ({
      name: localize(sub.name, lang),
      date: sub.date ? sub.date.toISOString() : null,
      end: sub.end ? sub.end.toISOString() : null,
      description: localize(sub.description, lang) || null,
      icon: sub.icon
    }))
  };
}

// Format course for API response
function formatCourseForApi(course) {
  return {
    id: course._id.toString(),
    course: course.course,
    label: localize(course.label),
    selectionRequired: course.selectionRequired !== undefined ? course.selectionRequired : true,
    selectionIcon: generateSelectionIconHTML(course)
  };
}

// Format course option for API response
function formatCourseOptionForApi(option, lang) {
  // Format image data for display
  let imageData = null;
  if (option.image) {
    if (option.image.data && option.image.contentType) {
      // Populated image document with binary data
      const base64Data = option.image.data.toString('base64');
      imageData = `data:${option.image.contentType};base64,${base64Data}`;
    } else {
      // Unpopulated ObjectId reference — return as string for frontend
      const idStr = option.image._id ? option.image._id.toString() : option.image.toString();
      if (idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
        imageData = idStr;
      }
    }
  }

  return {
    id: option._id.toString(),
    courseId: option.courseId.toString(),
    label: localize(option.label, lang),
    image: imageData,
    description: localize(option.description, lang) || null,
    // Special Dietary Indicators
    isVegetarian: option.isVegetarian || false,
    containsAllergens: option.containsAllergens || false,
    containsLactose: option.containsLactose || false,
    isSpicy: option.isSpicy || false,
    containsNuts: option.containsNuts || false,
    dietaryIcons: generateDietaryIconsHTML(option)
  };
}

module.exports = {
  formatEventForApi,
  formatCourseForApi,
  formatCourseOptionForApi
};