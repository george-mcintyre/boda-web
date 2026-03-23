// Menu Management Module
// Contains all menu-related functions extracted from guests.js

// Global variables that need to be available from the main scope
let draggedChip = null;
let currentMenuView = 'banquet'; // Track which menu is currently shown
let dayMenusData = []; // Store day menus data
let banquetChefData = null; // Store banquet chef data

// Main menu loader - sets up sub-navigation and loads initial view
async function loadMenuSelections() {
  const menuContent = document.getElementById('menu');

  if (!menuContent) return;
  
  // Show loading state
  menuContent.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p><div data-i18n="guests:menuLoading">${translate('guests:menuLoading')}</div></p>
    </div>
  `;
  
  // Load day menus data in parallel
  try {
    const [dayMenusResponse, banquetChefResponse] = await Promise.all([
      fetch(`/api/guest/day-menus?lang=${window.currentLanguage}`, {
        method: 'GET',
        headers: { 'Authorization': window.token }
      }),
      fetch(`/api/guest/banquet-chef?lang=${window.currentLanguage}`, {
        method: 'GET',
        headers: { 'Authorization': window.token }
      })
    ]);
    
    if (dayMenusResponse.ok) {
      dayMenusData = await dayMenusResponse.json();
    }
    if (banquetChefResponse.ok) {
      banquetChefData = await banquetChefResponse.json();
    }
  } catch (err) {
    console.error('Error loading day menus:', err);
  }
  
  // Create sub-navigation
  menuContent.innerHTML = `
    <div class="menu-sub-nav">
      <button class="menu-sub-btn active" data-menu="banquet">
        <i class="fas fa-utensils"></i>
        <span data-i18n="guests:mainBanquet">Main Banquet</span>
      </button>
      <button class="menu-sub-btn" data-menu="day1">
        <i class="fas fa-glass-cheers"></i>
        <span data-i18n="guests:welcomeCocktails">Welcome Cocktails</span>
      </button>
      <button class="menu-sub-btn" data-menu="day3">
        <i class="fas fa-sun"></i>
        <span data-i18n="guests:weddingBrunch">Wedding Brunch</span>
      </button>
      <button class="menu-sub-btn" data-menu="seating">
        <i class="fas fa-chair"></i>
        <span data-i18n="guests:seating">Seating</span>
      </button>
    </div>
    <div id="menu-view-container"></div>
  `;
  
  // Add click handlers for sub-navigation
  document.querySelectorAll('.menu-sub-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const menuType = btn.dataset.menu;
      switchMenuView(menuType);
    });
  });
  
  // Check for seating deep link
  if (typeof checkSeatingDeepLink === 'function' && checkSeatingDeepLink()) {
    switchMenuView('seating');
  } else {
    // Load initial banquet view
    await loadBanquetMenu();
  }
}

// Switch between menu views
function switchMenuView(menuType) {
  currentMenuView = menuType;
  
  // Update active button
  document.querySelectorAll('.menu-sub-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.menu === menuType);
  });
  
  // Load appropriate view
  if (menuType === 'banquet') {
    loadBanquetMenu();
  } else if (menuType === 'seating') {
    if (typeof loadSeatingView === 'function') {
      loadSeatingView();
    }
  } else {
    loadDayMenu(menuType);
  }
}

// Load banquet menu (original functionality)
async function loadBanquetMenu() {
  const viewContainer = document.getElementById('menu-view-container');
  
  if (!viewContainer) return;
  
  // Show loading state
  viewContainer.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p><div data-i18n="guests:menuLoading">${translate('guests:menuLoading')}</div></p>
    </div>
  `;
  
  try {
    
    const [partyResponse, menuResponse, menuChoicesResponse, banquetChefResponse] = await Promise.all([
      fetch('/api/guest/party', {
        method: 'GET',
        headers: { 'Authorization': window.token }
      }),
      fetch(`/api/guest/menu?lang=${window.currentLanguage}`, {
        method: 'GET',
        headers: { 'Authorization': window.token }
      }),
      fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': window.token }
      }),
      fetch(`/api/guest/banquet-chef?lang=${window.currentLanguage}`, {
        method: 'GET',
        headers: { 'Authorization': window.token }
      })
    ]);
    
    if (banquetChefResponse.ok) {
      banquetChefData = await banquetChefResponse.json();
    }

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
      welcome_cocktails: { label: 'guests:courseGroupWelcomeCocktails', icon: 'fa-glass-cheers', courses: [] },
      starter: { label: 'guests:courseGroupStarters', icon: 'fa-seedling', courses: [] },
      main: { label: 'guests:courseGroupMainCourses', icon: 'fa-drumstick-bite', courses: [] },
      dessert: { label: 'guests:courseGroupDesserts', icon: 'fa-ice-cream', courses: [] },
      late_night_snacks: { label: 'guests:courseGroupLateNightSnacks', icon: 'fa-moon', courses: [] },
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
          <div data-i18n="guests:mainBanquetTitle">Main Banquet - Make Your Selections</div>
        </h2>
        <p class="card-description">
          <div data-i18n="guests:mainBanquetDescription">Please select your meal preferences for each course. Drag and drop guests to their chosen options.</div>
        </p>
      </div>
    `;
    

    // Iterate through course groups
    const groupOrder = ['welcome_cocktails', 'starter', 'main', 'dessert', 'late_night_snacks', 'drinks'];
    
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
                <div class="option-image-container" data-lightbox-url="${imageUrl}">
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
                  </div>
                  ${option.description ? `
                    <p class="option-description-text">${option.description}</p>
                  ` : ''}
                  <div class="dietary-badges">
                    ${option.isVegan ? '<span class="dietary-badge vegan"><i class="fas fa-seedling" style="color: #22bb33;"></i> Vegan</span>' : option.isVegetarian ? '<span class="dietary-badge vegetarian"><i class="fas fa-leaf" style="color: #28a745;"></i> Vegetarian</span>' : ''}
                    ${option.isSpicy ? '<span class="dietary-badge spicy"><i class="fas fa-pepper-hot" style="color: #dc3545;"></i> Spicy</span>' : ''}
                    ${option.containsGluten ? '<span class="dietary-badge allergens"><i class="fas fa-bread-slice" style="color: #f39c12;"></i> Contains Gluten</span>' : ''}
                    ${option.containsEggs ? '<span class="dietary-badge allergens"><i class="fas fa-egg" style="color: #f39c12;"></i> Contains Eggs</span>' : ''}
                    ${option.containsFish ? '<span class="dietary-badge allergens"><i class="fas fa-fish" style="color: #3498db;"></i> Contains Fish</span>' : ''}
                    ${option.containsShellfish ? '<span class="dietary-badge allergens"><i class="fas fa-shrimp" style="color: #e74c3c;"></i> Contains Shellfish</span>' : ''}
                    ${option.containsSoy ? '<span class="dietary-badge allergens"><i class="fas fa-seedling" style="color: #95a5a6;"></i> Contains Soy</span>' : ''}
                    ${option.containsSesame ? '<span class="dietary-badge allergens"><i class="fas fa-circle" style="color: #d68910;"></i> Contains Sesame</span>' : ''}
                    ${option.containsLactose ? '<span class="dietary-badge lactose"><i class="fas fa-cheese" style="color: #fd7e14;"></i> Contains Dairy</span>' : ''}
                    ${option.containsNuts ? '<span class="dietary-badge contains-nuts"><i class="fas fa-dot-circle" style="color: #8b4513;"></i> Contains Nuts</span>' : ''}
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
              data-i18n="guests:additionalDetails:placeholder"
              placeholder="Additional details or specific requirements..."
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
    
    // Add chef profile section at the bottom (after special requests)
    if (banquetChefData) {
      html += `
        <div class="chef-profile-section">
          <div class="chef-profile-header">
            <i class="fas fa-user-chef"></i>
            <h3><div data-i18n="guests:meetTheChef">Meet The Chef</div></h3>
          </div>
          <div class="chef-profile-card">
            ${banquetChefData.imageUrl ? `
              <div class="chef-photo">
                <img data-auth-src="${banquetChefData.imageUrl}" alt="${escapeHtml(banquetChefData.name)}" onerror="this.style.display='none';">
                <span style="display:none;"></span>
              </div>
            ` : ''}
            <div class="chef-info">
              <h4 class="chef-name">${escapeHtml(banquetChefData.name)}</h4>
              <div class="chef-bio">${banquetChefData.bio}</div>
            </div>
          </div>
        </div>
      `;
    }


    html += '</div>'; // Close unified-menu-container

    viewContainer.innerHTML = html;

    // Translate the newly loaded content
    if (typeof updatePageContent === 'function') {
      updatePageContent();
    }
    
    // Load auth-protected images
    if (typeof loadAuthImages === 'function') {
      loadAuthImages();
    }

    // Initialize drag and drop functionality
    initMenuDragDrop();

    // Initialize image zoom functionality
    initImageZoom();

    // Attach auto-save to special request textareas
    document.querySelectorAll('.special-request-detail textarea').forEach(textarea => {
      // Save on blur (when user clicks away)
      textarea.addEventListener('blur', () => {
        autoSaveMenuChoices();
      });
      
      // Save on Enter key (but don't prevent default - allow newlines)
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          // Ctrl+Enter or Cmd+Enter saves immediately
          autoSaveMenuChoices();
        }
      });
    });

  } catch (err) {
    console.error('Error loading banquet menu:', err);
    viewContainer.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3><div data-i18n="guests:menuErrorTitle">Error Loading Menu</div></h3>
        <p><div data-i18n="guests:menuErrorMessage2">There was a problem loading the menu. Please try again.</div></p>
        <button class="btn-retry" onclick="loadBanquetMenu()">
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

// Load day menu (informational only - day1 or day3)
async function loadDayMenu(day) {
  const viewContainer = document.getElementById('menu-view-container');
  
  if (!viewContainer) return;
  
  try {
    const dayMenusResponse = await fetch(`/api/guest/day-menus?lang=${window.currentLanguage}`, {
      method: 'GET',
      headers: { 'Authorization': window.token }
    });
    if (dayMenusResponse.ok) {
      dayMenusData = await dayMenusResponse.json();
    }
  } catch (err) {
    console.error('Error refreshing day menus:', err);
  }
  
  const dayMenu = dayMenusData.find(m => m.day === day);
  
  if (!dayMenu) {
    viewContainer.innerHTML = `
      <div class="info-card">
        <p><div data-i18n="guests:menuInfoNotAvailable">Menu information not yet available.</div></p>
      </div>
    `;
    return;
  }
  
  let html = '<div class="day-menu-container">';
  
  // Title based on day
  const title = day === 'day1' ? 'Welcome Cocktails Menu' : 'Wedding Brunch Menu';
  const titleKey = day === 'day1' ? 'guests:welcomeCocktailsMenuTitle' : 'guests:weddingBrunchMenuTitle';
  
  html += `
    <div class="intro-card intro-section">
      <h2 class="card-title">
        <div data-i18n="${titleKey}">${title}</div>
      </h2>
      <p class="card-description">
        <div data-i18n="guests:dayMenuDescription">Information about the menu for this event.</div>
      </p>
    </div>
  `;
  
  // Render sections
  dayMenu.sections.forEach(section => {
    html += `
      <div class="day-menu-section">
        <h3 class="section-title">${escapeHtml(section.title)}</h3>
        ${section.imageUrl ? `
          <div class="section-image">
            <img data-auth-src="${section.imageUrl}" alt="${escapeHtml(section.title)}" onerror="this.style.display='none';">
          </div>
        ` : ''}
        <div class="section-content">${escapeHtml(section.content)}</div>
      </div>
    `;
  });
  
  // Add chef profile at the bottom
  if (dayMenu.chefProfile) {
    html += `
      <div class="chef-profile-section">
        <div class="chef-profile-header">
          <i class="fas fa-user-chef"></i>
          <h3><div data-i18n="guests:meetTheChef">Meet The Chef</div></h3>
        </div>
        <div class="chef-profile-card">
          ${dayMenu.chefProfile.imageUrl ? `
            <div class="chef-photo">
              <img data-auth-src="${dayMenu.chefProfile.imageUrl}" alt="${escapeHtml(dayMenu.chefProfile.name)}" onerror="this.style.display='none';">
              <span style="display:none;"></span>
            </div>
          ` : ''}
          <div class="chef-info">
            <h4 class="chef-name">${escapeHtml(dayMenu.chefProfile.name)}</h4>
            <div class="chef-bio">${dayMenu.chefProfile.bio}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  html += '</div>'; // Close day-menu-container
  
  viewContainer.innerHTML = html;
  
  // Translate the newly loaded content
  if (typeof updatePageContent === 'function') {
    updatePageContent();
  }
  
  // Load auth-protected images
  if (typeof loadAuthImages === 'function') {
    loadAuthImages();
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
  
  // Auto-save the change
  autoSaveMenuChoices();
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

// Auto-save function - saves with user notification
async function autoSaveMenuChoices() {
  // Debounce to avoid too many saves
  if (window.autoSaveTimeout) {
    clearTimeout(window.autoSaveTimeout);
  }
  window.autoSaveTimeout = setTimeout(async () => {
    await saveAllMenuChoices(false); // false = show notification
  }, 500); // Wait 500ms after last change
}

// Update dietary checkbox visual state and auto-save
window.updateDietaryCheckbox = function(checkbox) {
  const label = checkbox.closest('.dietary-checkbox');
  if (label) {
    if (checkbox.checked) {
      label.classList.add('checked');
    } else {
      label.classList.remove('checked');
    }
  }
  autoSaveMenuChoices();
};

// Save all menu choices (silent = true for auto-save, false for manual save)
async function saveAllMenuChoices(silent = false) {
  if (!silent) {
    console.log('Saving menu selections...');
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
        'Authorization': window.token
      },
      body: JSON.stringify({ choices: choicesArray })
    });

    if (response.ok) {
      if (!silent) {
        showToast(`<div data-i18n="common:menu.selections.saved">${translate('common:menu.selections.saved')}</div>`, 'success');
      }
    } else {
      const data = await response.json();
      showToast(`<div data-i18n="common:error.saving.menu.selections">${(data.error || translate('common:error.saving.menu.selections'))}</div>`, 'error');
    }
  } catch (err) {
    console.error('Error saving menu choices:', err);
    if (!silent) {
      showToast(`<div data-i18n="common:error.saving.menu.selections">${translate('common:error.saving.menu.selections')}</div>`, 'error');
    }
  }
}

// Make menu functions globally accessible
window.loadMenuSelections = loadMenuSelections;

// ============================================================================
// Image Lightbox Functionality
// ============================================================================

function initializeLightbox() {
  // Create lightbox HTML if it doesn't exist
  if (!document.getElementById('image-lightbox')) {
    const lightboxHTML = `
      <div id="image-lightbox" class="lightbox" style="display: none;">
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
          <img src="" alt="" class="lightbox-image">
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
  }

  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = lightbox.querySelector('.lightbox-image');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const backdrop = lightbox.querySelector('.lightbox-backdrop');

  // Function to open lightbox
  function openLightbox(imageUrl, altText) {
    lightboxImg.src = imageUrl;
    lightboxImg.alt = altText;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  // Function to close lightbox
  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    lightboxImg.src = ''; // Clear image
  }

  // Add click handlers to all menu images
  document.addEventListener('click', (e) => {
    const imageContainer = e.target.closest('.option-image-container');
    if (imageContainer && imageContainer.dataset.lightboxUrl) {
      const imageUrl = imageContainer.dataset.lightboxUrl;
      const altText = imageContainer.querySelector('img')?.alt || 'Menu item';
      openLightbox(imageUrl, altText);
    }
  });

  // Close button
  closeBtn.addEventListener('click', closeLightbox);

  // Click backdrop to close
  backdrop.addEventListener('click', closeLightbox);

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      closeLightbox();
    }
  });

  // Mobile touch support: swipe down to close
  let touchStartY = 0;
  let touchEndY = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  });

  lightbox.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeDistance = touchEndY - touchStartY;
    // If swiped down more than 100px, close
    if (swipeDistance > 100) {
      closeLightbox();
    }
  }
}

// Initialize lightbox when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLightbox);
} else {
  initializeLightbox();
}

window.addEventListener('languageChanged', () => {
  const menuViewContainer = document.getElementById('menu-view-container');
  if (!menuViewContainer) return;
  switchMenuView(currentMenuView);
});

window.loadMenuSelections = loadMenuSelections;