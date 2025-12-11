// Summary Module

// Define loadSummaryContent function to load all summary data
async function loadSummaryContent() {
const summaryContent = document.getElementById('summary');

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
        headers: { 'Authorization': window.token }
    }),
    fetch(`/api/guest/events?lang=${window.currentLanguage}`, {
        method: 'GET',
        headers: { 'Authorization': window.token }
    }),
    fetch('/api/guest/event-choices', {
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
    fetch('/api/guest/gift-choices', {
        method: 'GET',
        headers: { 'Authorization': window.token }
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
    return date.toLocaleDateString(window.currentLanguage || 'en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
    };
    
    const formatEventTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(window.currentLanguage || 'en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    };
    
    const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(window.currentLanguage || 'en-GB', {
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
    
    // Build dietary requirements lookup: { partyGuestId: { specialRequest: [], specialRequestDetail: '' } }
    const dietaryLookup = {};
    menuChoices.forEach(memberChoice => {
    const memberId = memberChoice.partyGuestId;
    dietaryLookup[memberId] = {
        specialRequest: memberChoice.specialRequest || [],
        specialRequestDetail: memberChoice.specialRequestDetail || ''
    };
    });
    
    // Define dietary options with icons (matching guests.js)
    const dietaryOptions = [
    { name: 'vegetarian', label: 'Vegetarian', icon: 'fa-leaf' },
    { name: 'lactose-intolerant', label: 'Lactose Intolerant', icon: 'fa-cheese' },
    { name: 'gluten-intolerant', label: 'Gluten Intolerant', icon: 'fa-bread-slice' },
    { name: 'nut-allergy', label: 'Nut Allergy', icon: 'fa-seedling' },
    { name: 'other', label: 'Other', icon: 'fa-question-circle' }
    ];
    
    // Start building HTML
    let html = '';

    
    // ========== 1. Party Members Card ==========
    html += `
    <div class="summary-section party-members-section">
        <h3 class="summary-section-title clickable" onclick="switchToTab('party')" style="cursor: pointer;">
        <i class="fas fa-users"></i>
        <div data-i18n="guests:summaryYourParty">Your Party</div>
        ( ${partyMembers.length} <div data-i18n="${partyMembers.length === 1 ? 'common:person' : 'common:people'}">Person</div>)
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
            ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:party.primary\">${member.primary ? translate('common:party.primary') : ''}</span>" : ''}
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
        <h3 class="summary-section-title clickable" onclick="switchToTab('events')" style="cursor: pointer;">
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
                ${attendees.length} <span data-i18n="guests:eventsAttending">${translate('guests:eventsAttending')}</span>
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
        <h3 class="summary-section-title clickable" onclick="switchToTab('menu')" style="cursor: pointer;">
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
            ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:party.primary\">${member.primary ? translate('common:party.primary') : ''}</span>" : ''}
            </div>
            <div class="menu-choices-list">
        `;
        const memberDietary = dietaryLookup[member.id] || { specialRequest: [], specialRequestDetail: '' };
        const selectedRequests = Array.isArray(memberDietary.specialRequest) ? memberDietary.specialRequest : [];
        
        // Get selected dietary option names
        const selectedDietaryNames = selectedRequests
            .map(r => typeof r === 'string' ? r : r.name)
            .filter(name => name);
        
        html += `
        <div class="menu-choice-items">
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
        `;

        html += `
        <div class="dietary-member-card">
            <div class="dietary-requirements-list">
        `;
        
        if (selectedDietaryNames.length > 0) {
            // Show selected dietary requirements with icons
            selectedDietaryNames.forEach(dietaryName => {
                const dietaryOption = dietaryOptions.find(opt => opt.name === dietaryName);
                if (dietaryOption) {
                    html += `
                    <div class="dietary-requirement-item">
                        <i class="fas ${dietaryOption.icon}"></i>
                        <span>${escapeHtml(dietaryOption.label)}</span>
                    </div>
                    `;
                }
            });
            
            // Show additional details if provided
            if (memberDietary.specialRequestDetail && memberDietary.specialRequestDetail.trim()) {
                html += `
                <div class="dietary-requirement-detail">
                    <i class="fas fa-info-circle"></i>
                    <span>${escapeHtml(memberDietary.specialRequestDetail.trim())}</span>
                </div>
                `;
            }
        } else {
            // No dietary requirements
            html += `
            <div class="no-dietary-requirements">
                <i class="fas fa-check-circle"></i>
                <span>No special dietary requirements</span>
            </div>
            `;
        }
        
        html += `
            </div>
        </div>
        `;
        
        

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
        <h3 class="summary-section-title clickable" onclick="switchToTab('gifts')" style="cursor: pointer;">
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
    const settings = await window.fetchSettings();
    window.applySettingsVisibility(settings);
} catch (error) {
    console.error('Error refreshing settings for summary:', error);
}

}

