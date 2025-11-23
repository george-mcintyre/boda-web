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

  // Image preloading and caching
  let imageCache = {};
  let imagesPreloaded = false;

  function preloadGiftCardImages() {
    if (imagesPreloaded) return;
    
    // Preload all 30 gift card images
    for (let i = 1; i <= 30; i++) {
      const paddedNumber = String(i).padStart(2, '0');
      const imageUrl = `/assets/images/gift-cards/image_${paddedNumber}.jpg`;
      
      const img = new Image();
      img.src = imageUrl;
      
      // Cache the image for instant access
      imageCache[i] = {
        id: i,
        label: `Gift Card ${i}`,
        imageUrl: imageUrl,
        element: img
      };
    }
    
    imagesPreloaded = true;
    console.log('Preloaded all 30 gift card images');
  }

  function getCachedImageOptions(selectedValue) {
    const options = [];
    for (let i = 1; i <= 30; i++) {
      options.push({
        value: i,
        label: `Gift Card ${i}`,
        imageUrl: imageCache[i].imageUrl,
        cached: true
      });
    }
    return options;
  }

  // Custom image dropdown component
  function createImageDropdown(id, name, options, selectedValue) {
    // Ensure styles are loaded
    addImageDropdownStyles();
    
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
    
    options.forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'image-dropdown-option';
      if (String(option.value) === String(selectedValue)) {
        optionDiv.classList.add('selected');
      }
      
      optionDiv.innerHTML = `
        <img src="${option.imageUrl}" alt="${option.label}">
        <span>${option.label}</span>
      `;
      
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
  function openFormModal({ title = 'Form', submitText = 'Save', fields = [], initialValues = {}, onSubmit }){
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
        ${fields.map(f => {
          const id = `f_${f.name}`;
          const label = `<label for="${id}" style="display:block;margin:6px 0 6px 0;font-weight:600;color:#333;">${f.label}${f.required?' *':''}</label>`;
          const val = initialValues[f.name] ?? f.default ?? '';
          const baseStyle = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;';
          let inputHtml = '';
          
          if (f.type === 'textarea') {
            inputHtml = `<textarea id="${id}" name="${f.name}" rows="${f.rows||3}" style="${baseStyle}">${val!==undefined?String(val):''}</textarea>`;
          } else if (f.type === 'select') {
            // Check if this is an image dropdown
            if (f.showImages && f.options && f.options.length > 0 && f.options[0].imageUrl) {
              const imageOptions = f.options.map(opt => ({
                value: opt.value,
                label: opt.label,
                imageUrl: opt.imageUrl
              }));
              
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
        const el = modal.querySelector(`#f_${f.name}`);
        let v = el ? el.value : '';
        if (f.type === 'number') v = v === '' ? '' : Number(v);
        if (f.required && (v === '' || v === null || v === undefined || (f.type==='number' && Number.isNaN(v)))) valid = false;
        data[f.name] = v;
      });
      if (!valid){
        const err = modal.querySelector('#mfError');
        err.textContent = 'Please fill all required fields correctly.';
        err.style.display = 'block';
        return;
      }
      Promise.resolve(onSubmit && onSubmit(data, close)).catch(err => {
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
    
    // Preload gift card images for instant dropdown access
    preloadGiftCardImages();
    
    // Load gifts (we'll use cached images for the dropdown)
    const giftsRes = await api('/api/admin/gifts');
    const gifts = giftsRes.ok ? await giftsRes.json() : [];
    
    // Use cached image options for instant access
    const imageOptions = getCachedImageOptions();
    
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
    const rows = (data||[]).map(ev => `
      <tr>
        <td>${ev.evento||''}</td>
        <td>${ev.fecha||''}</td>
        <td>${ev.hora||''}</td>
        <td>${ev.lugar||''}</td>
        <td>${ev.descripcion||''}</td>
        <td>
          <button class="admin-action" data-action="edit" data-id="${ev.id}"><i class="fas fa-edit"></i></button>
          <button class="admin-action danger" data-action="del" data-id="${ev.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
    content.innerHTML = renderTable({title:'Event Schedule', columns:['Event','Date','Time','Place','Description','Actions']}, rows,
      `<button id="addEvent" class="admin-action"><i class=\"fas fa-plus\"></i> Add</button>`);
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; const id = btn.dataset.id; const action = btn.dataset.action;
      const current = (data||[]).find(x => String(x.id) === String(id)) || {};
      if (action==='del'){
        if (!confirm('Delete this event?')) return;
        const r = await api(`/api/admin/events/${id}`, { method:'DELETE' }); if (r.ok) showEvent(); else notify('Error','error');
      } else if (action==='edit'){
        openFormModal({
          title: 'Edit event', submitText: 'Save',
          fields: [
            { name:'evento', label:'Event', required:true },
            { name:'fecha', label:'Date', type:'date' },
            { name:'hora', label:'Time', type:'time' },
            { name:'lugar', label:'Place' },
            { name:'descripcion', label:'Description', type:'textarea' },
          ],
          initialValues: {
            evento: current.evento || current.titulo || current.nombre || '',
            fecha: current.fecha || '',
            hora: current.hora || '',
            lugar: current.lugar || '',
            descripcion: current.descripcion || ''
          },
          onSubmit: async (values, close) => {
            const r = await api(`/api/admin/events/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
            if (!r.ok) throw new Error('Failed to update');
            close();
            showEvent();
          }
        });
      }
    });
    content.querySelector('#addEvent').addEventListener('click', async ()=>{
      openFormModal({
        title: 'Add event', submitText: 'Add',
        fields: [
          { name:'evento', label:'Event', required:true },
          { name:'fecha', label:'Date', type:'date' },
          { name:'hora', label:'Time', type:'time' },
          { name:'lugar', label:'Place' },
          { name:'descripcion', label:'Description', type:'textarea' },
        ],
        onSubmit: async (values, close) => {
          const r = await api('/api/admin/events', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
          if (!r.ok) throw new Error('Failed to create');
          close();
          showEvent();
        }
      });
    });
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
    const res = await api('/api/config/event/blocked');
    const cfg = res.ok ? await res.json() : {};
    const isBlocked = !!(cfg.event && cfg.event.blocked);
    const reason = (cfg.event && cfg.event.reason) || '';
    content.innerHTML = `
      <div class="admin-content">
        <h3><i class="fas fa-cog"></i> Settings</h3>
        <div class="config-grid">
          <div class="config-card">
            <h4>Event lock</h4>
            <p>Current state: <strong>${isBlocked?'Locked':'Open'}</strong></p>
            ${isBlocked?`<p>Reason: ${reason||'-'}</p>`:''}
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button id="btnLock" class="admin-action ${isBlocked?'disabled':''}" ${isBlocked?'disabled':''}><i class="fas fa-lock"></i> Lock</button>
              <button id="btnUnlock" class="admin-action ${!isBlocked?'disabled':''}" ${!isBlocked?'disabled':''}><i class="fas fa-lock-open"></i> Unlock</button>
            </div>
          </div>
        </div>
      </div>`;
    const btnLock = document.getElementById('btnLock');
    const btnUnlock = document.getElementById('btnUnlock');
    if (btnLock) btnLock.addEventListener('click', async ()=>{
      openFormModal({
        title: 'Lock event', submitText: 'Lock',
        fields: [ { name:'reason', label:'Reason', type:'textarea' } ],
        onSubmit: async (values, close) => {
          const r = await api('/api/config/event/blocked', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
          if (!r.ok) throw new Error('Failed to lock');
          close();
          showSettings();
        }
      });
    });
    if (btnUnlock) btnUnlock.addEventListener('click', async ()=>{
      const r = await api('/api/config/event/blocked', { method:'DELETE' });
      if (r.ok) showSettings(); else notify('Error','error');
    });
  }

  // Router for tabs
  function showTab(tab){
    // Add styles for party management
    addPartyStyles();
    
    // Preload gift card images when admin panel first loads
    preloadGiftCardImages();
    
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
