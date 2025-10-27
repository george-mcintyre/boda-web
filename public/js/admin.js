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
      const res = await api('/api/admin/guests');
      if (!res.ok) throw new Error('Failed to load guests');
      const data = await res.json();
      const rows = (data||[]).map(g => `
        <tr>
          <td>${g.name || ''}</td>
          <td>${g.email||''}</td>
          <td>${g.status || 'pending'}</td>
          <td>${g.companions ?? 0}</td>
          <td>${g.specialMenu || ''}</td>
          <td>
            <button class="admin-action" data-action="edit" data-id="${g._id}"><i class="fas fa-edit"></i></button>
            <button class="admin-action danger" data-action="del" data-id="${g._id}"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`).join('');
      content.innerHTML = renderTable({title:'Guests', columns:['Name','Email','Status','Companions','Special menu','Actions']}, rows,
        `<button id="addGuest" class="admin-action"><i class="fas fa-user-plus"></i> Add</button>`);
      const tbody = content.querySelector('tbody');
      tbody.addEventListener('click', async (e)=>{
        const btn = e.target.closest('button'); if(!btn) return;
        const id = btn.dataset.id; const action = btn.dataset.action;
        const current = (data||[]).find(x => String(x._id) === String(id)) || {};
        if (action==='del'){
          if (!confirm('Delete this guest?')) return;
          const r = await api(`/api/admin/guests/${id}`, { method:'DELETE' });
          if (r.ok) showGuests(); else notify('Error deleting', 'error');
        } else if (action==='edit'){
          openFormModal({
            title: 'Edit guest',
            submitText: 'Save',
            fields: [
              { name:'name', label:'Name', required:true },
              { name:'email', label:'Email', type:'email', required:true },
              { name:'status', label:'Status', type:'select', options:['pending','confirmed','declined'], required:true },
              { name:'companions', label:'Companions', type:'number', help:'Number of additional guests' },
              { name:'specialMenu', label:'Special menu', help:'Allergies or special request' },
            ],
            initialValues: {
              name: current.name || '',
              email: current.email || '',
              status: current.status || 'pending',
              companions: current.companions ?? 0,
              specialMenu: current.specialMenu || ''
            },
            onSubmit: async (values, close) => {
              const r = await api(`/api/admin/guests/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
              if (!r.ok) throw new Error('Failed to update');
              close();
              showGuests();
            }
          });
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
            const r = await api('/api/admin/guests', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
            if (!r.ok) throw new Error('Failed to create');
            close();
            showGuests();
          }
        });
      });
    } catch(e){ notify(e.message,'error'); }
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

  // ========== Settings ==========
  async function showSettings(){
    activate('configuration');
    setLoading('Loading settings...');
    const res = await api('/api/config/agenda/blocked');
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
          const r = await api('/api/config/agenda/blocked', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(values)});
          if (!r.ok) throw new Error('Failed to lock');
          close();
          showSettings();
        }
      });
    });
    if (btnUnlock) btnUnlock.addEventListener('click', async ()=>{
      const r = await api('/api/config/agenda/blocked', { method:'DELETE' });
      if (r.ok) showSettings(); else notify('Error','error');
    });
  }

  // Router for tabs
  function showTab(tab){
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
