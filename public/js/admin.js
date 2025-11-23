(function(){
  // Admin panel client script (based on legacy admin-fixed.js), translated to English
  const content = document.getElementById('adminContent');
  const tabs = document.querySelectorAll('.adminTab');
  const logoutBtn = document.getElementById('logoutAdmin');
  const token = localStorage.getItem('adminToken') || '';

  // Enforce authentication
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  // Show loading placeholder
  function setLoading(msg){
    content.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i><p>${msg||'Loading...'}</p></div>`;
  }

  // Simple logger/notification (can be replaced with UI toasts)
  function notify(msg, type){
    console[type==='error'?'error':'log'](msg);
  }

  // Fetch helper with auth header and cache-busting
  function api(path, opts){
    const options = Object.assign({}, opts || {});
    // Merge headers correctly without dropping Authorization on methods that set Content-Type
    const mergedHeaders = Object.assign({ 'Authorization': `Bearer ${token}` }, options.headers || {});
    options.headers = mergedHeaders;
    const sep = path.includes('?') ? '&' : '?';
    return fetch(path + sep + `_t=${Date.now()}`, options);
  }

  // Tab activation helper
  function activate(tab){
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  }

  // Date formatting utilities that adapt to user's language preference
  function getUserLanguage() {
    return localStorage.getItem('i18nextLng') || 'es';
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const userLang = getUserLanguage();
      return date.toLocaleDateString(userLang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Madrid'
      });
    } catch (e) {
      return isoString;
    }
  }

  function formatTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const userLang = getUserLanguage();
      return date.toLocaleTimeString(userLang, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Madrid'
      });
    } catch (e) {
      return isoString;
    }
  }

  function extractDateFromISO(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString); // uses the +01:00/+02:00 in the string
  
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
  
      // en-CA gives YYYY-MM-DD, but use formatToParts so we’re explicit
      const parts = formatter.formatToParts(date);
      const year  = parts.find(p => p.type === 'year').value;
      const month = parts.find(p => p.type === 'month').value;
      const day   = parts.find(p => p.type === 'day').value;
  
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  }
  

  function extractTimeFromISO(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
  
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
  
      const parts = formatter.formatToParts(date);
      const hour   = parts.find(p => p.type === 'hour').value;
      const minute = parts.find(p => p.type === 'minute').value;
  
      return `${hour}:${minute}`;
    } catch (e) {
      return '';
    }
  }

  // Sub-event icon utilities
  function getSubEventIcon(iconType) {
    const icons = {
      ceremony: '/assets/icons/ceremony.svg',
      cocktails: '/assets/icons/cocktails.svg',
      reception: '/assets/icons/reception.svg',
      dancing: '/assets/icons/dancing.svg'
    };
    return icons[iconType] || icons.ceremony;
  }

  // Location selection component
  function createLocationSelector(id, initialValue = '', initialLatitude = '', initialLongitude = '') {
    const container = document.createElement('div');
    container.className = 'location-selector';
    container.innerHTML = `
      <div style="margin-bottom: 10px;">
        <label style="display:block;margin-bottom:5px;font-weight:600;color:#333;">Address</label>
        <input type="text" id="${id}_address" value="${initialValue}" placeholder="e.g. Urbanización las Chapas, s/n, 29604 Marbella, Málaga" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <div style="flex:1;">
          <label style="display:block;margin-bottom:5px;font-weight:600;color:#333;">Latitude</label>
          <input type="number" id="${id}_lat" step="any" placeholder="36.5108" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
        </div>
        <div style="flex:1;">
          <label style="display:block;margin-bottom:5px;font-weight:600;color:#333;">Longitude</label>
          <input type="number" id="${id}_lng" step="any" placeholder="-4.8890" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
        </div>
      </div>
      <div id="${id}_map" style="width:100%;height:200px;border:1px solid #ddd;border-radius:8px;margin-bottom:10px;background:#f8f9fa;display:flex;align-items:center;justify-content:center;color:#666;">
        <div style="text-align:center;">
          <i class="fas fa-map-marked-alt" style="font-size:2em;margin-bottom:10px;"></i>
          <div>Map preview will appear here</div>
          <small>Enter coordinates to see map</small>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button type="button" id="${id}_use_map" class="admin-action" style="background:#17a2b8;">
          <i class="fas fa-map"></i> Use Map
        </button>
        <button type="button" id="${id}_search" class="admin-action" style="background:#28a745;">
          <i class="fas fa-search"></i> Search Address
        </button>
      </div>
    `;
    
    const latInput = container.querySelector(`#${id}_lat`);
    const lngInput = container.querySelector(`#${id}_lng`);
    const addressInput = container.querySelector(`#${id}_address`);
    const mapDiv = container.querySelector(`#${id}_map`);
    
    // Set initial values - prioritize separate lat/lng if provided, otherwise parse from initialValue
    if (initialLatitude && initialLongitude) {
      // Use separate latitude and longitude values
      latInput.value = initialLatitude;
      lngInput.value = initialLongitude;
      updateMapPreview(mapDiv, parseFloat(initialLatitude), parseFloat(initialLongitude));
    } else if (initialValue && initialValue.includes(',')) {
      // Parse coordinates from initialValue (legacy format)
      const coords = initialValue.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coords) {
        latInput.value = coords[1];
        lngInput.value = coords[2];
        updateMapPreview(mapDiv, parseFloat(coords[1]), parseFloat(coords[2]));
      }
    } else {
      // No coordinates provided, just set the address
      addressInput.value = initialValue;
    }
    
    // Update map preview when coordinates change
    latInput.addEventListener('change', updateMapPreview);
    lngInput.addEventListener('change', updateMapPreview);
    
    // Use map button - opens Google Maps in new tab
    container.querySelector(`#${id}_use_map`).addEventListener('click', () => {
      const lat = latInput.value;
      const lng = lngInput.value;
      const address = addressInput.value;
      
      if (lat && lng) {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
      } else if (address) {
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank');
      } else {
        alert('Please enter an address or coordinates');
      }
    });
    
    // Search address button - simple geocoding simulation
    container.querySelector(`#${id}_search`).addEventListener('click', async () => {
      const address = addressInput.value;
      if (!address) {
        alert('Please enter an address to search');
        return;
      }
      
      // Enhanced mock geocoding simulation
      const mockCoords = {
        // Spanish cities
        'marbella': { lat: 36.5108, lng: -4.8890 },
        'malaga': { lat: 36.7213, lng: -4.4214 },
        'malaga spain': { lat: 36.7213, lng: -4.4214 },
        'seville': { lat: 37.3886, lng: -5.9823 },
        'sevilla': { lat: 37.3886, lng: -5.9823 },
        'madrid': { lat: 40.4168, lng: -3.7038 },
        'barcelona': { lat: 41.3851, lng: 2.1734 },
        'valencia': { lat: 39.4699, lng: -0.3763 },
        'bilbao': { lat: 43.2627, lng: -2.9253 },
        'palma': { lat: 39.5696, lng: 2.6502 },
        'las palmas': { lat: 28.1248, lng: -15.4300 },
        // International cities
        'paris': { lat: 48.8566, lng: 2.3522 },
        'london': { lat: 51.5074, lng: -0.1278 },
        'rome': { lat: 41.9028, lng: 12.4964 },
        'lisbon': { lat: 38.7223, lng: -9.1393 },
        // Common address patterns
        'beach': { lat: 36.5108, lng: -4.8890 },
        'restaurant': { lat: 36.5108, lng: -4.8890 },
        'hotel': { lat: 36.5108, lng: -4.8890 },
        'church': { lat: 36.5108, lng: -4.8890 },
        'ceremony': { lat: 36.5108, lng: -4.8890 },
        'reception': { lat: 36.5108, lng: -4.8890 },
        // Generic Spain
        'spain': { lat: 40.4637, lng: -3.7492 },
        'españa': { lat: 40.4637, lng: -3.7492 },
        'andalucia': { lat: 37.3886, lng: -5.9823 },
        'andalusia': { lat: 37.3886, lng: -5.9823 },
        'costa del sol': { lat: 36.5108, lng: -4.8890 }
      };
      
      const normalizedAddress = address.toLowerCase();
      let found = false;
      let matchedKey = '';
      
      // Try exact matches first
      for (const [key, coords] of Object.entries(mockCoords)) {
        if (normalizedAddress === key) {
          latInput.value = coords.lat;
          lngInput.value = coords.lng;
          updateMapPreview(mapDiv, coords.lat, coords.lng);
          found = true;
          matchedKey = key;
          break;
        }
      }
      
      // Try partial matches if no exact match found
      if (!found) {
        for (const [key, coords] of Object.entries(mockCoords)) {
          if (normalizedAddress.includes(key)) {
            latInput.value = coords.lat;
            lngInput.value = coords.lng;
            updateMapPreview(mapDiv, coords.lat, coords.lng);
            found = true;
            matchedKey = key;
            break;
          }
        }
      }
      
      if (found) {
        alert(`Address matched with "${matchedKey}". Coordinates filled automatically.`);
      } else {
        alert('Address not found in our database. Please enter coordinates manually or try a more specific address (e.g., include city name like "Marbella", "Madrid", etc.).');
      }
    });
    
    // Update map preview function
    function updateMapPreview(div, lat, lng) {
      if (lat && lng) {
        // Use Leaflet.js to create an interactive map - most reliable approach
        const osmUrl = `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lng.toFixed(6)}#map=16/${lat.toFixed(6)}/${lng.toFixed(6)}`;
        
        div.innerHTML = `
          <div style="position:relative;width:100%;height:100%;border-radius:8px;overflow:hidden;">
            <div id="map-${lat.toFixed(6)}-${lng.toFixed(6)}" style="width:100%;height:100%;border-radius:8px;"></div>
            <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:5px 10px;border-radius:4px;font-size:12px;z-index:1000;">
              ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </div>
            <a href="${osmUrl}" target="_blank" style="position:absolute;bottom:10px;right:10px;background:rgba(255,255,255,0.9);padding:3px 8px;border-radius:4px;font-size:11px;text-decoration:none;color:#333;z-index:1000;">
              View Larger Map
            </a>
          </div>
        `;
        
        // Initialize the map after DOM update
        setTimeout(() => {
          try {
            // Check if Leaflet is available
            if (typeof L !== 'undefined') {
              const mapId = `map-${lat.toFixed(6)}-${lng.toFixed(6)}`;
              const mapDiv = document.getElementById(mapId);
              
              if (mapDiv) {
                const map = L.map(mapId).setView([parseFloat(lat), parseFloat(lng)], 16);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
              }
            } else {
              // Fallback: Show a simple coordinate display with map link
              const mapId = `map-${lat.toFixed(6)}-${lng.toFixed(6)}`;
              const mapDiv = document.getElementById(mapId);
              
              if (mapDiv) {
                mapDiv.innerHTML = `
                  <div style="width:100%;height:100%;background:linear-gradient(45deg,#f0f0f0,#e0e0e0);display:flex;align-items:center;justify-content:center;border-radius:8px;">
                    <div style="text-align:center;color:#666;">
                      <i class="fas fa-map-marker-alt" style="font-size:2em;color:#e74c3c;margin-bottom:10px;"></i>
                      <div>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                      <small>Interactive map requires Leaflet.js</small>
                    </div>
                  </div>
                `;
              }
            }
          } catch (error) {
            console.error('Map initialization error:', error);
            // Graceful fallback
            const mapId = `map-${lat.toFixed(6)}-${lng.toFixed(6)}`;
            const mapDiv = document.getElementById(mapId);
            
            if (mapDiv) {
              mapDiv.innerHTML = `
                <div style="width:100%;height:100%;background:linear-gradient(45deg,#f0f0f0,#e0e0e0);display:flex;align-items:center;justify-content:center;border-radius:8px;">
                  <div style="text-align:center;color:#666;">
                    <i class="fas fa-map-marker-alt" style="font-size:2em;color:#e74c3c;margin-bottom:10px;"></i>
                    <div>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                    <small>Open in Maps to view</small>
                  </div>
                </div>
              `;
            }
          }
        }, 100);
      }
    }
    
    // Return functions to get/set values
    return {
      container,
      getValue: () => {
        return addressInput.value || '';
      },
      setValue: (value, latitude = '', longitude = '') => {
        // Set address
        addressInput.value = value || '';
        
        // Set coordinates if provided
        if (latitude !== '') {
          latInput.value = latitude;
        }
        if (longitude !== '') {
          lngInput.value = longitude;
        }
        
        // Update map preview if we have coordinates
        if (latInput.value && lngInput.value) {
          updateMapPreview(mapDiv, parseFloat(latInput.value), parseFloat(lngInput.value));
        }
      }
    };
  }

  function updateMapPreview(div, lat, lng) {
    if (lat && lng) {
      div.innerHTML = `
        <div style="position:relative;width:100%;height:100%;border-radius:8px;overflow:hidden;">
          <div style="width:100%;height:100%;background:linear-gradient(45deg,#f0f0f0,#e0e0e0);display:flex;align-items:center;justify-content:center;border-radius:8px;">
            <div style="text-align:center;color:#666;">
              <i class="fas fa-map-marker-alt" style="font-size:2em;color:#e74c3c;margin-bottom:10px;"></i>
              <div>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
              <small>Open in Google Maps to view</small>
            </div>
          </div>
          <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:5px 10px;border-radius:4px;font-size:12px;">
            ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `;
    }
  }

  // CSV Parser for guest bulk upload
  function parseCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return [];
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    const guests = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      // Skip empty rows (all values empty)
      if (values.every(v => !v)) continue;
      
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      
      // Map CSV columns to guest object
      const guest = {
        name: row['Name'] || row['name'] || '',
        email: row['email'] || row['Email'] || '',
        partyMembers: []
      };
      
      // Parse party size information
      const inParty = parseInt(row['In Party'] || row['in_party'] || '0');
      const adultsInParty = parseInt(row['Adults in Party'] || row['adults_in_party'] || '0');
      const childrenInParty = parseInt(row['Children In Party'] || row['children_in_party'] || '0');
      
      // Create party members (excluding the primary guest)
      if (inParty > 1) {
        const totalMembers = inParty - 1; // Subtract primary guest
        
        // Add adults (excluding primary guest who is always adult)
        const additionalAdults = Math.max(0, adultsInParty - 1);
        for (let j = 0; j < additionalAdults; j++) {
          guest.partyMembers.push({
            name: `${guest.name} - Guest ${j + 1}`,
            adult: true
          });
        }
        
        // Add children
        for (let j = 0; j < childrenInParty; j++) {
          guest.partyMembers.push({
            name: `${guest.name} - Child ${j + 1}`,
            adult: false
          });
        }
      }
      
      guests.push(guest);
    }
    
    return guests;
  }

  // Custom image dropdown component
  function createImageDropdown(id, name, options, selectedValue) {
    // Ensure styles are loaded
    addImageDropdownStyles();
    
    // Debug logging
    console.log('createImageDropdown called with:', {
      id,
      name, 
      optionsCount: options.length,
      options: options.slice(0, 3), // Log first 3 options for debugging
      selectedValue
    });
    
    const selectedOption = options.find(opt => String(opt.value) === String(selectedValue)) || options[0];
    
    const container = document.createElement('div');
    container.className = 'image-dropdown-container';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `${id}_btn`;
    button.className = 'image-dropdown-button';
    button.setAttribute('aria-expanded', 'false');
    
    button.innerHTML = `
      <img src="${selectedOption.imageUrl}" alt="Selected image">
      <span>${selectedOption.label}</span>
      <i class="fas fa-chevron-down"></i>
    `;
    
    const dropdown = document.createElement('div');
    dropdown.id = `${id}_dropdown`;
    dropdown.className = 'image-dropdown-menu';
    
    options.forEach((option, index) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'image-dropdown-option';
      if (String(option.value) === String(selectedValue)) {
        optionDiv.classList.add('selected');
      }
      
      optionDiv.innerHTML = `
        <img src="${option.imageUrl}" alt="${option.label}">
        <span>${option.label}</span>
      `;
      
      // Debug logging for first few options
      if (index < 3) {
        console.log(`Creating dropdown option ${index + 1}:`, {
          value: option.value,
          label: option.label,
          imageUrl: option.imageUrl,
          isSelected: String(option.value) === String(selectedValue)
        });
      }
      
      optionDiv.addEventListener('click', () => {
        // Update button content
        button.innerHTML = `
          <img src="${option.imageUrl}" alt="Selected image">
          <span>${option.label}</span>
          <i class="fas fa-chevron-down"></i>
        `;
        
        // Update selected state
        dropdown.querySelectorAll('.image-dropdown-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        optionDiv.classList.add('selected');
        
        // Update hidden input value
        const hiddenInput = document.getElementById(id);
        hiddenInput.value = option.value;
        
        // Close dropdown
        dropdown.style.display = 'none';
        button.setAttribute('aria-expanded', 'false');
      });
      
      dropdown.appendChild(optionDiv);
    });
    
    // Debug logging
    console.log(`createImageDropdown - Created ${options.length} total options for dropdown`);
    
    // Toggle dropdown
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
      button.setAttribute('aria-expanded', !isVisible);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
        button.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Create hidden input for form submission
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = id;
    hiddenInput.name = name;
    hiddenInput.value = selectedOption.value;
    
    container.appendChild(button);
    container.appendChild(dropdown);
    container.appendChild(hiddenInput);
    
    return container;
  }

  // Reusable modal form
  function openFormModal({ title = 'Form', submitText = 'Save', fields = [], initialValues = {}, onSubmit, ...additionalOptions }){
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;`;
    const modal = document.createElement('div');
    modal.style.cssText = `background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.25);width:min(520px,90vw);max-height:90vh;overflow:auto;`;
    modal.innerHTML = `
      <div style="padding:22px 24px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;color:#333;">${title}</h3>
        <button id="mfClose" class="admin-action" style="background:#6c757d;color:#fff;border:none;padding:8px 12px;border-radius:8px;">Close</button>
      </div>
      <form id="mfForm" style="padding:18px 24px;">
        <div id="mfError" style="display:none;margin-bottom:10px;color:#dc3545;font-weight:600;"></div>
        
        ${additionalOptions.showCurrentImage ? `
          <div style="margin-bottom:14px;">
            <label style="display:block;margin:6px 0 6px 0;font-weight:600;color:#333;">Current Image</label>
            <div style="border:1px solid #ddd;border-radius:8px;padding:10px;background:#f8f9fa;">
              <img src="${additionalOptions.currentImageUrl}" alt="Current event image" style="max-width:200px;max-height:120px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" onload="this.style.display='block';this.nextElementSibling.style.display='none';">
              <div style="color:#999; display: none;">Image not available</div>
              <small style="color:#666;margin-top:5px;display:block;">Upload a new image below to replace this one</small>
            </div>
          </div>
        ` : ''}
        
        ${fields.map(f => {
          const id = `f_${f.name}`;
          const label = `<label for="${id}" style="display:block;margin:6px 0 6px 0;font-weight:600;color:#333;">${f.label}${f.required?' *':''}</label>`;
          const val = initialValues[f.name] ?? f.default ?? '';
          const baseStyle = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;';
          let inputHtml = '';
          
          if (f.type === 'textarea') {
            inputHtml = `<textarea id="${id}" name="${f.name}" rows="${f.rows||3}" style="${baseStyle}">${val!==undefined?String(val):''}</textarea>`;
          } else if (f.type === 'location') {
            // Location selector with map integration - pass separate coordinates if available
            const locationAddress = val || '';
            const locationLatitude = initialValues[`${f.name}Latitude`] || '';
            const locationLongitude = initialValues[`${f.name}Longitude`] || '';
            
            const locationSelector = createLocationSelector(id, locationAddress, locationLatitude, locationLongitude);
            inputHtml = '';
            setTimeout(() => {
              const placeholder = document.getElementById(`location-placeholder-${f.name}`);
              if (placeholder) {
                placeholder.parentNode.replaceChild(locationSelector.container, placeholder);
                // Store reference to get value function
                locationSelector._getValue = locationSelector.getValue;
                locationSelector.getValue = () => locationSelector._getValue();
              }
            }, 0);
            inputHtml = `<div id="location-placeholder-${f.name}" style="width:100%;"></div>`;
          } else if (f.type === 'select') {
            // Check if this is an image dropdown
            if (f.showImages && f.options && f.options.length > 0 && f.options[0].imageUrl) {
              const imageOptions = f.options.map(opt => ({
                value: opt.value,
                label: opt.label,
                imageUrl: opt.imageUrl
              }));
              
              // Debug logging
              console.log('openFormModal - image field:', {
                fieldName: f.name,
                originalOptionsCount: f.options.length,
                mappedOptionsCount: imageOptions.length,
                mappedOptions: imageOptions.slice(0, 3),
                selectedValue: val
              });
              
              // Create a placeholder div that will be replaced after the form is created
              inputHtml = `<div id="image-dropdown-placeholder-${f.name}" style="width:100%;"></div>`;
              
              // Store the image dropdown creation for after the form is rendered
              setTimeout(() => {
                const placeholder = document.getElementById(`image-dropdown-placeholder-${f.name}`);
                if (placeholder) {
                  const container = createImageDropdown(id, f.name, imageOptions, val);
                  placeholder.parentNode.replaceChild(container, placeholder);
                }
              }, 0);
            } else {
              const opts = (f.options||[]).map(opt => {
                const v = typeof opt === 'string' ? opt : opt.value;
                const t = typeof opt === 'string' ? opt : opt.label;
                const sel = String(val) === String(v) ? 'selected' : '';
                return `<option value="${v}" ${sel}>${t}</option>`;
              }).join('');
              inputHtml = `<select id="${id}" name="${f.name}" style="${baseStyle}">${opts}</select>`;
            }
          } else {
            const type = f.type || 'text';
            inputHtml = `<input id="${id}" name="${f.name}" type="${type}" value="${val!==undefined?String(val):''}" style="${baseStyle}">`;
          }
          
          const help = f.help ? `<small style="display:block;color:#6c757d;margin-top:4px;">${f.help}</small>` : '';
          return `<div style="margin-bottom:14px;" data-field="${f.name}">${label}${inputHtml}${help}</div>`;
        }).join('')}
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
          <button type="button" id="mfCancel" class="admin-action" style="background:#6c757d;color:#fff;border:none;padding:10px 16px;border-radius:8px;">Cancel</button>
          <button type="submit" class="admin-action" style="background:#28a745;color:#fff;border:none;padding:10px 16px;border-radius:8px;">${submitText}</button>
        </div>
      </form>`;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close(){ document.body.removeChild(overlay); }
    modal.querySelector('#mfClose').addEventListener('click', close);
    modal.querySelector('#mfCancel').addEventListener('click', close);
    modal.querySelector('#mfForm').addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = {};
      let valid = true;
      fields.forEach(f => {
        let v = '';
        if (f.type === 'location') {
          // Handle location field which has a custom component
          const addressEl = modal.querySelector(`#f_${f.name}_address`);
          const latEl = modal.querySelector(`#f_${f.name}_lat`);
          const lngEl = modal.querySelector(`#f_${f.name}_lng`);
          
          const address = addressEl ? addressEl.value : '';
          const lat = latEl ? latEl.value : '';
          const lng = lngEl ? lngEl.value : '';
          
          // Store all location components in the data object
          data[f.name] = address;
          data[`${f.name}Address`] = address;
          data[`${f.name}Latitude`] = lat;
          data[`${f.name}Longitude`] = lng;
          
          // Location is valid if address is filled OR both lat and lng are filled
          v = (address.trim() !== '') || (lat.trim() !== '' && lng.trim() !== '');
        } else {
          const el = modal.querySelector(`#f_${f.name}`);
          v = el ? el.value : '';
        }
        
        if (f.type === 'number') v = v === '' ? '' : Number(v);
        if (f.required && (v === '' || v === null || v === undefined || (f.type==='number' && Number.isNaN(v)))) valid = false;
        if (f.type === 'select' && f.required && (v === '' || v === null || v === undefined)) valid = false;
        if (f.type === 'location' && f.required && (v === '' || v === null || v === undefined)) valid = false;
        
        // For non-location fields, store the value in data
        if (f.type !== 'location') {
          data[f.name] = v;
        }
      });
      if (!valid){
        const err = modal.querySelector('#mfError');
        // Find which required field is missing
        const missingFields = fields.filter(f => {
          if (!f.required) return false;
          
          if (f.type === 'location') {
            const addressEl = document.querySelector(`#f_${f.name}_address`);
            const latEl = document.querySelector(`#f_${f.name}_lat`);
            const lngEl = document.querySelector(`#f_${f.name}_lng`);
            
            const address = addressEl?.value?.trim() || '';
            const lat = latEl?.value?.trim() || '';
            const lng = lngEl?.value?.trim() || '';
            
            // Location is missing if no address AND (no lat OR no lng)
            return (address === '') && (lat === '' || lng === '');
          } else {
            const fieldValue = data[f.name];
            return !fieldValue || fieldValue.toString().trim() === '';
          }
        });
        
        if (missingFields.length > 0) {
          const fieldNames = missingFields.map(f => {
            if (f.type === 'location') return 'Location (address or coordinates)';
            return f.label;
          }).join(', ');
          err.textContent = `Please fill all required fields: ${fieldNames}`;
        } else {
          err.textContent = 'Please fill all required fields correctly.';
        }
        err.style.display = 'block';
        return;
      }
      Promise.resolve(onSubmit && onSubmit(data, close, modal)).catch(err => {
        const ebox = modal.querySelector('#mfError');
        ebox.textContent = err && err.message ? err.message : 'Failed to submit form';
        ebox.style.display = 'block';
      });
    });
    return { close };
  }

  // Add styles for custom image dropdown
  function addImageDropdownStyles(){
    if (document.getElementById('image-dropdown-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'image-dropdown-styles';
    style.textContent = `
      .image-dropdown-container {
        position: relative;
        width: 100%;
      }
      
      .image-dropdown-button {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #fff;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        text-align: left;
        transition: all 0.3s ease;
      }
      
      .image-dropdown-button:hover {
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }
      
      .image-dropdown-button img {
        width: 40px;
        height: 25px;
        object-fit: cover;
        border-radius: 4px;
        flex-shrink: 0;
      }
      
      .image-dropdown-button span {
        flex: 1;
        font-weight: 500;
      }
      
      .image-dropdown-button i {
        color: #666;
        transition: transform 0.3s ease;
      }
      
      .image-dropdown-button[aria-expanded="true"] i {
        transform: rotate(180deg);
      }
      
      .image-dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: none;
        max-height: 300px;
        overflow-y: auto;
        margin-top: 2px;
      }
      
      .image-dropdown-option {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s ease;
      }
      
      .image-dropdown-option:last-child {
        border-bottom: none;
      }
      
      .image-dropdown-option:hover {
        background-color: #f8f9fa;
      }
      
      .image-dropdown-option img {
        width: 40px;
        height: 25px;
        object-fit: cover;
        border-radius: 4px;
        flex-shrink: 0;
      }
      
      .image-dropdown-option span {
        flex: 1;
        font-weight: 500;
      }
      
      .image-dropdown-option.selected {
        background-color: #e7f3ff;
        color: #0056b3;
      }
    `;
    document.head.appendChild(style);
  }

  // Generic table renderer
  function renderTable(headers, rowsHtml, extraActionsHtml){
    return `
      <div class="admin-content">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;">${headers.title}</h3>
          <div>${extraActionsHtml||''}</div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr>${headers.columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ========== Guests ==========
  async function showGuests(){
    activate('guests');
    setLoading('Loading guests...');
    try {
      // Use pagination for large guest lists
      let url = '/api/admin/guests';
      const res = await api(url);
      if (!res.ok) throw new Error('Failed to load guests');
      const data = await res.json();
      
      // Handle both paginated and non-paginated responses
      const guests = data.items || data || [];
      
      // Calculate total guest count (sum of all party sizes)
      const totalGuests = guests.reduce((sum, g) => sum + (g.partySize || 1), 0);
      
      const rows = guests.map(g => `
        <tr>
          <td>${g.name || ''}</td>
          <td>${g.email || ''}</td>
          <td>${g.partySize || 1}</td>
          <td>
            <button class="admin-action" data-action="manage-party" data-id="${g.id || g._id}" title="Manage Party">
              <i class="fas fa-users"></i>
            </button>
            <button class="admin-action" data-action="edit" data-id="${g.id || g._id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="admin-action danger" data-action="del" data-id="${g.id || g._id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`).join('');
      
      content.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div class="guest-summary" style="background:#f8f9fa;padding:15px;border-radius:8px;margin-top:15px;border-left:4px solid #28a745;">
              <h4 style="margin:0 0 8px 0;color:#28a745;"><i class="fas fa-users"></i> Total Guests: ${totalGuests}</h4>
              <p style="margin:0;color:#666;font-size:0.9em;">Across ${guests.length} part${guests.length !== 1 ? 'ies' : 'y'}</p>
            </div>
            <div>
              <button id="addGuest" class="admin-action"><i class="fas fa-user-plus"></i> Add Guest</button>
              <button id="bulkUploadGuests" class="admin-action" style="background:#17a2b8;margin-left:8px;"><i class="fas fa-file-upload"></i> Bulk Upload CSV</button>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr>${['Name','Email','Party Size','Actions'].map(c=>`<th>${c}</th>`).join('')}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
      
      const tbody = content.querySelector('tbody');
      tbody.addEventListener('click', async (e)=>{
        const btn = e.target.closest('button'); if(!btn) return;
        const id = btn.dataset.id; const action = btn.dataset.action;
        const current = guests.find(x => String(x.id || x._id) === String(id)) || {};
        
        if (action==='del'){
          if (!confirm('Delete this guest and their entire party?')) return;
          const r = await api(`/api/admin/guests/${id}`, { method:'DELETE' });
          if (r.ok) showGuests(); else notify('Error deleting guest', 'error');
        } else if (action==='edit'){
          openFormModal({
            title: 'Edit guest',
            submitText: 'Save',
            fields: [
              { name:'name', label:'Name', required:true },
              { name:'email', label:'Email', type:'email', required:true }
            ],
            initialValues: {
              name: current.name || '',
              email: current.email || ''
            },
            onSubmit: async (values, close) => {
              const r = await api(`/api/admin/guests/${id}`, { 
                method:'PUT', 
                headers:{'Content-Type':'application/json'}, 
                body: JSON.stringify(values)
              });
              if (!r.ok) throw new Error('Failed to update guest');
              close();
              showGuests();
            }
          });
        } else if (action==='manage-party'){
          showPartyManager(id, current.name || current.nombre || '');
        }
      });
      
      content.querySelector('#addGuest').addEventListener('click', async ()=>{
        openFormModal({
          title: 'Add guest',
          submitText: 'Add',
          fields: [
            { name:'name', label:'Name', required:true },
            { name:'email', label:'Email', type:'email', required:true }
          ],
          onSubmit: async (values, close) => {
            const r = await api('/api/admin/guests', { 
              method:'POST', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(values)
            });
            if (!r.ok) throw new Error('Failed to create guest');
            close();
            showGuests();
          }
        });
      });

      // Bulk upload CSV handler
      content.querySelector('#bulkUploadGuests').addEventListener('click', async ()=>{
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          try {
            const text = await file.text();
            const guests = parseCSV(text);
            
            if (guests.length === 0) {
              notify('No valid guests found in CSV file', 'error');
              return;
            }
            
            // Show confirmation dialog with preview
            const preview = guests.slice(0, 5).map(g => 
              `${g.name} (${g.email || 'no email'})`
            ).join('\n');
            const more = guests.length > 5 ? `\n... and ${guests.length - 5} more` : '';
            
            if (!confirm(`Upload ${guests.length} guests?\n\nPreview:\n${preview}${more}`)) {
              return;
            }
            
            setLoading('Uploading guests...');
            
            const r = await api('/api/admin/guests/bulk-upload', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ guests })
            });
            
            if (!r.ok) throw new Error('Failed to upload guests');
            
            const results = await r.json();
            
            // Show results
            let message = `Upload complete!\n\n`;
            message += `✓ Successfully created: ${results.success.length}\n`;
            message += `⊘ Skipped (duplicates/empty): ${results.skipped.length}\n`;
            message += `✗ Errors: ${results.errors.length}`;
            
            if (results.errors.length > 0) {
              message += `\n\nFirst error: ${results.errors[0].error}`;
            }
            
            alert(message);
            showGuests();
          } catch (err) {
            notify('Error uploading CSV: ' + err.message, 'error');
            console.error('CSV upload error:', err);
          }
        };
        input.click();
      });
    } catch(e){ 
      console.error('Error loading guests:', e); 
      notify('Error loading guests: ' + e.message, 'error'); 
      content.innerHTML = `
        <div class="admin-content">
          <h3>Guests</h3>
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Guests</h3>
            <p>Failed to load guests: ${e.message}</p>
            <button onclick="showGuests()" class="btn-retry">
              <i class="fas fa-redo"></i> Retry
            </button>
          </div>
        </div>`;
    }
  }

  // ========== Party Management ==========
  async function showPartyManager(guestId, guestName){
    activate('guests');
    setLoading('Loading party members...');
    
    try {
      // Load current party members
      const res = await api(`/api/admin/guests/${guestId}/party`);
      if (!res.ok) throw new Error('Failed to load party members');
      const partyMembers = await res.json();
      
      // Separate primary guest from party members
      const primaryGuest = partyMembers.find(member => member.primary) || null;
      const party = partyMembers.filter(member => !member.primary) || [];
      
      const partyRows = party.map((member, index) => `
        <tr>
          <td>${member.name || ''}</td>
          <td>${member.adult ? 'Adult' : 'Child'}</td>
          <td>
            <button class="admin-action" data-action="edit-member" data-index="${index}" data-id="${member.id || ''}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="admin-action danger" data-action="remove-member" data-index="${index}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`).join('');
      
      const partyTable = party.length > 0 ? `
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Age Group</th><th>Actions</th></tr></thead>
            <tbody>${partyRows}</tbody>
          </table>
        </div>` : `
        <div class="no-party-members">
          <i class="fas fa-users" style="font-size: 2em; color: #ccc; margin-bottom: 10px;"></i>
          <p>No party members added yet.</p>
        </div>`;
      
      content.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <div>
              <h3 style="margin:0;">Manage Party: ${guestName}</h3>
              <p style="margin:5px 0 0 0;color:#666;">Manage party members for this guest</p>
            </div>
            <button id="backToGuests" class="admin-action">
              <i class="fas fa-arrow-left"></i> Back to Guests
            </button>
          </div>
          
          <div class="party-section">
            <h4><i class="fas fa-user"></i> Primary Guest</h4>
            <div class="primary-guest-info">
              <strong>${primaryGuest ? primaryGuest.name : 'Unknown'}</strong> 
              <span class="badge badge-primary">Primary</span>
            </div>
          </div>
          
          <div class="party-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
              <h4><i class="fas fa-users"></i> Party Members</h4>
              <button id="addPartyMember" class="admin-action">
                <i class="fas fa-user-plus"></i> Add Member
              </button>
            </div>
            ${partyTable}
          </div>
        </div>`;
      
      // Back button
      document.getElementById('backToGuests').addEventListener('click', showGuests);
      
      // Add party member
      document.getElementById('addPartyMember').addEventListener('click', ()=>{
        openFormModal({
          title: 'Add Party Member',
          submitText: 'Add',
          fields: [
            { name:'name', label:'Name', required:true },
            { name:'adult', label:'Age Group', type:'select', options:[
              { value: 'true', label: 'Adult (18+)' },
              { value: 'false', label: 'Child (Under 18)' }
            ], required:true }
          ],
          onSubmit: async (values, close) => {
            const newMember = {
              name: values.name,
              adult: values.adult === 'true',
              id: null // New member, no ID yet
            };
            
            const updatedParty = [...party, newMember];
            const r = await api(`/api/admin/guests/${guestId}/party`, { 
              method:'PUT', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(updatedParty)
            });
            
            if (!r.ok) throw new Error('Failed to add party member');
            close();
            showPartyManager(guestId, guestName);
          }
        });
      });
      
      // Handle party member actions
      const tbody = content.querySelector('tbody');
      if (tbody) {
        tbody.addEventListener('click', async (e)=>{
          const btn = e.target.closest('button'); if(!btn) return;
          const action = btn.dataset.action;
          const index = parseInt(btn.dataset.index);
          
          if (action==='remove-member'){
            if (!confirm('Remove this party member?')) return;
            
            const updatedParty = party.filter((_, i) => i !== index);
            const r = await api(`/api/admin/guests/${guestId}/party`, { 
              method:'PUT', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(updatedParty)
            });
            
            if (!r.ok) throw new Error('Failed to remove party member');
            showPartyManager(guestId, guestName);
          } else if (action==='edit-member'){
            const member = party[index];
            openFormModal({
              title: 'Edit Party Member',
              submitText: 'Save',
              fields: [
                { name:'name', label:'Name', required:true },
                { name:'adult', label:'Age Group', type:'select', options:[
                  { value: 'true', label: 'Adult (18+)' },
                  { value: 'false', label: 'Child (Under 18)' }
                ], required:true }
              ],
              initialValues: {
                name: member.name || '',
                adult: member.adult ? 'true' : 'false'
              },
              onSubmit: async (values, close) => {
                const updatedMember = {
                  ...member,
                  name: values.name,
                  adult: values.adult === 'true'
                };
                
                const updatedParty = [...party];
                updatedParty[index] = updatedMember;
                
                const r = await api(`/api/admin/guests/${guestId}/party`, { 
                  method:'PUT', 
                  headers:{'Content-Type':'application/json'}, 
                  body: JSON.stringify(updatedParty)
                });
                
                if (!r.ok) throw new Error('Failed to update party member');
                close();
                showPartyManager(guestId, guestName);
              }
            });
          }
        });
      }
      
    } catch(e){ 
      console.error('Error loading party:', e); 
      notify('Error loading party members: ' + e.message, 'error'); 
      content.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3>Manage Party: ${guestName}</h3>
            <button id="backToGuests" class="admin-action">
              <i class="fas fa-arrow-left"></i> Back to Guests
            </button>
          </div>
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Party</h3>
            <p>Failed to load party members: ${e.message}</p>
            <button onclick="showPartyManager('${guestId}', '${guestName}')" class="btn-retry">
              <i class="fas fa-redo"></i> Retry
            </button>
          </div>
        </div>`;
      document.getElementById('backToGuests').addEventListener('click', showGuests);
    }
  }

  // ========== Gift list ==========
  async function showGifts(){
    activate('gifts');
    setLoading('Loading gift list...');
    
    // Load gifts and available images
    const [giftsRes, imagesRes] = await Promise.all([
      api('/api/admin/gifts'),
      api('/api/admin/gift-images')
    ]);
    
    const gifts = giftsRes.ok ? await giftsRes.json() : [];
    const availableImages = imagesRes.ok ? await imagesRes.json() : [];
    
    // Debug logging
    console.log('showGifts - availableImages:', {
      count: availableImages.length,
      images: availableImages.slice(0, 5) // First 5 images for debugging
    });
    
    // Add image URLs to the available images for the dropdown
    const imageOptions = availableImages.map(img => ({
      value: img.id,
      label: `Gift Card ${img.id}`,
      imageUrl: img.url
    }));
    
    console.log('showGifts - imageOptions:', {
      count: imageOptions.length,
      options: imageOptions.slice(0, 3) // First 3 options for debugging
    });
    
    const rows = (gifts||[]).map(it => `
      <tr>
        <td>${it.name || it.title || ''}</td>
        <td>${it.description || ''}</td>
        <td>
          <img src="${it.imageUrl}" alt="Gift card" style="width: 40px; height: 25px; object-fit: cover; border-radius: 4px;">
        </td>
        <td>${it.available}</td>
        <td>€${it.amount}</td>
        <td>${it.purchased}</td>
        <td>
          <button class="admin-action" data-action="edit" data-id="${it.id}"><i class="fas fa-edit"></i></button>
          <button class="admin-action danger" data-action="del" data-id="${it.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
      
    content.innerHTML = renderTable({
      title:'Gift List', 
      columns:['Name','Description','Image','Available','Price','Purchased','Actions']
    }, rows, `<button id="addGift" class="admin-action"><i class="fas fa-plus"></i> Add</button>`);
    
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; 
      const id = btn.dataset.id; 
      const action = btn.dataset.action;
      const current = (gifts||[]).find(x => String(x.id) === String(id)) || {};
      
      if (action === 'del'){
        if (!confirm('Delete this gift?')) return;
        const r = await api(`/api/admin/gifts/${id}`, { method:'DELETE' }); 
        if (r.ok) showGifts(); else notify('Error deleting gift','error');
      } else if (action === 'edit'){
        openFormModal({
          title: 'Edit gift', 
          submitText: 'Save',
          fields: [
            { name:'name', label:'Name', required:true },
            { name:'description', label:'Description', type:'textarea', required:true },
            { name:'image', label:'Image', type:'select', required:true, 
              options: imageOptions,
              showImages: true,
              help: 'Select a gift card image' 
            },
            { name:'available', label:'Number Available', type:'number', min:'0', required:true },
            { name:'amount', label:'Price', type:'select', required:true,
              options: [
                { value: '25', label: '€25' },
                { value: '50', label: '€50' },
                { value: '100', label: '€100' },
                { value: '200', label: '€200' },
                { value: '500', label: '€500' }
              ]
            }
          ],
          initialValues: {
            name: current.name || current.title || '',
            description: current.description || '',
            image: current.image,
            available: current.available,
            amount: String(current.amount)
          },
          onSubmit: async (values, close) => {
            const r = await api(`/api/admin/gifts/${id}`, { 
              method:'PUT', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(values)
            });
            if (!r.ok) {
              const errorData = await r.json();
              throw new Error(errorData.error || 'Failed to update gift');
            }
            close();
            showGifts();
          }
        });
      }
    });
    
    content.querySelector('#addGift').addEventListener('click', async ()=>{
      openFormModal({
        title: 'Add gift', 
        submitText: 'Add',
        fields: [
          { name:'name', label:'Name', required:true },
          { name:'description', label:'Description', type:'textarea', required:true },
          { name:'image', label:'Image', type:'select', required:true,
            options: imageOptions,
            showImages: true,
            help: 'Select a gift card image' 
          },
          { name:'available', label:'Number Available', type:'number', min:'0', required:true },
          { name:'amount', label:'Price', type:'select', required:true,
            options: [
              { value: '25', label: '€25' },
              { value: '50', label: '€50' },
              { value: '100', label: '€100' },
              { value: '200', label: '€200' },
              { value: '500', label: '€500' }
            ]
          }
        ],
        onSubmit: async (values, close) => {
          const r = await api('/api/admin/gifts', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify(values)
          });
          if (!r.ok) {
            const errorData = await r.json();
            throw new Error(errorData.error || 'Failed to create gift');
          }
          close();
          showGifts();
        }
      });
    });
  }

  // ========== Messages ==========
  async function showMessages(){
    activate('messages');
    setLoading('Loading messages...');
    const res = await api('/api/admin/messages');
    const data = res.ok ? await res.json() : [];
    const rows = (data||[]).map(m => `
      <tr>
        <td>${m.name || ''}</td>
        <td>${m.email||''}</td>
        <td>${(m.content || '').slice(0,120)}</td>
        <td>${new Date(m.createdAt).toLocaleString()}</td>
        <td><button class="admin-action danger" data-id="${m._id}"><i class="fas fa-trash"></i></button></td>
      </tr>`).join('');
    content.innerHTML = renderTable({title:'Messages', columns:['Name','Email','Content','Date','Actions']}, rows);
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      if (!confirm('Delete this message?')) return;
      const r = await api(`/api/admin/messages/${btn.dataset.id}`, { method:'DELETE' });
      if (r.ok) showMessages(); else notify('Error','error');
    });
  }

  // ========== Event schedule ==========
  async function showEvent(){
    activate('event');
    setLoading('Loading event schedule...');
    const res = await api('/api/admin/events');
    const data = res.ok ? await res.json() : [];
    
    // Helper function to get image URL
    function getImageUrl(event) {
      if (!event.image) return null;
      
      // Handle different image formats
      if (typeof event.image === 'string') {
        // Legacy URL-based image or base64 data
        if (event.image.startsWith('data:')) {
          return event.image; // Already base64 encoded
        } else if (event.image.startsWith('/')) {
          return event.image; // Legacy file path
        } else {
          // Assume it's an ObjectId, use the image endpoint
          return `/api/admin/events/${event.id}/image/thumbnail`;
        }
      } else if (event.image && event.image.data) {
        // Database-stored image with base64 data
        return event.image;
      } else if (event.image && event.image._id) {
        // Image reference with populated data
        if (event.image.data) {
          const base64Data = event.image.data.toString('base64');
          return `data:${event.image.contentType};base64,${base64Data}`;
        } else {
          // No populated data, use endpoint
          return `/api/admin/events/${event.id}/image/thumbnail`;
        }
      }
      
      return null;
    }

    // Create rows with new structure
    const rows = (data||[]).map(ev => {
      const imageUrl = getImageUrl(ev);
      return `
      <tr>
        <td>${ev.name || ''}</td>
        <td>${formatDate(ev.date) || ''}</td>
        <td>${formatTime(ev.date) || ''}</td>
        <td>${formatTime(ev.end) || ''}</td>
        <td>${ev.title || ''}</td>
        <td>
          ${imageUrl ? `<img src="${imageUrl}" alt="Event image" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" onload="this.style.display='block';this.nextElementSibling.style.display='none';"><span style="color: #999; display: none;">No image</span>` : '<span style="color: #999;">No image</span>'}
        </td>
        <td>
          <button class="admin-action" data-action="edit-subevents" data-id="${ev.id}" title="Edit Sub-events">
            <i class="fas fa-list"></i>
          </button>
          <button class="admin-action" data-action="edit" data-id="${ev.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="admin-action danger" data-action="del" data-id="${ev.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');
    
    content.innerHTML = renderTable({
      title:'Event Schedule', 
      columns:['Name','Date','Start Time','End Time','Title','Image','Actions']
    }, rows, `<button id="addEvent" class="admin-action"><i class="fas fa-plus"></i> Add Event</button>`);
    
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; 
      const id = btn.dataset.id; 
      const action = btn.dataset.action;
      const current = (data||[]).find(x => String(x.id) === String(id)) || {};
      
      if (action==='del'){
        if (!confirm('Delete this event?')) return;
        const r = await api(`/api/admin/events/${id}`, { method:'DELETE' }); 
        if (r.ok) showEvent(); else notify('Error deleting event', 'error');
      } else if (action==='edit'){
        openEventForm(current, false);
      } else if (action==='edit-subevents'){
        openSubEventsManager(current);
      }
    });
    
    content.querySelector('#addEvent').addEventListener('click', async ()=>{
      openEventForm({}, true);
    });
  }

  // Helper function to get image URL for form display
  function getImageUrlForForm(event) {
    if (!event.image) return null;
    
    // Handle different image formats
    if (typeof event.image === 'string') {
      // Legacy URL-based image or base64 data
      if (event.image.startsWith('data:')) {
        return event.image; // Already base64 encoded
      } else if (event.image.startsWith('/')) {
        return event.image; // Legacy file path
      } else {
        // Assume it's an ObjectId, use the image endpoint
        return `/api/admin/events/${event.id}/image`;
      }
    } else if (event.image && event.image.data) {
      // Database-stored image with base64 data
      return event.image;
    } else if (event.image && event.image._id) {
      // Image reference with populated data
      if (event.image.data) {
        const base64Data = event.image.data.toString('base64');
        return `data:${event.image.contentType};base64,${base64Data}`;
      } else {
        // No populated data, use endpoint
        return `/api/admin/events/${event.id}/image`;
      }
    }
    
    return null;
  }

  // Open event add/edit form
  function openEventForm(event, isNew = false) {
    // Get current image URL for display
    const currentImageUrl = getImageUrlForForm(event);
    const showCurrentImage = !isNew && currentImageUrl;
    
    openFormModal({
      title: isNew ? 'Add Event' : 'Edit Event',
      submitText: isNew ? 'Add' : 'Save',
      showCurrentImage: showCurrentImage,
      currentImageUrl: currentImageUrl,
      fields: [
        { name:'name', label:'Name', required:true, help:'e.g. Wedding Ceremony' },
        { name:'date', label:'Date', type:'date', required:true, help:'Event date (Spain locale)' },
        { name:'startTime', label:'Start Time', type:'time', required:true, help:'Start time (24h format)' },
        { name:'endDate', label:'End Date', type:'date', help:'End date (optional, for events that span multiple days)' },
        { name:'endTime', label:'End Time', type:'time', help:'End time (24h format, can be next day if end date is set)' },
        { name:'location', label:'Location', type:'location', required:true, help:'Use map tool to select precise location' },
        { name:'title', label:'Title', help:'e.g. Oyana Beach Restaurant' },
        { name:'description', label:'Description', type:'textarea', rows: 3, help:'Event description or additional details' },
        { name:'image', label:'Image', type:'file', help:'Upload event image (will be stored in database)' }
      ],
      initialValues: {
        name: event.name || '',
        date: extractDateFromISO(event.date) || '',
        startTime: extractTimeFromISO(event.date) || '',
        endDate: extractDateFromISO(event.end) || '',
        endTime: extractTimeFromISO(event.end) || '',
        location: event.location || '',
        locationAddress: event.locationAddress || event.location || '',
        locationLatitude: event.locationLatitude || '',
        locationLongitude: event.locationLongitude || '',
        title: event.title || '',
        description: event.description || ''
      },
      onSubmit: async (values, close, modal) => {
        try {
          // Combine date and time into ISO format using Madrid Summer offset
          const startDateTime = values.date && values.startTime ? 
            new Date(`${values.date}T${values.startTime}:00+02:00`).toISOString() : null;
          
          // For end date/time, use endDate if provided, otherwise use start date
          // This allows events that end on the next day (or any other day)
          const endDate = values.endDate || values.date;
          const endDateTime = endDate && values.endTime ? 
            new Date(`${endDate}T${values.endTime}:00+02:00`).toISOString() : null;
          
          // Get location value from the location component - only if modal is available
          let locationValue = values.location || '';
          let lat = '';
          let lng = '';
          
          if (modal) {
            const locationAddressEl = modal.querySelector('#f_location_address');
            const locationLatEl = modal.querySelector('#f_location_lat');
            const locationLngEl = modal.querySelector('#f_location_lng');
            
            const address = locationAddressEl ? locationAddressEl.value || '' : '';
            lat = locationLatEl ? locationLatEl.value || '' : '';
            lng = locationLngEl ? locationLngEl.value || '' : '';
            
            // Build location value with address and coordinates if available
            if (address || (lat && lng)) {
              locationValue = address;
            } else {
              locationValue = values.location || '';
            }
          }
          
          // Handle image upload
          let imageReference = null;
          const imageFile = document.getElementById('f_image')?.files[0];
          if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);
            const uploadRes = await fetch('/api/admin/events/upload-image', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              // Store the image ID for the event
              imageReference = {
                imageId: uploadData.imageId
              };
            }
          } else if (event.image) {
            // Keep existing image reference for edit mode
            if (typeof event.image === 'string') {
              // Legacy URL-based image or ObjectId string
              if (event.image.startsWith('/')) {
                // Legacy URL-based image - keep as is
                imageReference = event.image;
              } else {
                // ObjectId string - keep as is
                imageReference = event.image;
              }
            } else if (event.image && typeof event.image === 'object') {
              // Database-stored image object - keep the reference
              if (event.image.imageId) {
                // New format with imageId
                imageReference = { imageId: event.image.imageId };
              } else if (event.image._id) {
                // MongoDB ObjectId reference
                imageReference = event.image._id.toString();
              } else {
                // Other object format - keep as is
                imageReference = event.image;
              }
            }
          }
          
          const eventData = {
            name: values.name,
            date: startDateTime,
            end: endDateTime,
            location: locationValue,
            locationAddress: values.locationAddress || values.location || '',
            locationLatitude: values.locationLatitude || (lat ? parseFloat(lat) : null),
            locationLongitude: values.locationLongitude || (lng ? parseFloat(lng) : null),
            title: values.title,
            description: values.description,
            image: imageReference
          };
          
          const url = isNew ? '/api/admin/events' : `/api/admin/events/${event.id}`;
          const method = isNew ? 'POST' : 'PUT';
          
          const r = await api(url, { 
            method, 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify(eventData)
          });
          
          if (!r.ok) throw new Error(isNew ? 'Failed to create event' : 'Failed to update event');
          
          close();
          showEvent();
        } catch (error) {
          throw error;
        }
      }
    });
  }

  // Open sub-events manager
  function openSubEventsManager(event) {
    const subEvents = event.sub_events || [];
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;
      display:flex;align-items:center;justify-content:center;
    `;
    
    modal.innerHTML = `
      <div style="
        background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.25);
        width:min(800px,95vw);max-height:90vh;overflow:auto;
      ">
        <div style="padding:22px 24px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;color:#333;">Manage Sub-events: ${event.name}</h3>
          <button id="closeSubEvents" class="admin-action" style="background:#6c757d;color:#fff;border:none;padding:8px 12px;border-radius:8px;">Close</button>
        </div>
        <div style="padding:18px 24px;">
          <div style="margin-bottom:20px;">
            <button id="addSubEvent" class="admin-action">
              <i class="fas fa-plus"></i> Add Sub-event
            </button>
          </div>
          <div id="subEventsList">
            ${subEvents.length > 0 ? subEvents.map((sub, index) => `
              <div style="border:1px solid #ddd;border-radius:8px;padding:15px;margin-bottom:10px;display:flex;align-items:center;gap:15px;">
                <img src="${getSubEventIcon(sub.icon)}" alt="${sub.icon}" style="width:24px;height:24px;">
                <div style="flex:1;">
                  <strong>${sub.name}</strong><br>
                  <small style="color:#666;">
                    ${formatDate(sub.date)} ${formatTime(sub.date)} - ${formatTime(sub.end)}
                  </small><br>
                  <small style="color:#666;">${(sub.description || '').substring(0, 100)}${(sub.description || '').length > 100 ? '...' : ''}</small>
                </div>
                <div>
                  <button class="admin-action" data-action="edit-sub" data-index="${index}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="admin-action danger" data-action="del-sub" data-index="${index}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('') : '<p style="text-align:center;color:#999;padding:20px;">No sub-events yet</p>'}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('#closeSubEvents').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Add sub-event
    modal.querySelector('#addSubEvent').addEventListener('click', () => {
      openSubEventForm(event, null, modal);
    });
    
    // Handle sub-event actions
    modal.querySelector('#subEventsList').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const index = parseInt(btn.dataset.index);
      
      if (action === 'edit-sub') {
        openSubEventForm(event, subEvents[index], modal, index);
      } else if (action === 'del-sub') {
        if (confirm('Delete this sub-event?')) {
          const updatedSubEvents = subEvents.filter((_, i) => i !== index);
          updateEventSubEvents(event.id, updatedSubEvents, modal);
        }
      }
    });
  }

  // Open sub-event add/edit form
  function openSubEventForm(event, subEvent, modal, index = null) {
    const isNew = !subEvent;
    const defaultDate = extractDateFromISO(event.date);
    const defaultStartTime = extractTimeFromISO(event.date);
    const defaultEndTime = extractTimeFromISO(event.end) || '23:59';
    
    openFormModal({
      title: isNew ? 'Add Sub-event' : 'Edit Sub-event',
      submitText: isNew ? 'Add' : 'Save',
      fields: [
        { name:'name', label:'Name', required:true, help:'e.g. Welcome Cocktails' },
        { name:'date', label:'Date', type:'date', required:true, default: defaultDate },
        { name:'startTime', label:'Start Time', type:'time', required:true, default: defaultStartTime },
        { name:'endTime', label:'End Time', type:'time', required:true, default: defaultEndTime },
        { name:'description', label:'Description', type:'textarea', rows: 3, help:'e.g. Enjoy cocktails and hor d\'oeuvres by the fountain while meeting other attendees' },
        { name:'icon', label:'Icon', type:'select', required:true, 
          options: [
            { value: 'ceremony', label: 'Ceremony' },
            { value: 'cocktails', label: 'Cocktails' },
            { value: 'reception', label: 'Reception' },
            { value: 'dancing', label: 'Dancing' }
          ]
        }
      ],
      initialValues: {
        name: subEvent?.name || '',
        date: extractDateFromISO(subEvent?.date) || defaultDate,
        startTime: extractTimeFromISO(subEvent?.date) || defaultStartTime,
        endTime: extractTimeFromISO(subEvent?.end) || defaultEndTime,
        description: subEvent?.description || '',
        icon: subEvent?.icon || 'ceremony'
      },
      onSubmit: async (values, close) => {
        try {
          // Combine date and time into ISO format using Madrid Summer offset
          const startDateTime = values.date && values.startTime ? 
            new Date(`${values.date}T${values.startTime}:00+02:00`).toISOString() : null;
          
          // For end date/time, use endDate if provided, otherwise use start date
          // This allows events that end on the next day (or any other day)
          const endDate = values.endDate || values.date;
          const endDateTime = endDate && values.endTime ? 
            new Date(`${endDate}T${values.endTime}:00+02:00`).toISOString() : null;
          
          const newSubEvent = {
            name: values.name,
            date: startDateTime,
            end: endDateTime,
            description: values.description,
            icon: values.icon
          };
          
          let updatedSubEvents = [...(event.sub_events || [])];
          if (isNew) {
            updatedSubEvents.push(newSubEvent);
          } else {
            updatedSubEvents[index] = newSubEvent;
          }
          
          await updateEventSubEvents(event.id, updatedSubEvents, modal);
          close();
        } catch (error) {
          throw error;
        }
      }
    });
  }

  // Update event sub-events
  async function updateEventSubEvents(eventId, subEvents, modal) {
    try {
      const r = await api(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ sub_events: subEvents })
      });
      
      if (!r.ok) throw new Error('Failed to update sub-events');
      
      // Get the updated event directly from the response
      const updatedEvent = await r.json();
      
      // Refresh the modal with updated data
      document.body.removeChild(modal);
      openSubEventsManager(updatedEvent);
      
      // Also refresh the main events table to update cached event data
      // This ensures that when user closes modal and opens sub-events manager again,
      // it will have the freshest data from the database
      await showEvent();
      
    } catch (error) {
      notify('Error updating sub-events: ' + error.message, 'error');
    }
  }

  // ========== Menu management ==========
  async function showMenu(){
    activate('menu');
    setLoading('Loading menus...');
    const res = await api('/api/admin/menu');
    const data = res.ok ? await res.json() : [];
    const rows = (data||[]).map(m => `
      <tr>
        <td>${m.nombre||m.name||''}</td>
        <td>${m.descripcion||''}</td>
        <td>${m.tipo||''}</td>
        <td>
          <button class="admin-action" data-action="edit" data-id="${m.id}"><i class="fas fa-edit"></i></button>
          <button class="admin-action danger" data-action="del" data-id="${m.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
    content.innerHTML = renderTable({title:'Menu Management', columns:['Name','Description','Type','Actions']}, rows,
      `<button id=\"addMenu\" class=\"admin-action\"><i class=\"fas fa-plus\"></i> Add</button>`);
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; const id = btn.dataset.id; const action = btn.dataset.action;
      const current = (data||[]).find(x => String(x.id) === String(id)) || {};
      if (action==='del'){
        if (!confirm('Delete this menu item?')) return;
        const r = await api(`/api/admin/menu/${id}`, { method:'DELETE' }); if (r.ok) showMenu(); else notify('Error','error');
      } else if (action==='edit'){
        openFormModal({
          title: 'Edit menu item', submitText: 'Save',
          fields: [
            { name:'nombre', label:'Name', required:true },
            { name:'descripcion', label:'Description', type:'textarea' },
            { name:'tipo', label:'Type' },
          ],
          initialValues: {
            nombre: current.nombre || current.name || '',
            descripcion: current.descripcion || '',
            tipo: current.tipo || ''
          },
          onSubmit: async (values, close) => {
            const r = await api(`/api/admin/menu/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
            if (!r.ok) throw new Error('Failed to update');
            close();
            showMenu();
          }
        });
      }
    });
    content.querySelector('#addMenu').addEventListener('click', async ()=>{
      openFormModal({
        title: 'Add menu item', submitText: 'Add',
        fields: [
          { name:'nombre', label:'Name', required:true },
          { name:'descripcion', label:'Description', type:'textarea' },
          { name:'tipo', label:'Type' },
        ],
        onSubmit: async (values, close) => {
          const r = await api('/api/admin/menu', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
          if (!r.ok) throw new Error('Failed to create');
          close();
          showMenu();
        }
      });
    });
  }

  // ========== Styles for Party Management ==========
  function addPartyStyles(){
    if (document.getElementById('party-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'party-styles';
    style.textContent = `
      .party-section {
        background: #fff;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .party-section h4 {
        margin: 0 0 15px 0;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .primary-guest-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid var(--primary-color, #8B5A96);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .badge-primary {
        background: var(--primary-color, #8B5A96);
        color: white;
      }
      
      .no-party-members {
        text-align: center;
        padding: 40px 20px;
        color: #6c757d;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
      }
      
      .error-message {
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
      }
      
      .error-message i {
        font-size: 2em;
        margin-bottom: 10px;
        display: block;
      }
      
      .error-message h3 {
        margin: 0 0 10px 0;
        font-size: 1.3em;
      }
      
      .error-message p {
        margin: 0 0 15px 0;
        line-height: 1.4;
      }
      
      .btn-retry {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      
      .btn-retry:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-1px);
      }
      
      .admin-action {
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      
      .admin-action:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }
      
      .admin-action.danger {
        background: #dc3545;
      }
      
      .admin-action.danger:hover {
        background: #c82333;
      }
      
      .admin-action:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .data-table th,
      .data-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      
      .data-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #333;
      }
      
      .data-table tbody tr:hover {
        background: #f8f9fa;
      }
      
      .table-container {
        margin-top: 15px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
  }

  // ========== Settings ==========
  async function showSettings(){
    activate('configuration');
    setLoading('Loading settings...');
    
    // Load both feature toggles and event blocking settings
    const [settingsRes, blockedRes] = await Promise.all([
      api('/api/admin/settings'),
    ]);
    
    const settings = settingsRes.ok ? await settingsRes.json() : {
      guestsEnabled: false,
      eventsEnabled: false,
      menuEnabled: false,
      messagesEnabled: false,
      giftsEnabled: false
    };
    
    content.innerHTML = `
      <div class="admin-content">
        <h3><i class="fas fa-cog"></i> Settings</h3>
        
        <!-- Feature Toggles -->
        <div class="settings-section">
          <h4><i class="fas fa-toggle-on"></i> Feature Toggles</h4>
          <p style="color:#666;margin-bottom:20px;">Control which features are available to guests</p>
          
          <div class="feature-toggles-grid">
            ${[
              { key: 'guestsEnabled', label: 'Enable Guest Area', icon: 'fa-users', desc: 'Allow guests to login and manage guests in their party' },
              { key: 'eventsEnabled', label: 'Show Wedding Events', icon: 'fa-calendar-alt', desc: 'Show the wedding event calendar and allow guests to confirm their attendance' },
              { key: 'menuEnabled', label: 'Menu', icon: 'fa-utensils', desc: 'Show Guest Menu selection and Preferences' },
              { key: 'messagesEnabled', label: 'Messages', icon: 'fa-comments', desc: 'Show Messages' },
              { key: 'giftsEnabled', label: 'Gifts', icon: 'fa-gift', desc: 'Show Gift Registry' }
            ].map(feature => `
              <div class="feature-toggle-card ${settings[feature.key] ? 'enabled' : 'disabled'}">
                <div class="feature-toggle-header">
                  <i class="fas ${feature.icon}"></i>
                  <h5>${feature.label}</h5>
                  <div class="toggle-switch">
                    <input type="checkbox" id="toggle-${feature.key}" ${settings[feature.key] ? 'checked' : ''}>
                    <label for="toggle-${feature.key}" onclick="updateFeatureToggle('${feature.key}', document.getElementById('toggle-${feature.key}').checked)"></label>
                  </div>
                </div>
                <p class="feature-desc">${feature.desc}</p>
                <div class="feature-status">
                  <span class="status-badge ${settings[feature.key] ? 'active' : 'inactive'}">
                    ${settings[feature.key] ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
    
    // Add styles for the feature toggles
    addSettingsStyles();
    
    const btnLock = document.getElementById('btnLock');
    const btnUnlock = document.getElementById('btnUnlock');
  }
  
  // Update feature toggle function (global scope)
  window.updateFeatureToggle = async function(featureKey, enabled) {
    try {
      // Get current state of all toggles
      const currentSettings = {
        guestsEnabled: featureKey === 'guestsEnabled' ? !enabled : (document.getElementById('toggle-guestsEnabled')?.checked || false) ,
        eventsEnabled: featureKey === 'eventsEnabled' ? !enabled : (document.getElementById('toggle-eventsEnabled')?.checked || false),
        menuEnabled: featureKey === 'menuEnabled' ? !enabled : (document.getElementById('toggle-menuEnabled')?.checked || false),
        messagesEnabled: featureKey === 'messagesEnabled' ? !enabled : (document.getElementById('toggle-messagesEnabled')?.checked || false),
        giftsEnabled: featureKey === 'giftsEnabled' ? !enabled : (document.getElementById('toggle-giftsEnabled')?.checked || false)
      };
      
      console.log('Updating settings:', currentSettings);
      
      const r = await api('/api/admin/settings', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(currentSettings)
      });
      
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${r.status}: Failed to update settings`);
      }
      
      const updatedSettings = await r.json();
      console.log('Settings updated successfully:', updatedSettings);
      
      // Update visual feedback for the specific toggle that was changed
      const toggle = document.getElementById(`toggle-${featureKey}`);
      const card = toggle?.closest('.feature-toggle-card');
      const badge = card?.querySelector('.status-badge');
      
      if (toggle && card && badge) {
        if (enabled) {
          card.classList.remove('disabled');
          card.classList.add('enabled');
          badge.textContent = 'Enabled';
          badge.classList.remove('inactive');
          badge.classList.add('active');
        } else {
          card.classList.remove('enabled');
          card.classList.add('disabled');
          badge.textContent = 'Disabled';
          badge.classList.remove('active');
          badge.classList.add('inactive');
        }
      }
      
      notify(`${featureKey} ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
    } catch (error) {
      console.error('Error updating feature toggle:', error);
      
      // Revert the toggle on error
      const toggle = document.getElementById(`toggle-${featureKey}`);
      if (toggle) {
        toggle.checked = !enabled;
      }
      
      notify('Error updating setting: ' + error.message, 'error');
    }
  };
  
  // Add styles for settings page
  function addSettingsStyles(){
    if (document.getElementById('settings-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'settings-styles';
    style.textContent = `
      .settings-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .settings-section h4 {
        margin: 0 0 8px 0;
        color: #333;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .settings-section h4 i {
        color: #8B5A96;
      }
      
      .feature-toggles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      
      .feature-toggle-card {
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 20px;
        transition: all 0.3s ease;
        background: #fff;
      }
      
      .feature-toggle-card.enabled {
        border-color: #28a745;
        background: linear-gradient(135deg, #ffffff 0%, #f8fff9 100%);
      }
      
      .feature-toggle-card.disabled {
        border-color: #dc3545;
        background: linear-gradient(135deg, #ffffff 0%, #fff8f8 100%);
      }
      
      .feature-toggle-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .feature-toggle-header i {
        font-size: 1.5em;
        color: #8B5A96;
      }
      
      .feature-toggle-header h5 {
        margin: 0;
        flex: 1;
        font-size: 1.1em;
        color: #333;
      }
      
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }
      
      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .toggle-switch label {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
      }
      
      .toggle-switch label:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      .toggle-switch input:checked + label {
        background-color: #28a745;
      }
      
      .toggle-switch input:checked + label:before {
        transform: translateX(26px);
      }
      
      .toggle-switch input:disabled + label {
        background-color: #e9ecef;
        cursor: not-allowed;
      }
      
      .feature-desc {
        color: #666;
        font-size: 0.9em;
        margin: 0 0 12px 0;
        line-height: 1.4;
      }
      
      .feature-status {
        text-align: right;
      }
      
      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-badge.active {
        background: #d4edda;
        color: #155724;
      }
      
      .status-badge.inactive {
        background: #f8d7da;
        color: #721c24;
      }
      
      .config-card {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        border-left: 4px solid #007bff;
      }
      
      .config-card h5 {
        margin: 0 0 10px 0;
        color: #333;
      }
      
      @media (max-width: 768px) {
        .feature-toggles-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Router for tabs
  function showTab(tab){
    // Add styles for party management
    addPartyStyles();
    
    switch(tab){
      case 'guests': return showGuests();
      case 'gifts': return showGifts();
      case 'messages': return showMessages();
      case 'event': return showEvent();
      case 'menu': return showMenu();
      case 'configuration': return showSettings();
      default:
        setLoading('Loading...');
    }
  }

  // Events
  if (logoutBtn){
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      window.location.href = 'admin-login.html';
    });
  }
  tabs.forEach(tab => tab.addEventListener('click', ()=> showTab(tab.dataset.tab)));

  // Default
  showTab('guests');
})();
