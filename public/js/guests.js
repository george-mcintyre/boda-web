
// Settings management for guest access control
let settingsCache = null;
let settingsCacheTimestamp = 0;
const SETTINGS_CACHE_DURATION = 300000; // 5 minutes

// Fetch application settings (same logic as auth-check.js)
async function fetchSettings() {
    try {
        // Check if we have cached settings that are still valid
        const now = Date.now();
        if (settingsCache && (now - settingsCacheTimestamp) < SETTINGS_CACHE_DURATION) {
            return settingsCache;
        }

        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
            throw new Error(`Failed to fetch settings: ${response.status}`);
        }
        
        const settings = await response.json();
        settingsCache = settings;
        settingsCacheTimestamp = now;
        return settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        // Return default settings if fetch fails
        return {
            guestsEnabled: false,
            eventsEnabled: false,
            menuEnabled: false,
            messagesEnabled: false,
            giftsEnabled: false
        };
    }
}

// Apply settings-based visibility control
function applySettingsVisibility(settings) {
    console.log('Applying settings visibility:', settings);
    
    // Control tabs-header visibility
    const partyTab = document.querySelector('[data-tab="partyContent"]');
    const eventsTab = document.querySelector('[data-tab="eventsContent"]');
    const menuTab = document.querySelector('[data-tab="menuContent"]');
    const giftsTab = document.querySelector('[data-tab="giftsContent"]');
    
    // Party tab - disable if guestsEnabled is not true
    if (partyTab) {
        if (settings.guestsEnabled) {
            partyTab.style.display = '';
            partyTab.classList.remove('disabled');
        } else {
            partyTab.style.display = 'none';
            partyTab.classList.add('disabled');
        }
    }
    
    // RSVP/Events tab - disable if eventsEnabled is not true
    if (eventsTab) {
        if (settings.eventsEnabled) {
            eventsTab.style.display = '';
            eventsTab.classList.remove('disabled');
        } else {
            eventsTab.style.display = 'none';
            eventsTab.classList.add('disabled');
        }
    }
    
    // Menu tab - disable if menuEnabled is not true
    if (menuTab) {
        if (settings.menuEnabled) {
            menuTab.style.display = '';
            menuTab.classList.remove('disabled');
        } else {
            menuTab.style.display = 'none';
            menuTab.classList.add('disabled');
        }
    }
    
    // Gifts tab - disable if giftsEnabled is not true
    if (giftsTab) {
        if (settings.giftsEnabled) {
            giftsTab.style.display = '';
            giftsTab.classList.remove('disabled');
        } else {
            giftsTab.style.display = 'none';
            giftsTab.classList.add('disabled');
        }
    }
    
    // Control summary-section visibility
    const rsvpSummarySection = document.querySelector('.rsvp-summary-section');
    const menuSummarySection = document.querySelector('.menu-summary-section');
    
    // RSVP summary section - only show if eventsEnabled is true
    if (rsvpSummarySection) {
        if (settings.eventsEnabled) {
            rsvpSummarySection.style.display = '';
        } else {
            rsvpSummarySection.style.display = 'none';
        }
    }
    
    // Menu summary section - only show if menuEnabled is true
    if (menuSummarySection) {
        if (settings.menuEnabled) {
            menuSummarySection.style.display = '';
        } else {
            menuSummarySection.style.display = 'none';
        }
    }
    
    // If current active tab is now hidden, switch to summary
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && (activeTab.style.display === 'none' || activeTab.classList.contains('disabled'))) {
        const summaryTab = document.querySelector('[data-tab="summaryContent"]');
        if (summaryTab) {
            summaryTab.click();
        }
    }
}

// Initialize settings and apply visibility
async function initializeSettingsVisibility() {
    try {
        const settings = await fetchSettings();
        applySettingsVisibility(settings);
    } catch (error) {
        console.error('Error initializing settings visibility:', error);
        // Apply default visibility (hide all conditional sections)
        const defaultSettings = {
            guestsEnabled: false,
            eventsEnabled: false,
            menuEnabled: false,
            messagesEnabled: false,
            giftsEnabled: false
        };
        applySettingsVisibility(defaultSettings);
    }
}

// Configurar event listeners
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  console.log('DOM loaded, initializing i18n system...');
  
  // Initialize settings-based visibility
  await initializeSettingsVisibility();
  
  // Refresh settings when window regains focus (in case admin changed settings)
  window.addEventListener('focus', async () => {
    console.log('Window focused, refreshing settings...');
    await initializeSettingsVisibility();
  });

  // Show welcome message
  function showMessage(elementId, msg, type = 'error') {
    const element = document.getElementById(elementId);
    element.textContent = msg;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  // Function to show toast of confirmation
  function showToast(message, type = 'success') {
    // Create a toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    //Add to the body
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  // Function to show custom confirmation
  function showConfirmDialog(message, onConfirm, onCancel) {
    // Create a confirmation overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-content">
          <i class="fas fa-question-circle"></i>
          <h3>Confirm action</h3>
          <p>${message}</p>
          <div class="form-actions">
            <button class="btn-base btn-outline btn-md">cancel</button>
            <button class="btn-base btn-primary btn-md">confirm</button>
          </div>
        </div>
      </div>
    `;
    
    // Add to the body
    document.body.appendChild(overlay);
    
    // Show with animation
    setTimeout(() => overlay.classList.add('show'), 100);
    
    // Event listeners
    overlay.querySelector('.btn-base.btn-outline').addEventListener('click', () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      }, 300);
    });
    
    overlay.querySelector('.btn-base.btn-primary').addEventListener('click', () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
      }, 300);
    });
    
    // Close with Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(overlay);
          if (onCancel) onCancel();
        }, 300);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Load and menu selections - New unified menu layout with drag-drop support
  async function loadMenuSelections() {
    console.log('Loading menu selections...');
    const menuContent = document.getElementById('menuContent');

    if (!menuContent) return;
    
    // Show loading state
    menuContent.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
        <p>Loading menu...</p>
      </div>
    `;
    
    try {
      // Get party members and menu data in parallel
      const [partyResponse, menuResponse, menuChoicesResponse] = await Promise.all([
        fetch('/api/guest/party', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/menu', {
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
          <h3>Error Loading Menu</h3>
          <p>Unable to load menu data. Please try again later.</p>
          <button class="btn-retry" onclick="loadMenuSelections()">
            <i class="fas fa-redo"></i> Retry
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
        starter: { label: 'Starters', icon: 'fa-seedling', courses: [] },
        main: { label: 'Main Courses', icon: 'fa-drumstick-bite', courses: [] },
        dessert: { label: 'Desserts', icon: 'fa-ice-cream', courses: [] },
        drinks: { label: 'Drinks', icon: 'fa-cocktail', courses: [] }
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
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
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
      <div class="intro-card">
        <h2 class="card-title">
          <div data-i18n="guests:menuPageTitle">${translate('guests:menuPageTitle')}</div>
        </h2>
        <p class="card-description">
          <div data-i18n="guests:menuPageDescription">${translate('guests:menuPageDescription')}</div>
        </p>
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
              <h3>${escapeHtml(group.label)}</h3>
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
                ${isSelectable ? '<span class="badge badge-warning"><i class="fas fa-hand-pointer"></i> Selection Required</span>' : '<span class="badge badge-secondary"><i class="fas fa-info-circle"></i> Info Only</span>'}
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
                      <p class="option-description-text">${escapeHtml(option.description)}</p>
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
                      <span class="panel-label"><i class="fas fa-users"></i> Who's having this?</span>
                      <span class="member-count">${membersForOption.length} selected</span>
                    </div>
                    <div class="member-drop-zone" data-option-id="${option.id}" data-course-id="${course.id}">
                      ${membersForOption.map(member => `
                        <div class="member-chip" draggable="true" data-member-id="${member.id}" data-member-name="${escapeHtml(member.name)}">
                          <i class="fas fa-user"></i>
                          <span>${escapeHtml(member.name)}</span>
                          ${member.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
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
            <h3>Dietary Requirements & Special Requests</h3>
          </div>
          <p class="special-requests-description">Please let us know about any dietary requirements or allergies for each guest.</p>
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
          <div class="card" data-member-id="${member.id}">
            <div class="card-header">
              <i class="fas fa-user"></i>
              <h4>${escapeHtml(member.name)}</h4>
              ${member.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
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
                    <span>${opt.label}</span>
                  </label>
                `;
              }).join('')}
            </div>
            <div class="special-request-detail">
              <label for="special-detail-${member.id}">Additional details or specific requirements:</label>
              <textarea
                id="special-detail-${member.id}"
                name="special-detail-${member.id}"
                placeholder="Please describe any specific dietary needs, allergies, or special requirements..."
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
          <button type="button" id="saveMenuChoicesBtn" class="btn-base btn-primary btn-lg">
            <i class="fas fa-save"></i>
            Save Menu Selections
          </button>
        </div>
      `;

      html += '</div>'; // Close unified-menu-container

      menuContent.innerHTML = html;

      // Initialize drag and drop functionality
      initMenuDragDrop();

      // Initialize image zoom functionality
      initImageZoom();

      // Attach save button handler
      const saveBtn = document.getElementById('saveMenuChoicesBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', saveAllMenuChoices);
      }

      console.log('Menu selections loaded successfully');

    } catch (err) {
      console.error('Error loading menu selections:', err);
      menuContent.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Menu</h3>
          <p>There was a problem loading the menu. Please try again.</p>
          <button class="btn-retry" onclick="loadMenuSelections()">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
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

  let draggedChip = null;

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
          countSpan.textContent = `${count} selected`;
        }
      }
    });
  }

  function markMenuAsUnsaved() {
    const saveBtn = document.getElementById('saveMenuChoicesBtn');
    if (saveBtn && !saveBtn.classList.contains('unsaved')) {
      saveBtn.classList.add('unsaved');
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Menu Selections *';
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
    const saveBtn = document.getElementById('saveMenuChoicesBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
      // Build choices from current DOM state
      const partyChoices = {};
      
      // Find all member chips and their current positions (menu selections)
      document.querySelectorAll('.member-chip').forEach(chip => {
        const memberId = chip.dataset.memberId;
        
        // Skip invalid member IDs
        if (!memberId || memberId === 'null' || memberId === 'undefined') {
          console.warn('Skipping chip with invalid memberId:', memberId);
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
      document.querySelectorAll('.special-request-card').forEach(card => {
        const memberId = card.dataset.memberId;
        
        // Skip invalid member IDs
        if (!memberId || memberId === 'null' || memberId === 'undefined') {
          console.warn('Skipping special request card with invalid memberId:', memberId);
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
      
      // Log for debugging
      console.log('Saving menu choices:', JSON.stringify({ choices: choicesArray }, null, 2));

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
        showToast('Menu selections saved successfully!', 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Menu Selections';
        }
      } else {
        const data = await response.json();
        showToast(data.error || 'Error saving menu selections', 'error');
      }
    } catch (err) {
      console.error('Error saving menu choices:', err);
      showToast('Error saving menu selections', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!saveBtn.classList.contains('unsaved')) {
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Menu Selections';
        }
      }
    }
  }

  // Make loadMenuSelections globally accessible for retry button
  window.loadMenuSelections = loadMenuSelections;

  // Save menu selection function
  window.saveMenuSelection = async (partyGuestId, courseId, optionId) => {
    try {
      const currentChoices = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      }).then(res => res.json());

      // Find or create choice for this party member
      let memberChoices = currentChoices.find(choice => 
        choice.partyGuestId === partyGuestId
      );

      if (!memberChoices) {
        memberChoices = {
          partyGuestId: partyGuestId,
          choices: []
        };
        currentChoices.push(memberChoices);
      }

      // Remove existing choice for this course and add new one
      memberChoices.choices = memberChoices.choices.filter(choice => choice.courseId !== courseId);
      memberChoices.choices.push({ courseId, optionId });

      // Update on server
      const response = await fetch('/api/guest/menu-choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ choices: currentChoices })
      });

      if (response.ok) {
        showToast('Menu selection saved successfully!', 'success');
      } else {
        showToast('Error saving menu selection', 'error');
      }
    } catch (err) {
      console.error('Error saving menu selection:', err);
      showToast('Error saving menu selection', 'error');
    }
  };

  // Save special request function
  window.saveSpecialRequest = async (partyGuestId, specialRequest) => {
    try {
      const currentChoices = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      }).then(res => res.json());

      // Find or create choice for this party member
      let memberChoices = currentChoices.find(choice => 
        choice.partyGuestId === partyGuestId
      );

      if (!memberChoices) {
        memberChoices = {
          partyGuestId: partyGuestId,
          choices: []
        };
        currentChoices.push(memberChoices);
      }

      memberChoices.specialRequest = specialRequest || null;
      if (specialRequest !== 'other') {
        memberChoices.specialRequestDetail = null;
      }

      // Update on server
      const response = await fetch('/api/guest/menu-choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ choices: currentChoices })
      });

      if (response.ok) {
        showToast('Special request saved successfully!', 'success');
        
        // Show/hide detail textarea based on selection
        const detailTextarea = document.querySelector(`textarea[name="special-request-detail-${partyGuestId}"]`);
        if (detailTextarea) {
          detailTextarea.style.display = specialRequest === 'other' ? 'block' : 'none';
        }
      } else {
        showToast('Error saving special request', 'error');
      }
    } catch (err) {
      console.error('Error saving special request:', err);
      showToast('Error saving special request', 'error');
    }
  };

  // Save special request detail function
  window.saveSpecialRequestDetail = async (partyGuestId, specialRequestDetail) => {
    try {
      const currentChoices = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      }).then(res => res.json());

      // Find or create choice for this party member
      let memberChoices = currentChoices.find(choice => 
        choice.partyGuestId === partyGuestId
      );

      if (!memberChoices) {
        memberChoices = {
          partyGuestId: partyGuestId,
          choices: []
        };
        currentChoices.push(memberChoices);
      }

      memberChoices.specialRequestDetail = specialRequestDetail || null;

      // Update on server
      const response = await fetch('/api/guest/menu-choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ choices: currentChoices })
      });

      if (response.ok) {
        showToast('Special request details saved successfully!', 'success');
      } else {
        showToast('Error saving special request details', 'error');
      }
    } catch (err) {
      console.error('Error saving special request details:', err);
      showToast('Error saving special request details', 'error');
    }
  };
  
   // Helper function to initialize a map for an event
   function initEventMap(mapContainerId, lat, lng) {
     try {
       // Check if Leaflet is available
       if (typeof L !== 'undefined') {
         const mapContainer = document.getElementById(mapContainerId);
         
         if (mapContainer) {
           const map = L.map(mapContainerId).setView([parseFloat(lat), parseFloat(lng)], 16);
           
           L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             attribution: '© OpenStreetMap contributors'
           }).addTo(map);
           
           L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
           
           // Fix map sizing issue when container is hidden
           setTimeout(() => {
             map.invalidateSize();
           }, 100);
         }
       } else {
         // Fallback: Show a simple coordinate display with map link
         const mapContainer = document.getElementById(mapContainerId);
         
         if (mapContainer) {
           mapContainer.innerHTML = `
             <div style="width:100%;height:100%;background:linear-gradient(45deg,#f0f0f0,#e0e0e0);display:flex;align-items:center;justify-content:center;border-radius:8px;">
               <div style="text-align:center;color:#666;">
                 <i class="fas fa-map-marker-alt" style="font-size:2em;color:#e74c3c;margin-bottom:10px;"></i>
                 <div>Location: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}</div>
                 <small>Interactive map requires Leaflet.js</small>
               </div>
             </div>
           `;
         }
       }
     } catch (error) {
       console.error('Map initialization error:', error);
       const mapContainer = document.getElementById(mapContainerId);
       
       if (mapContainer) {
         mapContainer.innerHTML = `
           <div style="width:100%;height:100%;background:linear-gradient(45deg,#f0f0f0,#e0e0e0);display:flex;align-items:center;justify-content:center;border-radius:8px;">
             <div style="text-align:center;color:#666;">
               <i class="fas fa-map-marker-alt" style="font-size:2em;color:#e74c3c;margin-bottom:10px;"></i>
               <div>Location: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}</div>
               <small>Open in Maps to view</small>
             </div>
           </div>
         `;
       }
     }
   }

  /**
   * Load and display events content in the events tab
   * Fetches events, party members, and event choices from the API
   * Creates event cards with attendance checkboxes for each party member
   */
  async function loadEventsContent() {
    const eventsContent = document.getElementById('eventsContent');
    
    if (!eventsContent) {
      console.error('Events content container not found');
      return;
    }
    
    // Show loading state
    eventsContent.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
        <p>Loading events...</p>
      </div>
    `;
    
    try {
      // Fetch all required data in parallel
      const [eventsResponse, partyResponse, choicesResponse] = await Promise.all([
        fetch('/api/guest/events', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/party', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/event-choices', {
          method: 'GET',
          headers: { 'Authorization': token }
        })
      ]);
      
      // Parse responses with error handling
      let events = [];
      let partyMembers = [];
      let eventChoices = [];
      
      if (eventsResponse.ok) {
        events = await eventsResponse.json();
      } else {
        console.error('Failed to fetch events:', eventsResponse.status);
      }
      
      if (partyResponse.ok) {
        partyMembers = await partyResponse.json();
      } else {
        console.error('Failed to fetch party members:', partyResponse.status);
      }
      
      if (choicesResponse.ok) {
        eventChoices = await choicesResponse.json();
      } else {
        // Event choices may not exist yet - not an error
        console.log('No event choices found (may be first time)');
      }
      
      // Handle no events case
      if (!Array.isArray(events) || events.length === 0) {
        eventsContent.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3>No Events Available</h3>
            <p>There are no events scheduled yet. Please check back later.</p>
          </div>
        `;
        return;
      }
      
      // Build attendance lookup: { partyGuestId: { eventId: boolean } }
      const attendanceLookup = {};
      if (Array.isArray(eventChoices)) {
        eventChoices.forEach(memberChoice => {
          const memberId = memberChoice.partyGuestId;
          if (!attendanceLookup[memberId]) {
            attendanceLookup[memberId] = {};
          }
          if (Array.isArray(memberChoice.choices)) {
            memberChoice.choices.forEach(choice => {
              attendanceLookup[memberId][choice.eventId] = choice.attending === true;
            });
          }
        });
      }
      
      // Helper to escape HTML to prevent injection
      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // Date/time formatting helpers
      const formatEventDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      };
      
      const formatEventTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      // Map sub-event icon names to Font Awesome icons
      const getIconClass = (iconName) => {
        const icons = {
          'ceremony': 'fa-ring',
          'cocktails': 'fa-glass-cheers',
          'reception': 'fa-utensils',
          'dancing': 'fa-music',
          'dinner': 'fa-utensils',
          'party': 'fa-champagne-glasses',
          'welcome': 'fa-hand-wave'
        };
        return icons[iconName] || 'fa-calendar-check';
      };
      
      // Group events by date for better organization
      const eventsByDate = {};
      events.forEach(event => {
        const dateKey = formatEventDate(event.date);
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      });
      
      // Track events with coordinates for map initialization
      const mapsToInitialize = [];

      // Build HTML for a single event card (horizontal layout: image left, details right)
      const buildEventCard = (event) => {
        const eventId = event.id;
        const mapContainerId = `event-map-${eventId}`;
        const hasLocation = event.locationLatitude && event.locationLongitude;
        
        // Get event image from API (can be null if no image uploaded)
        const eventImage = event.image;
        
        // Track for map initialization
        if (hasLocation) {
          mapsToInitialize.push({
            containerId: mapContainerId,
            lat: event.locationLatitude,
            lng: event.locationLongitude
          });
        }
        
        // Build sub-events timeline HTML
        let subEventsHtml = '';
        if (Array.isArray(event.sub_events) && event.sub_events.length > 0) {
          const subEventItems = event.sub_events.map(subEvent => `
            <div class="sub-event-item">
              <div class="sub-event-icon">
                <img src="/assets/icons/${subEvent.icon || 'ceremony'}.svg" alt="${escapeHtml(subEvent.name)}" />
              </div>
              <div class="sub-event-details">
                <span class="sub-event-name">${escapeHtml(subEvent.name)}</span>
                <span class="sub-event-time">
                  <i class="fas fa-clock"></i>
                  ${formatEventTime(subEvent.date)}${subEvent.end ? ' - ' + formatEventTime(subEvent.end) : ''}
                </span>
                ${subEvent.description ? `<span class="sub-event-description">${escapeHtml(subEvent.description)}</span>` : ''}
              </div>
            </div>
          `).join('');
          
          subEventsHtml = `
            <div class="sub-events-timeline">
              <h4><i class="fas fa-list-ul"></i> Schedule</h4>
              ${subEventItems}
            </div>
          `;
        }
        
        // Build attendance HTML
        let attendanceItemsHtml = '';
        if (Array.isArray(partyMembers) && partyMembers.length > 0) {
          attendanceItemsHtml = partyMembers.map(member => {
            const isAttending = attendanceLookup[member.id] ? attendanceLookup[member.id][eventId] === true : false;
            return `
              <div class="attendance-item" onclick="saveEventChoices()" style="cursor: pointer;">
                <label class="attendance-label">
                  <input type="checkbox" class="attendance-checkbox" data-event-id="${eventId}" data-member-id="${member.id}" ${isAttending ? 'checked' : ''}>
                  <span class="member-name">${escapeHtml(member.name)}</span>
                  ${member.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
                  ${member.adult === false ? '<span class="badge badge-info">Child</span>' : ''}
                </label>
              </div>
            `;
          }).join('');
        } else {
          attendanceItemsHtml = '<p class="no-members">No party members found.</p>';
        }
        
        // Build Google Maps link
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.title || ''} ${event.locationAddress || ''}`.trim())}`;

        // Build image HTML - only show if image exists
        const imageHtml = eventImage ? `
          <div class="event-image-container">
            <img src="${eventImage}" alt="${escapeHtml(event.name || event.title || 'Event')}" class="event-image" />
          </div>
        ` : '';

        // Build map HTML
        let mapHtml = '';
        if (hasLocation) {
            mapHtml = `
          <div class="event-map-container">
            <div id="${mapContainerId}" class="event-map"></div>
            <div class="event-actions">
              <a class="btn-ver-mapa" href="${mapsUrl}" target="_blank" rel="noopener">
                <i class="fas fa-map"></i> View on Map
              </a>
            </div>
          </div>
        `;
        }

          // Assemble the complete horizontal event card (image left 50%, details right 50%)
        return `
          <div class="event-card-horizontal ${eventImage ? '' : 'no-image'}" data-event-id="${eventId}">
            ${imageHtml}
            <div class="event-details-card">
              <div class="event-date-badge">
                <i class="fas fa-calendar-alt"></i>
                <span>${formatEventDate(event.date)}</span>
              </div>
              
              <div class="event-header">
                <div class="event-icon">
                  <i class="fas ${getIconClass(event.name || event.title || '')}"></i>
                </div>
                <h3 class="event-title">${escapeHtml(event.name || '')}</h3>
              </div>
              
              ${event.title && event.name !== event.title ? `<h4 class="event-venue-name">${escapeHtml(event.title)}</h4>` : ''}
              
              ${event.description ? `<p class="event-description">${escapeHtml(event.description)}</p>` : ''}
              
              <div class="event-meta">
                <div class="event-meta-item">
                  <i class="fas fa-clock"></i>
                  <span>${formatEventTime(event.date)}${event.end ? ' - ' + formatEventTime(event.end) : ''}</span>
                </div>
                ${event.locationAddress ? `
                  <div class="event-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(event.locationAddress)}</span>
                  </div>
                ` : ''}
              </div>
                ${(event.locationAddress || hasLocation) ? `
                  ${mapHtml}
                ` : ''}
              ${subEventsHtml}
              
              <div class="event-attendance">
                <h5 class="attendance-title">
                  <i class="fas fa-users"></i>
                  Who's Attending?
                </h5>
                <div class="attendance-list">
                  ${attendanceItemsHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      };
      
      // Build complete HTML output
      let html = '<div class="events-container">';
      
      html += `
        <div class="intro-card">
          <h2 class="card-title">
            <div data-i18n="guests:eventsPageTitle">${translate('guests:eventsPageTitle')}</div>
          </h2>
          <p class="card-description">
            <div data-i18n="guests:eventsPageDescription">${translate('guests:eventsPageDescription')}</div>
          </p>
        </div>
      `;
      
      Object.entries(eventsByDate).forEach(([dateKey, dateEvents]) => {
        // Build all event cards for this date
        const eventCardsHtml = dateEvents.map(event => buildEventCard(event)).join('');
        
        html += `
          <div class="event-day">
            <h3 class="day-title">
              <i class="fas fa-calendar-day"></i>
              ${dateKey}
            </h3>
            <div class="day-events">
              ${eventCardsHtml}
            </div>
          </div>
        `;
      });

      
      html += '</div>'; // Close events-container
      
      // Update DOM
      eventsContent.innerHTML = html;
      
      // Initialize maps after DOM update
      if (mapsToInitialize.length > 0) {
        setTimeout(() => {
          mapsToInitialize.forEach(mapConfig => {
            initEventMap(mapConfig.containerId, mapConfig.lat, mapConfig.lng);
          });
        }, 150);
      }

      
    } catch (error) {
      console.error('Error loading events:', error);
      eventsContent.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Events</h3>
          <p>There was a problem loading the events. Please try again.</p>
          <button class="btn-retry" onclick="loadEventsContent()">
            <i class="fas fa-redo"></i>
            Retry
          </button>
        </div>
      `;
    }
  }
  
  // Make loadEventsContent globally accessible for retry button
  window.loadEventsContent = loadEventsContent;
  
  // Make saveEventChoices globally accessible for onclick handlers
  window.saveEventChoices = saveEventChoices;
   
  // Function to save event attendance choices
   async function saveEventChoices() {
     const saveBtn = document.getElementById('saveEventChoicesBtn');
     
     try {
       // Collect all attendance checkboxes
       const checkboxes = document.querySelectorAll('.attendance-checkbox');
       
       // Build the partyChoices structure
       const partyChoicesMap = {};
       
       checkboxes.forEach(checkbox => {
         const eventId = checkbox.dataset.eventId;
         const memberId = checkbox.dataset.memberId;
         const attending = checkbox.checked;
         
         if (!partyChoicesMap[memberId]) {
           partyChoicesMap[memberId] = {
             partyGuestId: memberId,
             choices: []
           };
         }
         
         partyChoicesMap[memberId].choices.push({
           eventId: eventId,
           attending: attending
         });
       });
       
       // Convert to array
       const partyChoices = Object.values(partyChoicesMap);
       
       // Send to server
       const response = await fetch('/api/guest/event-choices', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify(partyChoices)
       });
       
       if (response.ok) {
         showToast('Attendance choices saved successfully!', 'success');
       } else {
         const data = await response.json();
         showToast(data.error || 'Error saving attendance choices', 'error');
       }
     } catch (err) {
       console.error('Error saving event choices:', err);
       showToast('Error saving attendance choices', 'error');
     } finally {
       if (saveBtn) {
         saveBtn.disabled = false;
         saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Attendance Choices';
       }
     }
   }

   // Global function to confirm events
   window.confirmEventAttendance = async (eventoId, confirmar) => {
     try {
       const res = await fetch('/api/event/confirm', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ eventoId, confirmar })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast(data.mensaje, 'success');
         setTimeout(() => {
           cargarContenidoAgenda(); // Recargar la event
           cargarStatusAgenda(); // Actualizar el status en la pestaña resumen
         }, 1000);
       } else {
         // Verificar si es un error de bloqueo
         if (res.status === 403) {
           showToast(`La event está bloqueada: ${data.error}`, 'error');
           // Recargar la event para mostrar el estado de bloqueo
           setTimeout(() => {
             cargarContenidoAgenda();
           }, 1000);
         } else {
           showToast(data.error || 'Error al confirmar el evento.', 'error');
         }
       }
     } catch (err) {
       showToast('Error de conexión al confirmar el evento.', 'error');
     }
   };

   // Function to load the gifts content in the gifts tab
  async function loadGiftsContent() {
     console.log("loading gifts content");
     const giftsContent = document.getElementById('giftsContent');
     
     if (!giftsContent) {
       console.error('Gifts content container not found');
       return;
     }
     
     // Show loading state
     giftsContent.innerHTML = `
       <div class="loading-state">
         <i class="fas fa-spinner fa-spin fa-3x"></i>
         <p>Loading gifts...</p>
       </div>
     `;
     
     try {
       // Fetch gift choices (donations) and available gifts in parallel
       const [giftChoicesRes, giftsRes] = await Promise.all([
         fetch('/api/guest/gift-choices', {
           method: 'GET',
           headers: { 'Authorization': token }
         }),
         fetch('/api/guest/gifts', {
           method: 'GET',
           headers: { 'Authorization': token }
         })
       ]);
       
       let giftChoices = [];
       let gifts = [];
       
       if (giftChoicesRes.ok) {
         giftChoices = await giftChoicesRes.json();
       }
       
       if (!giftsRes.ok) {
         throw new Error('Failed to load gifts');
       }
       gifts = await giftsRes.json();
       
       // Helper to escape HTML
       const escapeHtml = (str) => {
         if (!str) return '';
         return String(str)
           .replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&#039;');
       };
       
       // Format date helper
       const formatDate = (dateString) => {
         if (!dateString) return '';
         const date = new Date(dateString);
         return date.toLocaleDateString('en-GB', {
           day: 'numeric',
           month: 'long',
           year: 'numeric'
         });
       };
       
       let html = '<div class="gifts-container">';

       html += `
       <div class="intro-card">
         <h2 class="card-title">
           <div data-i18n="guests:giftsPageTitle">${translate('guests:giftsPageTitle')}</div>
         </h2>
         <p class="card-description">
           <div data-i18n="guests:giftsPageDescription">${translate('guests:giftsPageDescription')}</div>
         </p>
       </div>
     `;
             
       // ========== Section 1: Thank You Section (if there are donated gifts) ==========
       if (giftChoices.length > 0) {
         html += `
           <div class="gifts-thank-you-section">
             <div class="thank-you-header">
               <i class="fas fa-heart"></i>
               <h3>Thank You for Your Generosity!</h3>
               <p>We are so grateful for your wonderful gifts</p>
             </div>
             <div class="donated-gifts-grid">
         `;
         
         giftChoices.forEach(choice => {
           html += `
             <div class="donated-gift-card" style="background-image: url('${escapeHtml(choice.giftImageUrl)}');">
               <div class="donated-gift-overlay">
                 <div class="donated-gift-content">
                   <h4 class="donated-gift-title">${escapeHtml(choice.giftTitle)}</h4>
                   <div class="donated-gift-price">€${choice.giftAmount}</div>
                   <div class="donated-gift-date">
                     <i class="fas fa-calendar-check"></i>
                     Donated on ${formatDate(choice.date)}
                   </div>
                   ${choice.message ? `
                     <div class="donated-gift-message">
                       <i class="fas fa-quote-left"></i>
                       ${escapeHtml(choice.message)}
                     </div>
                   ` : ''}
                 </div>
               </div>
             </div>
           `;
         });
         
         html += `
             </div>
           </div>
         `;
       }
       
       // ========== Section 2: Available Gifts Grid ==========
       html += `
         <div class="gifts-available-section">
           <div class="available-gifts-header">
             <i class="fas fa-gift"></i>
             <h3>Gift Registry</h3>
             <p>Choose from our carefully selected gifts</p>
           </div>
           <div class="gift-cards-grid">
       `;
       
       if (gifts.length === 0) {
         html += `
           <div class="empty-state">
             <i class="fas fa-inbox"></i>
             <h4>No gifts available</h4>
             <p>Please check back later for our gift registry.</p>
           </div>
         `;
       } else {
         gifts.forEach(gift => {
           const isAvailable = gift.stock > 0;
           
           html += `
             <div class="card gift-credit-card ${!isAvailable ? 'sold-out' : ''}" data-gift-id="${gift.id}">
               <div class="gift-card-image-section" style="background-image: url('${escapeHtml(gift.imageUrl)}');">
                 <div class="gift-card-image-overlay">
                   <h4 class="gift-card-title">${escapeHtml(gift.title)}</h4>
                   <div class="gift-card-price">${escapeHtml(gift.priceDisplay)}</div>
                 </div>
               </div>
               <div class="gift-card-details">
                 <p class="gift-card-description">${escapeHtml(gift.description)}</p>
                 <div class="gift-card-stock">
                   ${isAvailable
                     ? `<span class="stock-available"><i class="fas fa-check-circle"></i> ${gift.stock} available</span>`
                     : `<span class="stock-sold-out"><i class="fas fa-times-circle"></i> Sold Out</span>`
                   }
                 </div>
                 <div class="action-container">
                   ${isAvailable ? `
                     <button class="btn-base btn-primary btn-md" onclick="purchaseGift('${gift.id}', '${escapeHtml(gift.title).replace(/'/g, "\\'")}', ${gift.amount})">
                       <i class="fas fa-credit-card"></i>
                       Buy Gift
                     </button>
                   ` : `
                     <button class="btn-disabled" disabled>
                       <i class="fas fa-ban"></i>
                       Sold Out
                     </button>
                   `}
                 </div>
               </div>
             </div>
           `;
         });
       }
       
       html += `
           </div>
         </div>
       `;
       
       html += '</div>'; // Close gifts-container
       
       giftsContent.innerHTML = html;
       
       // Check for payment success/cancel in URL
       const urlParams = new URLSearchParams(window.location.search);
       const paymentStatus = urlParams.get('payment');
       if (paymentStatus === 'success') {
         showToast('Thank you for your gift! Your payment was successful.', 'success');
         // Clean up URL
         window.history.replaceState({}, document.title, window.location.pathname);
         // Reload to show updated gift choices
         setTimeout(() => loadGiftsContent(), 1000);
       } else if (paymentStatus === 'cancelled') {
         showToast('Payment was cancelled.', 'error');
         // Clean up URL
         window.history.replaceState({}, document.title, window.location.pathname);
       }
       
     } catch (err) {
       console.error('Error loading gifts:', err);
       giftsContent.innerHTML = `
         <div class="error-state">
           <i class="fas fa-exclamation-triangle"></i>
           <h3>Error Loading Gifts</h3>
           <p>There was a problem loading the gifts. Please try again.</p>
           <button class="btn-retry" onclick="loadGiftsContent()">
             <i class="fas fa-redo"></i>
             Retry
           </button>
         </div>
       `;
     }
   }
   
   // Make loadGiftsContent globally accessible
   window.loadGiftsContent = loadGiftsContent;
   
   // Global function to purchase a gift
   window.purchaseGift = async (giftId, giftTitle, giftAmount) => {
     // Show a confirmation dialog with optional message
     const overlay = document.createElement('div');
     overlay.className = 'gift-purchase-overlay';
     overlay.innerHTML = `
       <div class="gift-purchase-dialog">
         <div class="gift-purchase-header">
           <i class="fas fa-gift"></i>
           <h3>Purchase Gift</h3>
         </div>
         <div class="gift-purchase-content">
           <p>You're about to purchase:</p>
           <div class="gift-purchase-summary">
             <strong>${giftTitle}</strong>
             <span class="gift-purchase-amount">€${giftAmount}</span>
           </div>
           <div class="gift-message-input">
             <label for="giftMessage">Add a personal message (optional):</label>
             <textarea id="giftMessage" placeholder="Leave a lovely message for the couple..." rows="3"></textarea>
           </div>
         </div>
         <div class="action-container">
           <button class="btn-base btn-outline btn-md btn-cancel-purchase">Cancel</button>
           <button class="btn-base btn-primary btn-md btn-confirm-purchase">
             <i class="fas fa-credit-card"></i>
             Proceed to Payment
           </button>
         </div>
       </div>
     `;
     
     document.body.appendChild(overlay);
     setTimeout(() => overlay.classList.add('show'), 10);
     
     // Handle cancel
     overlay.querySelector('.btn-cancel-purchase').addEventListener('click', () => {
       overlay.classList.remove('show');
       setTimeout(() => document.body.removeChild(overlay), 300);
     });
     
     // Handle confirm
     overlay.querySelector('.btn-confirm-purchase').addEventListener('click', async () => {
       const message = document.getElementById('giftMessage').value.trim();
       const confirmBtn = overlay.querySelector('.btn-confirm-purchase');
       
       // Show loading state
       confirmBtn.disabled = true;
       confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
       
       try {
         const response = await fetch('/api/guest/create-payment-session', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': token
           },
           body: JSON.stringify({ giftId, message })
         });
         
         const data = await response.json();
         
         if (response.ok && data.checkoutUrl) {
           // Redirect to Stripe checkout
           window.location.href = data.checkoutUrl;
         } else {
           showToast(data.error || 'Error processing payment', 'error');
           confirmBtn.disabled = false;
           confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> Proceed to Payment';
         }
       } catch (err) {
         console.error('Error creating payment session:', err);
         showToast('Error connecting to payment service', 'error');
         confirmBtn.disabled = false;
         confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> Proceed to Payment';
       }
     });
     
     // Close on escape
     const handleEscape = (e) => {
       if (e.key === 'Escape') {
         overlay.classList.remove('show');
         setTimeout(() => document.body.removeChild(overlay), 300);
         document.removeEventListener('keydown', handleEscape);
       }
     };
     document.addEventListener('keydown', handleEscape);
   };

   // Load messages content
   async function loadMessagesContent() {
   }

   // Configure the messages form
   const messagesForm = document.getElementById('messagesForm');
   if (messagesForm) {
     messagesForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const message = messagesForm.message.value.trim();
       if (!message) return;
       
       try {
         const res = await fetch('/api/messages', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify({ mensaje })
         });
         const data = await res.json();
         if (res.ok) {
           showMessage('mensajeStatus', 'Mensaje enviado con éxito', 'success');
           showToast('Mensaje enviado con éxito');
           mensajeForm.reset();
           cargarMensajes();
         } else {
           showMessage('mensajeStatus', data.error || 'Error al enviar el mensaje.', 'error');
         }
       } catch (err) {
         showMessage('mensajeStatus', 'Error de conexión al enviar el mensaje.', 'error');
       }
     });
   }

   // Global function to reserve gifts
   window.reserveGift = async (giftId) => {
     try {
       const res = await fetch('/api/regalos/reservar', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ id: regaloId })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast(data.mensaje, 'success');
         setTimeout(() => {
           cargarContenidoRegalos(); // Recargar la lista de regalos
           cargarStatusRegalos(); // Actualizar el status en la pestaña resumen
         }, 1000);
       } else {
         showToast(data.error || 'Error al reservar el regalo.', 'error');
       }
     } catch (err) {
       showToast('Error de conexión al reservar el regalo.', 'error');
     }
   };

   // Global function to cancel gifts
   window.cancelGift = async (giftId) => {
     try {
       const res = await fetch('/api/regalos/cancelar', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ id: regaloId })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast(data.mensaje, 'success');
         setTimeout(() => {
           cargarContenidoRegalos(); // Recargar la lista de regalos
           cargarStatusRegalos(); // Actualizar el status en la pestaña resumen
         }, 1000);
       } else {
         showToast(data.error || 'Error al cancelar el regalo.', 'error');
       }
     } catch (err) {
       showToast('Error de conexión al cancelar el regalo.', 'error');
     }
   };

   // Global function to buy gifts
   window.buyGift = async (giftId) => {
     try {
       const message = prompt('Leave a message with your gift (optional):');
       
       const res = await fetch('/api/invitado/create-payment-session', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ giftId, message })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast('Gift added to cart! Redirecting to checkout...', 'success');
         // Redirect to checkout (implement based on your payment system)
         setTimeout(() => {
           window.open(data.checkoutUrl, '_blank');
           cargarContenidoRegalos(); // Recargar la lista de regalos
         }, 1000);
       } else {
         showToast(data.error || 'Error al procesar el regalo.', 'error');
       }
     } catch (err) {
       showToast('Error de conexión al procesar el regalo.', 'error');
     }
   };

   // Global logout function
  window.logoutGuest = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    window.location.href = 'index.html';
  };
  
  // Main function
  try {
    const response = await fetch('/api/guest/profile', {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const name = data.name || data.name || 'guest';
      console.log(`Welcome, ${name}!`);
    } else {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error('Error connecting to the server.');
  }

  /**
   * Load and display party content in the party tab
   * Allows managing party members (add/edit names, max 4 members)
   * And managing dietary requirements for each member
   */
  async function loadPartyContent() {
    const partyContent = document.getElementById('partyContent');
    
    if (!partyContent) {
      console.error('Party content container not found');
      return;
    }
    
    // Show loading state
    partyContent.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
        <p>Loading party...</p>
      </div>
    `;
    
    try {
      // Fetch party members and menu choices (for dietary info) in parallel
      const [partyResponse, menuChoicesResponse] = await Promise.all([
        fetch('/api/guest/party', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/menu-choices', {
          method: 'GET',
          headers: { 'Authorization': token }
        })
      ]);
      
      if (!partyResponse.ok) {
        throw new Error('Failed to load party data');
      }
      
      const partyData = await partyResponse.json();
      const menuChoicesData = menuChoicesResponse.ok ? await menuChoicesResponse.json() : [];
      
      // Build dietary requests lookup from existing choices
      const dietaryLookup = {};
      menuChoicesData.forEach(memberChoice => {
        dietaryLookup[memberChoice.partyGuestId] = {
          specialRequest: memberChoice.specialRequest || [],
          specialRequestDetail: memberChoice.specialRequestDetail || ''
        };
      });
      
      // Helper to escape HTML
      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      const maxPartySize = 4;
      const canAddMore = partyData.length < maxPartySize;
      
      // Build HTML
      let html = '<div class="party-management-container">';
      html += `
        <div class="intro-card">
          <h2 class="card-title">
            <div data-i18n="guests:partyPageTitle">${translate('guests:partyPageTitle')}</div>
          </h2>
          <p class="card-description">
            <div data-i18n="guests:partyPageDescription">${translate('guests:partyPageDescription')}</div>
          </p>
        </div>
      `;      
      
      // ========== Section 1: Party Members List ==========
      html += `
        <div class="party-members-management">
          <div class="party-members-header">
            <h3><i class="fas fa-users"></i> Party Members</h3>
            <span class="party-count">${partyData.length} / ${maxPartySize} members</span>
          </div>
          <p class="party-description">
            Your party includes everyone who will attend the wedding with you. You can add up to ${maxPartySize} party members including yourself.
            ${!canAddMore ? '<strong>You have reached the maximum party size. Please contact the wedding administrators if you need to add more guests.</strong>' : ''}
          </p>
          <div class="party-members-edit-list">
      `;
      
      // Party member edit cards
      partyData.forEach((member, index) => {
        html += `
          <div class="card party-member-edit-card ${member.primary ? 'primary-member' : ''}" data-member-id="${member.id}" data-index="${index}" data-is-primary="${member.primary ? 'true' : 'false'}">
            <div class="member-edit-header">
              <span class="member-number">${index + 1}</span>
              ${member.primary ? '<span class="primary-indicator"><i class="fas fa-star"></i> Primary Guest</span>' : ''}
              ${member.adult === false ? '<span class="child-indicator"><i class="fas fa-child"></i> Child</span>' : ''}
            </div>
            <div class="member-edit-form">
              <div class="form-group">
                <label for="member-name-${member.id}">
                  <i class="fas fa-user"></i> Name
                </label>
                <input type="text"
                       id="member-name-${member.id}"
                       class="form-control member-name-input"
                       data-member-id="${member.id}"
                       data-is-primary="${member.primary ? 'true' : 'false'}"
                       value="${escapeHtml(member.name)}"
                       placeholder="Enter name...">
              </div>
              <div class="form-group">
                <label for="member-age-${member.id}">
                  <i class="fas fa-birthday-cake"></i> Age Category
                </label>
                <select id="member-age-${member.id}"
                        class="form-control member-age-select"
                        data-member-id="${member.id}"
                        data-is-primary="${member.primary ? 'true' : 'false'}">
                  <option value="adult" ${member.adult !== false ? 'selected' : ''}>Adult (18+)</option>
                  <option value="child" ${member.adult === false ? 'selected' : ''}>Child (Under 18)</option>
                </select>
              </div>
              ${!member.primary ? `
                <button type="button" class="btn-base btn-danger btn-sm" data-member-id="${member.id}" title="Remove member">
                  <i class="fas fa-trash-alt"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      });
      
      // Add new member button (if under max)
      if (canAddMore) {
        html += `
          <div class="add-member-card">
            <button type="button" id="addPartyMemberBtn" class="btn-base btn-secondary btn-md">
              <i class="fas fa-plus-circle"></i>
              <span>Add Party Member</span>
            </button>
          </div>
        `;
      } else {
        html += `
          <div class="max-members-notice">
            <i class="fas fa-info-circle"></i>
            <p>Maximum party size reached. Need more guests? <a href="mailto:wedding@example.com">Contact us</a></p>
          </div>
        `;
      }
      
      html += `
          </div>
          <div class="action-container">
            <button type="button" id="savePartyMembersBtn" class="btn-base btn-primary btn-lg">
              <i class="fas fa-save"></i>
              Save Party Members
            </button>
          </div>
        </div>
      `;
      
      // ========== Section 2: Dietary Requirements ==========
      html += `
        <div class="party-dietary-management">
          <div class="dietary-header">
            <h3><i class="fas fa-utensils"></i> Dietary Requirements</h3>
          </div>
          <p class="dietary-description">
            Please let us know about any dietary requirements or allergies for each party member.
          </p>
          <div class="party-dietary-cards">
      `;
      
      const dietaryOptions = [
        { name: 'vegetarian', label: 'Vegetarian', icon: 'fa-leaf' },
        { name: 'lactose-intolerant', label: 'Lactose Intolerant', icon: 'fa-cheese' },
        { name: 'gluten-intolerant', label: 'Gluten Intolerant', icon: 'fa-bread-slice' },
        { name: 'nut-allergy', label: 'Nut Allergy', icon: 'fa-seedling' },
        { name: 'other', label: 'Other', icon: 'fa-question-circle' }
      ];
      
      partyData.forEach(member => {
        const memberDietary = dietaryLookup[member.id] || { specialRequest: [], specialRequestDetail: '' };
        const selectedRequests = Array.isArray(memberDietary.specialRequest) ? memberDietary.specialRequest : [];
        
        html += `
          <div class="card party-dietary-card" data-member-id="${member.id}">
            <div class="party-dietary-card-header">
              <i class="fas fa-user"></i>
              <h4>${escapeHtml(member.name)}</h4>
              ${member.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
            </div>
            <div class="dietary-options">
              ${dietaryOptions.map(opt => {
                const isSelected = selectedRequests.some(r =>
                  (typeof r === 'string' && r === opt.name) ||
                  (typeof r === 'object' && r.name === opt.name && r.selected)
                );
                return `
                  <label class="dietary-checkbox ${isSelected ? 'checked' : ''}">
                    <input type="checkbox"
                      name="party-dietary-${member.id}"
                      value="${opt.name}"
                      ${isSelected ? 'checked' : ''}
                      onchange="updatePartyDietaryCheckbox(this)">
                    <i class="fas ${opt.icon}"></i>
                    <span>${opt.label}</span>
                  </label>
                `;
              }).join('')}
            </div>
            <div class="dietary-detail">
              <label for="party-dietary-detail-${member.id}">Additional details or specific requirements:</label>
              <textarea
                id="party-dietary-detail-${member.id}"
                name="party-dietary-detail-${member.id}"
                class="form-control dietary-detail-textarea"
                data-member-id="${member.id}"
                placeholder="Please describe any specific dietary needs, allergies, or special requirements..."
                rows="2"
              >${escapeHtml(memberDietary.specialRequestDetail || '')}</textarea>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
          <div class="action-container">
            <button type="button" id="saveDietaryBtn" class="btn-base btn-primary btn-lg">
              <i class="fas fa-save"></i>
              Save Dietary Requirements
            </button>
          </div>
        </div>
      `;
      
      html += '</div>'; // Close party-management-container
      
      partyContent.innerHTML = html;
      
      // ========== Attach Event Listeners ==========
      
      // Add new member button
      const addMemberBtn = document.getElementById('addPartyMemberBtn');
      if (addMemberBtn) {
        addMemberBtn.addEventListener('click', addNewPartyMember);
      }
      
      // Save party members button
      const savePartyBtn = document.getElementById('savePartyMembersBtn');
      if (savePartyBtn) {
        savePartyBtn.addEventListener('click', savePartyMembers);
      }
      
      // Save dietary button
      const saveDietaryBtn = document.getElementById('saveDietaryBtn');
      if (saveDietaryBtn) {
        saveDietaryBtn.addEventListener('click', savePartyDietary);
      }
      
      // Remove member buttons
      document.querySelectorAll('.btn-base.btn-danger.btn-sm').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const card = this.closest('.party-member-edit-card');
          if (card) {
            const memberId = card.getAttribute('data-member-id');
            console.log('Button clicked, card found:', card, 'memberId:', memberId);
            removePartyMember(memberId);
          }
        });
      });
      
      // Mark as unsaved when inputs change
      document.querySelectorAll('.member-name-input').forEach(input => {
        input.addEventListener('input', markPartyAsUnsaved);
      });
      
      // Mark as unsaved when age selector changes
      document.querySelectorAll('.member-age-select').forEach(select => {
        select.addEventListener('change', markPartyAsUnsaved);
      });
      
      console.log('Party content loaded successfully');
      
    } catch (err) {
      console.error('Error loading party content:', err);
      partyContent.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Party</h3>
          <p>There was a problem loading your party information. Please try again.</p>
          <button class="btn-retry" onclick="loadPartyContent()">
            <i class="fas fa-redo"></i>
            Retry
          </button>
        </div>
      `;
    }
  }
  
  // Make loadPartyContent globally accessible
  window.loadPartyContent = loadPartyContent;
  
  // Track new members to add (temporary IDs)
  let newMemberCounter = 0;

  // 24-char hex, looks like a Mongo ObjectId
  function makeObjectIdLike() {
    const bytes = new Uint8Array(12); // 12 bytes = 24 hex chars

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Browser or modern runtime
     crypto.getRandomValues(bytes);
    } else {
      // Fallback (e.g. older Node without crypto in this scope)
      for (let i = 0; i < 12; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  // Add a new party member to the list
  function addNewPartyMember() {
    const membersList = document.querySelector('.party-members-edit-list');
    const addCard = document.querySelector('.add-member-card');
    const maxMembersNotice = document.querySelector('.max-members-notice');
    
    if (!membersList) return;
    
    // Count current members
    const currentMembers = membersList.querySelectorAll('.party-member-edit-card');
    const maxPartySize = 4;
    
    if (currentMembers.length >= maxPartySize) {
      showToast('Maximum party size reached (4 members)', 'error');
      return;
    }
    
    newMemberCounter++;
    const index = currentMembers.length;
    const id = makeObjectIdLike();

    // Create new member card
    const newCard = document.createElement('div');
    newCard.className = 'card party-member-edit-card new-member';
    newCard.dataset.memberId = id;
    newCard.dataset.index = index;
    newCard.innerHTML = `
      <div class="member-edit-header">
        <span class="member-number">${index + 1}</span>
        <span class="new-member-indicator"><i class="fas fa-plus-circle"></i> New</span>
      </div>
      <div class="member-edit-form">
        <div class="form-group">
          <label for="member-name-${id}">
            <i class="fas fa-user"></i> Name
          </label>
          <input type="text"
                 id="member-name-${id}"
                 class="form-control member-name-input new-member-input"
                 data-member-id="${id}"
                 value=""
                 placeholder="Enter name..."
                 autofocus>
        </div>
        <div class="form-group">
          <label for="member-age-${id}">
            <i class="fas fa-birthday-cake"></i> Age Category
          </label>
          <select id="member-age-${id}"
                  class="form-control member-age-select new-member-age-select"
                  data-member-id="${id}">
            <option value="adult" selected>Adult (18+)</option>
            <option value="child">Child (Under 18)</option>
          </select>
        </div>
        <button type="button" class="btn-base btn-danger btn-sm" data-member-id="${id}" title="Remove member">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    
    // Insert before add button or max notice
    if (addCard) {
      membersList.insertBefore(newCard, addCard);
    } else if (maxMembersNotice) {
      membersList.insertBefore(newCard, maxMembersNotice);
    } else {
      membersList.appendChild(newCard);
    }
    
    // Check if we've reached max
    const updatedCount = membersList.querySelectorAll('.party-member-edit-card').length;
    if (updatedCount >= maxPartySize && addCard) {
      addCard.style.display = 'none';
      
      // Add max notice if not present
      if (!maxMembersNotice) {
        const notice = document.createElement('div');
        notice.className = 'max-members-notice';
        notice.innerHTML = `
          <i class="fas fa-info-circle"></i>
          <p>Maximum party size reached. Need more guests? <a href="mailto:wedding@example.com">Contact us</a></p>
        `;
        membersList.appendChild(notice);
      }
    }
    
    // Update party count display
    updatePartyCountDisplay();
    
    // Attach remove listener to new button
    newCard.querySelector('.btn-base.btn-danger.btn-sm').addEventListener('click', function() {
      removePartyMember(tempId);
    });
    
    // Mark as unsaved
    markPartyAsUnsaved();
    
    // Focus the new input
    const newInput = newCard.querySelector('.member-name-input');
    if (newInput) newInput.focus();
  }
  
  // Remove a party member from the list
  function removePartyMember(memberId) {
    const card = document.querySelector(`.party-member-edit-card[data-member-id="${memberId}"]`);
    if (!card) return;
    
    const memberName = card.querySelector('.member-name-input')?.value || 'this member';
    
    // Confirm removal
    showConfirmDialog(
      `Are you sure you want to remove ${memberName} from your party?`,
      async () => {
        card.remove();
        
        // Show add button again if under max
        const membersList = document.querySelector('.party-members-edit-list');
        const currentMembers = membersList.querySelectorAll('.party-member-edit-card');
        const addCard = document.querySelector('.add-member-card');
        const maxMembersNotice = document.querySelector('.max-members-notice');
        
        if (currentMembers.length < 4) {
          if (addCard) addCard.style.display = '';
          if (maxMembersNotice) maxMembersNotice.remove();
        }
        
        // Re-number members
        membersList.querySelectorAll('.party-member-edit-card').forEach((card, idx) => {
          const numberEl = card.querySelector('.member-number');
          if (numberEl) numberEl.textContent = idx + 1;
          card.dataset.index = idx;
        });
        
        updatePartyCountDisplay();

        await savePartyMembers();
      }
    );
  }
  
  // Update the party count display
  function updatePartyCountDisplay() {
    const countEl = document.querySelector('.party-count');
    const membersList = document.querySelector('.party-members-edit-list');
    if (countEl && membersList) {
      const count = membersList.querySelectorAll('.party-member-edit-card').length;
      countEl.textContent = `${count} / 4 members`;
    }
  }
  
  // Mark party changes as unsaved
  function markPartyAsUnsaved() {
    const saveBtn = document.getElementById('savePartyMembersBtn');
    if (saveBtn && !saveBtn.classList.contains('unsaved')) {
      saveBtn.classList.add('unsaved');
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Party Members *';
    }
  }
  
  // Update party dietary checkbox visual state
  window.updatePartyDietaryCheckbox = function(checkbox) {
    const label = checkbox.closest('.dietary-checkbox');
    if (label) {
      if (checkbox.checked) {
        label.classList.add('checked');
      } else {
        label.classList.remove('checked');
      }
    }
    markDietaryAsUnsaved();
  };
  
  // Mark dietary changes as unsaved
  function markDietaryAsUnsaved() {
    const saveBtn = document.getElementById('saveDietaryBtn');
    if (saveBtn && !saveBtn.classList.contains('unsaved')) {
      saveBtn.classList.add('unsaved');
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Dietary Requirements *';
    }
  }
  
  // Save party members
  async function savePartyMembers() {
    const saveBtn = document.getElementById('savePartyMembersBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
      // Collect all member data from the form
      const memberCards = document.querySelectorAll('.party-member-edit-card');
      const members = [];
      
      memberCards.forEach(card => {
        const memberId = card.dataset.memberId;
        const nameInput = card.querySelector('.member-name-input');
        const ageSelect = card.querySelector('.member-age-select');
        const name = nameInput ? nameInput.value.trim() : '';
        
        if (!name) {
          // Skip empty names
          return;
        }
        
        // Read adult property from the form selector
        const ageCategory = ageSelect ? ageSelect.value : 'adult';
        const isAdult = ageCategory === 'adult';

        members.push({
          id: memberId,
          name: name,
          adult: isAdult
        });
      });
      
      console.log('Saving party members:', members);
      
      const response = await fetch('/api/guest/party', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(members)
      });
      
      if (response.ok) {
        showToast('Party members saved successfully!', 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Party Members';
        }
        // Reload to get updated IDs and refresh dietary cards
        loadPartyContent();
      } else {
        const data = await response.json();
        showToast(data.error || 'Error saving party members', 'error');
      }
    } catch (err) {
      console.error('Error saving party members:', err);
      showToast('Error saving party members', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!saveBtn.classList.contains('unsaved')) {
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Party Members';
        }
      }
    }
  }
  
  // Save party dietary requirements
  async function savePartyDietary() {
    const saveBtn = document.getElementById('saveDietaryBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
      // Get current menu choices first
      const currentChoicesResponse = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      
      let currentChoices = [];
      if (currentChoicesResponse.ok) {
        currentChoices = await currentChoicesResponse.json();
      }
      
      // Collect dietary data from cards
      const dietaryCards = document.querySelectorAll('.party-dietary-card');
      
      dietaryCards.forEach(card => {
        const memberId = card.dataset.memberId;
        
        // Skip invalid member IDs
        if (!memberId || memberId.startsWith('new-')) return;
        
        // Get selected dietary options
        const selectedOptions = [];
        card.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
          selectedOptions.push({
            name: checkbox.value,
            selected: true
          });
        });
        
        // Get free text detail
        const detailTextarea = card.querySelector('.dietary-detail-textarea');
        const specialRequestDetail = detailTextarea && detailTextarea.value.trim() ? detailTextarea.value.trim() : null;
        
        // Find or create choice for this member
        let memberChoice = currentChoices.find(c => c.partyGuestId === memberId);
        if (!memberChoice) {
          memberChoice = {
            partyGuestId: memberId,
            choices: []
          };
          currentChoices.push(memberChoice);
        }
        
        memberChoice.specialRequest = selectedOptions;
        memberChoice.specialRequestDetail = specialRequestDetail;
      });
      
      // Filter out any with invalid IDs
      const validChoices = currentChoices.filter(choice =>
        choice.partyGuestId &&
        !choice.partyGuestId.startsWith('new-') &&
        choice.partyGuestId !== 'null' &&
        choice.partyGuestId !== 'undefined'
      );

      // Send to server
      const response = await fetch('/api/guest/menu-choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ choices: validChoices })
      });
      
      if (response.ok) {
        showToast('Dietary requirements saved successfully!', 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Dietary Requirements';
        }
      } else {
        const data = await response.json();
        showToast(data.error || 'Error saving dietary requirements', 'error');
      }
    } catch (err) {
      console.error('Error saving dietary requirements:', err);
      showToast('Error saving dietary requirements', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!saveBtn.classList.contains('unsaved')) {
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Dietary Requirements';
        }
      }
    }
  }

  // Tabs functionality with settings-based access control
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      console.log("button Clicked: ", targetTab);
      
      // Check if tab is disabled due to settings
      if (button.style.display === 'none' || button.classList.contains('disabled')) {
        const currentLang = localStorage.getItem('i18nextLng') || 'es';
        const messages = {
          en: 'This section is not yet enabled. Please check back later or contact the organizers for more information.',
          es: 'Esta sección aún no está habilitada. Vuelve a consultar más tarde o contacta con los organizadores para más información.',
          fr: 'Cette section n\'est pas encore activée. Veuillez vérifier plus tard ou contacter les organisateurs pour plus d\'informations.'
        };
        
        showToast(messages[currentLang] || messages.es, 'info');
        return;
      }
      
      //Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to the clicked button and its content
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      // If the tab is party, load the party content
      if (targetTab === 'partyContent') {
        loadPartyContent();
      }
      
      // If the tab is menu, load the menu content
      if (targetTab === 'menuContent') {
        loadMenuSelections();
      }
      
      // If the tab is events (RSVP), load the events content
      if (targetTab === 'eventsContent') {
        loadEventsContent();
      }
      
      // If the tab is gifts, load the gifts content
      if (targetTab === 'giftsContent') {
        loadGiftsContent();
      }
      
      // If the tab is summary, reload all the status data
      if (targetTab === 'summaryContent') {
        console.log("loading summary content");
        loadSummaryContent();
        loadMessagesContent();
      }

    });
  });

  // Function to switch to a specific tab
  window.switchToTab = function(tabName) {
    // Find and check if target tab is accessible
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (!targetButton) return;
    
    // Check if tab is disabled due to settings
    if (targetButton.style.display === 'none' || targetButton.classList.contains('disabled')) {
      const currentLang = localStorage.getItem('i18nextLng') || 'es';
      const messages = {
        en: 'This section is not yet enabled. Please check back later or contact the organizers for more information.',
        es: 'Esta sección aún no está habilitada. Vuelve a consultar más tarde o contacta con los organizadores para más información.',
        fr: 'Cette section n\'est pas encore activée. Veuillez vérifier plus tard ou contacter les organisateurs pour plus d\'informations.'
      };
      
      showToast(messages[currentLang] || messages.es, 'info');
      return;
    }
    
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Activate the target tab button
    targetButton.classList.add('active');

    // Find and activate the target tab content
    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
      targetContent.classList.add('active');
    }

    // Load content for the specific tab
    if (tabName === 'partyContent') {
      loadPartyContent();
    } else if (tabName === 'menuContent') {
      loadMenuSelections();
    } else if (tabName === 'eventsContent') {
      loadEventsContent();
    } else if (tabName === 'giftsContent') {
      loadGiftsContent();
    } else if (tabName === 'summaryContent') {
      loadSummaryContent();
      loadMessagesContent();
    }
  }

  // Define loadSummaryContent function to load all summary data
  async function loadSummaryContent() {
    const summaryContent = document.getElementById('summaryContent');
    
    if (!summaryContent) {
      console.error('Summary content container not found');
      return;
    }
    
    // Re-apply settings visibility to control summary sections
    try {
      const settings = await fetchSettings();
      applySettingsVisibility(settings);
    } catch (error) {
      console.error('Error refreshing settings for summary:', error);
    }
    
    // Show loading state
    summaryContent.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Loading summary...</p>
      </div>
    `;
    
    try {
      // Fetch all required data in parallel
      const [partyResponse, eventsResponse, eventChoicesResponse, menuResponse, menuChoicesResponse, giftChoicesResponse] = await Promise.all([
        fetch('/api/guest/party', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/events', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/event-choices', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/menu', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/menu-choices', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/gift-choices', {
          method: 'GET',
          headers: { 'Authorization': token }
        })
      ]);
      
      // Parse responses
      let partyMembers = [];
      let events = [];
      let eventChoices = [];
      let menu = [];
      let menuChoices = [];
      let giftChoices = [];
      
      if (partyResponse.ok) partyMembers = await partyResponse.json();
      if (eventsResponse.ok) events = await eventsResponse.json();
      if (eventChoicesResponse.ok) eventChoices = await eventChoicesResponse.json();
      if (menuResponse.ok) menu = await menuResponse.json();
      if (menuChoicesResponse.ok) menuChoices = await menuChoicesResponse.json();
      if (giftChoicesResponse.ok) giftChoices = await giftChoicesResponse.json();
      
      // Helper to escape HTML
      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // Date/time formatting helpers
      const formatEventDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });
      };
      
      const formatEventTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      };
      
      // Build attendance lookup: { partyGuestId: { eventId: boolean } }
      const attendanceLookup = {};
      if (Array.isArray(eventChoices)) {
        eventChoices.forEach(memberChoice => {
          const memberId = memberChoice.partyGuestId;
          if (!attendanceLookup[memberId]) {
            attendanceLookup[memberId] = {};
          }
          if (Array.isArray(memberChoice.choices)) {
            memberChoice.choices.forEach(choice => {
              attendanceLookup[memberId][choice.eventId] = choice.attending === true;
            });
          }
        });
      }
      
      // Build menu choices lookup: { partyGuestId: { courseId: optionId } }
      const menuChoicesLookup = {};
      menuChoices.forEach(memberChoice => {
        const memberId = memberChoice.partyGuestId;
        menuChoicesLookup[memberId] = {};
        if (memberChoice.choices) {
          memberChoice.choices.forEach(choice => {
            menuChoicesLookup[memberId][choice.courseId] = choice.optionId;
          });
        }
      });
      
      // Build options lookup from menu: { optionId: optionLabel }
      const optionsLookup = {};
      const coursesLookup = {};
      menu.forEach(course => {
        coursesLookup[course.id] = {
          label: course.label,
          selectionRequired: course.selectionRequired !== false,
          options: course.options
        };
        (course.options || []).forEach(option => {
          optionsLookup[option.id] = option.label;
        });
      });
      
      // Start building HTML
      let html = '';

      
      // ========== 1. Party Members Card ==========
      html += `
        <div class="summary-section party-members-section">
          <h3 class="summary-section-title clickable" onclick="switchToTab('partyContent')" style="cursor: pointer;">
            <i class="fas fa-users"></i>
            Your Party (${partyMembers.length} ${partyMembers.length === 1 ? 'person' : 'people'})
            <i class="fas fa-arrow-right section-nav-arrow"></i>
          </h3>
          <div class="party-members-list">
      `;
      
      if (partyMembers.length > 0) {
        partyMembers.forEach(member => {
          html += `
            <div class="party-member-item ${member.primary ? 'primary-member' : ''}">
              <span class="member-name">
                <i class="fas fa-user"></i>
                ${escapeHtml(member.name)}
              </span>
              ${member.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
              ${member.adult === false ? '<span class="badge badge-info">Child</span>' : ''}
            </div>
          `;
        });
      } else {
        html += '<p class="no-data">No party members found.</p>';
      }
      
      html += `
          </div>
        </div>
      `;
      
      // ========== 2. RSVP Summary Card ==========
      html += `
        <div class="summary-section rsvp-summary-section">
          <h3 class="summary-section-title clickable" onclick="switchToTab('eventsContent')" style="cursor: pointer;">
            <i class="fas fa-calendar-check"></i>
            RSVP Summary
            <i class="fas fa-arrow-right section-nav-arrow"></i>
          </h3>
      `;
      
      if (events.length > 0) {
        events.forEach(event => {
          // Get attendees for this event
          const attendees = partyMembers.filter(member => {
            const memberAttendance = attendanceLookup[member.id];
            return memberAttendance && memberAttendance[event.id] === true;
          });
          
          html += `
            <div class="rsvp-event-item">
              <div class="rsvp-event-header">
                <div class="rsvp-event-info">
                  <span class="rsvp-event-name">${escapeHtml(event.name)}</span>
                  <span class="rsvp-event-datetime">${formatEventDate(event.date)} at ${formatEventTime(event.date)}</span>
                </div>
                <span class="rsvp-attendee-count ${attendees.length > 0 ? 'has-attendees' : 'no-attendees'}">
                  ${attendees.length} attending
                </span>
              </div>
              ${attendees.length > 0 ? `
                <div class="rsvp-attendees-list">
                  ${attendees.map(a => `<span class="attendee-chip"><i class="fas fa-check"></i> ${escapeHtml(a.name)}</span>`).join('')}
                </div>
              ` : `
                <div class="no-attendees-message">
                  <i class="fas fa-info-circle"></i> No attendees confirmed yet
                </div>
              `}
            </div>
          `;
        });
      } else {
        html += '<p class="no-data">No events available.</p>';
      }
      
      html += '</div>';
      
      // ========== 3. Menu Choices Summary Card ==========
      html += `
        <div class="summary-section menu-summary-section">
          <h3 class="summary-section-title clickable" onclick="switchToTab('menuContent')" style="cursor: pointer;">
            <i class="fas fa-utensils"></i>
            Menu Selections
            <i class="fas fa-arrow-right section-nav-arrow"></i>
          </h3>
      `;
      
      if (partyMembers.length > 0 && menu.length > 0) {
        partyMembers.forEach(member => {
          const memberChoices = menuChoicesLookup[member.id] || {};
          
          html += `
            <div class="menu-member-card">
              <div class="menu-member-header">
                <i class="fas fa-user"></i>
                <span class="menu-member-name">${escapeHtml(member.name)}</span>
                ${member.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
              </div>
              <div class="menu-choices-list">
          `;
          
          // Sort menu courses by the correct order: starter, main, dessert, drinks
          const courseOrder = { starter: 1, main: 2, dessert: 3, drinks: 4 };
          const sortedMenu = menu.slice().sort((a, b) => (courseOrder[a.course] || 999) - (courseOrder[b.course] || 999));
          
          sortedMenu.forEach(course => {
            const selectedOptionId = memberChoices[course.id];
            const isSelectable = course.selectionRequired !== false && course.options && course.options.length > 1;
            
            if (isSelectable) {
              // Selectable course - show selected option
              const selectedLabel = selectedOptionId ? optionsLookup[selectedOptionId] : null;
              
              html += `
                <div class="menu-choice-item">
                  <span class="menu-course-label">${escapeHtml(course.label)}:</span>
                  <span class="menu-option-label ${selectedLabel ? '' : 'not-selected'}">
                    ${selectedLabel ? escapeHtml(selectedLabel) : 'Not selected'}
                  </span>
                </div>
              `;
            } else {
              // Non-selectable course - show all options or single option
              const optionLabels = (course.options || []).map(o => o.label);
              
              html += `
                <div class="menu-choice-item info-only">
                  <span class="menu-course-label">${escapeHtml(course.label)}:</span>
                  <span class="menu-option-label">
                    ${optionLabels.length > 0 ? optionLabels.map(l => escapeHtml(l)).join(', ') : 'N/A'}
                  </span>
                </div>
              `;
            }
          });
          
          html += `
              </div>
            </div>
          `;
        });
      } else {
        html += '<p class="no-data">No menu selections available.</p>';
      }
      
      html += '</div>';
      
      // ========== 4. Gifts Offered Card (only if gifts exist) ==========
      if (giftChoices.length > 0) {
        html += `
          <div class="summary-section gifts-summary-section">
            <h3 class="summary-section-title clickable" onclick="switchToTab('giftsContent')" style="cursor: pointer;">
              <i class="fas fa-gift"></i>
              Your Gifts
              <i class="fas fa-arrow-right section-nav-arrow"></i>
            </h3>
            <div class="gifts-list">
        `;
        
        giftChoices.forEach(gift => {
          html += `
            <div class="gift-summary-item">
              <div class="gift-summary-header">
                <span class="gift-title">${escapeHtml(gift.giftTitle)}</span>
                <span class="gift-amount">€${gift.giftAmount}</span>
              </div>
              <div class="gift-summary-date">
                <i class="fas fa-calendar"></i>
                ${formatDate(gift.date)}
              </div>
              ${gift.message ? `
                <div class="gift-summary-message">
                  <i class="fas fa-quote-left"></i>
                  ${escapeHtml(gift.message)}
                </div>
              ` : ''}
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      // Update the DOM
      summaryContent.innerHTML = html;
      
    } catch (error) {
      console.error('Error loading summary:', error);
      summaryContent.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Summary</h3>
          <p>There was a problem loading your summary. Please try again.</p>
          <button class="btn-retry" onclick="loadSummaryContent()">
            <i class="fas fa-redo"></i>
            Retry
          </button>
        </div>
      `;
    }
  }
  
  // Make loadSummaryContent globally accessible
  window.loadSummaryContent = loadSummaryContent;

  // Load preferred language
  const savedLang = localStorage.getItem('i18nextLng');
  if (savedLang && languages[savedLang]) {
    currentLanguage = savedLang;
  }
  
  // Initialize
  updateDocumentDirection();
  updatePageContent();
  updateLanguageSelector();
  updateFormatting();
  
  // Check which tab is active on page load and load its content
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    const targetTab = activeTab.getAttribute('data-tab');
    console.log('Initial tab on page load:', targetTab);
    
    // Load appropriate content for the active tab
    if (targetTab === 'summaryContent') {
      loadSummaryContent();
    } else if (targetTab === 'partyContent') {
      loadPartyContent();
    } else if (targetTab === 'menuContent') {
      loadMenuSelections();
    } else if (targetTab === 'eventsContent') {
      loadEventsContent();
    } else if (targetTab === 'giftsContent') {
      loadGiftsContent();
    }
  }
  
  console.log(`i18n system initialized, language: ${currentLanguage}`);
});

