/**
 * Course Type Display Labels
 * Maps course type values to display labels in multiple languages
 */

const courseLabels = {
  welcome_cocktails: {
    es: 'Cóctel de Bienvenida',
    en: 'Welcome Cocktails',
    fr: 'Cocktail de Bienvenue',
    de: 'Willkommenscocktail'
  },
  starter: {
    es: 'Entrantes',
    en: 'Starters',
    fr: 'Entrées',
    de: 'Vorspeisen'
  },
  main: {
    es: 'Plato Principal',
    en: 'Main Course',
    fr: 'Plat Principal',
    de: 'Hauptgericht'
  },
  dessert: {
    es: 'Postres',
    en: 'Desserts',
    fr: 'Desserts',
    de: 'Desserts'
  },
  late_night_snacks: {
    es: 'Snacks Nocturnos',
    en: 'Late Night Snacks',
    fr: 'Collations de Nuit',
    de: 'Spätnacht-Snacks'
  },
  drinks: {
    es: 'Bebidas',
    en: 'Drinks',
    fr: 'Boissons',
    de: 'Getränke'
  }
};

/**
 * Get display label for a course type
 * @param {string} courseType - Course type value
 * @param {string} lang - Language code (es, en, fr, de)
 * @returns {string} Display label or the course type itself if not found
 */
function getCourseLabel(courseType, lang = 'en') {
  if (!courseLabels[courseType]) {
    console.warn(`Unknown course type: ${courseType}`);
    return courseType;
  }
  return courseLabels[courseType][lang] || courseLabels[courseType].en;
}

/**
 * Get all course types with their labels
 * @param {string} lang - Language code
 * @returns {Array} Array of {value, label} objects
 */
function getAllCourseTypes(lang = 'en') {
  return Object.keys(courseLabels).map(courseType => ({
    value: courseType,
    label: getCourseLabel(courseType, lang)
  }));
}

module.exports = {
  courseLabels,
  getCourseLabel,
  getAllCourseTypes
};
