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

// Function to load events dynamically from the database and group by day
async function loadEvents() {
  const eventsGrid = document.getElementById('events-grid');
  if (!eventsGrid) return;

  try {
    const response = await fetch('/api/event'); // returns an array of located events
    const events = response.ok ? await response.json() : [];

    if (Array.isArray(events) && events.length > 0) {
      // Normalize date to day key (YYYY-MM-DD) and visible label (event.day or formatted date)
      const groups = new Map(); // key -> { label, items: [] }
      for (const ev of events) {
        const dt = ev.date ? new Date(ev.date) : null;
        const key = dt ? dt.toISOString().slice(0,10) : (ev.day || '');
        const label = ev.day || (dt ? dt.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : '');
        const item = {
          title: ev.title || '',
          description: ev.description || '',
          venue: ev.venue || '',
          address: ev.address || '',
          time: ev.time || '',
        };
        if (!groups.has(key)) groups.set(key, { label, items: [] });
        groups.get(key).items.push(item);
      }

      // Create HTML for each day, max 3 cards; the rest as subevents
      const daysHtml = Array.from(groups.entries()).map(([key, group]) => {
        const firstThree = group.items.slice(0,3);
        const rest = group.items.slice(3);

        const cards = firstThree.map(event => {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.address}`.trim())}`;
          return `
            <div class="info-card">
              <div class="info-icon">
                <i class="${getEventIcon(event.title || '')}"></i>
              </div>
              <h3>${event.title}</h3>
              ${event.venue ? `<p><strong>${event.venue}</strong></p>` : ''}
              ${event.address ? `<p>${event.address}</p>` : ''}
              ${event.time ? `<p class=\"time\"><i class=\"fas fa-clock\"></i> ${event.time}</p>` : ''}
              ${event.description ? `<p class=\"event-description\">${event.description}</p>` : ''}
              ${(event.venue || event.address) ? `<a class=\"btn-ver-mapa\" href=\"${mapsUrl}\" target=\"_blank\" rel=\"noopener\">\n                    <i class=\"fas fa-map\"></i> ${translate('wedding:location.viewMap')}\n                  </a>` : ''}
            </div>
          `;
        }).join('');

        const subEvents = rest.length ? `
          <div class="sub-events">
            <h4>${group.label ? `${group.label} -` : ''} ${rest.length} ${rest.length===1? 'more event':'more events'}</h4>
            <ul>
              ${rest.map(ev => `<li>${ev.time ? `<strong>${ev.time}</strong> - `: ''}${ev.title}${ev.venue?` @ ${ev.venue}`:''}</li>`).join('')}
            </ul>
          </div>
        ` : '';

        return `
          <div class="day-group">
            ${group.label ? `<h3 style=\"text-align:center; margin: 0.5rem 0 0;\">${group.label}</h3>` : ''}
            <div class="events-row">${cards}</div>
            ${subEvents}
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
          ${daysHtml}
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
