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
            const opts = (f.options||[]).map(opt => {
              const v = typeof opt === 'string' ? opt : opt.value;
              const t = typeof opt === 'string' ? opt : opt.label;
              const sel = String(val) === String(v) ? 'selected' : '';
              return `<option value="${v}" ${sel}>${t}</option>`;
            }).join('');
            inputHtml = `<select id="${id}" name="${f.name}" style="${baseStyle}">${opts}</select>`;
          } else {
            const type = f.type || 'text';
            inputHtml = `<input id="${id}" name="${f.name}" type="${type}" value="${val!==undefined?String(val):''}" style="${baseStyle}">`;
          }
          const help = f.help ? `<small style="display:block;color:#6c757d;margin-top:4px;">${f.help}</small>` : '';
          return `<div style="margin-bottom:14px;">${label}${inputHtml}${help}</div>`;
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
      
      content.innerHTML = renderTable({title:'Guests', columns:['Name','Email','Party Size','Actions']}, rows,
        `<button id="addGuest" class="admin-action"><i class="fas fa-user-plus"></i> Add Guest</button>
         <button id="bulkUploadGuests" class="admin-action" style="background:#17a2b8;"><i class="fas fa-file-upload"></i> Bulk Upload CSV</button>
         <div class="guest-summary" style="background:#f8f9fa;padding:15px;border-radius:8px;margin-top:15px;border-left:4px solid #28a745;">
           <h4 style="margin:0 0 8px 0;color:#28a745;"><i class="fas fa-users"></i> Total Guests: ${totalGuests}</h4>
           <p style="margin:0;color:#666;font-size:0.9em;">Across ${guests.length} party${guests.length !== 1 ? 'ies' : ''}</p>
         </div>`);
      
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
    const res = await api('/api/admin/gifts');
    const data = res.ok ? await res.json() : [];
    const rows = (data||[]).map(it => `
      <tr>
        <td>${it.nombre || ''}</td>
        <td>${it.descripcion||''}</td>
        <td>${it.precio||''}</td>
        <td>${it.categoria||''}</td>
        <td>${it.url?`<a href="${it.url}" target="_blank">link</a>`:''}</td>
        <td>
          <button class="admin-action" data-action="edit" data-id="${it.id}"><i class="fas fa-edit"></i></button>
          <button class="admin-action danger" data-action="del" data-id="${it.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
    content.innerHTML = renderTable({title:'Gift List', columns:['Name','Description','Price','Category','URL','Actions']}, rows,
      `<button id="addGift" class="admin-action"><i class=\"fas fa-plus\"></i> Add</button>`);
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; const id = btn.dataset.id; const action = btn.dataset.action;
      const current = (data||[]).find(x => String(x.id) === String(id)) || {};
      if (action==='del'){
        if (!confirm('Delete this gift?')) return;
        const r = await api(`/api/admin/gifts/${id}`, { method:'DELETE' }); if (r.ok) showGifts(); else notify('Error','error');
      } else if (action==='edit'){
        openFormModal({
          title: 'Edit gift', submitText: 'Save',
          fields: [
            { name:'nombre', label:'Name', required:true },
            { name:'descripcion', label:'Description', type:'textarea' },
            { name:'precio', label:'Price' },
            { name:'categoria', label:'Category' },
            { name:'url', label:'URL' },
          ],
          initialValues: {
            nombre: current.nombre || '',
            descripcion: current.descripcion || '',
            precio: current.precio || '',
            categoria: current.categoria || '',
            url: current.url || ''
          },
          onSubmit: async (values, close) => {
            const r = await api(`/api/admin/gifts/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
            if (!r.ok) throw new Error('Failed to update');
            close();
            showGifts();
          }
        });
      }
    });
    content.querySelector('#addGift').addEventListener('click', async ()=>{
      openFormModal({
        title: 'Add gift', submitText: 'Add',
        fields: [
          { name:'nombre', label:'Name', required:true },
          { name:'descripcion', label:'Description', type:'textarea' },
          { name:'precio', label:'Price' },
          { name:'categoria', label:'Category' },
          { name:'url', label:'URL' },
        ],
        onSubmit: async (values, close) => {
          const r = await api('/api/admin/gifts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
          if (!r.ok) throw new Error('Failed to create');
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
