// Events Management Module

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

/**
 * Load and display events content in the events tab
 * Fetches events, party members, and event choices from the API
 * Creates event cards with attendance checkboxes for each party member
 */
async function loadEventsContent() {
  const eventsContent = document.getElementById('events');
  
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
              ${subEvent.description ? `<span class="sub-event-description">${subEvent.description}</span>` : ''}
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
                ${member.primary ? "<span class=\"badge badge-primary\" data-i18n=\"common:party.primary\">${member.primary ? translate('common:party.primary') : ''}</span>" : ''}
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
            
            ${event.description ? `<p class="event-description">${event.description}</p >` : ''}
            
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

// Make functions globally accessible
window.loadEventsContent = loadEventsContent;
window.saveEventChoices = saveEventChoices;
