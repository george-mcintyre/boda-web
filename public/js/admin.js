(function(){
  // Admin panel client script (based on legacy admin-fixed.js), translated to English
  const content = document.getElementById('admin');
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
    content.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i><p >${msg||'Loading...'}</p></div>`;
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
        <button type="button" id="${id}_use_map" class="btn btn-info">
          <i class="fas fa-map"></i> Use Map
        </button>
        <button type="button" id="${id}_search" class="btn btn-success">
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
        adult: true,
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
            id: makeObjectIdLike(),
            name: `${guest.name} - Guest ${j + 1}`,
            adult: true
          });
        }
        
        // Add children
        for (let j = 0; j < childrenInParty; j++) {
          guest.partyMembers.push({
            id: makeObjectIdLike(),
            name: `${guest.name} - Child ${j + 1}`,
            adult: false
          });
        }
      }
      
      guests.push(guest);
    }
    
    return guests;
  }

  // Image preview handler for file inputs
  function setupImagePreview(modal) {
    const fileInput = modal.querySelector('#f_image');
    const previewContainer = modal.querySelector('#image-preview-container');
    
    console.log('setupImagePreview called:', {
      hasFileInput: !!fileInput,
      hasPreviewContainer: !!previewContainer,
      fileInputId: fileInput?.id,
      previewContainerId: previewContainer?.id
    });
    
    if (!fileInput || !previewContainer) {
      console.warn('Image preview setup failed: missing elements', {
        fileInput: !!fileInput,
        previewContainer: !!previewContainer
      });
      return;
    }
    
    // Remove any existing listeners to prevent duplicates
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    newFileInput.addEventListener('change', function(e) {
      console.log('File input changed:', e.target.files[0]);
      const file = e.target.files[0];
      
      if (!file) {
        console.log('No file selected, resetting preview');
        // Reset preview if no file selected
        previewContainer.innerHTML = `
          <div style="text-align:center; color:#999;">
            <i class="fas fa-image" style="font-size:2em; margin-bottom:10px; display:block;"></i>
            <div>Image preview will appear here</div>
          </div>`;
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        newFileInput.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        newFileInput.value = '';
        return;
      }
      
      // Create and show preview
      const reader = new FileReader();
      reader.onload = function(e) {
        console.log('FileReader loaded, creating preview');
        const imageUrl = e.target.result;
        previewContainer.innerHTML = `
          <div style="text-align:center;">
            <img src="${imageUrl}" alt="Preview" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="margin-top:8px; color:#666; font-size:0.9em;">
              <i class="fas fa-info-circle"></i> 
              ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          </div>`;
        console.log('Preview created successfully');
      };
      reader.onerror = function(error) {
        console.error('FileReader error:', error);
        alert('Error reading file');
      };
      reader.readAsDataURL(file);
    });
    
    console.log('Image preview event listener attached successfully');
  }

  // Custom image dropdown component
  function createImageDropdown(id, name, options, selectedValue) {
    
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
        <button id="mfClose" class="btn btn-secondary">Close</button>
      </div>
      <form id="mfForm" style="padding:18px 24px;">
        <div id="mfError" style="display:none;margin-bottom:10px;color:#dc3545;font-weight:600;"></div>
        
        ${fields.map(f => {
          const id = `f_${f.name}`;
          const val = initialValues[f.name] ?? f.default ?? '';
          const baseStyle = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;';
          let inputHtml = '';
          
          if (f.type === 'checkbox') {
            const checked = val === true || val === 'true' || val === 'on' ? 'checked' : '';
            inputHtml = `<input id="${id}" name="${f.name}" type="checkbox" ${checked} style="width:auto;margin-right:8px;"> <label for="${id}" style="font-weight:normal;margin:0;cursor:pointer;">${f.label}${f.required?' *':''}</label>`;
            const help = f.help ? `<small style="display:block;color:#6c757d;margin-top:4px;margin-left:24px;">${f.help}</small>` : '';
            return `<div style="margin-bottom:14px;" data-field="${f.name}">${inputHtml}${help}</div>`;
          } else {
            const label = `<label for="${id}" style="display:block;margin:6px 0 6px 0;font-weight:600;color:#333;">${f.label}${f.required?' *':''}</label>`;
            
            if (f.type === 'textarea') {
              console.log('textarea', f);
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
            } else if (f.type === 'imagePreview') {
              // Image preview container - will be populated by file input change handler
              inputHtml = `<div id="image-preview-container" style="margin-top:10px; padding:10px; border:1px dashed #ddd; border-radius:8px; background:#f8f9fa; min-height:120px; display:flex; align-items:center; justify-content:center;">
                <div style="text-align:center; color:#999;">
                  <i class="fas fa-image" style="font-size:2em; margin-bottom:10px; display:block;"></i>
                  <div>Image preview will appear here</div>
                </div>
              </div>`;
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
          }
        }).join('')}
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
          <button type="button" id="mfCancel" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-success">${submitText}</button>
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
        if (f.type === 'checkbox' && f.required && !v) valid = false;
        
        // Handle checkbox values properly
        if (f.type === 'checkbox') {
          const checkboxEl = modal.querySelector(`#f_${f.name}`);
          data[f.name] = checkboxEl ? checkboxEl.checked : false;
        } else if (f.type !== 'location') {
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

    // Setup image preview for file inputs
    setupImagePreview(modal);

    // Populate image preview with existing image if editing and image exists
    if (additionalOptions.showCurrentImage && additionalOptions.currentImageUrl) {
      const previewContainer = modal.querySelector('#image-preview-container');
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div style="text-align:center;">
            <img src="${additionalOptions.currentImageUrl}" alt="Current gift card image" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="margin-top:8px; color:#666; font-size:0.9em;">
              <i class="fas fa-info-circle"></i> 
              Current gift card image
            </div>
          </div>`;
      }
    }

    return { close, modal };
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
    setLoading(translate('guests:loadingGuests'));
    try {
      // Use pagination for large guest lists
      let url = '/api/admin/guests';
      const res = await api(url);
      if (!res.ok) throw new Error(translate('admin:guests.errorLoading'));
      const data = await res.json();
      
      // Handle both paginated and non-paginated responses
      const guests = data.items || data || [];
      
      // Calculate total guest count (sum of all party sizes)
      const totalGuests = guests.reduce((sum, g) => sum + (g.partySize || 1), 0);
      
      const rows = guests.map(g => `
        <tr>
          <td>${g.name || ''}</td>
          <td>${g.email || ''}</td>
          <td><div class="badge badge-info" data-i18n="admin:guests.${g.adult !== false ? 'adult' : 'child'}">
          ${g.adult !== false ? translate('admin:guests.adult') : translate('admin:guests.child')}
          </div></td>
          <td>${g.partySize || 1}</td>
          <td>
            <button class="btn btn-info" data-action="manage-party" data-id="${g.id || g._id}" title="Manage Party">
              <i class="fas fa-users"></i>
            </button>
            <button class="btn btn-primary" data-action="edit" data-id="${g.id || g._id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger" data-action="del" data-id="${g.id || g._id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`).join('');
      
      content.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div class="guest-summary" style="background:#f8f9fa;padding:15px;border-radius:8px;margin-top:15px;border-left:4px solid #28a745;">
              <h4 style="margin:0 0 8px 0;color:#28a745;"><i class="fas fa-users"></i>
              <span data-i18n="admin:guests.totalGuests">
                ${translate('admin:guests.totalGuests')}
              </span>: ${totalGuests}</h4>
              <p style="margin:0;color:#666;font-size:0.9em;">
                ${translateWithVars('admin:guests.acrossParties', { count: guests.length, partyWord: guests.length !== 1 ? 'parties' : 'party' })}
              </p>
            </div>
            <div>
              <button id="addGuest" class="btn btn-success"><i class="fas fa-user-plus"></i> 
              <span data-i18n="admin:guests.addGuest">${translate('admin:guests.addGuest')}</span></button>
              <button id="bulkUploadGuests" class="btn btn-info" style="margin-left:8px;"><i class="fas fa-file-upload"></i> 
              <span data-i18n="admin:guests.bulkUploadCsv">${translate('admin:guests.bulkUploadCsv')}</span></button>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr>
                <th><div data-i18n="common:party.name">${translate('common:party.name')}</div></th>
                <th><div data-i18n="admin:guests.table.email">${translate('admin:guests.table.email')}</div></th>
                <th><div data-i18n="common:party.age.category">${translate('common:party.age.category')}</div></th>
                <th><div data-i18n="admin:guests.table.partySize">${translate('admin:guests.table.partySize')}</div></th>
                <th><div data-i18n="admin:guests.table.actions">${translate('admin:guests.table.actions')}</div></th>
              </tr></thead>
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
          if (!confirm(translate('admin:guests.confirmDelete'))) return;
          const r = await api(`/api/admin/guests/${id}`, { method:'DELETE' });
          if (r.ok) showGuests(); else notify('Error deleting guest', 'error');
        } else if (action==='edit'){
          openFormModal({
            title: translate('admin:guests.editTitle'),
            submitText: translate('admin:guests.save'),
            fields: [
              { name:'name', label:translate('admin:guests.field.name'), required:true },
              { name:'email', label:translate('admin:guests.field.email'), type:'email', required:true },
              { name:'adult', label:translate('admin:guests.field.ageCategory'), type:'select', options:[
                { value: 'true', label: translate('admin:guests.option.adult') },
                { value: 'false', label: translate('admin:guests.option.child') }
              ], required:true }
            ],
            initialValues: {
              name: current.name || '',
              email: current.email || '',
              adult: current.adult !== undefined ? String(current.adult) : 'true'
            },
            onSubmit: async (values, close) => {
              const guestData = {
                name: values.name,
                email: values.email,
                adult: values.adult === 'true'
              };
              const r = await api(`/api/admin/guests/${id}`, { 
                method:'PUT', 
                headers:{'Content-Type':'application/json'}, 
                body: JSON.stringify(guestData)
              });
              if (!r.ok) throw new Error('Failed to update guest');
              close();
              showGuests();
            }
          });
        } else if (action==='manage-party'){
          showPartyManager(id, current.name || current.name || '');
        }
      });
      
      content.querySelector('#addGuest').addEventListener('click', async ()=>{
        openFormModal({
          title: translate('admin:guests.addTitle'),
          submitText: translate('admin:guests.add'),
          fields: [
            { name:'name', label:translate('admin:guests.field.name'), required:true },
            { name:'email', label:translate('admin:guests.field.email'), type:'email', required:true },
            { name:'adult', label:translate('admin:guests.field.ageCategory'), type:'select', options:[
              { value: 'true', label: translate('admin:guests.option.adult') },
              { value: 'false', label: translate('admin:guests.option.child') }
            ], required:true, default: 'true' }
          ],
          onSubmit: async (values, close) => {
            const guestData = {
              name: values.name,
              email: values.email,
              adult: values.adult === 'true'
            };
            const r = await api('/api/admin/guests', { 
              method:'POST', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(guestData)
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
              notify(translate('admin:guests.csv.noValidGuests'), 'error');
              return;
            }
            
            // Show confirmation dialog with preview
            const preview = guests.slice(0, 5).map(g => 
              `${g.name} (${g.email || 'no email'})`
            ).join('\n');
            const more = guests.length > 5 ? `\n${translate('admin:guests.csv.more', { count: guests.length - 5 })}` : '';
            
            if (!confirm(`${translateWithVars('admin:guests.csv.uploadCount', { count: guests.length })}\n\n${translate('admin:guests.csv.preview')}\n${preview}${more}`)) {
              return;
            }
            
            setLoading(translate('admin:uploadingGuests'));
            
            const r = await api('/api/admin/guests/bulk-upload', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ guests })
            });
            
            if (!r.ok) throw new Error('Failed to upload guests');
            
            const results = await r.json();
            
            // Show results
            let message = `${translate('admin:guests.csv.uploadComplete')}\n\n`;
            message += `✓ ${translateWithVars('admin:guests.csv.successCreated', { count: results.success.length })}\n`;
            message += `⊘ ${translateWithVars('admin:guests.csv.skippedDuplicates', { count: results.skipped.length })}\n`;
            message += `✗ ${translateWithVars('admin:guests.csv.errors', { count: results.errors.length })}`;
            
            if (results.errors.length > 0) {
              message += `\n\n${translateWithVars('admin:guests.csv.firstError', { error: results.errors[0].error })}`;
            }
            
            alert(message);
            showGuests();
          } catch (err) {
            notify(translateWithVars('admin:guests.csv.uploadingError', { error: err.message }), 'error');
            console.error('CSV upload error:', err);
          }
        };
        input.click();
      });
    } catch(e){ 
      console.error('Error loading guests:', e); 
      notify(translateWithVars('admin:guests.error.failed', { error: e.message }), 'error'); 
      content.innerHTML = `
        <div class="admin-content">
          <h3><div data-i18n="admin:tab.guests">
          ${translate('admin:tab.guests')}</div></h3>
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3><div data-i18n="admin:guests.error.title">
            ${translate('admin:guests.error.title')}</div></h3>
            <p>${translateWithVars('admin:guests.error.failed', { error: e.message })}</p>
            <button onclick="showGuests()" class="btn btn-primary">
              <i class="fas fa-redo"></i> <div data-i18n="admin:guests.retry">
              ${translate('admin:guests.retry')}</div>
            </button>
          </div>
        </div>`;
    }
  }

  // ========== Party Management ==========
  async function showPartyManager(guestId, guestName){
    activate('guests');
    setLoading(translate('admin:loadingPartyMembers'));
    
    try {
      // Load current party members
      const res = await api(`/api/admin/guests/${guestId}/party`);
      if (!res.ok) throw new Error(translate('admin:party.error.loadFailed'));
      const partyMembers = await res.json();
      
      // Separate primary guest from party members
      const primaryGuest = partyMembers.find(member => member.primary) || null;
      const party = partyMembers.filter(member => !member.primary) || [];
      
      const partyRows = party.map((member, index) => `
        <tr>
          <td>${member.name || ''}</td>
          <td><div data-i18n="admin:party.${member.adult ? 'adult' : 'child'}" class="badge badge-info">${translate('admin:party.' + (member.adult ? 'adult' : 'child'))}</div></td>
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
            <thead><tr>
              <th><div data-i18n="admin:party.table.name">${translate('admin:party.table.name')}</div></th>
              <th><div data-i18n="admin:party.table.ageGroup">${translate('admin:party.table.ageGroup')}</div></th>
              <th><div data-i18n="admin:party.table.actions">${translate('admin:party.table.actions')}</div></th>
            </tr></thead>
            <tbody>${partyRows}</tbody>
          </table>
        </div>` : `
        <div class="no-party-members">
          <i class="fas fa-users" style="font-size: 2em; color: #ccc; margin-bottom: 10px;"></i>
          <p><div data-i18n="admin:party.noMembers">${translate('admin:party.noMembers')}</div></p>
        </div>`;
      
      content.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <div>
              <h3 style="margin:0;"><span data-i18n="admin:party.title">${translate('admin:party.title')}</span>${guestName}</h3>
              <p style="margin:5px 0 0 0;color:#666;"><div data-i18n="admin:party.description">${translate('admin:party.description')}</div></p>
            </div>
            <button id="backToGuests" class="admin-action">
              <i class="fas fa-arrow-left"></i> <div data-i18n="admin:party.backToGuests">${translate('admin:party.backToGuests')}</div>
            </button>
          </div>
          
          <div class="party-section">
            <h4><i class="fas fa-user"></i> <div data-i18n="common:party.primary.guest">${translate('common:party.primary.guest')}</div></h4>
            <div class="primary-guest-info">
              <strong>${primaryGuest ? primaryGuest.name : translate('admin:party.unknown')}</strong> 
              <span class="badge badge-primary" data-i18n="common:party.primary">${primaryGuest ? translate('common:party.primary') : ''}</span>
              <span class="badge ${primaryGuest && primaryGuest.adult === false ? 'badge-info' : 'badge-secondary'}">
                <div data-i18n="admin:party.${primaryGuest && primaryGuest.adult === false ? 'child' : 'adult'}">${translate('admin:party.' + (primaryGuest && primaryGuest.adult === false ? 'child' : 'adult'))}</div>
              </span>
            </div>
          </div>
          
          <div class="party-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
              <h4><i class="fas fa-users"></i> <div data-i18n="admin:party.partyMembers">${translate('admin:party.partyMembers')}</div></h4>
              <button id="addPartyMember" class="admin-action">
                <i class="fas fa-user-plus"></i> <div data-i18n="admin:party.addMember">${translate('admin:party.addMember')}</div>
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
          title: translate('admin:party.addModalTitle'),
          submitText: translate('admin:party.add'),
          fields: [
            { name:'name', label:translate('admin:party.field.name'), required:true },
            { name:'adult', label:translate('admin:party.field.ageGroup'), type:'select', options:[
              { value: 'true', label: translate('admin:party.option.adult') },
              { value: 'false', label: translate('admin:party.option.child') }
            ], required:true }
          ],
          onSubmit: async (values, close) => {
            const newMember = {
              name: values.name,
              adult: values.adult === 'true',
              id: makeObjectIdLike(),
            };
            
            const updatedParty = [...party, newMember];
            const r = await api(`/api/admin/guests/${guestId}/party`, { 
              method:'PUT', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(updatedParty)
            });
            
            if (!r.ok) throw new Error(translate('admin:party.error.addFailed'));
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
            if (!confirm(translate('admin:party.confirmRemove'))) return;
            
            const updatedParty = party.filter((_, i) => i !== index);
            const r = await api(`/api/admin/guests/${guestId}/party`, { 
              method:'PUT', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(updatedParty)
            });
            
            if (!r.ok) throw new Error(translate('admin:party.error.removeFailed'));
            showPartyManager(guestId, guestName);
          } else if (action==='edit-member'){
            const member = party[index];
            openFormModal({
              title: translate('admin:party.editModalTitle'),
              submitText: translate('admin:party.save'),
              fields: [
                { name:'name', label:translate('admin:party.field.name'), required:true },
                { name:'adult', label:translate('admin:party.field.ageGroup'), type:'select', options:[
                  { value: 'true', label: translate('admin:party.option.adult') },
                  { value: 'false', label: translate('admin:party.option.child') }
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
                
                if (!r.ok) throw new Error(translate('admin:party.error.updateFailed'));
                close();
                showPartyManager(guestId, guestName);
              }
            });
          }
        });
      }
      
    } catch(e){ 
      console.error('Error loading party:', e); 
      notify(translateWithVars('admin:party.error.loadingError', { error: e.message }), 'error'); 
      content.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3><div data-i18n="admin:party.title">${translateWithVars('admin:party.title', { guestName: guestName })}</div></h3>
            <button id="backToGuests" class="admin-action">
              <i class="fas fa-arrow-left"></i> <div data-i18n="admin:party.backToGuests">${translate('admin:party.backToGuests')}</div>
            </button>
          </div>
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3><div data-i18n="admin:party.error.title">${translate('admin:party.error.title')}</div></h3>
            <p>${translateWithVars('admin:party.error.failed', { error: e.message })}</p>
            <button onclick="showPartyManager('${guestId}', '${guestName}')" class="btn-retry">
              <i class="fas fa-redo"></i> <div data-i18n="admin:party.retry">${translate('admin:party.retry')}</div>
            </button>
          </div>
        </div>`;
      document.getElementById('backToGuests').addEventListener('click', showGuests);
    }
  }

  // ========== Gift list ==========
  async function showGifts(){
    activate('gifts');
    setLoading(translate('admin:loadingGiftList'));
    
    // Load gifts 
    const giftsRes = await api(`/api/admin/gifts?lang=${getUserLanguage()}`);
    const gifts = giftsRes.ok ? await giftsRes.json() : [];
    
    const rows = (gifts||[]).map(it => {
      // Helper function to get image URL
      function getGiftImageUrl(gift) {
        if (!gift.image) return null;
        
        // Handle different image formats
        if (typeof gift.image === 'string') {
          // Base64 data or ObjectId
          if (gift.image.startsWith('data:')) {
            return gift.image; // Already base64 encoded
          } else if (gift.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(gift.image)) {
            // ObjectId - use the image endpoint with image ID
            return `/api/admin/gift-images/${gift.image}`;
          } else {
            return gift.image; // Legacy URL
          }
        } else if (gift.image && gift.image.data) {
          // Database-stored image with base64 data
          return gift.image;
        }
        
        return null;
      };
      
      const imageUrl = getGiftImageUrl(it);
      
      return `
      <tr>
        <td>${it.title || ''}</td>
        <td>${it.description || ''}</td>
        <td>
          ${imageUrl ? `<img src="${imageUrl}" alt="Gift card" style="width: 40px; height: 25px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" onload="this.style.display='block';this.nextElementSibling.style.display='none';"><span style="color: #999; display: none;"><div data-i18n="admin:gifts.noImage">${translate('admin:gifts.noImage')}</div></span>` : '<span style="color: #999;"><div data-i18n="admin:gifts.noImage">' + translate('admin:gifts.noImage') + '</div></span>'}
        </td>
        <td>${it.available}</td>
        <td>€${it.amount}</td>
        <td>${it.purchased}</td>
        <td>
          <button class="admin-action" data-action="edit" data-id="${it.id}"><i class="fas fa-edit"></i></button>
          <button class="admin-action danger" data-action="del" data-id="${it.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
    
    // Calculate Grand Total
    const totalAvailable = (gifts||[]).reduce((sum, gift) => sum + (parseInt(gift.available) || 0), 0);
    const totalValue = (gifts||[]).reduce((sum, gift) => sum + ((parseInt(gift.available) || 0) * (parseInt(gift.amount) || 0)), 0);
    
    // Add Grand Total row
    const grandTotalRow = `
      <tr style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
        <td><div data-i18n="admin:gifts.grandTotal">${translate('admin:gifts.grandTotal')}</div></td>
        <td><div data-i18n="admin:gifts.grandTotalDescription">${translate('admin:gifts.grandTotalDescription')}</div></td>
        <td></td>
        <td><div data-i18n="admin:gifts.data.totalAvailable">${totalAvailable}</div></td>
        <td><div data-i18n="admin:gifts.data.totalValue">€${totalValue}</div></td>
        <td><div data-i18n="admin:gifts.data.totalPurchased">0</div></td>
        <td></td>
      </tr>`;
    
    const allRows = rows + grandTotalRow;
      
    content.innerHTML = renderTable({
      title: `<div data-i18n="admin:gifts.title">${translate('admin:gifts.title')}</div>`, 
      columns:[
        `<div data-i18n="admin:gifts.table.title">${translate('admin:gifts.table.title')}</div>`,
        `<div data-i18n="admin:gifts.table.description">${translate('admin:gifts.table.description')}</div>`,
        `<div data-i18n="admin:gifts.table.image">${translate('admin:gifts.table.image')}</div>`,
        `<div data-i18n="admin:gifts.table.available">${translate('admin:gifts.table.available')}</div>`,
        `<div data-i18n="admin:gifts.table.price">${translate('admin:gifts.table.price')}</div>`,
        `<div data-i18n="admin:gifts.table.purchased">${translate('admin:gifts.table.purchased')}</div>`,
        `<div data-i18n="admin:gifts.table.actions">${translate('admin:gifts.table.actions')}</div>`
      ]
    }, allRows, `<button id="addGift" class="admin-action"><i class="fas fa-plus"></i> <span data-i18n="admin:gifts.add">${translate('admin:gifts.add')}</span></button>`);
    
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; 
      const id = btn.dataset.id; 
      const action = btn.dataset.action;
      const current = (gifts||[]).find(x => String(x.id) === String(id)) || {};
      
      if (action === 'del'){
        if (!confirm(translate('admin:gifts.deleteConfirm'))) return;
        const r = await api(`/api/admin/gifts/${id}`, { method:'DELETE' }); 
        if (r.ok) showGifts(); else notify('Error deleting gift','error');
      } else if (action === 'edit'){
        // Helper function to determine if image is an ObjectId
        function isObjectId(str) {
          return str && typeof str === 'string' && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str);
        }

        // Helper function to get proper image URL for display
        function getImageUrlForForm(gift) {
          if (!gift.image) return null;
          
          // Handle base64 data URLs
          if (typeof gift.image === 'string' && gift.image.startsWith('data:')) {
            return gift.image;
          }
          
          // Handle ObjectId references
          if (isObjectId(gift.image)) {
            return `/api/admin/gift-images/${gift.image}`;
          }
          
          // Handle legacy URL-based images
          if (typeof gift.image === 'string' && gift.image.startsWith('/')) {
            return gift.image;
          }
          
          return null;
        }

        const imageUrl = getImageUrlForForm(current);
        const showCurrentImage = !!(current.image && imageUrl);

        openFormModal({
          title: `<div data-i18n="admin:gifts.edit">${translate('admin:gifts.edit')}</div>`, 
          submitText: `<span data-i18n="admin:gifts.save">${translate('admin:gifts.save')}</span>`,
          showCurrentImage: showCurrentImage,
          currentImageUrl: imageUrl,
          fields: [
            { name:'title', label: translate('admin:gifts.field.title'), required:true },
            { name:'description', label: translate('admin:gifts.field.description'), type:'textarea', required:true },
            { name:'image', label: translate('admin:gifts.field.image'), type:'file', help: translate('admin:gifts.field.imageHelp') },
            { name:'imagePreview', label:'Preview', type:'imagePreview' },
            { name:'available', label: translate('admin:gifts.field.available'), type:'number', min:'0', required:true },
            { name:'amount', label: translate('admin:gifts.field.price'), type:'select', required:true,
              options: [
                { value: '25', label: translate('admin:gifts.priceOption.25') },
                { value: '50', label: translate('admin:gifts.priceOption.50') },
                { value: '100', label: translate('admin:gifts.priceOption.100') },
                { value: '200', label: translate('admin:gifts.priceOption.200') },
                { value: '500', label: translate('admin:gifts.priceOption.500') }
              ]
            }
          ],
          initialValues: {
            title: current.title || '',
            description: current.description || '',
            available: current.available,
            amount: String(current.amount)
          },
          onSubmit: async (values, close, modal) => {
            try {
              // Handle image upload
              let imageReference = null;
              const imageFile = document.getElementById('f_image')?.files[0];
              if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await fetch('/api/admin/gifts/upload-image', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData
                });
                if (uploadRes.ok) {
                  const uploadData = await uploadRes.json();
                  // Store the image ID for the gift
                  imageReference = {
                    imageId: uploadData.imageId
                  };
                }
              } else if (current.image) {
                // Keep existing image reference for edit mode
                if (typeof current.image === 'string') {
                  if (current.image.startsWith('data:')) {
                    // Base64 data - keep as is
                    imageReference = current.image;
                  } else if (current.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(current.image)) {
                    // ObjectId string - keep as is
                    imageReference = current.image;
                  } else {
                    // Legacy URL-based image - keep as is
                    imageReference = current.image;
                  }
                } else if (current.image && typeof current.image === 'object') {
                  // Database-stored image object - keep the reference
                  if (current.image.imageId) {
                    // New format with imageId
                    imageReference = { imageId: current.image.imageId };
                  } else if (current.image._id) {
                    // MongoDB ObjectId reference
                    imageReference = current.image._id.toString();
                  } else {
                    // Other object format - keep as is
                    imageReference = current.image;
                  }
                }
              }
              
              const giftData = {
                title: values.title,
                description: values.description,
                available: parseInt(values.available),
                amount: parseInt(values.amount),
                image: imageReference
              };
              
              const r = await api(`/api/admin/gifts/${id}?lang=${getUserLanguage()}`, { 
                method:'PUT', 
                headers:{'Content-Type':'application/json'}, 
                body: JSON.stringify(giftData)
              });
              if (!r.ok) {
                const errorData = await r.json();
                throw new Error(errorData.error || 'Failed to update gift');
              }
              close();
              showGifts();
            } catch (error) {
              throw error;
            }
          }
        });
      }
    });
    
    content.querySelector('#addGift').addEventListener('click', async ()=>{
      openFormModal({
        title: `<div data-i18n="admin:gifts.add">${translate('admin:gifts.add')}</div>`, 
        submitText: `<span data-i18n="admin:gifts.add">${translate('admin:gifts.add')}</span>`,
        fields: [
          { name:'title', label: translate('admin:gifts.field.title'), required:true },
          { name:'description', label: translate('admin:gifts.field.description'), type:'textarea', required:true },
          { name:'image', label: translate('admin:gifts.field.image'), type:'file', required:true, help: translate('admin:gifts.field.imageHelp') },
          { name:'imagePreview', label:'Preview', type:'imagePreview' },
          { name:'available', label: translate('admin:gifts.field.available'), type:'number', min:'0', required:true },
          { name:'amount', label: translate('admin:gifts.field.price'), type:'select', required:true,
            options: [
              { value: '25', label: translate('admin:gifts.priceOption.25') },
              { value: '50', label: translate('admin:gifts.priceOption.50') },
              { value: '100', label: translate('admin:gifts.priceOption.100') },
              { value: '200', label: translate('admin:gifts.priceOption.200') },
              { value: '500', label: translate('admin:gifts.priceOption.500') }
            ]
          }
        ],
        onSubmit: async (values, close, modal) => {
          try {
            // Handle image upload
            let imageReference = null;
            const imageFile = document.getElementById('f_image')?.files[0];
            if (imageFile) {
              const formData = new FormData();
              formData.append('image', imageFile);
              const uploadRes = await fetch('/api/admin/gifts/upload-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
              });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                // Store the image ID for the gift
                imageReference = {
                  imageId: uploadData.imageId
                };
              }
            }
            
            const giftData = {
              title: values.title,
              description: values.description,
              available: parseInt(values.available),
              amount: parseInt(values.amount),
              image: imageReference
            };
            
            const r = await api(`/api/admin/gifts?lang=${getUserLanguage()}`, { 
              method:'POST', 
              headers:{'Content-Type':'application/json'}, 
              body: JSON.stringify(giftData)
            });
            if (!r.ok) {
              const errorData = await r.json();
              throw new Error(errorData.error || 'Failed to create gift');
            }
            close();
            showGifts();
          } catch (error) {
            throw error;
          }
        }
      });
    });
  }

  // ========== Messages ==========
  // State for admin messages pagination
  let adminMessagesState = {
    messages: [],
    nextCursor: null,
    hasMoreMessages: true,
    isLoadingMessages: false,
    limit: 15
  };

  // Global delete function for onclick handlers
  window.deleteMessage = async function(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const r = await api(`/api/admin/messages/${messageId}`, {
        method: 'DELETE'
      });
      
      if (r.ok) {
        // Remove the message from the DOM with animation
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
          messageElement.style.opacity = '0';
          messageElement.style.transform = 'translateX(-20px)';
          setTimeout(() => {
            messageElement.remove();
            // Also remove from state
            adminMessagesState.messages = adminMessagesState.messages.filter(m => m.id !== messageId);
            // Check if there are no more messages
            const remainingMessages = document.querySelectorAll('.message-item');
            if (remainingMessages.length === 0) {
              const messagesList = document.getElementById('adminMessagesList');
              if (messagesList) {
                messagesList.innerHTML = `
                  <div class="no-messages">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Guests will appear here when they post comments.</p>
                  </div>
                `;
              }
            }
          }, 300);
        }
        notify('Message deleted successfully', 'success');
      } else {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      notify('Error deleting message: ' + error.message, 'error');
    }
  };

  // Load admin messages with cursor-based pagination
  async function loadAdminMessages(options = {}) {
    const { cursor = null, fromBeginning = false, append = false } = options;
    
    if (adminMessagesState.isLoadingMessages) return;
    adminMessagesState.isLoadingMessages = true;

    // Show loading indicator
    const loadingEl = document.getElementById('adminMessagesLoading');
    if (loadingEl) {
      loadingEl.style.display = 'flex';
    }

    try {
      const url = new URL('/api/admin/messages', window.location.origin);
      url.searchParams.append('limit', adminMessagesState.limit);
      if (!fromBeginning && cursor) {
        url.searchParams.append('cursor', cursor);
      }

      const response = await api(url.toString());

      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        adminMessagesState.nextCursor = data.nextCursor || null;
        adminMessagesState.hasMoreMessages = adminMessagesState.nextCursor !== null;

        const newMessages = items.map(msg => ({
          id: msg.id,
          author: msg.author || 'Guest',
          body: msg.body || '',
          createdAt: msg.createdAt
        }));

        if (append) {
          adminMessagesState.messages = [...adminMessagesState.messages, ...newMessages];
        } else {
          adminMessagesState.messages = newMessages;
        }
      }
    } catch (error) {
      console.error('Error loading admin messages:', error);
    } finally {
      adminMessagesState.isLoadingMessages = false;
      // Hide loading indicator
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
    }

    renderAdminMessages();
  }

  // Setup infinite scroll for admin messages
  function setupAdminMessagesInfiniteScroll() {
    const container = document.getElementById('adminMessagesList');
    if (!container) return;

    // Remove existing sentinel if any
    const existingSentinel = document.getElementById('admin-messages-scroll-sentinel');
    if (existingSentinel) {
      existingSentinel.remove();
    }

    const sentinel = document.createElement('div');
    sentinel.id = 'admin-messages-scroll-sentinel';
    sentinel.style.height = '1px';
    container.appendChild(sentinel);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && adminMessagesState.hasMoreMessages && !adminMessagesState.isLoadingMessages) {
          loadAdminMessages({ cursor: adminMessagesState.nextCursor, append: true });
        }
      });
    }, { rootMargin: '100px' });

    observer.observe(sentinel);
  }

  async function showMessages(){
    activate('messages');
    setLoading(translate('admin:loadingMessages'));

    // Reset state
    adminMessagesState = {
      messages: [],
      nextCursor: null,
      hasMoreMessages: true,
      isLoadingMessages: false,
      limit: 15
    };

    try {
      content.innerHTML = `
        <div class="admin-content">
          <div class="messages-header">
            <h3><i class="fas fa-comments"></i> <div data-i18n="admin:messages.title">${translate('admin:messages.title')}</div></h3>
            <p class="messages-subtitle"><div data-i18n="admin:messages.subtitle">${translate('admin:messages.subtitle')}</div></p>
          </div>
          
          <!-- Messages list -->
          <div class="messages-list" id="adminMessagesList">
            <div id="adminMessagesLoading" class="loading-messages" style="display: flex;">
              <i class="fas fa-spinner fa-spin"></i>
              <span><div data-i18n="admin:messages.loading">${translate('admin:messages.loading')}</div></span>
            </div>
          </div>
        </div>
      `;
      
      // Load initial messages
      await loadAdminMessages({ fromBeginning: true });
      
      // Setup infinite scroll
      setupAdminMessagesInfiniteScroll();
      
    } catch (error) {
      console.error('Error loading messages:', error);
      content.innerHTML = `
        <div class="admin-content">
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3><div data-i18n="admin:messages.errorTitle">${translate('admin:messages.errorTitle')}</div></h3>
            <p>${translateWithVars('admin:messages.errorMessage', { error: error.message })}</p>
            <button onclick="showMessages()" class="btn-retry">
              <i class="fas fa-redo"></i> <div data-i18n="admin:messages.retry">${translate('admin:messages.retry')}</div>
            </button>
          </div>
        </div>
      `;
    }
  }

  // Render admin messages with delete functionality
  function renderAdminMessages() {
    const messagesList = document.getElementById('adminMessagesList');
    if (!messagesList) return;

    // Keep the sentinel if it exists
    const sentinel = document.getElementById('admin-messages-scroll-sentinel');

    if (adminMessagesState.messages.length === 0 && !adminMessagesState.isLoadingMessages) {
      messagesList.innerHTML = `
        <div class="no-messages">
          <i class="fas fa-comments"></i>
          <p><div data-i18n="admin:messages.noMessages">${translate('admin:messages.noMessages')}</div></p>
        </div>
      `;
      if (sentinel) messagesList.appendChild(sentinel);
      return;
    }

    // Sort messages by date (most recent first)
    const sortedMessages = adminMessagesState.messages.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    const messagesHTML = sortedMessages.map(message => {
      const authorName = message.author || message.name || 'Guest';
      const body = message.body || message.content || '';
      const createdAt = message.createdAt;
      const messageId = message.id;
      
      return `
        <div class="message-item" data-message-id="${messageId}">
          <div class="message-header">
            <span class="message-author">${escapeHtml(authorName)}</span>
            <span class="message-date">${formatMessageDate(createdAt)}</span>
          </div>
          <div class="message-content">${escapeHtml(body)}</div>
          <div class="message-actions">
            <button class="admin-action danger" onclick="deleteMessage('${messageId}')" title="Delete message">
              <i class="fas fa-trash"></i>
              <div data-i18n="admin:messages.delete">${translate('admin:messages.delete')}</div>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Add loading indicator at the bottom
    const loadingHTML = `
      <div id="adminMessagesLoading" class="loading-messages" style="display: ${adminMessagesState.isLoadingMessages ? 'flex' : 'none'};">
        <i class="fas fa-spinner fa-spin"></i>
        <span><div data-i18n="admin:messages.loading">${translate('admin:messages.loading')}</div></span>
      </div>
    `;

    messagesList.innerHTML = messagesHTML + loadingHTML;
    
    if (sentinel) messagesList.appendChild(sentinel);
    
    // Re-setup infinite scroll sentinel if needed
    if (!sentinel && adminMessagesState.hasMoreMessages) {
      setupAdminMessagesInfiniteScroll();
    }
  }

  // Format message date for display
  function formatMessageDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(getUserLanguage(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }





  // ========== Event schedule ==========
  async function showEvent(){
    activate('event');
    setLoading(translate('admin:loadingEventSchedule'));
    const res = await api(`/api/admin/events?lang=${getUserLanguage()}`);
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
          ${imageUrl ? `<img src="${imageUrl}" alt="Event image" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" onload="this.style.display='block';this.nextElementSibling.style.display='none';"><span style="color: #999; display: none;"><div data-i18n="admin:events.noImage">${translate('admin:events.noImage')}</div></span>` : '<span style="color: #999;"><div data-i18n="admin:events.noImage">' + translate('admin:events.noImage') + '</div></span>'}
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
      title: `<div data-i18n="admin:events.title">${translate('admin:events.title')}</div>`, 
      columns:[
        `<div data-i18n="admin:events.table.name">${translate('admin:events.table.name')}</div>`,
        `<div data-i18n="admin:events.table.date">${translate('admin:events.table.date')}</div>`,
        `<div data-i18n="admin:events.table.startTime">${translate('admin:events.table.startTime')}</div>`,
        `<div data-i18n="admin:events.table.endTime">${translate('admin:events.table.endTime')}</div>`,
        `<div data-i18n="admin:events.table.title">${translate('admin:events.table.title')}</div>`,
        `<div data-i18n="admin:events.table.image">${translate('admin:events.table.image')}</div>`,
        `<div data-i18n="admin:events.table.actions">${translate('admin:events.table.actions')}</div>`
      ]
    }, rows, `<button id="addEvent" class="admin-action"><i class="fas fa-plus"></i> <span data-i18n="admin:events.addEvent">${translate('admin:events.addEvent')}</span></button>`);
    
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; 
      const id = btn.dataset.id; 
      const action = btn.dataset.action;
      const current = (data||[]).find(x => String(x.id) === String(id)) || {};
      
      if (action==='del'){
        if (!confirm(translate('admin:events.confirmDelete'))) return;
        const r = await api(`/api/admin/events/${id}`, { method:'DELETE' }); 
        if (r.ok) showEvent(); else notify(translate('admin:events.errorDeleting'), 'error');
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
      title: isNew ? `<div data-i18n="admin:events.modal.addTitle">${translate('admin:events.modal.addTitle')}</div>` : `<div data-i18n="admin:events.modal.editTitle">${translate('admin:events.modal.editTitle')}</div>`,
      submitText: isNew ? `<span data-i18n="admin:events.add">${translate('admin:events.add')}</span>` : `<span data-i18n="admin:events.save">${translate('admin:events.save')}</span>`,
      showCurrentImage: showCurrentImage,
      currentImageUrl: currentImageUrl,
      fields: [
        { name:'name', label: translate('admin:events.field.name'), required:true, help: translate('admin:events.field.nameHelp') },
        { name:'date', label: translate('admin:events.field.date'), type:'date', required:true, help: translate('admin:events.field.dateHelp') },
        { name:'startTime', label: translate('admin:events.field.startTime'), type:'time', required:true, help: translate('admin:events.field.startTimeHelp') },
        { name:'endDate', label: translate('admin:events.field.endDate'), type:'date', help: translate('admin:events.field.endDateHelp') },
        { name:'endTime', label: translate('admin:events.field.endTime'), type:'time', help: translate('admin:events.field.endTimeHelp') },
        { name:'location', label: translate('admin:events.field.location'), type:'location', required:true, help: translate('admin:events.field.locationHelp') },
        { name:'title', label: translate('admin:events.field.title'), help: translate('admin:events.field.titleHelp') },
        { name:'description', label: translate('admin:events.field.description'), type:'textarea', rows: 3, help: translate('admin:events.field.descriptionHelp') },
        { name:'image', label: translate('admin:events.field.image'), type:'file', help: translate('admin:events.field.imageHelp') },
        { name:'imagePreview', label:'Current Image', type:'imagePreview' }
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
          let imageReference = event.image;
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
          
          const url = isNew ? '/api/admin/events?lang=${getUserLanguage()}' : `/api/admin/events/${event.id}?lang=${getUserLanguage()}`;
          const method = isNew ? 'POST' : 'PUT';
          
          const r = await api(url, { 
            method, 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify(eventData)
          });
          
          if (!r.ok) throw new Error(isNew ? translate('admin:events.error.create') : translate('admin:events.error.update'));
          
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
          <h3 style="margin:0;color:#333;"><div data-i18n="admin:subEvents.manageTitle">${translateWithVars('admin:subEvents.manageTitle', { eventName: event.name })}</div></h3>
          <button id="closeSubEvents" class="admin-action" style="background:#6c757d;color:#fff;border:none;padding:8px 12px;border-radius:8px;"><div data-i18n="admin:subEvents.close">${translate('admin:subEvents.close')}</div></button>
        </div>
        <div style="padding:18px 24px;">
          <div style="margin-bottom:20px;">
            <button id="addSubEvent" class="admin-action">
              <i class="fas fa-plus"></i> <div data-i18n="admin:subEvents.addSubEvent">${translate('admin:subEvents.addSubEvent')}</div>
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
            `).join('') : '<p style="text-align:center;color:#999;padding:20px;"><div data-i18n="admin:subEvents.noSubEvents">' + translate('admin:subEvents.noSubEvents') + '</div></p>'}
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
        if (confirm(translate('admin:subEvents.deleteConfirm'))) {
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
      title: isNew ? `<div data-i18n="admin:subEvents.addTitle">${translate('admin:subEvents.addTitle')}</div>` : `<div data-i18n="admin:subEvents.editTitle">${translate('admin:subEvents.editTitle')}</div>`,
      submitText: isNew ? `<div data-i18n="admin:subEvents.add">${translate('admin:subEvents.add')}</div>` : `<div data-i18n="admin:subEvents.save">${translate('admin:subEvents.save')}</div>`,
      fields: [
        { name:'name', label: translate('admin:subEvents.field.name'), required:true, help: translate('admin:subEvents.field.nameHelp') },
        { name:'date', label: translate('admin:subEvents.field.date'), type:'date', required:true, default: defaultDate },
        { name:'startTime', label: translate('admin:subEvents.field.startTime'), type:'time', required:true, default: defaultStartTime },
        { name:'endTime', label: translate('admin:subEvents.field.endTime'), type:'time', required:true, default: defaultEndTime },
        { name:'description', label: translate('admin:subEvents.field.description'), type:'textarea', rows: 3, help: translate('admin:subEvents.field.descriptionHelp') },
        { name:'icon', label: translate('admin:subEvents.field.icon'), type:'select', required:true, 
          options: [
            { value: 'ceremony', label: translate('admin:subEvents.option.ceremony') },
            { value: 'cocktails', label: translate('admin:subEvents.option.cocktails') },
            { value: 'reception', label: translate('admin:subEvents.option.reception') },
            { value: 'dancing', label: translate('admin:subEvents.option.dancing') }
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
      const r = await api(`/api/admin/events/${eventId}?lang=${getUserLanguage()}`, {
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
    setLoading(translate('admin:loadingCourses'));
    
    try {
      const res = await api(`/api/admin/courseData?lang=${getUserLanguage()}`);
      const data = res.ok ? await res.json() : [];
      
      // Group by course type for better organization
      const courseGroups = {
        starter: [],
        main: [],
        dessert: [],
        drinks: []
      };
      
      (data || []).forEach(part => {
        if (courseGroups[part.course]) {
          courseGroups[part.course].push(part);
        }
      });
      
      const courseIcons = {
        starter: 'fa-utensils',
        main: 'fa-drumstick-bite',
        dessert: 'fa-birthday-cake',
        drinks: 'fa-wine-glass-alt'
      };
      
      const courseNames = {
        starter: translate('admin:menu.courseType.starter'),
        main: translate('admin:menu.courseType.main'),
        dessert: translate('admin:menu.courseType.dessert'),
        drinks: translate('admin:menu.courseType.drinks')
      };
      
      let menuContent = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 style="margin:0;"><div data-i18n="admin:menu.title">${translate('admin:menu.title')}</div></h3>
          </div>
          
          <div class="menu-overview">
      `;
      
      // Render each course group
      Object.keys(courseGroups).forEach(courseType => {
        const parts = courseGroups[courseType];
        menuContent += `
          <div class="course-section">
            <div class="course-header">
              <i class="fas ${courseIcons[courseType]}"></i>
              <h4><div data-i18n="admin:menu.courseType.${courseType}">${courseNames[courseType]}</div></h4>
              <span class="count-badge">${parts.length}</span>
              <button class="admin-action" onclick="openAddMenuForm('${courseType}')" title="${translate('admin:menu.addCourse')}">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <div class="course-parts">
        `;
        
        if (parts.length === 0) {
          menuContent += `
            <div class="empty-course">
              <p><div data-i18n="admin:menu.emptyCourse">${translateWithVars('admin:menu.emptyCourse', { courseType: courseNames[courseType].toLowerCase() })}</div></p>
            </div>
          `;
        } else {
          parts.forEach(part => {
            // Determine if course has selectable options or is fixed
            const selectionIcon = part.selectionRequired === true 
              ? '<i class="fas fa-list" title="Selectable - Guests must choose one option" style="color: #007bff; margin-left: 8px;"></i>'
              : '<i class="fas fa-check" title="Fixed - All options will be provided" style="color: #28a745; margin-left: 8px;"></i>';
            
            menuContent += `
              <div class="menu-course-card" data-id="${part.id}">
                <div class="menu-course-header">
                  <div class="course-title-section">
                    <h5>${part.label}</h5>
                    ${selectionIcon}
                  </div>
                  <div class="menu-course-actions">
                    <button class="admin-action" onclick="editMenuCourseOption('${part.id}')" title="Add Option">
                      <i class="fas fa-plus"></i>
                    </button>
                    <button class="admin-action" onclick="editMenuCourse('${part.id}')" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-action danger" onclick="deleteMenuCourse('${part.id}')" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div class="menu-options">
                  ${(part.options || []).map(option => `
                    <div class="menu-option">
                      <div class="option-info">
                        <div class="option-header">
                          <span class="option-label">${option.label}</span>
                          ${option.dietaryIcons || ''}
                        </div>
                        ${option.description ? `<small class="option-description">${option.description}</small>` : ''}
                      </div>
                      ${option.image ? `<img src="${option.image}" alt="${option.label}" class="option-image" onerror="this.style.display='none'">` : ''}
                      <button class="admin-action" onclick="editMenuCourseOption('${part.id}', '${option.id}')" title="Edit Option">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="admin-action danger" onclick="deleteMenuCourseOption('${part.id}', '${option.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  `).join('')}
                  ${(part.options || []).length === 0 ? '<p class="no-options"><div data-i18n="admin:menu.noOptionsDefined">' + translate('admin:menu.noOptionsDefined') + '</div></p>' : ''}
                </div>
              </div>
            `;
          });
        }
        
        menuContent += `
            </div>
          </div>
        `;
      });
      
      menuContent += `
          </div>
        </div>
      `;
      
      content.innerHTML = menuContent;
      
      // Add global add button handler
      content.querySelector('#addMenuCourse')?.addEventListener('click', () => {
        openAddMenuForm();
      });
      
    } catch(e) { 
      console.error('Error loading menu:', e); 
      notify('Error loading menu: ' + e.message, 'error'); 
      content.innerHTML = `
        <div class="admin-content">
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3><div data-i18n="admin:menu.errorLoading">${translate('admin:menu.errorLoading')}</div></h3>
            <p>${translateWithVars('admin:menu.failedToLoad', { error: e.message })}</p>
            <button onclick="showMenu()" class="btn-retry">
              <i class="fas fa-redo"></i> <div data-i18n="admin:menu.retry">${translate('admin:menu.retry')}</div>
            </button>
          </div>
        </div>`;
    }
  }
  
  // Global functions for menu management
  window.openAddMenuForm = function(courseType = '') {
    openMenuCourseForm(null, courseType);
  };
  
  window.editMenuCourse = function(id) {
    openMenuCourseForm(id, null);
  };
  
  window.editMenuCourseOption = function (courseId, optionId = null) {
    openMenuCourseOptionsForm(courseId, optionId);
  };
  
  window.deleteMenuCourse = async function(courseId) {
    if (!confirm(translate('admin:menu.confirmDelete'))) return;
    
    try {
      const r = await api(`/api/admin/courseData/${courseId}`, { method: 'DELETE' });
      if (r.ok) {
        showMenu();
      } else {
        notify(translate('admin:menu.errorDeleting'), 'error');
      }
    } catch (error) {
      notify(translateWithVars('admin:menu.errorDeleting', { error: error.message }), 'error');
    }
  };

  window.deleteMenuCourseOption = async function(courseId, optionId) {
    if (!confirm(translate('admin:menu.confirmDeleteOption'))) return;
    
    try {
      const r = await api(`/api/admin/courseData/${courseId}/options/${optionId}`, { method: 'DELETE' });
      if (r.ok) {
        showMenu();
      } else {
        notify(translate('admin:menu.errorDeletingOption'), 'error');
      }
    } catch (error) {
      notify(translateWithVars('admin:menu.errorDeletingOption', { error: error.message }), 'error');
    }
  };

  function openMenuCourseForm(courseId = null, defaultCourse = '') {
    // Load existing menu data for editing
    let existingData = null;
    
    const loadExistingData = async () => {
      if (courseId) {
        try {
          const res = await api(`/api/admin/courseData?lang=${getUserLanguage()}`);
          if (res.ok) {
            const data = await res.json();
            existingData = data.find(part => part.id === courseId) || null;
          }
        } catch (error) {
          console.error('Error loading menu part data:', error);
        }
      }
    };
    
    const showForm = () => {
      const isEditing = !!existingData;
      
      openFormModal({
        title: isEditing ? `<div data-i18n="admin:menu.editCourse">${translate('admin:menu.editCourse')}</div>` : `<div data-i18n="admin:menu.addCourse">${translate('admin:menu.addCourse')}</div>`,
        submitText: isEditing ? `<span data-i18n="admin:menu.save">${translate('admin:menu.save')}</span>` : `<span data-i18n="admin:menu.add">${translate('admin:menu.add')}</span>`,
        fields: [
          { 
            name: 'course', 
            label: translate('admin:menu.field.courseType'), 
            type: 'select', 
            required: true,
            options: [
              { value: 'starter', label: translate('admin:menu.option.starter') },
              { value: 'main', label: translate('admin:menu.option.main') },
              { value: 'dessert', label: translate('admin:menu.option.dessert') },
              { value: 'drinks', label: translate('admin:menu.option.drinks') }
            ]
          },
          { name: 'label', label: translate('admin:menu.field.courseLabel'), required: true, help: translate('admin:menu.field.courseLabelHelp') },
          { name: 'selectionRequired', label: translate('admin:menu.field.selectionRequired'), type: 'select', 
            help: translate('admin:menu.field.helpSelectionRequired'),
            options: [
              { value: 'true', label: translate('admin:menu.option.yes') },
              { value: 'false', label: translate('admin:menu.option.no') }
            ]
          },
        ],
        initialValues: {
          course: existingData?.course || defaultCourse || 'starter',
          label: existingData?.label || '',
          selectionRequired: existingData?.selectionRequired !== undefined ? String(existingData.selectionRequired) : 'true'
        },
        onSubmit: async (values, close) => {
          try {
            const courseData = {
              course: values.course,
              label: values.label,
              selectionRequired: values.selectionRequired === 'true'
            };
            
            const url = courseId ? `/api/admin/courseData/${courseId}?lang=${getUserLanguage()}` : `/api/admin/courseData?lang=${getUserLanguage()}`;
            const method = courseId ? 'PUT' : 'POST';
            
            const r = await api(url, { 
              method, 
              headers: {'Content-Type': 'application/json'}, 
              body: JSON.stringify(courseData)
            });
            
            if (!r.ok) {
              const errorData = await r.json().catch(() => ({}));
              const action = courseId ? 'update' : 'create';
              throw new Error(errorData.error || translateWithVars(`admin:menu.error.${action}Course`));
            }
            
            close();
            showMenu();
          } catch (error) {
            throw error;
          }
        }
      });
    };
    
    if (courseId) {
      loadExistingData().then(showForm);
    } else {
      showForm();
    }
  }

  function openMenuCourseOptionsForm(courseId, optionId = null) {
    // Load existing menu data for editing
    let existingData = null;
    
    const loadExistingData = async () => {
      if (optionId) {
        try {
          const res = await api(`/api/admin/courseData/${courseId}/options/${optionId}?lang=${getUserLanguage()}`);
          if (res.ok) {
            const data = await res.json();
            existingData = data;
          }
        } catch (error) {
          console.error('Error loading course option data:', error);
        }
      }
    };
    
    const showForm = () => {
      const isEditing = !!existingData;
      
      // Get current image URL for display
      const currentImageUrl = existingData?.image || null;
      const showCurrentImage = isEditing && currentImageUrl;
      
      openFormModal({
        title: isEditing ? `<div data-i18n="admin:menu.editCourseOption">${translate('admin:menu.editCourseOption')}</div>` : `<div data-i18n="admin:menu.addCourseOption">${translate('admin:menu.addCourseOption')}</div>`,
        submitText: isEditing ? `<span data-i18n="admin:menu.save">${translate('admin:menu.save')}</span>` : `<span data-i18n="admin:menu.add">${translate('admin:menu.add')}</span>`,
        showCurrentImage: showCurrentImage,
        currentImageUrl: currentImageUrl,
        fields: [
          { name: 'label', label: translate('admin:menu.field.option'), required: true, help: translate('admin:menu.field.optionHelp') },
          { name: 'image', label: translate('admin:menu.field.image'), type: 'file', help: translate('admin:menu.field.imageHelp') },
          { name: 'description', label: translate('admin:menu.field.optionDescription'), type: 'textarea', required: false, help: translate('admin:menu.field.optionDescriptionHelp') },
          // Special Dietary Indicators
          { name: 'isVegetarian', label: translate('admin:menu.field.isVegetarian'), type: 'checkbox', help: translate('admin:menu.field.helpVegetarian') },
          { name: 'containsAllergens', label: translate('admin:menu.field.containsAllergens'), type: 'checkbox', help: translate('admin:menu.field.helpAllergens') },
          { name: 'containsLactose', label: translate('admin:menu.field.containsLactose'), type: 'checkbox', help: translate('admin:menu.field.helpLactose') },
          { name: 'isSpicy', label: translate('admin:menu.field.isSpicy'), type: 'checkbox', help: translate('admin:menu.field.helpSpicy') },
          { name: 'containsNuts', label: translate('admin:menu.field.containsNuts'), type: 'checkbox', help: translate('admin:menu.field.helpNuts') },
        ],
        initialValues: {
          label: existingData?.label || '',
          image: existingData?.image || '',
          description: existingData?.description || '',
          isVegetarian: existingData?.isVegetarian || false,
          containsAllergens: existingData?.containsAllergens || false,
          containsLactose: existingData?.containsLactose || false,
          isSpicy: existingData?.isSpicy || false,
          containsNuts: existingData?.containsNuts || false
        },
        onSubmit: async (values, close, modal) => {
          try {
            // Handle image upload
            let imageReference = null;
            const imageFile = document.getElementById('f_image')?.files[0];
            if (imageFile) {
              const formData = new FormData();
              formData.append('image', imageFile);
              const uploadRes = await fetch('/api/admin/menu-options/upload-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
              });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                // Store the image ID for the menu option
                imageReference = {
                  imageId: uploadData.imageId
                };
              }
            } else if (existingData?.image) {
              // Keep existing image reference for edit mode
              if (typeof existingData.image === 'string') {
                if (existingData.image.startsWith('data:')) {
                  // Base64 data - keep as is
                  imageReference = existingData.image;
                } else if (existingData.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(existingData.image)) {
                  // ObjectId string - keep as is
                  imageReference = existingData.image;
                } else {
                  // Legacy URL-based image - keep as is
                  imageReference = existingData.image;
                }
              } else if (existingData.image && typeof existingData.image === 'object') {
                // Database-stored image object - keep the reference
                if (existingData.image.imageId) {
                  // New format with imageId
                  imageReference = { imageId: existingData.image.imageId };
                } else if (existingData.image._id) {
                  // MongoDB ObjectId reference
                  imageReference = existingData.image._id.toString();
                } else {
                  // Other object format - keep as is
                  imageReference = existingData.image;
                }
              }
            }
            
            const courseData = {
              label: values.label,
              image: imageReference,
              description: values.description,
              isVegetarian: values.isVegetarian || false,
              containsAllergens: values.containsAllergens || false,
              containsLactose: values.containsLactose || false,
              isSpicy: values.isSpicy || false,
              containsNuts: values.containsNuts || false
            };
            
            const url = optionId ? `/api/admin/courseData/${courseId}/options/${optionId}?lang=${getUserLanguage()}` : `/api/admin/courseData/${courseId}/options?lang=${getUserLanguage()}`;
            const method = optionId ? 'PUT' : 'POST';
            
            const r = await api(url, { 
              method, 
              headers: {'Content-Type': 'application/json'}, 
              body: JSON.stringify(courseData)
            });
            
            if (!r.ok) {
              const errorData = await r.json().catch(() => ({}));
              const action = optionId ? 'update' : 'create';
              throw new Error(errorData.error || translateWithVars(`admin:menu.error.${action}CourseOption`));
            }
            
            close();
            showMenu();
          } catch (error) {
            throw error;
          }
        }
      });
    };
    
    if (optionId) {
      loadExistingData().then(showForm);
    } else {
      showForm();
    }
  }
  




  // ========== Settings ==========
  async function showSettings(){
    activate('configuration');
    setLoading(translate('admin:loadingSettings'));
    
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
        <h3><i class="fas fa-cog"></i> <div data-i18n="admin:settings.title">${translate('admin:settings.title')}</div></h3>
        
        <!-- Feature Toggles -->
        <div class="settings-section">
          <h4><i class="fas fa-toggle-on"></i> <div data-i18n="admin:settings.featureToggles">${translate('admin:settings.featureToggles')}</div></h4>
          <p style="color:#666;margin-bottom:20px;"><div data-i18n="admin:settings.featureTogglesDescription">${translate('admin:settings.featureTogglesDescription')}</div></p>
          
          <div class="feature-toggles-grid">
            ${[
              { key: 'guestsEnabled', label: 'admin:settings.enableGuestArea', icon: 'fa-users', desc: 'admin:settings.enableGuestAreaDesc' },
              { key: 'eventsEnabled', label: 'admin:settings.showWeddingEvents', icon: 'fa-calendar-alt', desc: 'admin:settings.showWeddingEventsDesc' },
              { key: 'menuEnabled', label: 'admin:settings.menu', icon: 'fa-utensils', desc: 'admin:settings.menuDesc' },
              { key: 'messagesEnabled', label: 'admin:settings.messages', icon: 'fa-comments', desc: 'admin:settings.messagesDesc' },
              { key: 'giftsEnabled', label: 'admin:settings.gifts', icon: 'fa-gift', desc: 'admin:settings.giftsDesc' }
            ].map(feature => `
              <div class="feature-toggle-card ${settings[feature.key] ? 'enabled' : 'disabled'}">
                <div class="feature-toggle-header">
                  <i class="fas ${feature.icon}"></i>
                  <h5><div data-i18n="${feature.label}">${translate(feature.label)}</div></h5>
                  <div class="toggle-switch">
                    <input type="checkbox" id="toggle-${feature.key}" ${settings[feature.key] ? 'checked' : ''}>
                    <label for="toggle-${feature.key}" onclick="updateFeatureToggle('${feature.key}', !document.getElementById('toggle-${feature.key}').checked)"></label>
                  </div>
                </div>
                <p class="feature-desc"><div data-i18n="${feature.desc}">${translate(feature.desc)}</div></p>
                <div class="feature-status">
                  <span class="status-badge ${settings[feature.key] ? 'active' : 'inactive'}">
                    <span data-i18n="admin:settings.${settings[feature.key] ? 'enabled' : 'disabled'}">${translate('admin:settings.' + (settings[feature.key] ? 'enabled' : 'disabled'))}</span>
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
    

    
    const btnLock = document.getElementById('btnLock');
    const btnUnlock = document.getElementById('btnUnlock');
  }
  
  // Update feature toggle function (global scope)
  window.updateFeatureToggle = async function(featureKey, enabled) {
    try {
      // Get current state of all toggles
      const currentSettings = {
        guestsEnabled: featureKey === 'guestsEnabled' ? enabled : (document.getElementById('toggle-guestsEnabled')?.checked || false) ,
        eventsEnabled: featureKey === 'eventsEnabled' ? enabled : (document.getElementById('toggle-eventsEnabled')?.checked || false),
        menuEnabled: featureKey === 'menuEnabled' ? enabled : (document.getElementById('toggle-menuEnabled')?.checked || false),
        messagesEnabled: featureKey === 'messagesEnabled' ? enabled : (document.getElementById('toggle-messagesEnabled')?.checked || false),
        giftsEnabled: featureKey === 'giftsEnabled' ? enabled : (document.getElementById('toggle-giftsEnabled')?.checked || false)
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
          toggle.classList.remove('checked');
          card.classList.remove('disabled');
          card.classList.add('enabled');
          badge.textContent = 'Enabled';
          badge.classList.remove('inactive');
          badge.classList.add('active');
        } else {
          toggle.classList.add('checked');
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
  


  // Router for tabs
  function showTab(tab){
    localStorage.setItem('adminPage', tab);

    
    switch(tab){
      case 'guests': return showGuests();
      case 'gifts': return showGifts();
      case 'messages': return showMessages();
      case 'event': return showEvent();
      case 'menu': return showMenu();
      case 'configuration': return showSettings();
      default:
        setLoading(translate('admin:loading'));
    }
  }

  // Events
  if (logoutBtn){
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      window.location.href = 'index.html';
    });
  }
  tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
  
  const savedPage = localStorage.getItem('adminPage') || 'guests';

  // Initialize
  console.log('Initializing admin page');
  updateDocumentDirection();
  updatePageContent();
  updateLanguageSelector();
  updateFormatting();
    
  // Default
  showTab(savedPage);

  window.addEventListener('languageChanged', (event) => {
    const newLanguage = event.detail.language;
    const savedPage = localStorage.getItem('adminPage') || 'guests';
    showTab(savedPage);
    console.log('Content refreshed for language:', newLanguage);
  });
})();

