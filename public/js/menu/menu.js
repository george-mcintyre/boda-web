// Menu Management Module
// Contains all menu-related functions extracted from guests.js

// Global variables that need to be available from the main scope
let draggedChip = null;

// Load and menu selections - New unified menu layout with drag-drop support
async function loadMenuSelections() {
  const menuContent = document.getElementById('menu');

  if (!menuContent) return;
  
  // Show loading state
  menuContent.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p><div data-i18n="guests:menuLoading">Loading menu...</div></p>
    </div>
  `;
  
  try {
    // Get token and current language from localStorage
    const token = localStorage.getItem('token');
    const currentLanguage = localStorage.getItem('i18nextLng') || 'es';
    
    // Get party members and menu data in parallel
    const [partyResponse, menuResponse, menuChoicesResponse] = await Promise.all([
      fetch('/api/guest/party', {
        method: 'GET',
        headers: { 'Authorization': token }
      }),
      fetch(`/api/guest/menu?lang=${currentLanguage}`, {
        method: 'GET',
        headers: { 'Authorization': token }
      }),
      fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      })
    ]);

    if (!partyResponse.ok || !menuResponse.ok) {
      menuContent.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3><div data-i18n="guests:menuErrorTitle">Error Loading Menu</div></h3>
          <p><div data-i18n="guests:menuErrorMessage">Unable to load menu data. Please try again later.</div></p>
          <button class="btn-retry" onclick="loadMenuSelections()">
            <i class="fas fa-redo"></i> <div data-i18n="guests:retry">Retry</div>
          </button>
        </div>
      `;
      return;
    }

    const partyData = await partyResponse.json();
    const menuData = await menuResponse.json();
    const menuChoicesData = menuChoicesResponse.ok ? await menuChoicesResponse.json() : [];

    // Group courses by type (starter, main, dessert, drinks)
    const courseGroups = {
      starter: { label: 'guests:courseGroupStarters', icon: 'fa-seedling', courses: [] },
      main: { label: 'guests:courseGroupMainCourses', icon: 'fa-drumstick-bite', courses: [] },
      dessert: { label: 'guests:courseGroupDesserts', icon: 'fa-ice-cream', courses: [] },
      drinks: { label: 'guests:courseGroupDrinks', icon: 'fa-cocktail', courses: [] }
    };

    menuData.forEach(course => {
      if (courseGroups[course.course]) {
        courseGroups[course.course].courses.push(course);
      }
    });

    // Build a lookup for party member choices: { partyGuestId: { courseId: optionId } }
    const choicesLookup = {};
    menuChoicesData.forEach(memberChoice => {
      const memberId = memberChoice.partyGuestId;
      choicesLookup[memberId] = {};
      if (memberChoice.choices) {
        memberChoice.choices.forEach(choice => {
          choicesLookup[memberId][choice.courseId] = choice.optionId;
        });
      }
    });

    // Helper to escape HTML
    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
    };

    // Helper to get image URL for option
    const getOptionImageUrl = (option) => {
      if (!option.image) return null;
      if (typeof option.image === 'string') {
        if (option.image.startsWith('data:')) {
          return option.image;
        } else if (option.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(option.image)) {
          return `/api/admin/menu-options/${option.id}/image/thumbnail`;
        }
        return option.image;
      }
      return null;
    };

    // Build HTML for the unified menu
    let html = '<div class="unified-menu-container">';

    html += `
      <div class="intro-card intro-section">
        <h2 class="card-title">
          <div data-i18n="guests:menuPageTitle">${translate('guests:menuPageTitle')}</div>
        </h2>
        <p class="card-description">
          <div data-i18n="guests:menuPageDescription">${translate('guests:menuPageDescription')}</div>
        </p>
      </div>
    `;
    
    // Add save button
    html += `
      <div class="action-container">
        <button type="button" id="saveMenuChoicesBtn" class="btn-base btn-primary btn-lg">
          <i class="fas fa-save"></i>
          <span data-i18n="guests:saveMenuSelections">${translate("guests:saveMenuSelections")}</span>
        </button>
      </div>
    `;

    // Iterate through course groups
    const groupOrder = ['starter', 'main', 'dessert', 'drinks'];
    
    groupOrder.forEach(groupKey => {
      const group = courseGroups[groupKey];
      if (!group.courses.length) return;

      html += `
        <div class="menu-course-group" data-group="${groupKey}">
          <div class="course-group-header">
            <i class="fas ${group.icon}"></i>
            <h3><div data-i18n="${group.label}">${translate(group.label)}</div></h3>
          </div>
          <div class="course-group-content">
      `;

      // Iterate through courses in this group - each course gets its own card
      group.courses.forEach(course => {
        const options = course.options || [];
        // Course is not selectable if: explicitly marked as not required, OR only has one option
        const isSelectable = course.selectionRequired !== false && options.length > 1;
        
        html += `
          <div class="card" data-course-id="${course.id}" data-selectable="${isSelectable}">
            <div class="card-header">
              <h4>${escapeHtml(course.label)}</h4>
              ${isSelectable ? '<span class="badge badge-warning"><i class="fas fa-hand-pointer"></i> <div data-i18n="guests:selectionRequired">Selection Required</div></span>' : '<span class="badge badge-secondary"><i class="fas fa-info-circle"></i> <div data-i18n="guests:infoOnly">Info Only</div></span>'}
            </div>
            <div class="card-content">
        `;

        // Iterate through options in this course
        options.forEach((option, optionIndex) => {
          const imageUrl = getOptionImageUrl(option);
          
          // Determine which party members have selected this option (only for selectable courses)
          let membersForOption = [];
          if (isSelectable) {
            partyData.forEach(member => {
              const memberChoices = choicesLookup[member.id] || {};
              const selectedOptionId = memberChoices[course.id];
              
              if (selectedOptionId === option.id) {
                membersForOption.push(member);
              } else if (!selectedOptionId && optionIndex === 0) {
                // Default: first option gets unassigned members
                membersForOption.push(member);
              }
            });
          }

          html += `
            <div class="menu-option-card" data-option-id="${option.id}" data-course-id="${course.id}">
              <div class="option-card-main">
                <div class="option-image-container">
                  ${imageUrl ? `
                    <img src="${imageUrl}" alt="${escapeHtml(option.label)}" class="option-thumbnail" onerror="this.style.display='none'; this.parentElement.classList.add('no-image');">
                  ` : `
                    <div class="option-image-placeholder">
                      <i class="fas fa-utensils"></i>
                    </div>
                  `}
                </div>
                <div class="option-details">
                  <div class="option-header-row">
                    <h5 class="option-name">${escapeHtml(option.label)}</h5>
                    ${option.dietaryIcons ? `<span class="dietary-icons">${option.dietaryIcons}</span>` : ''}
                  </div>
                  ${option.description ? `
                    <p class="option-description-text">${option.description}</p>
                  ` : ''}
                  <div class="dietary-badges">
                    ${option.isVegetarian ? '<span class="dietary-badge vegetarian"><i class="fas fa-leaf"></i> Vegetarian</span>' : ''}
                    ${option.containsAllergens ? '<span class="dietary-badge allergens"><i class="fas fa-exclamation-triangle"></i> Allergens</span>' : ''}
                    ${option.containsLactose ? '<span class="dietary-badge lactose"><i class="fas fa-cheese"></i> Lactose</span>' : ''}
                    ${option.isSpicy ? '<span class="dietary-badge spicy"><i class="fas fa-pepper-hot"></i> Spicy</span>' : ''}
                    ${option.containsNuts ? '<span class="dietary-badge contains-nuts"><i class="fas fa-seedling"></i> Contains Nuts</span>' : ''}
                  </div>
                </div>
              </div>
              ${isSelectable ? `
                <div class="option-selection-panel" data-option-id="${option.id}" data-course-id="${course.id}">
                  <div class="selection-panel-header">
                    <span class="panel-label"><i class="fas fa-users"></i> <div data-i18n="guests:whosHavingThis">Who's having this?</div></span>
                    <span class="member-count">${membersForOption.length} <span data-i18n="guests:selectedCount">${translate("guests:selectedCount")}</span></span>
                  </div>
                  <div class="member-drop-zone" data-option-id="${option.id}" data-course-id="${course.id}">
                    ${membersForOption.map(member => `
                      <div class="member-chip" draggable="true" data-member-id="${member.id}" data-member-name="${escapeHtml(member.name)}">
                        <i class="fas fa-user"></i>
                        <span>${escapeHtml(member.name)}</span>
                        ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:party.primary\">${member.primary ? translate('common:party.primary') : ''}</span>" : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    // Build special requests lookup from existing choices
    const specialRequestsLookup = {};
    menuChoicesData.forEach(memberChoice => {
      specialRequestsLookup[memberChoice.partyGuestId] = {
        specialRequest: memberChoice.specialRequest || [],
        specialRequestDetail: memberChoice.specialRequestDetail || ''
      };
    });

    // Add special dietary requests section
    html += `
      <div class="special-requests-section">
        <div class="special-requests-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3><div data-i18n="guests:dietaryRequirementsTitle">Dietary Requirements & Special Requests</div></h3>
        </div>
        <p class="special-requests-description"><div data-i18n="guests:dietaryRequirementsDescription">Please let us know about any dietary requirements or allergies for each guest.</div></p>
        <div class="special-requests-cards">
    `;

    // Create a card for each party member
    partyData.forEach(member => {
      const memberRequests = specialRequestsLookup[member.id] || { specialRequest: [], specialRequestDetail: '' };
      const selectedRequests = Array.isArray(memberRequests.specialRequest) ? memberRequests.specialRequest : [];
      
      const dietaryOptions = [
        { name: 'vegetarian', label: 'Vegetarian', icon: 'fa-leaf' },
        { name: 'lactose-intolerant', label: 'Lactose Intolerant', icon: 'fa-cheese' },
        { name: 'gluten-intolerant', label: 'Gluten Intolerant', icon: 'fa-bread-slice' },
        { name: 'nut-allergy', label: 'Nut Allergy', icon: 'fa-seedling' },
        { name: 'other', label: 'Other', icon: 'fa-question-circle' }
      ];

      html += `
        <div class="card menu-dietary-card" data-member-id="${member.id}">
          <div class="card-header">
            <h4>
              <i class="fas fa-user"></i>
              ${escapeHtml(member.name)}
              ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:party.primary\">${member.primary ? translate('common:party.primary') : ''}</span>" : ''}
            </h4>
          </div>
          <div class="card-content">
            ${dietaryOptions.map(opt => {
              const isSelected = selectedRequests.some(r =>
                (typeof r === 'string' && r === opt.name) ||
                (typeof r === 'object' && r.name === opt.name && r.selected)
              );
              return `
                <label class="dietary-checkbox ${isSelected ? 'checked' : ''}">
                  <input type="checkbox"
                    name="dietary-${member.id}"
                    value="${opt.name}"
                    ${isSelected ? 'checked' : ''}
                    onchange="updateDietaryCheckbox(this)">
                  <i class="fas ${opt.icon}"></i>
                  <span data-i18n="guests:dietary${opt.label}">${translate("guests:dietary" + opt.label)}</span>
                </label>
              `;
            }).join('')}
          </div>
          <div class="special-request-detail">
            <label for="special-detail-${member.id}"><div data-i18n="guests:additionalDetailsLabel">${translate("guests:additionalDetailsLabel")}</div></label>
            <textarea
              id="special-detail-${member.id}"
              name="special-detail-${member.id}"
              placeholder="${translate("guests:additionalDetailsPlaceholder")}"
              rows="3"
            >${escapeHtml(memberRequests.specialRequestDetail || '')}</textarea>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    // Add save button
    html += `
      <div class="action-container">
        <button type="button" id="saveMenuChoicesBtnBelow" class="btn-base btn-primary btn-lg">
          <i class="fas fa-save"></i>
          <span data-i18n="guests:saveMenuSelections">${translate("guests:saveMenuSelections")}</span>
        </button>
      </div>
    `;

    html += '</div>'; // Close unified-menu-container

    menuContent.innerHTML = html;

    // Translate the newly loaded content
    if (typeof updatePageContent === 'function') {
      updatePageContent();
    }

    // Initialize drag and drop functionality
    initMenuDragDrop();

    // Initialize image zoom functionality
    initImageZoom();

    // Attach save button handler
    let saveBtn = document.getElementById('saveMenuChoicesBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveAllMenuChoices);
    }
    saveBtn = document.getElementById('saveMenuChoicesBtnBelow');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveAllMenuChoices);
    }

  } catch (err) {
    console.error('Error loading menu selections:', err);
    menuContent.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3><div data-i18n="guests:menuErrorTitle">Error Loading Menu</div></h3>
        <p><div data-i18n="guests:menuErrorMessage2">There was a problem loading the menu. Please try again.</div></p>
        <button class="btn-retry" onclick="loadMenuSelections()">
          <i class="fas fa-redo"></i> <div data-i18n="guests:retry">Retry</div>
        </button>
      </div>
    `;

    // Even on error, try to translate any remaining content
    if (typeof updatePageContent === 'function') {
      updatePageContent();
    }
  }
}

// Initialize image zoom functionality for menu thumbnails
function initImageZoom() {
  // Create zoom overlay element
  const zoomOverlay = document.createElement('div');
  zoomOverlay.className = 'image-zoom-overlay';
  zoomOverlay.innerHTML = '<img src="" alt="Zoomed Image" class="zoom-image">';
  document.body.appendChild(zoomOverlay);

  // Get all image containers
  const imageContainers = document.querySelectorAll('.option-image-container');
  
  imageContainers.forEach(container => {
    const img = container.querySelector('.option-thumbnail');
    
    if (!img) return; // Skip if no image found
    
    container.addEventListener('mouseenter', function(e) {
      const imageUrl = img.src;
      
      if (!imageUrl || imageUrl === '') return;
      
      // Show zoom overlay
      const zoomImg = zoomOverlay.querySelector('.zoom-image');
      zoomImg.src = imageUrl;
      zoomOverlay.style.display = 'block';
      
      // Position overlay
      positionZoomOverlay(e);
    });
    
    container.addEventListener('mousemove', function(e) {
      if (zoomOverlay.style.display === 'block') {
        positionZoomOverlay(e);
      }
    });
    
    container.addEventListener('mouseleave', function() {
      zoomOverlay.style.display = 'none';
    });
  });
  
  // Position the zoom overlay based on mouse position
  function positionZoomOverlay(e) {
    const zoomImg = zoomOverlay.querySelector('.zoom-image');
    const overlay = zoomOverlay;
    
    // Get mouse position
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Default zoom image dimensions
    const zoomWidth = 300;
    const zoomHeight = 300;
    
    // Calculate position (try to keep overlay on screen)
    let left = mouseX + 20; // Offset from cursor
    let top = mouseY + 20;
    
    // Adjust if going off right edge
    if (left + zoomWidth > viewportWidth) {
      left = mouseX - zoomWidth - 20;
    }
    
    // Adjust if going off bottom edge
    if (top + zoomHeight > viewportHeight) {
      top = mouseY - zoomHeight - 20;
    }
    
    // Adjust if going off left edge
    if (left < 10) {
      left = 10;
    }
    
    // Adjust if going off top edge
    if (top < 10) {
      top = 10;
    }
    
    // Apply positioning
    overlay.style.left = left + 'px';
    overlay.style.top = top + 'px';
  }
}

// Initialize drag and drop for menu selections
function initMenuDragDrop() {
  const memberChips = document.querySelectorAll('.member-chip');
  const dropZones = document.querySelectorAll('.member-drop-zone');

  memberChips.forEach(chip => {
    chip.addEventListener('dragstart', handleDragStart);
    chip.addEventListener('dragend', handleDragEnd);
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  draggedChip = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.memberId);
  
  // Highlight valid drop zones (same course)
  const courseId = this.closest('.member-drop-zone').dataset.courseId;
  document.querySelectorAll(`.member-drop-zone[data-course-id="${courseId}"]`).forEach(zone => {
    zone.classList.add('drop-target-highlight');
  });
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.member-drop-zone').forEach(zone => {
    zone.classList.remove('drop-target-highlight', 'drag-over');
  });
  draggedChip = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (draggedChip) {
    const draggedCourseId = draggedChip.closest('.member-drop-zone').dataset.courseId;
    if (this.dataset.courseId === draggedCourseId) {
      this.classList.add('drag-over');
    }
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  
  if (!draggedChip) return;
  
  const draggedCourseId = draggedChip.closest('.member-drop-zone').dataset.courseId;
  const targetCourseId = this.dataset.courseId;
  
  // Only allow drops within the same course
  if (draggedCourseId !== targetCourseId) return;
  
  // Move the chip to the new zone
  this.appendChild(draggedChip);
  
  // Update the member counts
  updateMemberCounts(targetCourseId);
  
  // Show unsaved changes indicator
  markMenuAsUnsaved();
}

function updateMemberCounts(courseId) {
  const dropZones = document.querySelectorAll(`.member-drop-zone[data-course-id="${courseId}"]`);
  dropZones.forEach(zone => {
    const count = zone.querySelectorAll('.member-chip').length;
    const panel = zone.closest('.option-selection-panel');
    if (panel) {
      const countSpan = panel.querySelector('.member-count');
      if (countSpan) {
        countSpan.textContent = `${count} ${translate("guests:selectedCount")}`;
      }
    }
  });
}

function markMenuAsUnsaved() {
  const saveBtn = document.getElementById('saveMenuChoicesBtn');
  if (saveBtn && !saveBtn.classList.contains('unsaved')) {
    saveBtn.classList.add('unsaved');
    saveBtn.innerHTML = `<i class="fas fa-save"></i> <span data-i18n="guests:saveMenuSelections">${translate("guests:saveMenuSelections")}</span> *`;
  }
}

// Update dietary checkbox visual state
window.updateDietaryCheckbox = function(checkbox) {
  const label = checkbox.closest('.dietary-checkbox');
  if (label) {
    if (checkbox.checked) {
      label.classList.add('checked');
    } else {
      label.classList.remove('checked');
    }
  }
  markMenuAsUnsaved();
};

// Save all menu choices
async function saveAllMenuChoices() {
  console.log('Saving menu selections...');
  const saveBtn = document.getElementById('saveMenuChoicesBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <div data-i18n="common:menu.saving">'+ translate('common:menu.saving') +'</div>';
  }

  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Build choices from current DOM state
    const partyChoices = {};
    
    // Find all member chips and their current positions (menu selections)
    document.querySelectorAll('.member-chip').forEach(chip => {
      const memberId = chip.dataset.memberId;
      
      // Skip invalid member IDs
      if (!memberId || memberId === 'null' || memberId === 'undefined') {
        return;
      }
      
      const dropZone = chip.closest('.member-drop-zone');
      
      if (!dropZone) return;
      
      const optionId = dropZone.dataset.optionId;
      const courseId = dropZone.dataset.courseId;
      
      if (!partyChoices[memberId]) {
        partyChoices[memberId] = {
          partyGuestId: memberId,
          choices: [],
          specialRequest: [],
          specialRequestDetail: null
        };
      }
      
      // Check if we already have a choice for this course
      const existingChoice = partyChoices[memberId].choices.find(c => c.courseId === courseId);
      if (!existingChoice) {
        partyChoices[memberId].choices.push({
          courseId: courseId,
          optionId: optionId
        });
      }
    });

    // Collect special dietary requests for each member
    document.querySelectorAll('.menu-dietary-card').forEach(card => {
      const memberId = card.dataset.memberId;
      
      // Skip invalid member IDs
      if (!memberId || memberId === 'null' || memberId === 'undefined') {
        return;
      }
      
      if (!partyChoices[memberId]) {
        partyChoices[memberId] = {
          partyGuestId: memberId,
          choices: [],
          specialRequest: [],
          specialRequestDetail: null
        };
      }
      
      // Get selected dietary options
      const selectedOptions = [];
      card.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedOptions.push({
          name: checkbox.value,
          selected: true
        });
      });
      partyChoices[memberId].specialRequest = selectedOptions;
      
      // Get free text detail
      const detailTextarea = card.querySelector('textarea');
      if (detailTextarea && detailTextarea.value.trim()) {
        partyChoices[memberId].specialRequestDetail = detailTextarea.value.trim();
      } else {
        partyChoices[memberId].specialRequestDetail = null;
      }
    });

    // Convert to array format expected by API, filtering out any with invalid IDs
    const choicesArray = Object.values(partyChoices).filter(choice => {
      const isValid = choice.partyGuestId &&
                      choice.partyGuestId !== 'null' &&
                      choice.partyGuestId !== 'undefined';
      if (!isValid) {
        console.warn('Filtering out invalid choice:', choice);
      }
      return isValid;
    });
    
    // Send to server
    const response = await fetch('/api/guest/menu-choices', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ choices: choicesArray })
    });

    if (response.ok) {
      showToast(`<div data-i18n="common:menu.selections.saved">${translate('common:menu.selections.saved')}</div>`, 'success');
      if (saveBtn) {
        saveBtn.classList.remove('unsaved');
        saveBtn.innerHTML = `<i class="fas fa-save"></i> <span data-i18n="guests:saveMenuSelections">${translate('guests:saveMenuSelections')}</span>`;
      }
    } else {
      const data = await response.json();
      showToast(`<div data-i18n="common:error.saving.menu.selections">${(data.error || translate('common:error.saving.menu.selections'))}</div>`, 'error');
    }
  } catch (err) {
    console.error('Error saving menu choices:', err);
    showToast(`<div data-i18n="common:error.saving.menu.selections">${translate('common:error.saving.menu.selections')}</div>`, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      if (!saveBtn.classList.contains('unsaved')) {
        saveBtn.innerHTML = `<i class="fas fa-save"></i> <span data-i18n="guests:saveMenuSelections">${translate('guests:saveMenuSelections')}</span>`;
      }
    }
  }
}

// Make menu functions globally accessible
window.loadMenuSelections = loadMenuSelections;