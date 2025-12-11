// Function to open map with all events
let mapInstance = null;
async function openMap() {
  try {
    const overlay = document.getElementById('mapOverlay');
    const closeBtn = document.getElementById('mapCloseBtn');
    if (!overlay) return;

    // Show overlay
    overlay.style.display = 'flex';

    // Close when clicking on close or outside
    const handleClose = () => { overlay.style.display = 'none'; };
    closeBtn && (closeBtn.onclick = handleClose);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleClose();
    }, { once: true });

    // Get events from the backend
    const response = await fetch('/api/events');
    const data = await response.json();
    const events = Array.isArray(data?.events) ? data.events : [];

    // Prepare map container
    const mapEl = document.getElementById('events-map');
    if (!mapEl) return;

    // Create or reset map
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }

    mapInstance = L.map('events-map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    const markers = [];

    events.forEach(ev => {
      // Determine coordinates or geocode address
      if (ev && ev.coordenadas && typeof ev.coordenadas.lat === 'number' && typeof ev.coordenadas.lng === 'number') {
        const marker = L.marker([ev.coordenadas.lat, ev.coordenadas.lng]).addTo(mapInstance);
        const title = ev.titulo || '';
        const place = ev.lugar || '';
        const address = ev.direccion || '';
        const hours = `${ev.horaInicio || ''}${ev.horaFin ? ' - ' + ev.horaFin : ''}`;
        const gmUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} ${address}`.trim())}`;
        marker.bindPopup(`<strong>${title}</strong><br>${place}<br>${address}<br>${hours}<br><a href="${gmUrl}" target="_blank" rel="noopener">${translate('wedding:location.viewMap')}</a>`);
        markers.push(marker);
      }
    });

    // Fit view
    const group = L.featureGroup(markers);
    if (markers.length > 0) {
      mapInstance.fitBounds(group.getBounds().pad(0.2));
    } else {
      mapInstance.setView([40.4168, -3.7038], 12); // Madrid por defecto
    }
  } catch (error) {
    console.error('Error opening map:', error);
    alert('Could not load map. Please try again later.');
  }
}

// Function to get the appropriate icon according to the event type
function getEventIcon(eventTitle) {
  const title = eventTitle.toLowerCase();
  if (title.includes('ceremonia') || title.includes('ceremony') || title.includes('cérémonie')) {
    return 'fas fa-church';
  } else if (title.includes('cocktail') || title.includes('bienvenida') || title.includes('welcome') || title.includes('bienvenue')) {
    return 'fas fa-glass-cheers';
  } else if (title.includes('recepción') || title.includes('reception') || title.includes('celebration') || title.includes('réception')) {
    return 'fas fa-glass-cheers';
  } else if (title.includes('brunch') || title.includes('desayuno') || title.includes('breakfast') || title.includes('déjeuner')) {
    return 'fas fa-coffee';
  } else if (title.includes('aniversario') || title.includes('anniversary') || title.includes('anniversaire')) {
    return 'fas fa-heart';
  } else {
    return 'fas fa-calendar-alt';
  }
}

// Function to map events from the backend to translation keys
function getEventTranslationKey(event) {
  const title = event.titulo.toLowerCase();
  if (title.includes('cocktail') || title.includes('bienvenida')) {
    return 'cocktail';
  } else if (title.includes('ceremonia') || title.includes('ceremony') || title.includes('cérémonie')) {
    return 'ceremony';
  } else if (title.includes('recepción') || title.includes('reception') || title.includes('celebration') || title.includes('réception')) {
    return 'reception';
  } else if (title.includes('brunch') || title.includes('desayuno') || title.includes('breakfast') || title.includes('déjeuner')) {
    return 'brunch';
  } else if (title.includes('aniversario') || title.includes('anniversary') || title.includes('anniversaire')) {
    return 'anniversary';
  }
  return null;
}

// Function to translate an event
function translateEvent(event) {
  const translationKey = getEventTranslationKey(event);
  if (!translationKey) {
    return event; // Return original event if no translation is found
  }

  return {
    ...event,
    titulo: translate(`events:${translationKey}.title`),
    descripcion: translate(`events:${translationKey}.description`),
    lugar: translate(`events:${translationKey}.venue`),
    direccion: translate(`events:${translationKey}.address`)
  };
}

// Function to format time from ISO date string
function formatEventTime(dateString, endString) {
  if (!dateString) return '';
  const start = new Date(dateString);
  const end = endString ? new Date(endString) : null;
  const options = { hour: '2-digit', minute: '2-digit' };
  let timeStr = start.toLocaleTimeString(undefined, options);
  if (end) {
    timeStr += ` - ${end.toLocaleTimeString(undefined, options)}`;
  }
  return timeStr;
}

// Function to get a default event image based on the event name
function getDefaultEventImage(eventName) {
  const name = (eventName || '').toLowerCase();
  if (name.includes('cocktail') || name.includes('welcome') || name.includes('bienvenida')) {
    return '/assets/images/reception.png';
  } else if (name.includes('ceremony') || name.includes('ceremonia') || name.includes('wedding')) {
    return '/assets/images/celebrate.png';
  } else if (name.includes('reception') || name.includes('dinner') || name.includes('cena')) {
    return '/assets/images/dinner.png';
  } else if (name.includes('brunch') || name.includes('breakfast') || name.includes('desayuno')) {
    return '/assets/images/marbella.png';
  } else if (name.includes('party') || name.includes('fiesta') || name.includes('dancing')) {
    return '/assets/images/paradise.png';
  }
  return '/assets/images/event.png';
}

// Function to render sub-events timeline
function renderSubEvents(subEvents) {
  if (!subEvents || subEvents.length === 0) return '';
  
  const subEventItems = subEvents.map(sub => {
    const time = formatEventTime(sub.date, sub.end);
    const iconClass = sub.icon ? `sub-event-icon-${sub.icon}` : '';
    return `
      <div class="sub-event-item ${iconClass}">
        <div class="sub-event-icon">
          <img src="/assets/icons/${sub.icon || 'ceremony'}.svg" alt="${sub.name}" />
        </div>
        <div class="sub-event-details">
          <span class="sub-event-name">${sub.name}</span>
          ${time ? `<span class="sub-event-time"><i class="fas fa-clock"></i> ${time}</span>` : ''}
          ${sub.description ? `<span class="sub-event-description">${sub.description}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="sub-events-timeline">
      <h4><i class="fas fa-list-ul"></i> Schedule</h4>
      ${subEventItems}
    </div>
  `;
}

// Function to load events dynamically from the database and group by day
async function loadEvents() {
  const eventsGrid = document.getElementById('events-grid');
  if (!eventsGrid) return;

  try {
    const response = await fetch('/api/events'); // Use public API endpoint
    const events = response.ok ? await response.json() : [];

    if (Array.isArray(events) && events.length > 0) {
      // Render each event as a two-column card (image left, details right)
      const eventCards = events.map(event => {
        const eventImage = event.image || getDefaultEventImage(event.name);
        const eventTime = formatEventTime(event.date, event.end);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.title || ''} ${event.locationAddress || ''}`.trim())}`;
        const hasLocation = event.locationLatitude && event.locationLongitude;
        
        // Format the date for display
        const eventDate = event.date ? new Date(event.date) : null;
        const dateLabel = eventDate ? eventDate.toLocaleDateString(window.currentLanguage || 'en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '';

        return `
          <div class="event-card-horizontal">
            <div class="event-image-container">
              <img src="${eventImage}" alt="${event.name || event.title || 'Event'}" class="event-image" />
              <div class="event-date-badge">
                <i class="fas fa-calendar-alt"></i>
                <span>${dateLabel}</span>
              </div>
            </div>
            <div class="event-details-card">
              <div class="event-header">
                <div class="event-icon">
                  <i class="${getEventIcon(event.name || event.title || '')}"></i>
                </div>
                <h3 class="event-title">${event.name || ''}</h3>
              </div>
              
              ${event.title ? `<h4 class="event-venue-name">${event.title}</h4>` : ''}
              
              ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
              
              <div class="event-meta">
                ${eventTime ? `
                  <div class="event-meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${eventTime}</span>
                  </div>
                ` : ''}
                
                ${event.locationAddress ? `
                  <div class="event-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.locationAddress}</span>
                  </div>
                ` : ''}
              </div>
              
              ${renderSubEvents(event.sub_events)}
              
              ${(event.locationAddress || hasLocation) ? `
                <div class="event-actions">
                  <a class="btn-ver-mapa" href="${mapsUrl}" target="_blank" rel="noopener">
                    <i class="fas fa-map"></i> ${translate('wedding:location.viewMap')}
                  </a>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Centered location card
      const locationCard = `
        <div class="info-card location-card">
          <div class="info-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <h3>${translate('wedding:location.title')}</h3>
          <p>${translate('wedding:location.description')}</p>
          <button onclick="openMap()">
            <i class="fas fa-map"></i> ${translate('wedding:location.viewMap')}
          </button>
        </div>
      `;

      eventsGrid.innerHTML = `
        <div class="events-container">
          <div class="events-list">
            ${eventCards}
          </div>
          <div class="location-section">${locationCard}</div>
        </div>
      `;
    } else {
      // If there are no events, only show location
      showDefaultEvents();
    }
  } catch (error) {
    console.error('Error loading events:', error);
    // If the load fails, only show location
    showDefaultEvents();
  }
}

// Function to show default view (no events, only location)
function showDefaultEvents() {
  const eventsGrid = document.getElementById('events-grid');
  if (!eventsGrid) return;

  eventsGrid.innerHTML = `
    <div class="events-container">
      <div class="location-section">
        <div class="info-card location-card">
          <div class="info-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <h3>${translate('wedding:location.title')}</h3>
          <p>${translate('wedding:location.description')}</p>
          <button onclick="openMap()">
            <i class="fas fa-map"></i> ${translate('wedding:location.viewMap')}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Load events when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
});
