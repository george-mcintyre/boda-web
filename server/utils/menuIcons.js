/**
 * Icon definitions for Menu Course Options and Courses
 * Provides consistent icon mapping for dietary flags and selection types
 */

// Dietary Indicator Icons
const dietaryIcons = {
  vegetarian: {
    icon: 'fa-leaf',
    color: '#28a745',
    label: 'Vegetarian',
    tooltip: 'This option is suitable for vegetarians'
  },
  allergens: {
    icon: 'fa-exclamation-triangle',
    color: '#ffc107',
    label: 'Contains Allergens',
    tooltip: 'This option contains allergens - please check ingredient list'
  },
  lactose: {
    icon: 'fa-cheese',
    color: '#fd7e14',
    label: 'Contains Lactose',
    tooltip: 'This option contains lactose/dairy products'
  }
};

// Selection Type Icons  
const selectionIcons = {
  choiceRequired: {
    icon: 'fa-list-ul',
    color: '#007bff',
    label: 'Choice Required',
    tooltip: 'Guests must select one option from this course'
  },
  allProvided: {
    icon: 'fa-utensils',
    color: '#6c757d',
    label: 'All Provided',
    tooltip: 'All options will be provided - no selection needed'
  }
};

/**
 * Get dietary flag icons for a course option
 * @param {Object} option - Course option object with dietary flags
 * @returns {Array} Array of active dietary icons
 */
function getDietaryIcons(option) {
  const icons = [];
  
  if (option.isVegetarian) {
    icons.push(dietaryIcons.vegetarian);
  }
  
  if (option.containsAllergens) {
    icons.push(dietaryIcons.allergens);
  }
  
  if (option.containsLactose) {
    icons.push(dietaryIcons.lactose);
  }
  
  return icons;
}

/**
 * Get selection type icon for a course
 * @param {Object} course - Course object with selectionRequired flag
 * @returns {Object} Selection icon object
 */
function getSelectionIcon(course) {
  return course.selectionRequired ? 
    selectionIcons.choiceRequired : 
    selectionIcons.allProvided;
}

/**
 * Generate HTML for dietary flag icons
 * @param {Object} option - Course option object
 * @returns {string} HTML string for dietary icons
 */
function generateDietaryIconsHTML(option) {
  const icons = getDietaryIcons(option);
  
  if (icons.length === 0) return '';
  
  const iconHTML = icons.map(iconData => `
    <span class="dietary-icon" 
          style="color: ${iconData.color};" 
          title="${iconData.tooltip}"
          data-tooltip="${iconData.tooltip}">
      <i class="fas ${iconData.icon}"></i>
      <span class="sr-only">${iconData.label}</span>
    </span>
  `).join('');
  
  return `
    <div class="dietary-flags">
      ${iconHTML}
    </div>
  `;
}

/**
 * Generate HTML for selection type icon
 * @param {Object} course - Course object
 * @returns {string} HTML string for selection icon
 */
function generateSelectionIconHTML(course) {
  const iconData = getSelectionIcon(course);
  
  return `
    <span class="selection-icon" 
          style="color: ${iconData.color};" 
          title="${iconData.tooltip}"
          data-tooltip="${iconData.tooltip}">
      <i class="fas ${iconData.icon}"></i>
      <span class="sr-only">${iconData.label}</span>
    </span>
  `;
}

module.exports = {
  dietaryIcons,
  selectionIcons,
  getDietaryIcons,
  getSelectionIcon,
  generateDietaryIconsHTML,
  generateSelectionIconHTML
};