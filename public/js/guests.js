
// Configurar event listeners
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  console.log('DOM loaded, initializing i18n system...');

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
          <div class="confirm-buttons">
            <button class="btn-cancel-confirm">cancel</button>
            <button class="btn-confirm-action">confirm</button>
          </div>
        </div>
      </div>
    `;
    
    // Add to the body
    document.body.appendChild(overlay);
    
    // Show with animation
    setTimeout(() => overlay.classList.add('show'), 100);
    
    // Event listeners
    overlay.querySelector('.btn-cancel-confirm').addEventListener('click', () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      }, 300);
    });
    
    overlay.querySelector('.btn-confirm-action').addEventListener('click', () => {
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
      <div class="loading-menu">
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
          <div class="error-message">
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
            <div class="menu-course-card" data-course-id="${course.id}" data-selectable="${isSelectable}">
              <div class="course-card-header">
                <h4 class="course-card-title">${escapeHtml(course.label)}</h4>
                ${isSelectable ? '<span class="selection-required-badge"><i class="fas fa-hand-pointer"></i> Selection Required</span>' : '<span class="info-only-badge"><i class="fas fa-info-circle"></i> Info Only</span>'}
              </div>
              <div class="course-card-content">
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
                          ${member.primary ? '<span class="chip-badge primary">Primary</span>' : ''}
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
          <div class="special-request-card" data-member-id="${member.id}">
            <div class="special-request-card-header">
              <i class="fas fa-user"></i>
              <h4>${escapeHtml(member.name)}</h4>
              ${member.primary ? '<span class="primary-badge">Primary</span>' : ''}
            </div>
            <div class="special-request-options">
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
        <div class="menu-actions">
          <button type="button" id="saveMenuChoicesBtn" class="btn-save-menu">
            <i class="fas fa-save"></i>
            Save Menu Selections
          </button>
        </div>
      `;

      html += '</div>'; // Close unified-menu-container

      menuContent.innerHTML = html;

      // Initialize drag and drop functionality
      initMenuDragDrop();

      // Attach save button handler
      const saveBtn = document.getElementById('saveMenuChoicesBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', saveAllMenuChoices);
      }

      console.log('Menu selections loaded successfully');

    } catch (err) {
      console.error('Error loading menu selections:', err);
      menuContent.innerHTML = `
        <div class="error-message">
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
  
    // Cargar y mostrar el status del RSVP
  async function cargarStatusRSVP() {
    try {
      // Obtener eventos y selecciones de RSVP
      const [eventsRes, guestRes] = await Promise.all([
        fetch('/api/event'),
        fetch('/api/invitado', {
          headers: { 'Authorization': token }
        })
      ]);
      
      const events = await eventsRes.json().catch(() => []);
      const guestData = await guestRes.json().catch(() => ({}));
      
      const eventStatusContent = document.getElementById('eventStatusContent');
      if (!eventStatusContent) return;
      
      if (eventsRes.ok && events.length > 0) {
        // Mostrar eventos disponibles para RSVP
        eventStatusContent.innerHTML = `
          <h4><i class="fas fa-check-circle"></i> Tus confirmaciones de eventos</h4>
          <p class="no-selection">Visita la pestaña RSVP para confirmar tu asistencia a cada evento.</p>
        `;
      } else {
        eventStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de RSVP</h4>
          <p class="no-selection">Aún no hay eventos disponibles para confirmar asistencia.</p>
        `;
      }
    } catch (err) {
      console.error('Error loading the RSVP Status:', err);
    }
  }
  
  // Load and show the gift status
  async function loadStatusGifts() {
  }

// Load messages
  async function loadMessages() {
  }

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
      <div class="loading-events">
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
          <div class="no-events-message">
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
      
      // Build HTML for a single event card
      const buildEventCard = (event) => {
        const eventId = event.id;
        const mapContainerId = `event-map-${eventId}`;
        const hasLocation = event.locationLatitude && event.locationLongitude;
        
        // Track for map initialization
        if (hasLocation) {
          mapsToInitialize.push({
            containerId: mapContainerId,
            lat: event.locationLatitude,
            lng: event.locationLongitude
          });
        }
        
        // Build sub-events HTML
        let subEventsHtml = '';
        if (Array.isArray(event.sub_events) && event.sub_events.length > 0) {
          const subEventItems = event.sub_events.map(subEvent => `
            <div class="sub-event-item">
              <div class="sub-event-icon">
                <i class="fas ${getIconClass(subEvent.icon)}"></i>
              </div>
              <div class="sub-event-info">
                <span class="sub-event-name">${escapeHtml(subEvent.name)}</span>
                <span class="sub-event-time">${formatEventTime(subEvent.date)}${subEvent.end ? ' - ' + formatEventTime(subEvent.end) : ''}</span>
                ${subEvent.description ? `<p class="sub-event-description">${escapeHtml(subEvent.description)}</p>` : ''}
              </div>
            </div>
          `).join('');
          
          subEventsHtml = `
            <div class="sub-events">
              <h5 class="sub-events-title">
                <i class="fas fa-list-ul"></i>
                Schedule
              </h5>
              <div class="sub-events-list">
                ${subEventItems}
              </div>
            </div>
          `;
        }
        
        // Build attendance HTML
        let attendanceItemsHtml = '';
        if (Array.isArray(partyMembers) && partyMembers.length > 0) {
          attendanceItemsHtml = partyMembers.map(member => {
            const isAttending = attendanceLookup[member.id] ? attendanceLookup[member.id][eventId] === true : false;
            return `
              <div class="attendance-item">
                <label class="attendance-label">
                  <input type="checkbox" class="attendance-checkbox" data-event-id="${eventId}" data-member-id="${member.id}" ${isAttending ? 'checked' : ''}>
                  <span class="member-name">${escapeHtml(member.name)}</span>
                  ${member.primary ? '<span class="primary-badge">Primary</span>' : ''}
                  ${member.adult === false ? '<span class="child-badge">Child</span>' : ''}
                </label>
              </div>
            `;
          }).join('');
        } else {
          attendanceItemsHtml = '<p class="no-members">No party members found.</p>';
        }
        
        // Build location HTML
        let locationHtml = '';
        if (event.locationAddress || event.location) {
          const mapLinkHtml = hasLocation ? `
            <a href="https://www.google.com/maps?q=${event.locationLatitude},${event.locationLongitude}" target="_blank" class="map-link" title="Open in Google Maps">
              <i class="fas fa-external-link-alt"></i>
            </a>
          ` : '';
          
          locationHtml = `
            <div class="event-location">
              <i class="fas fa-map-marker-alt"></i>
              <span>${escapeHtml(event.locationAddress || event.location)}</span>
              ${mapLinkHtml}
            </div>
          `;
        }
        
        // Build map HTML
        let mapHtml = '';
        if (hasLocation) {
          mapHtml = `
            <div class="event-map-container">
              <div id="${mapContainerId}" class="event-map"></div>
              <div class="map-coordinates">
                <span>${parseFloat(event.locationLatitude).toFixed(4)}, ${parseFloat(event.locationLongitude).toFixed(4)}</span>
                <a href="https://www.openstreetmap.org/?mlat=${event.locationLatitude}&mlon=${event.locationLongitude}#map=16/${event.locationLatitude}/${event.locationLongitude}" target="_blank" class="osm-link">View Larger Map</a>
              </div>
            </div>
          `;
        }
        
        // Build description HTML
        let descriptionHtml = '';
        if (event.description) {
          descriptionHtml = `
            <div class="event-description">
              <p>${escapeHtml(event.description)}</p>
            </div>
          `;
        }
        
        // Build image HTML
        let imageHtml = '';
        if (event.image) {
          imageHtml = `
            <div class="event-image">
              <img src="${event.image}" alt="${escapeHtml(event.name)}" onerror="this.parentElement.style.display='none';">
            </div>
          `;
        }
        
        // Build event name subtitle HTML
        let eventNameHtml = '';
        if (event.title && event.name !== event.title) {
          eventNameHtml = `<p class="event-name">${escapeHtml(event.name)}</p>`;
        }
        
        // Assemble the complete event card
        return `
          <div class="event-card" data-event-id="${eventId}">
            <div class="event-card-header">
              ${imageHtml}
              <div class="event-header-content">
                <h4 class="event-title">${escapeHtml(event.title || event.name)}</h4>
                ${eventNameHtml}
              </div>
            </div>
            <div class="event-details">
              <div class="event-time">
                <i class="fas fa-clock"></i>
                <span>${formatEventTime(event.date)}${event.end ? ' - ' + formatEventTime(event.end) : ''}</span>
              </div>
              ${locationHtml}
              ${mapHtml}
              ${descriptionHtml}
            </div>
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
        `;
      };
      
      // Build complete HTML output
      let html = '<div class="events-container">';
      
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
      
      // Save button
      html += `
        <div class="events-actions">
          <button type="button" id="saveEventChoicesBtn" class="btn-save-choices">
            <i class="fas fa-save"></i>
            Save Attendance Choices
          </button>
        </div>
      `;
      
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
      
      // Attach save button event listener
      const saveButton = document.getElementById('saveEventChoicesBtn');
      if (saveButton) {
        saveButton.addEventListener('click', saveEventChoices);
      }
      
    } catch (error) {
      console.error('Error loading events:', error);
      eventsContent.innerHTML = `
        <div class="error-message">
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
   
  // Function to save event attendance choices
   async function saveEventChoices() {
     const saveBtn = document.getElementById('saveEventChoicesBtn');
     if (saveBtn) {
       saveBtn.disabled = true;
       saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
     }
     
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
       <div class="loading-gifts">
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
           <div class="no-gifts-message">
             <i class="fas fa-inbox"></i>
             <h4>No gifts available</h4>
             <p>Please check back later for our gift registry.</p>
           </div>
         `;
       } else {
         gifts.forEach(gift => {
           const isAvailable = gift.stock > 0;
           
           html += `
             <div class="gift-credit-card ${!isAvailable ? 'sold-out' : ''}" data-gift-id="${gift.id}">
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
                     ? `<span class="stock-available"><i class="fas fa-check-circle"></i> ${gift.stock} in stock</span>`
                     : `<span class="stock-sold-out"><i class="fas fa-times-circle"></i> Sold Out</span>`
                   }
                 </div>
                 <div class="gift-card-actions">
                   ${isAvailable ? `
                     <button class="btn-buy-gift" onclick="purchaseGift('${gift.id}', '${escapeHtml(gift.title).replace(/'/g, "\\'")}', ${gift.amount})">
                       <i class="fas fa-credit-card"></i>
                       Buy Gift
                     </button>
                   ` : `
                     <button class="btn-sold-out" disabled>
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
         <div class="error-message">
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
         <div class="gift-purchase-actions">
           <button class="btn-cancel-purchase">Cancel</button>
           <button class="btn-confirm-purchase">
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
    window.location.href = 'login.html';
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

  // Tabs functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      console.log("button Clicked: ", targetTab);
      
      //Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to the clicked button and its content
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
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

  // Define loadSummaryContent function if not already defined
  function loadSummaryContent() {
    // Reload RSVP status
    cargarStatusRSVP();
  }

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
  
  console.log(`i18n system initialized, language: ${currentLanguage}`);
});

