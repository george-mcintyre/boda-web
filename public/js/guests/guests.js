// Guests Management Module

  /**
   * Load and display party content in the party tab
   * Allows managing party members (add/edit names, max 4 members)
   * And managing dietary requirements for each member
   */
  window.loadPartyContent = async () => {
    const partyContent = document.getElementById('party');
    
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
          headers: { 'Authorization': window.token }
        }),
        fetch('/api/guest/menu-choices', {
          method: 'GET',
          headers: { 'Authorization': window.token }
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
            <div data-i18n="guests:party.page.title">${translate('guests:party.page.title')}</div>
          </h2>
          <p class="card-description">
            <div data-i18n="guests:party.page.description">${translate('guests:party.page.description')}</div>
          </p>
        </div>
      `;      
      
      // ========== Section 1: Party Members List ==========
      html += `
        <div class="party-members-management">
          <div class="party-members-header">
            <h3 data-i18n="rich:guests:partyMembersTitle">${translate("rich:guests:partyMembersTitle")}</h3>
            <span class="party-count">${partyData.length} / ${maxPartySize} ${translate("common:party.members")}</span>
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
              ${member.primary ? '<span class="primary-indicator"><i class="fas fa-star"></i> <div data-i18n="common:party.primary.guest">Primary Guest</div></span>' : ''}
              ${member.adult === false ? '<span class="child-indicator"><i class="fas fa-child"></i> <div data-i18n="common:party.child">Child</div></span>' : ''}
            </div>
            <div class="member-edit-form">
              <div class="form-group">
                <label for="member-name-${member.id}">
                  <i class="fas fa-user"></i> <span data-i18n="common:party.name">${translate('common:party.name')}</span>
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
                  <i class="fas fa-birthday-cake"></i> <span data-i18n="common:party.age.category">${translate('common:party.age.category')}</span>
                </label>
                <select id="member-age-${member.id}"
                        class="form-control member-age-select"
                        data-member-id="${member.id}"
                        data-is-primary="${member.primary ? 'true' : 'false'}">
                  <option value="adult" ${member.adult !== false ? 'selected' : ''}><div data-i18n="common:party.adult">${translate('common:party.adult')}</div></option>
                  <option value="child" ${member.adult === false ? 'selected' : ''}><div data-i18n="common:party.child">${translate('common:party.child')}</div></option>
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
              ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:party.primary\">${member.primary ? translate('common:party.primary') : ''}</span>" : ''}
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
        addMemberBtn.addEventListener('click', window.addNewPartyMember);
      }
      
      // Save party members button
      const savePartyBtn = document.getElementById('savePartyMembersBtn');
      if (savePartyBtn) {
        savePartyBtn.addEventListener('click', window.savePartyMembers);
      }
      
      // Save dietary button
      const saveDietaryBtn = document.getElementById('saveDietaryBtn');
      if (saveDietaryBtn) {
        saveDietaryBtn.addEventListener('click', window.savePartyDietaryChoices);
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
            window.removePartyMember(memberId);
          }
        });
      });
      
      // Mark as unsaved when inputs change
      document.querySelectorAll('.member-name-input').forEach(input => {
        input.addEventListener('input', window.markPartyAsUnsaved);
      });
      
      // Mark as unsaved when age selector changes
      document.querySelectorAll('.member-age-select').forEach(select => {
        select.addEventListener('change', window.markPartyAsUnsaved);
      });
      
      // Translate the newly loaded content
      if (typeof window.updatePageContent === 'function') {
        window.updatePageContent();
      }
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
      if (typeof window.updatePageContent === 'function') {
        window.updatePageContent();
      }
    }
  }
  
  // Add a new party member to the list
  window.addNewPartyMember = () => {
    const membersList = document.querySelector('.party-members-edit-list');
    const addCard = document.querySelector('.add-member-card');
    const maxMembersNotice = document.querySelector('.max-members-notice');
    
    if (!membersList) return;
    
    // Count current members
    const currentMembers = membersList.querySelectorAll('.party-member-edit-card');
    const maxPartySize = 4;
    
    if (currentMembers.length >= maxPartySize) {
      window.showToast('Maximum party size reached (4 members)', 'error');
      return;
    }
    
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
            <i class="fas fa-user"></i> <span data-i18n="common:party.name">${translate('common:party.name')}</span>
          </label>
          <input type="text"
                 id="member-name-${id}"
                 class="form-control member-name-input new-member-input"
                 data-member-id="${id}"
                 value=""
                 placeholder="${translate('common:enter.name')}"
                 autofocus>
        </div>
        <div class="form-group">
          <label for="member-age-${id}">
            <i class="fas fa-birthday-cake"></i> <span data-i18n="common:party.age.category">${translate('common:party.age.category')}</span>
          </label>
          <select id="member-age-${id}"
                  class="form-control member-age-select new-member-age-select"
                  data-member-id="${id}">
            <option value="adult" selected><span data-i18n="common:party.adult">${translate('common:party.adult')}</span></option>
            <option value="child"><span data-i18n="common:party.child">${translate('common:party.child')}</span></option>
          </select>
        </div>
        <button type="button" class="btn-base btn-danger btn-sm" data-member-id="${id}" title="${translate('rich:common:party.remove.member')}">
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
    window.updatePartyCountDisplay();
    
    // Attach remove listener to new button
    newCard.querySelector('.btn-base.btn-danger.btn-sm').addEventListener('click', function() {
      window.removePartyMember(newCard.dataset.memberId);
    });
    
    // Mark as unsaved
    window.markPartyAsUnsaved();
    
    // Focus the new input
    const newInput = newCard.querySelector('.member-name-input');
    if (newInput) newInput.focus();
  }
  
  // Remove a party member from the list
  window.removePartyMember = async (memberId) => {
    const card = document.querySelector(`.party-member-edit-card[data-member-id="${memberId}"]`);
    if (!card) return;
    
    const memberName = card.querySelector('.member-name-input')?.value || 'this member';
    
    // Confirm removal
    window.showConfirmDialog(
      `${translateWithVars("common:party.confirm.remove.member", { memberName: memberName })}`,
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
  window.updatePartyCountDisplay = () => {
    const countEl = document.querySelector('.party-count');
    const membersList = document.querySelector('.party-members-edit-list');
    if (countEl && membersList) {
      const count = membersList.querySelectorAll('.party-member-edit-card').length;
      countEl.textContent = `${count} / 4 ${translate('common:party.members')}`;
    }
  }
  
  // Mark party changes as unsaved
  window.markPartyAsUnsaved = () => {
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
    window.markDietaryAsUnsaved();
  };
  
  // Mark dietary changes as unsaved
  window.markDietaryAsUnsaved = () => {
    const saveBtn = document.getElementById('saveDietaryBtn');
    if (saveBtn && !saveBtn.classList.contains('unsaved')) {
      saveBtn.classList.add('unsaved');
      saveBtn.innerHTML = `<span data-i18n="rich:guests:saveDietaryRequirements">${translate("rich:guests:saveDietaryRequirements")}</span> *`;
    }
  }
  
  // Save party members
  window.savePartyMembers = async () => {
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
          'Authorization': window.token
        },
        body: JSON.stringify(members)
      });
      
      if (response.ok) {
        window.showToast(translate('guests:partyMembersSaved'), 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = `<span data-i18n="rich:guests:savePartyMembers">${translate("rich:guests:savePartyMembers")}</span>`;
        }
        // Reload to get updated IDs and refresh dietary cards
        window.loadPartyContent();
      } else {
        const data = await response.json();
        window.showToast(data.error || translate('common:errorSavingPartyMembers'), 'error');
      }
    } catch (err) {
      console.error('Error saving party members:', err);
      window.showToast(translate('common:errorSavingPartyMembers'), 'error');
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
  window.savePartyDietaryChoices = async () => {
    const saveBtn = document.getElementById('saveDietaryBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
      // Get current menu choices first
      const currentChoicesResponse = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': window.token }
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

        console.log('Dietary choices for member:', memberChoice.specialRequest);
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
          'Authorization': window.token
        },
        body: JSON.stringify({ choices: validChoices })
      });
      
      if (response.ok) {
        window.showToast(translate('guests:dietaryRequirementsSaved'), 'success');
        if (saveBtn) {
          saveBtn.classList.remove('unsaved');
          saveBtn.innerHTML = `<div data-i18n="rich:guests:saveDietaryRequirements">${translate("rich:guests:saveDietaryRequirements")}</div>`;
        }
      } else {
        const data = await response.json();
        window.showToast(data.error || translate('common:errorSavingDietaryRequirements'), 'error');
      }
    } catch (err) {
      console.error('Error saving dietary requirements:', err);
      window.showToast(translate('common:errorSavingDietaryRequirements'), 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!saveBtn.classList.contains('unsaved')) {
          saveBtn.innerHTML = `<div data-i18n="rich:guests:saveDietaryRequirements">${translate("rich:guests:saveDietaryRequirements")}</div>`;
        }
      }
    }
  }

