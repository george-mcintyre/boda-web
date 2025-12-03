
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
    
    // Comments section - only show if messagesEnabled is true
    const commentsSection = document.querySelector('.comments-card');
    if (commentsSection) {
        if (settings.messagesEnabled) {
            commentsSection.style.display = '';
            // Initialize comments system if messages are enabled and comments system exists
            if (window.commentsSystem) {
                // Refresh comments when becoming visible
                setTimeout(() => {
                    if (typeof window.commentsSystem.loadComments === 'function') {
                        window.commentsSystem.loadComments();
                    }
                }, 100);
            }
        } else {
            commentsSection.style.display = 'none';
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
  
  // Initialize settings-based visibility
  await initializeSettingsVisibility();
  
  // Refresh settings when window regains focus (in case admin changed settings)
  window.addEventListener('focus', async () => {
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
          <h3 data-i18n="rich:common:confirmAction">${translate("rich:common:confirmAction")}</h3>
          <p>${message}</p> 
          <div class="form-actions">
            <button class="btn-base btn-outline btn-md" data-i18n="rich:common:cancel">${translate("rich:common:cancel")}</button>
            <button class="btn-base btn-primary btn-md" data-i18n="rich:common:confirm">${translate("rich:common:confirm")}</button>
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
    const menuContent = document.getElementById('menuContent');

    if (!menuContent) return;
    
    // Show loading state
    menuContent.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
        <p><div data-i18n="guests:menuLoading">Loading menu...</div></p>
      </div>
    `;
    
    try {
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
      <div class="intro-card intro-section">
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
                      <span class="panel-label"><i class="fas fa-users"></i> <div data-i18n="guests:whosHavingThis">Who's having this?</div></span>
                      <span class="member-count">${membersForOption.length} <div data-i18n="guests:selectedCount">selected</div></span>
                    </div>
                    <div class="member-drop-zone" data-option-id="${option.id}" data-course-id="${course.id}">
                      ${membersForOption.map(member => `
                        <div class="member-chip" draggable="true" data-member-id="${member.id}" data-member-name="${escapeHtml(member.name)}">
                          <i class="fas fa-user"></i>
                          <span>${escapeHtml(member.name)}</span>
                          ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:primary\">${member.primary ? translate('common:primary') : ''}</span>" : ''}
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
          { name: 'vegetarian', label: 'guests:dietaryVegetarian', icon: 'fa-leaf' },
          { name: 'lactose-intolerant', label: 'guests:dietaryLactoseIntolerant', icon: 'fa-cheese' },
          { name: 'gluten-intolerant', label: 'guests:dietaryGlutenIntolerant', icon: 'fa-bread-slice' },
          { name: 'nut-allergy', label: 'guests:dietaryNutAllergy', icon: 'fa-seedling' },
          { name: 'other', label: 'guests:dietaryOther', icon: 'fa-question-circle' }
        ];

        html += `
          <div class="card" data-member-id="${member.id}">
            <div class="card-header">
              <i class="fas fa-user"></i>
              <h4>${escapeHtml(member.name)}</h4>
              ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:primary\">${member.primary ? translate('common:primary') : ''}</span>" : ''}
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
                    <span><div data-i18n="guests:dietary${opt.label}">${translate("guests:dietary" + opt.label)}</div></span>
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
          <button type="button" id="saveMenuChoicesBtn" class="btn-base btn-primary btn-lg">
            <i class="fas fa-save"></i>
            <div data-i18n="guests:saveMenuSelections">Save Menu Selections</div>
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
      const saveBtn = document.getElementById('saveMenuChoicesBtn');
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
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <div data-i18n="common:saving">'+ translate('common:saving') +'</div>';
    }

    try {
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
      document.querySelectorAll('.party-dietary-card').forEach(card => {
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
        showToast('<div data-i18n="common:menuSelectionsSaved">'+ translate('common:menuSelectionsSaved') +'</div>', 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = '<i class="fas fa-save"></i> <div data-i18n="guests:saveMenuSelections">'+ translate('guests:saveMenuSelections') +'</div>';
        }
      } else {
        const data = await response.json();
        showToast('<div data-i18n="common:errorSavingMenuSelections">'+ (data.error || translate('common:errorSavingMenuSelections')) + '</div>', 'error');
      }
    } catch (err) {
      console.error('Error saving menu choices:', err);
      showToast('<div data-i18n="common:errorSavingMenuSelections">'+ translate('common:errorSavingMenuSelections') +'</div>', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!saveBtn.classList.contains('unsaved')) {
          saveBtn.innerHTML = '<i class="fas fa-save"></i> <div data-i18n="guests:saveMenuSelections">'+ translate('guests:saveMenuSelections') +'</div>';
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
        showToast('<div data-i18n="common:menuSelectionSaved">'+ translate('common:menuSelectionSaved') +'</div>', 'success');
      } else {
        showToast('<div data-i18n="common:errorSavingMenuSelection">'+ translate('common:errorSavingMenuSelection') +'</div>', 'error');
      }
    } catch (err) {
      console.error('Error saving menu selection:', err);
      showToast('<div data-i18n="common:errorSavingMenuSelection">'+ translate('common:errorSavingMenuSelection') +'</div>', 'error');
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
        showToast('<div data-i18n="common:specialRequestSaved">'+ translate('common:specialRequestSaved') +'</div>', 'success');
        
        // Show/hide detail textarea based on selection
        const detailTextarea = document.querySelector(`textarea[name="special-request-detail-${partyGuestId}"]`);
        if (detailTextarea) {
          detailTextarea.style.display = specialRequest === 'other' ? 'block' : 'none';
        }
      } else {
        showToast('<div data-i18n="common:errorSavingSpecialRequest">'+ translate('common:errorSavingSpecialRequest') +'</div>', 'error');
      }
    } catch (err) {
      console.error('Error saving special request:', err);
      showToast('<div data-i18n="common:errorSavingSpecialRequest">'+ translate('common:errorSavingSpecialRequest') +'</div>', 'error');
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
        showToast('<div data-i18n="common:specialRequestDetailsSaved">'+ translate('common:specialRequestDetailsSaved') +'</div>', 'success');
      } else {
        showToast('<div data-i18n="common:errorSavingSpecialRequestDetails">'+ translate('common:errorSavingSpecialRequestDetails') +'</div>', 'error');
      }
    } catch (err) {
      console.error('Error saving special request details:', err);
      showToast('<div data-i18n="common:errorSavingSpecialRequestDetails">'+ translate('common:errorSavingSpecialRequestDetails') +'</div>', 'error');
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
        <p><div data-i18n="guests:eventsLoading">${translate('guests:eventsLoading')}</div></p>
      </div>
    `;
    
    try {
      // Fetch all required data in parallel
      const [eventsResponse, partyResponse, choicesResponse] = await Promise.all([
        fetch(`/api/guest/events?lang=${currentLanguage}`, {
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
      }
      
      // Handle no events case
      if (!Array.isArray(events) || events.length === 0) {
        eventsContent.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3><div data-i18n="guests:eventsNoEvents">${translate('guests:eventsNoEvents')}</div></h3>
            <p><div data-i18n="guests:eventsNoEventsDescription">${translate('guests:eventsNoEventsDescription')}</div></p>
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
        return date.toLocaleDateString(currentLanguage || 'en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      };
      
      const formatEventTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString(currentLanguage || 'en-GB', {
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
              <h4><i class="fas fa-list-ul"></i> <div data-i18n="guests:eventsSchedule">Schedule</div></h4>
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
                  ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:primary\">${member.primary ? translate('common:primary') : ''}</span>" : ''}
                  ${member.adult === false ? '<span class="badge badge-info"><div data-i18n="guests:childBadge">Child</div></span>' : ''}
                </label>
              </div>
            `;
          }).join('');
        } else {
          attendanceItemsHtml = '<p class="no-members"><div data-i18n="guests:eventsNoPartyMembers">No party members found.</div></p>';
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
                <i class="fas fa-map"></i> <div data-i18n="guests:eventsViewOnMap">View on Map</div>
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
                  <div data-i18n="guests:eventsWhosAttending">Who's Attending?</div>
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
        <div class="intro-card intro-section">
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
            <div class="day-title">
              <i class="fas fa-calendar-day"></i>
              <h3>${dateKey}</h3>
            </div>
            <div class="day-events">
              ${eventCardsHtml}
            </div>
          </div>
        `;
      });

      
      html += '</div>'; // Close events-container
      
      // Update DOM
      eventsContent.innerHTML = html;
      
      // Translate the newly loaded content
      if (typeof updatePageContent === 'function') {
        updatePageContent();
      }
      
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
          <h3><div data-i18n="guests:eventsErrorTitle">Error Loading Events</div></h3>
          <p><div data-i18n="guests:eventsErrorMessage">There was a problem loading the events. Please try again.</div></p>
          <button class="btn-retry" onclick="loadEventsContent()">
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
         showToast('<div data-i18n="guests:eventsAttendanceSavedSuccess">'+ translate('guests:eventsAttendanceSavedSuccess') +'</div>', 'success');
       } else {
         const data = await response.json();
         showToast('<div data-i18n="guests:eventsAttendanceSavedError">'+ (data.error || translate('guests:eventsAttendanceSavedError')) + '</div>', 'error');
       }
     } catch (err) {
       console.error('Error saving event choices:', err);
       showToast('<div data-i18n="guests:eventsAttendanceSavedError">'+ translate('guests:eventsAttendanceSavedError') +'</div>', 'error');
     } finally {
       if (saveBtn) {
         saveBtn.disabled = false;
         saveBtn.innerHTML = '<i class="fas fa-save"></i> <div data-i18n="guests:eventsSaveAttendanceChoices">'+ translate('guests:eventsSaveAttendanceChoices') +'</div>';
       }
     }
   }

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
         <p><span data-i18n="guests:giftsLoading">${translate('guests:giftsLoading')}</span></p>
       </div>
     `;
     
     try {
       // Fetch gift choices (donations) and available gifts in parallel
       const [giftChoicesRes, giftsRes] = await Promise.all([
         fetch('/api/guest/gift-choices', {
           method: 'GET',
           headers: { 'Authorization': token }
         }),
         fetch(`/api/guest/gifts?lang=${currentLanguage}`, {
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
         return date.toLocaleDateString(currentLanguage || 'en-GB', {
           day: 'numeric',
           month: 'long',
           year: 'numeric'
         });
       };
       
       let html = '<div class="gifts-container">';

       html += `
       <div class="intro-card intro-section">
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
               <h3><span data-i18n="guests:giftsThankYouTitle">${translate('guests:giftsThankYouTitle')}</span></h3>
               <p><span data-i18n="guests:giftsThankYouMessage">${translate('guests:giftsThankYouMessage')}</span></p>
             </div>
             <div class="donated-gifts-grid">
         `;
         
         giftChoices.forEach(choice => {
           const donatedOnText = translate('rich:guests:giftsDonatedOn').replace('{{date}}', formatDate(choice.date));
           html += `
             <div class="donated-gift-card" style="background-image: url('${escapeHtml(choice.giftImageUrl)}');">
               <div class="donated-gift-overlay">
                 <div class="donated-gift-content">
                   <h4 class="donated-gift-title">${escapeHtml(choice.giftTitle)}</h4>
                   <div class="donated-gift-price">€${choice.giftAmount}</div>
                   <div class="donated-gift-date">
                     <i class="fas fa-calendar-check"></i>
                     <span data-i18n="rich:guests:giftsDonatedOn" data-i18n-options='{"date": "${formatDate(choice.date)}"}'>${donatedOnText}</span>
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
             <h3><span data-i18n="guests:giftsRegistryTitle">${translate('guests:giftsRegistryTitle')}</span></h3>
             <p><span data-i18n="guests:giftsRegistrySubtitle">${translate('guests:giftsRegistrySubtitle')}</span></p>
           </div>
           <div class="gift-cards-grid">
       `;
       
       if (gifts.length === 0) {
         html += `
           <div class="empty-state">
             <i class="fas fa-inbox"></i>
             <h4><span data-i18n="guests:giftsNoAvailable">${translate('guests:giftsNoAvailable')}</span></h4>
             <p><span data-i18n="guests:giftsNoAvailableDescription">${translate('guests:giftsNoAvailableDescription')}</span></p>
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
                     ? `<span class="stock-available"><i class="fas fa-check-circle"></i> ${gift.stock} <span data-i18n="guests:giftsAvailable">${translate('guests:giftsAvailable')}</span></span>`
                     : `<span class="stock-sold-out"><i class="fas fa-times-circle"></i> <span data-i18n="guests:giftsSoldOut">${translate('guests:giftsSoldOut')}</span></span>`
                   }
                 </div>
                 <div class="action-container">
                   ${isAvailable ? `
                     <button class="btn-base btn-primary btn-md" onclick="purchaseGift('${gift.id}', '${escapeHtml(gift.title).replace(/'/g, "\\'")}', ${gift.amount})">
                       <i class="fas fa-credit-card"></i>
                       <span data-i18n="guests:giftsBuyGift">${translate('guests:giftsBuyGift')}</span>
                     </button>
                   ` : `
                     <button class="btn-disabled" disabled>
                       <i class="fas fa-ban"></i>
                       <span data-i18n="guests:giftsSoldOut">${translate('guests:giftsSoldOut')}</span>
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
         showToast(translate('guests:giftsPaymentSuccess'), 'success');
         // Clean up URL
         window.history.replaceState({}, document.title, window.location.pathname);
         // Reload to show updated gift choices
         setTimeout(() => loadGiftsContent(), 1000);
       } else if (paymentStatus === 'cancelled') {
         showToast(translate('guests:giftsPaymentCancelled'), 'error');
         // Clean up URL
         window.history.replaceState({}, document.title, window.location.pathname);
       }
       
      // Translate the newly loaded content
      if (typeof updatePageContent === 'function') {
        updatePageContent();
      }
      
     } catch (err) {
       console.error('Error loading gifts:', err);
       giftsContent.innerHTML = `
         <div class="error-state">
           <i class="fas fa-exclamation-triangle"></i>
           <h3><span data-i18n="guests:giftsErrorLoading">${translate('guests:giftsErrorLoading')}</span></h3>
           <p><span data-i18n="guests:giftsErrorLoadingDescription">${translate('guests:giftsErrorLoadingDescription')}</span></p>
           <button class="btn-retry" onclick="loadGiftsContent()">
             <i class="fas fa-redo"></i>
             <span data-i18n="guests:giftsRetry">${translate('guests:giftsRetry')}</span>
           </button>
         </div>
       `;
       // Even on error, try to translate any remaining content
       if (typeof updatePageContent === 'function') {
         updatePageContent();
       }
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
           <h3><span data-i18n="guests:giftsPurchaseTitle">${translate('guests:giftsPurchaseTitle')}</span></h3>
         </div>
         <div class="gift-purchase-content">
           <p><span data-i18n="guests:giftsPurchaseAbout">${translate('guests:giftsPurchaseAbout')}</span></p>
           <div class="gift-purchase-summary">
             <strong>${giftTitle}</strong>
             <span class="gift-purchase-amount">€${giftAmount}</span>
           </div>
           <div class="gift-message-input">
             <label for="giftMessage"><span data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</span></label>
             <textarea id="giftMessage" placeholder="${translate('guests:giftsPurchaseMessagePlaceholder')}" data-i18n-placeholder="guests:giftsPurchaseMessagePlaceholder" rows="3"></textarea>
           </div>
         </div>
         <div class="action-container">
           <button class="btn-base btn-outline btn-md btn-cancel-purchase"><span data-i18n="guests:giftsPurchaseCancel">${translate('guests:giftsPurchaseCancel')}</span></button>
           <button class="btn-base btn-primary btn-md btn-confirm-purchase">
             <i class="fas fa-credit-card"></i>
             <span data-i18n="guests:giftsPurchaseProceed">${translate('guests:giftsPurchaseProceed')}</span>
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
       confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-i18n="guests:giftsPurchaseProcessing">' + translate('guests:giftsPurchaseProcessing') + '</span>';
       
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
           showToast(data.error || translate('guests:giftsPaymentError'), 'error');
           confirmBtn.disabled = false;
           confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:giftsPurchaseProceed">' + translate('guests:giftsPurchaseProceed') + '</span>';
         }
       } catch (err) {
         console.error('Error creating payment session:', err);
         showToast(translate('guests:giftsPaymentServiceError'), 'error');
         confirmBtn.disabled = false;
         confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:giftsPurchaseProceed">' + translate('guests:giftsPurchaseProceed') + '</span>';
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
        <div class="intro-card intro-section">
          <h2 class="card-title ">
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
            <h3 data-i18n="rich:guests:partyMembersTitle">${translate("rich:guests:partyMembersTitle")}</h3>
            <span class="party-count">${partyData.length} / ${maxPartySize} ${translate("common:members")}</span>
          </div>
          <p class="party-description">
            ${translateWithVars("guests:partyDescription", { maxPartySize: maxPartySize })}
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
              ${member.primary ? '<span class="primary-indicator"><i class="fas fa-star"></i> <div data-i18n="common:party.primaryGuest">Primary Guest</div></span>' : ''}
              ${member.adult === false ? '<span class="child-indicator"><i class="fas fa-child"></i> <div data-i18n="common:child">Child</div></span>' : ''}
            </div>
            <div class="member-edit-form">
              <div class="form-group">
                <label for="member-name-${member.id}">
                  <i class="fas fa-user"></i> <span data-i18n="common:name">${translate('common:name')}</span>
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
                  <i class="fas fa-birthday-cake"></i> <span data-i18n="common:ageCategory">${translate('common:ageCategory')}</span>
                </label>
                <select id="member-age-${member.id}"
                        class="form-control member-age-select"
                        data-member-id="${member.id}"
                        data-is-primary="${member.primary ? 'true' : 'false'}">
                  <option value="adult" ${member.adult !== false ? 'selected' : ''}><div data-i18n="common:adult">${translate('common:adult')}</div></option>
                  <option value="child" ${member.adult === false ? 'selected' : ''}><div data-i18n="common:child">${translate('common:child')}</div></option>
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
            <button type="button" id="addPartyMemberBtn" class="btn-base btn-secondary btn-sm">
              <span data-i18n="rich:guests:addPartyMember">${translate("rich:guests:addPartyMember")}</span>
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
            <button type="button" id="savePartyMembersBtn" class="btn-base btn-primary btn-lg" data-i18n="rich:guests:savePartyMembers">${translate("rich:guests:savePartyMembers")}</button>
          </div>
        </div>
      `;
      
      // ========== Section 2: Dietary Requirements ==========
      html += `
        <div class="party-dietary-management">
          <div class="dietary-header">
            <h3 data-i18n="rich:guests:dietaryRequirements">${translate("rich:guests:dietaryRequirements")}</h3>
          </div>
          <p class="dietary-description">
            ${translate("guests:dietaryDescription")}
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
              ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:primary\">${member.primary ? translate('common:primary') : ''}</span>" : ''}
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
                    <span><div data-i18n="guests:dietary${opt.label}">${translate("guests:dietary" + opt.label)}</div></span>
                  </label>
                `;
              }).join('')}
            </div>
            <div class="dietary-detail">
              <label for="party-dietary-detail-${member.id}" data-i18n="guests:additionalDetailsLabel">${translate("guests:additionalDetailsLabel")}</label>
              <textarea
                id="party-dietary-detail-${member.id}"
                name="party-dietary-detail-${member.id}"
                class="form-control dietary-detail-textarea"
                data-member-id="${member.id}"
                placeholder="${translate("guests:additionalDetailsPlaceholder")}"
                rows="2"
              >${escapeHtml(memberDietary.specialRequestDetail || '')}</textarea>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
          <div class="action-container">
            <button type="button" id="saveDietaryBtn" class="btn-base btn-primary btn-lg" data-i18n="rich:guests:saveDietaryRequirements"> ${translate("rich:guests:saveDietaryRequirements")} </button>
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
      
      // Translate the newly loaded content
      if (typeof updatePageContent === 'function') {
        updatePageContent();
      }
      
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
      // Even on error, try to translate any remaining content
      if (typeof updatePageContent === 'function') {
        updatePageContent();
      }
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
        <span class="new-member-indicator" data-i18n="rich:common:new">${translate('rich:common:new')}</span>
      </div>
      <div class="member-edit-form">
        <div class="form-group">
          <label for="member-name-${id}">
            <i class="fas fa-user"></i> <span data-i18n="common:name">${translate('common:name')}</span>
          </label>
          <input type="text"
                 id="member-name-${id}"
                 class="form-control member-name-input new-member-input"
                 data-member-id="${id}"
                 value=""
                 placeholder="${translate('common:enterName')}"
                 autofocus>
        </div>
        <div class="form-group">
          <label for="member-age-${id}">
            <i class="fas fa-birthday-cake"></i> <span data-i18n="common:ageCategory">${translate('common:ageCategory')}</span>
          </label>
          <select id="member-age-${id}"
                  class="form-control member-age-select new-member-age-select"
                  data-member-id="${id}">
            <option value="adult" selected><span data-i18n="common:adult">${translate('common:adult')}</span></option>
            <option value="child"><span data-i18n="common:child">${translate('common:child')}</span></option>
          </select>
        </div>
        <button type="button" class="btn-base btn-danger btn-sm" data-member-id="${id}" title="${translate('rich:common:removeMember')}">
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
      `${translateWithVars("guests:confirmRemoveMember", { memberName: memberName })}`,
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
      countEl.textContent = `${count} / 4 ${translate('common:members')}`;
    }
  }
  
  // Mark party changes as unsaved
  function markPartyAsUnsaved() {
    const saveBtn = document.getElementById('savePartyMembersBtn');
    if (saveBtn && !saveBtn.classList.contains('unsaved')) {
      saveBtn.classList.add('unsaved');
      saveBtn.innerHTML = `<span data-i18n="rich:guests:savePartyMembers">${translate("rich:guests:savePartyMembers")}</span> *`;
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
      saveBtn.innerHTML = `<span data-i18n="rich:guests:saveDietaryRequirements">${translate("rich:guests:saveDietaryRequirements")}</span> *`;
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
        showToast(translate('guests:partyMembersSaved'), 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = `<span data-i18n="rich:guests:savePartyMembers">${translate("rich:guests:savePartyMembers")}</span>`;
        }
        // Reload to get updated IDs and refresh dietary cards
        loadPartyContent();
      } else {
        const data = await response.json();
        showToast(data.error || translate('common:errorSavingPartyMembers'), 'error');
      }
    } catch (err) {
      console.error('Error saving party members:', err);
      showToast(translate('common:errorSavingPartyMembers'), 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!saveBtn.classList.contains('unsaved')) {
          saveBtn.innerHTML = `<span data-i18n="rich:guests:savePartyMembers">${translate("rich:guests:savePartyMembers")}</span>`;
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
        showToast(translate('guests:dietaryRequirementsSaved'), 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = `<div data-i18n="rich:guests:saveDietaryRequirements">${translate("rich:guests:saveDietaryRequirements")}</div>`;
        }
      } else {
        const data = await response.json();
        showToast(data.error || translate('common:errorSavingDietaryRequirements'), 'error');
      }
    } catch (err) {
      console.error('Error saving dietary requirements:', err);
      showToast(translate('common:errorSavingDietaryRequirements'), 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!saveBtn.classList.contains('unsaved')) {
          saveBtn.innerHTML = `<div data-i18n="rich:guests:saveDietaryRequirements">${translate("rich:guests:saveDietaryRequirements")}</div>`;
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
        loadSummaryContent();
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
    }
    updatePageContent();
  }

  // Define loadSummaryContent function to load all summary data
  async function loadSummaryContent() {
    const summaryContent = document.getElementById('summaryContent');
    
    if (!summaryContent) {
      console.error('Summary content container not found');
      return;
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
        fetch(`/api/guest/events?lang=${currentLanguage}`, {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/event-choices', {
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
        return date.toLocaleDateString(currentLanguage || 'en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });
      };
      
      const formatEventTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString(currentLanguage || 'en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(currentLanguage || 'en-GB', {
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
            <div data-i18n="guests:summaryYourParty">Your Party</div>
            ( ${partyMembers.length} <div data-i18n="${partyMembers.length === 1 ? 'common:Person' : 'common:People'}">Person</div>)
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
              ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:primary\">${member.primary ? translate('common:primary') : ''}</span>" : ''}
              ${member.adult === false ? '<span class="badge badge-info"><div data-i18n="guests:childBadge">Child</div></span>' : ''}
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
            <div data-i18n="guests:summaryRSVP">RSVP Summary</div>
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
            <div data-i18n="guests:summaryMenuSelections">Menu Selections</div>
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
                ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:primary\">${member.primary ? translate('common:primary') : ''}</span>" : ''}
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
      
      // Translate the newly loaded content
      if (typeof updatePageContent === 'function') {
        updatePageContent();
      }
      
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
      
      // Even on error, try to translate any remaining content
      if (typeof updatePageContent === 'function') {
        updatePageContent();
      }
    }

    // Re-apply settings visibility to control summary sections
    try {
      const settings = await fetchSettings();
      applySettingsVisibility(settings);
    } catch (error) {
      console.error('Error refreshing settings for summary:', error);
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
    console.log('Initializing guests page');
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

