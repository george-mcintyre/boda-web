/**
 * Icon definitions for Menu Course Options and Courses
 * Provides consistent icon mapping for dietary flags and selection types
 */

// Dietary and Allergen Indicator Icons
const dietaryIcons = {
  // Dietary preferences
  vegetarian: {
    icon: 'fa-leaf',
    color: '#28a745',
    label: 'Vegetarian',
    tooltip: 'This option is suitable for vegetarians'
  },
  vegan: {
    icon: 'fa-seedling',
    color: '#22bb33',
    label: 'Vegan',
    tooltip: 'This option is vegan - free from all animal products'
  },
  spicy: {
    icon: 'fa-pepper-hot',
    color: '#dc3545',
    label: 'Spicy',
    tooltip: 'This option contains spicy ingredients'
  },
  
  // Specific allergens
  gluten: {
    icon: 'fa-bread-slice',
    color: '#f39c12',
    label: 'Contains Gluten',
    tooltip: 'Contains wheat, rye, or barley'
  },
  eggs: {
    icon: 'fa-egg',
    color: '#f39c12',
    label: 'Contains Eggs',
    tooltip: 'Contains eggs or egg products'
  },
  fish: {
    icon: 'fa-fish',
    color: '#3498db',
    label: 'Contains Fish',
    tooltip: 'Contains fish or fish products'
  },
  shellfish: {
    icon: 'fa-shrimp',
    color: '#e74c3c',
    label: 'Contains Shellfish',
    tooltip: 'Contains shellfish or crustaceans'
  },
  soy: {
    icon: 'fa-seedling',
    color: '#95a5a6',
    label: 'Contains Soy',
    tooltip: 'Contains soy or soy products'
  },
  sesame: {
    icon: 'fa-circle',
    color: '#d68910',
    label: 'Contains Sesame',
    tooltip: 'Contains sesame seeds or sesame oil'
  },
  lactose: {
    icon: 'fa-cheese',
    color: '#fd7e14',
    label: 'Contains Dairy',
    tooltip: 'Contains milk, cheese, or other dairy products'
  },
  nuts: {
    icon: 'fa-dot-circle',
    color: '#8b4513',
    label: 'Contains Nuts',
    tooltip: 'May contain tree nuts or peanuts'
  },
  
  // Deprecated - generic allergen warning
  allergens: {
    icon: 'fa-exclamation-triangle',
    color: '#ffc107',
    label: 'Contains Allergens',
    tooltip: 'This option contains allergens - please check with staff'
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
 * Get dietary flag and allergen icons for a course option
 * @param {Object} option - Course option object with dietary flags
 * @returns {Array} Array of active dietary icons
 */
function getDietaryIcons(option) {
  const icons = [];
  
  // Dietary preferences (vegan takes priority over vegetarian)
  if (option.isVegan) {
    icons.push(dietaryIcons.vegan);
  } else if (option.isVegetarian) {
    icons.push(dietaryIcons.vegetarian);
  }
  
  if (option.isSpicy) {
    icons.push(dietaryIcons.spicy);
  }
  
  // Specific allergens
  if (option.containsGluten) {
    icons.push(dietaryIcons.gluten);
  }
  
  if (option.containsEggs) {
    icons.push(dietaryIcons.eggs);
  }
  
  if (option.containsFish) {
    icons.push(dietaryIcons.fish);
  }
  
  if (option.containsShellfish) {
    icons.push(dietaryIcons.shellfish);
  }
  
  if (option.containsSoy) {
    icons.push(dietaryIcons.soy);
  }
  
  if (option.containsSesame) {
    icons.push(dietaryIcons.sesame);
  }
  
  if (option.containsLactose) {
    icons.push(dietaryIcons.lactose);
  }
  
  if (option.containsNuts) {
    icons.push(dietaryIcons.nuts);
  }
  
  // Fallback: deprecated generic allergen warning
  // Only show if no specific allergens are flagged but containsAllergens is true
  if (option.containsAllergens && 
      !option.containsGluten && !option.containsEggs && !option.containsFish &&
      !option.containsShellfish && !option.containsSoy && !option.containsSesame &&
      !option.containsLactose && !option.containsNuts) {
    icons.push(dietaryIcons.allergens);
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
  
  const iconHTML = icons.map(iconData => {
    // Determine background color based on icon type
    const bgColor = iconData.color + '20'; // Add 20% opacity
    return `
    <span class="dietary-icon" 
          style="background: ${bgColor}; color: ${iconData.color}; border: 1px solid ${iconData.color}40;" 
          title="${iconData.tooltip}"
          data-tooltip="${iconData.tooltip}">
      <i class="fas ${iconData.icon}"></i>
      <span class="sr-only">${iconData.label}</span>
    </span>
  `;
  }).join('');
  
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