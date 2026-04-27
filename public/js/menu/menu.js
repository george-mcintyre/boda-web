// Menu Management Module
// Contains all menu-related functions extracted from guests.js

// Global variables
let currentMenuView = 'banquet'; // Track which menu is currently shown
let banquetChefData = null;

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
  
  // Create sub-navigation (banquet + seating only)
  menuContent.innerHTML = `
    <div class="menu-sub-nav">
      <button class="menu-sub-btn active" data-menu="banquet">
        <i class="fas fa-utensils"></i>
        <span data-i18n="guests:mainBanquet">Main Banquet</span>
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
    btn.addEventListener('click', () => {
      const menuType = btn.dataset.menu;
      switchMenuView(menuType);
    });
  });
  
  // Check for seating deep link
  if (typeof checkSeatingDeepLink === 'function' && checkSeatingDeepLink()) {
    switchMenuView('seating');
  } else {
    await loadBanquetMenu();
  }
}

// Switch between menu views (banquet | seating)
function switchMenuView(menuType) {
  currentMenuView = menuType;
  
  document.querySelectorAll('.menu-sub-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.menu === menuType);
  });
  
  if (menuType === 'banquet') {
    loadBanquetMenu();
  } else if (menuType === 'seating') {
    if (typeof loadSeatingView === 'function') {
      loadSeatingView();
    }
  }
}

// Load banquet menu with selection table + read-only detail cards
async function loadBanquetMenu() {
  const viewContainer = document.getElementById('menu-view-container');
  
  if (!viewContainer) return;
  
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
      viewContainer.innerHTML = `
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

    // Build choices lookup: { memberId: { courseId: optionId } }
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

    // Build cooking preferences lookup: { memberId: { courseId: cookingPreference } }
    const cookingPreferencesLookup = {};
    menuChoicesData.forEach(memberChoice => {
      const memberId = memberChoice.partyGuestId;
      cookingPreferencesLookup[memberId] = {};
      if (memberChoice.choices) {
        memberChoice.choices.forEach(choice => {
          if (choice.cookingPreference) {
            cookingPreferencesLookup[memberId][choice.courseId] = choice.cookingPreference;
          }
        });
      }
    });
    window.cookingPrefsData = cookingPreferencesLookup;

    const specialRequestsLookup = {};
    menuChoicesData.forEach(memberChoice => {
      specialRequestsLookup[memberChoice.partyGuestId] = {
        specialRequest: memberChoice.specialRequest || [],
        specialRequestDetail: memberChoice.specialRequestDetail || ''
      };
    });

    const dietaryOptions = [
      { name: 'vegetarian', label: 'Vegetarian', icon: 'fa-leaf' },
      { name: 'lactose-intolerant', label: 'Lactose Intolerant', icon: 'fa-cheese' },
      { name: 'gluten-intolerant', label: 'Gluten Intolerant', icon: 'fa-bread-slice' },
      { name: 'nut-allergy', label: 'Nut Allergy', icon: 'fa-seedling' },
      { name: 'other', label: 'Other', icon: 'fa-question-circle' }
    ];

    const resolveImageRef = (ref, optionId, isCloseup) => {
      if (!ref) return null;
      if (typeof ref !== 'string') return null;
      if (ref.startsWith('data:')) return ref;
      if (ref.length === 24 && /^[0-9a-fA-F]{24}$/.test(ref)) {
        const suffix = isCloseup ? 'image-closeup/thumbnail' : 'image/thumbnail';
        return `/api/admin/menu-options/${optionId}/${suffix}`;
      }
      return ref;
    };
    const getOptionImageUrl = (option) => resolveImageRef(option && option.image, option && option.id, false);
    const getOptionCloseupUrl = (option) => resolveImageRef(option && option.imageCloseup, option && option.id, true);

    const getDesc = (desc) => {
      if (!desc) return '';
      if (typeof desc === 'object') return desc[window.currentLanguage] || desc.en || '';
      return String(desc);
    };

    // Selectable courses: those requiring a choice with more than one option
    const selectableCourses = menuData.filter(c => c.selectionRequired !== false && c.options && c.options.length > 1);

    const cookingPrefValues = ['rare', 'medium-rare', 'medium', 'well-done'];

    // ── Selection table ──────────────────────────────────────────────────
    let html = '<div class="unified-menu-container">';
    html += `
      <div class="intro-card intro-section">
        <h2 class="card-title">
          <div data-i18n="guests:mainBanquetTitle">${translate('guests:mainBanquetTitle') || 'Main Banquet - Make Your Selections'}</div>
        </h2>
        <p class="card-description">
          <div data-i18n="guests:mainBanquetDescription">${translate('guests:mainBanquetDescription') || 'Please select your meal preferences for each course.'}</div>
        </p>
      </div>
    `;

    if (selectableCourses.length > 0) {
      html += `
        <div class="banquet-selection-table-wrapper">
          <h3 class="selection-table-heading" data-i18n="guests:selectMealChoices">${translate('guests:selectMealChoices') || 'Select your meal choices'}</h3>
          <div class="table-responsive">
            <table class="banquet-selection-table">
              <thead>
                <tr>
                  <th data-i18n="guests:guestColumnHeader">${translate('guests:guestColumnHeader') || 'Guest'}</th>
                  ${selectableCourses.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${partyData.map(member => {
                  const memberRequests = specialRequestsLookup[member.id] || { specialRequest: [], specialRequestDetail: '' };
                  const selectedRequests = Array.isArray(memberRequests.specialRequest) ? memberRequests.specialRequest : [];

                  const courseCellsHtml = selectableCourses.map(course => {
                    const savedOptionId = (choicesLookup[member.id] || {})[course.id] || '';
                    const savedCookingPref = (cookingPreferencesLookup[member.id] || {})[course.id] || 'medium';
                    const selectedOpt = course.options.find(o => o.id === savedOptionId) || null;
                    const selectedImgUrl = selectedOpt ? (getOptionImageUrl(selectedOpt) || '') : '';
                    const selectedLabel = selectedOpt ? escapeHtml(selectedOpt.label) : (translate('guests:selectOption') || 'Select…');
                    const allowsCookingPref = selectedOpt ? !!selectedOpt.allowsCookingPreference : false;

                    const optionsHtml = [
                      `<div class="cms-option" data-value="" data-allows-cooking-pref="false" data-image-url="" data-is-vegetarian="false" data-is-vegan="false" data-contains-lactose="false" data-contains-gluten="false" data-contains-nuts="false">
                        <span class="cms-option-text"><span class="cms-option-title">— ${translate('guests:selectOption') || 'Select'} —</span></span>
                      </div>`
                    ].concat(course.options.map(opt => {
                      const optImg = getOptionImageUrl(opt) || '';
                      const desc = getDesc(opt.description);
                      return `<div class="cms-option${savedOptionId === opt.id ? ' selected' : ''}" data-value="${opt.id}" data-allows-cooking-pref="${opt.allowsCookingPreference ? 'true' : 'false'}" data-image-url="${escapeHtml(optImg)}" data-is-vegetarian="${opt.isVegetarian ? 'true' : 'false'}" data-is-vegan="${opt.isVegan ? 'true' : 'false'}" data-contains-lactose="${opt.containsLactose ? 'true' : 'false'}" data-contains-gluten="${opt.containsGluten ? 'true' : 'false'}" data-contains-nuts="${opt.containsNuts ? 'true' : 'false'}">
                        ${optImg ? `<img src="${escapeHtml(optImg)}" alt="" loading="lazy">` : '<span class="cms-option-no-img"></span>'}
                        <span class="cms-option-text">
                          <span class="cms-option-title">${escapeHtml(opt.label)}</span>
                          ${desc ? `<span class="cms-option-desc">${escapeHtml(desc)}</span>` : ''}
                        </span>
                      </div>`;
                    })).join('');

                    return `
                      <td class="course-choice-cell" data-course-id="${course.id}" data-label="${escapeHtml(course.label)}">
                        <div class="selection-cell-inner">
                          <div class="custom-menu-select" data-member-id="${member.id}" data-course-id="${course.id}" data-value="${escapeHtml(savedOptionId)}">
                            <button type="button" class="cms-trigger" aria-haspopup="listbox" aria-expanded="false">
                              ${selectedImgUrl ? `<img src="${escapeHtml(selectedImgUrl)}" alt="" class="cms-trigger-img">` : '<span class="cms-trigger-img cms-trigger-img--empty"></span>'}
                              <span class="cms-trigger-label">${selectedLabel}</span>
                              <i class="fas fa-chevron-down cms-chevron"></i>
                            </button>
                            <div class="cms-panel" role="listbox" style="display:none">${optionsHtml}</div>
                          </div>
                          <select class="cooking-pref-inline" data-member-id="${member.id}" data-course-id="${course.id}" onchange="window.onCookingPrefChange(this)" style="${allowsCookingPref ? '' : 'display:none;'}">
                            ${cookingPrefValues.map(p => `<option value="${p}" ${savedCookingPref === p ? 'selected' : ''}>${translate('menu.cooking.' + p) || p}</option>`).join('')}
                          </select>
                        </div>
                      </td>
                    `;
                  }).join('');

                  const dietarySubRowHtml = `
                    <tr class="dietary-sub-row" data-member-id="${member.id}">
                      <td colspan="${selectableCourses.length + 1}" class="dietary-sub-row-cell">
                        <div class="menu-dietary-card dietary-inline-container" data-member-id="${member.id}" data-member-name="${escapeHtml(member.name)}">
                          <div class="dietary-inline-checkboxes">
                            ${dietaryOptions.map(opt => {
                              const isSelected = selectedRequests.some(r =>
                                (typeof r === 'string' && r === opt.name) ||
                                (typeof r === 'object' && r.name === opt.name && r.selected)
                              );
                              return `<label class="dietary-checkbox ${isSelected ? 'checked' : ''}">
                                <input type="checkbox"
                                  name="dietary-${member.id}"
                                  value="${opt.name}"
                                  data-member-id="${member.id}"
                                  ${isSelected ? 'checked' : ''}
                                  onchange="updateDietaryCheckbox(this)">
                                <i class="fas ${opt.icon}"></i>
                                <span data-i18n="guests:dietary${opt.label}">${translate('guests:dietary' + opt.label)}</span>
                              </label>`;
                            }).join('')}
                          </div>
                          <div class="special-request-detail">
                            <label for="special-detail-${member.id}"><div data-i18n="guests:additionalDetailsLabel">${translate('guests:additionalDetailsLabel')}</div></label>
                            <textarea
                              id="special-detail-${member.id}"
                              name="special-detail-${member.id}"
                              data-i18n="guests:additionalDetails:placeholder"
                              placeholder="Additional details or specific requirements..."
                              rows="2"
                            >${escapeHtml(memberRequests.specialRequestDetail || '')}</textarea>
                          </div>
                        </div>
                      </td>
                    </tr>
                  `;

                  return `
                    <tr data-member-id="${member.id}">
                      <td class="member-name-cell">
                        ${escapeHtml(member.name)}
                        ${member.primary ? `<span class="badge badge-primary" data-i18n="common:party.primary">${translate('common:party.primary') || 'You'}</span>` : ''}
                      </td>
                      ${courseCellsHtml}
                    </tr>
                    ${dietarySubRowHtml}
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="banquet-selection-table-wrapper">
          <h3 class="selection-table-heading" data-i18n="guests:dietaryPreferences">${translate('guests:dietaryPreferences') || 'Dietary Preferences'}</h3>
          ${partyData.map(member => {
            const memberRequests = specialRequestsLookup[member.id] || { specialRequest: [], specialRequestDetail: '' };
            const selectedRequests = Array.isArray(memberRequests.specialRequest) ? memberRequests.specialRequest : [];
            return `
              <div class="menu-dietary-card dietary-inline-container" data-member-id="${member.id}" data-member-name="${escapeHtml(member.name)}">
                <div class="dietary-fallback-member-name">${escapeHtml(member.name)}</div>
                <div class="dietary-inline-checkboxes">
                  ${dietaryOptions.map(opt => {
                    const isSelected = selectedRequests.some(r =>
                      (typeof r === 'string' && r === opt.name) ||
                      (typeof r === 'object' && r.name === opt.name && r.selected)
                    );
                    return `<label class="dietary-checkbox ${isSelected ? 'checked' : ''}">
                      <input type="checkbox"
                        name="dietary-${member.id}"
                        value="${opt.name}"
                        data-member-id="${member.id}"
                        ${isSelected ? 'checked' : ''}
                        onchange="updateDietaryCheckbox(this)">
                      <i class="fas ${opt.icon}"></i>
                      <span data-i18n="guests:dietary${opt.label}">${translate('guests:dietary' + opt.label)}</span>
                    </label>`;
                  }).join('')}
                </div>
                <div class="special-request-detail">
                  <label for="special-detail-${member.id}"><div data-i18n="guests:additionalDetailsLabel">${translate('guests:additionalDetailsLabel')}</div></label>
                  <textarea
                    id="special-detail-${member.id}"
                    name="special-detail-${member.id}"
                    data-i18n="guests:additionalDetails:placeholder"
                    placeholder="Additional details or specific requirements..."
                    rows="2"
                  >${escapeHtml(memberRequests.specialRequestDetail || '')}</textarea>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // ── Full menu detail section heading ─────────────────────────────────
    html += `
      <div class="menu-details-heading">
        <h3 data-i18n="guests:fullMenuDetails">${translate('guests:fullMenuDetails') || 'Full Menu Details'}</h3>
      </div>
    `;

    // ── Read-only course detail cards ─────────────────────────────────────
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

      group.courses.forEach(course => {
        const options = course.options || [];
        const isSelectable = course.selectionRequired !== false && options.length > 1;

        html += `
          <div class="card" data-course-id="${course.id}" data-selectable="${isSelectable}">
            <div class="card-header">
              <h4>${escapeHtml(course.label)}</h4>
              ${isSelectable
                ? '<span class="badge badge-warning"><i class="fas fa-hand-pointer"></i> <div data-i18n="guests:selectionRequired">Selection Required</div></span>'
                : '<span class="badge badge-secondary"><i class="fas fa-info-circle"></i> <div data-i18n="guests:infoOnly">Info Only</div></span>'
              }
            </div>
            <div class="card-content">
        `;

        options.forEach(option => {
          const imageUrl = getOptionImageUrl(option);
          const closeupUrl = getOptionCloseupUrl(option);
          const hasBoth = !!(imageUrl && closeupUrl);

          html += `
            <div class="menu-option-card" data-option-id="${option.id}" data-course-id="${course.id}">
              <div class="option-card-main">
                <div class="option-image-container" data-lightbox-url="${imageUrl || ''}" data-lightbox-closeup="${closeupUrl || ''}" data-lightbox-alt="${escapeHtml(option.label)}">
                  ${imageUrl ? `
                    <img src="${imageUrl}" alt="${escapeHtml(option.label)}" class="option-thumbnail" onerror="this.style.display='none'; this.parentElement.classList.add('no-image');">
                  ` : `
                    <div class="option-image-placeholder">
                      <i class="fas fa-utensils"></i>
                    </div>
                  `}
                  ${hasBoth ? `<span class="option-photo-badge" aria-label="${escapeHtml(translate('guests:viewPhotos') || 'View photos')}"><i class="fas fa-camera"></i><span class="option-photo-badge-count">2</span></span>` : ''}
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

    if (banquetChefData) {
      html += `
        <div class="chef-profile-section">
          <div class="chef-profile-header">
            <i class="fas fa-user-chef"></i>
            <h3><div data-i18n="guests:meetTheChef">${translate('guests:meetTheChef') || 'Meet The Chef'}</div></h3>
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

    if (typeof updatePageContent === 'function') updatePageContent();
    if (typeof loadAuthImages === 'function') loadAuthImages();

    initCustomMenuSelects(viewContainer);

    document.querySelectorAll('.special-request-detail textarea').forEach(textarea => {
      textarea.addEventListener('blur', () => autoSaveMenuChoices());
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) autoSaveMenuChoices();
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
    if (typeof updatePageContent === 'function') updatePageContent();
  }
}

// ── Selection change handler ──────────────────────────────────────────────────

window.onMenuSelectChange = function(wrapper) {
  const cell = wrapper.closest('.course-choice-cell');
  if (!cell) return;

  const memberId = wrapper.dataset.memberId;
  const courseId = wrapper.dataset.courseId;
  const optionId = wrapper.dataset.value;
  const selectedItem = optionId ? wrapper.querySelector(`.cms-option[data-value="${optionId}"]`) : null;
  const allowsCookingPref = selectedItem && selectedItem.dataset.allowsCookingPref === 'true';

  const cookingSelect = cell.querySelector('.cooking-pref-inline');
  if (allowsCookingPref) {
    cookingSelect.style.display = '';
  } else {
    cookingSelect.style.display = 'none';
    if (window.cookingPrefsData && window.cookingPrefsData[memberId]) {
      delete window.cookingPrefsData[memberId][courseId];
    }
  }

  autoSaveMenuChoices();
  if (memberId) checkDietaryConflicts(memberId);
};

window.onCookingPrefChange = function(select) {
  const memberId = select.dataset.memberId;
  const courseId = select.dataset.courseId;
  if (!window.cookingPrefsData) window.cookingPrefsData = {};
  if (!window.cookingPrefsData[memberId]) window.cookingPrefsData[memberId] = {};
  window.cookingPrefsData[memberId][courseId] = select.value;
  autoSaveMenuChoices();
};

// ── Auto-save ────────────────────────────────────────────────────────────────

async function autoSaveMenuChoices() {
  if (window.autoSaveTimeout) clearTimeout(window.autoSaveTimeout);
  window.autoSaveTimeout = setTimeout(async () => {
    await saveAllMenuChoices(false);
  }, 500);
}

window.updateDietaryCheckbox = function(checkbox) {
  const label = checkbox.closest('.dietary-checkbox');
  if (label) {
    label.classList.toggle('checked', checkbox.checked);
  }
  const memberId = checkbox.dataset.memberId;
  autoSaveMenuChoices();
  if (memberId) checkDietaryConflicts(memberId);
};

// ── Dietary conflict checker ──────────────────────────────────────────────────

function checkDietaryConflicts(memberId) {
  const dietaryCard = document.querySelector(`.menu-dietary-card[data-member-id="${memberId}"]`);
  if (!dietaryCard) return;

  const checkedPrefs = new Set();
  dietaryCard.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    checkedPrefs.add(cb.value);
  });
  if (checkedPrefs.size === 0) return;

  const memberName = dietaryCard.dataset.memberName || 'Guest';
  const conflicts = [];

  document.querySelectorAll(`.custom-menu-select[data-member-id="${memberId}"]`).forEach(wrapper => {
    const optionId = wrapper.dataset.value;
    if (!optionId) return;
    const selectedItem = wrapper.querySelector(`.cms-option[data-value="${optionId}"]`);
    if (!selectedItem) return;

    const isVegetarian = selectedItem.dataset.isVegetarian === 'true';
    const isVegan = selectedItem.dataset.isVegan === 'true';
    const containsLactose = selectedItem.dataset.containsLactose === 'true';
    const containsGluten = selectedItem.dataset.containsGluten === 'true';
    const containsNuts = selectedItem.dataset.containsNuts === 'true';

    const optionLabel = wrapper.querySelector('.cms-trigger-label')?.textContent?.trim() || 'selection';

    if (checkedPrefs.has('vegetarian') && !isVegetarian && !isVegan) {
      conflicts.push(translateWithVars('guests:conflict.notVegetarian', { option: optionLabel }));
    }
    if (checkedPrefs.has('lactose-intolerant') && containsLactose) {
      conflicts.push(translateWithVars('guests:conflict.containsDairy', { option: optionLabel }));
    }
    if (checkedPrefs.has('gluten-intolerant') && containsGluten) {
      conflicts.push(translateWithVars('guests:conflict.containsGluten', { option: optionLabel }));
    }
    if (checkedPrefs.has('nut-allergy') && containsNuts) {
      conflicts.push(translateWithVars('guests:conflict.containsNuts', { option: optionLabel }));
    }
  });

  conflicts.forEach(msg => {
    showToast(`⚠️ ${memberName}: ${msg}`, 'warning');
  });
}

// ── Save all menu choices ─────────────────────────────────────────────────────

async function saveAllMenuChoices(silent = false) {
  if (!silent) {
    console.log('Saving menu selections...');
  }

  try {
    const partyChoices = {};

    document.querySelectorAll('.custom-menu-select').forEach(wrapper => {
      const memberId = wrapper.dataset.memberId;
      const courseId = wrapper.dataset.courseId;
      const optionId = wrapper.dataset.value;

      if (!memberId || memberId === 'null' || memberId === 'undefined' || !optionId) return;

      if (!partyChoices[memberId]) {
        partyChoices[memberId] = {
          partyGuestId: memberId,
          choices: [],
          specialRequest: [],
          specialRequestDetail: null
        };
      }

      partyChoices[memberId].choices.push({
        courseId,
        optionId,
        cookingPreference: window.cookingPrefsData?.[memberId]?.[courseId] || undefined
      });
    });

    // Collect special dietary requests
    document.querySelectorAll('.menu-dietary-card').forEach(card => {
      const memberId = card.dataset.memberId;
      if (!memberId || memberId === 'null' || memberId === 'undefined') return;

      if (!partyChoices[memberId]) {
        partyChoices[memberId] = {
          partyGuestId: memberId,
          choices: [],
          specialRequest: [],
          specialRequestDetail: null
        };
      }

      const selectedOptions = [];
      card.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedOptions.push({ name: checkbox.value, selected: true });
      });
      partyChoices[memberId].specialRequest = selectedOptions;

      const detailTextarea = card.querySelector('textarea');
      partyChoices[memberId].specialRequestDetail = detailTextarea && detailTextarea.value.trim()
        ? detailTextarea.value.trim()
        : null;
    });

    const choicesArray = Object.values(partyChoices).filter(choice => {
      const isValid = choice.partyGuestId &&
                      choice.partyGuestId !== 'null' &&
                      choice.partyGuestId !== 'undefined';
      if (!isValid) console.warn('Filtering out invalid choice:', choice);
      return isValid;
    });

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
        showToast(translate('common:menu.selections.saved'), 'success');
      }
    } else {
      const data = await response.json();
      const msg = data.errorCode
        ? translate(`common:error.${data.errorCode}`) || translate('common:error.saving.menu.selections')
        : data.error || translate('common:error.saving.menu.selections');
      showToast(msg, 'error');
    }
  } catch (err) {
    console.error('Error saving menu choices:', err);
    if (!silent) {
      showToast(translate('common:error.saving.menu.selections'), 'error');
    }
  }
}

// ── Image zoom on hover ───────────────────────────────────────────────────────

function initCustomMenuSelects(container) {
  const closeAll = (except) => {
    container.querySelectorAll('.custom-menu-select.open').forEach(w => {
      if (w !== except) {
        w.classList.remove('open');
        const p = w.querySelector('.cms-panel');
        p.style.display = 'none';
        w.querySelector('.cms-trigger').setAttribute('aria-expanded', 'false');
      }
    });
  };

  const positionPanel = (wrapper, panel) => {
    const rect = wrapper.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.left = rect.left + 'px';
    panel.style.top = (rect.bottom + 4) + 'px';
    panel.style.width = rect.width + 'px';
    panel.style.maxHeight = Math.min(320, window.innerHeight - rect.bottom - 12) + 'px';
  };

  container.querySelectorAll('.custom-menu-select').forEach(wrapper => {
    const trigger = wrapper.querySelector('.cms-trigger');
    const panel = wrapper.querySelector('.cms-panel');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('open');
      closeAll(null);
      if (!isOpen) {
        wrapper.classList.add('open');
        panel.style.display = 'block';
        positionPanel(wrapper, panel);
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    panel.addEventListener('click', (e) => e.stopPropagation());

    panel.querySelectorAll('.cms-option').forEach(option => {
      option.addEventListener('click', () => {
        const value = option.dataset.value;
        const imgUrl = option.dataset.imageUrl || '';
        const titleEl = option.querySelector('.cms-option-title');
        const label = titleEl ? titleEl.textContent : '';

        wrapper.dataset.value = value;

        panel.querySelectorAll('.cms-option').forEach(o => o.classList.remove('selected'));
        if (value) option.classList.add('selected');

        const triggerImg = trigger.querySelector('.cms-trigger-img');
        if (imgUrl) {
          triggerImg.src = imgUrl;
          triggerImg.classList.remove('cms-trigger-img--empty');
          triggerImg.style.display = '';
        } else {
          triggerImg.src = '';
          triggerImg.classList.add('cms-trigger-img--empty');
          triggerImg.style.display = 'none';
        }
        trigger.querySelector('.cms-trigger-label').textContent = label;

        wrapper.classList.remove('open');
        panel.style.display = 'none';
        trigger.setAttribute('aria-expanded', 'false');

        window.onMenuSelectChange(wrapper);
      });
    });
  });

  document.addEventListener('click', () => closeAll(null));
}



// ============================================================================
// Image Lightbox Functionality
// ============================================================================

function initializeLightbox() {
  const tr = (k, fb) => (typeof translate === 'function' ? translate(k) : '') || fb;

  if (!document.getElementById('image-lightbox')) {
    const lightboxHTML = `
      <div id="image-lightbox" class="lightbox" style="display: none;" role="dialog" aria-modal="true">
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
          <img src="" alt="" class="lightbox-image">
          <div class="lightbox-toggle" role="tablist" hidden>
            <button type="button" class="lightbox-toggle-btn is-active" data-view="wide" role="tab" aria-selected="true">
              <i class="fas fa-image"></i>
              <span>${tr('guests:photoToggleWide', 'Wide')}</span>
            </button>
            <button type="button" class="lightbox-toggle-btn" data-view="closeup" role="tab" aria-selected="false">
              <i class="fas fa-search-plus"></i>
              <span>${tr('guests:photoToggleCloseup', 'Close-up')}</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
  }

  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = lightbox.querySelector('.lightbox-image');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const backdrop = lightbox.querySelector('.lightbox-backdrop');
  const toggle = lightbox.querySelector('.lightbox-toggle');
  const toggleBtns = toggle ? toggle.querySelectorAll('.lightbox-toggle-btn') : [];
  let currentPair = { wide: '', closeup: '', alt: '' };
  let currentView = 'wide';
  let returnFocusEl = null;

  function setView(view) {
    if (view === 'closeup' && !currentPair.closeup) view = 'wide';
    currentView = view;
    lightboxImg.src = view === 'closeup' ? currentPair.closeup : currentPair.wide;
    toggleBtns.forEach(b => {
      const active = b.dataset.view === view;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function openLightbox(wideUrl, altText, closeupUrl, triggerEl) {
    currentPair = { wide: wideUrl || '', closeup: closeupUrl || '', alt: altText || '' };
    lightboxImg.alt = altText || '';
    if (toggle) toggle.hidden = !closeupUrl;
    setView('wide');
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    returnFocusEl = triggerEl || null;
    setTimeout(() => closeBtn.focus(), 0);
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    lightboxImg.src = '';
    currentPair = { wide: '', closeup: '', alt: '' };
    if (returnFocusEl && typeof returnFocusEl.focus === 'function') {
      try { returnFocusEl.focus(); } catch (_) {}
    }
    returnFocusEl = null;
  }

  document.addEventListener('click', (e) => {
    const imageContainer = e.target.closest('.option-image-container');
    if (imageContainer && imageContainer.dataset.lightboxUrl) {
      const wideUrl = imageContainer.dataset.lightboxUrl;
      const closeupUrl = imageContainer.dataset.lightboxCloseup || '';
      const altText = imageContainer.dataset.lightboxAlt || imageContainer.querySelector('img')?.alt || 'Menu item';
      openLightbox(wideUrl, altText, closeupUrl, imageContainer);
    }
  });

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setView(btn.dataset.view);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (lightbox.style.display !== 'flex') return;
    if (e.key === 'Escape') { closeLightbox(); return; }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && currentPair.closeup) {
      e.preventDefault();
      setView(currentView === 'wide' ? 'closeup' : 'wide');
    }
  });

  let touchStartX = 0, touchStartY = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dy) > Math.abs(dx) && dy > 100) { closeLightbox(); return; }
    if (currentPair.closeup && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      setView(dx < 0 ? 'closeup' : 'wide');
    }
  });
}

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
