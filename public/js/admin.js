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
    const headers = Object.assign({ 'Authorization': token }, (opts && opts.headers)||{});
    const options = Object.assign({ headers }, opts||{});
    return fetch(path + (path.includes('?')?'':'?') + `_t=${Date.now()}`, options);
  }

  // Tab activation helper
  function activate(tab){
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
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
    activate('invitados');
    setLoading('Loading guests...');
    try {
      const res = await api('/api/admin/invitados');
      if (!res.ok) throw new Error('Failed to load guests');
      const data = await res.json();
      const rows = (data||[]).map(g => `
        <tr>
          <td>${g.name || g.nombre || ''}</td>
          <td>${g.email||''}</td>
          <td>${g.status || g.estado || 'pending'}</td>
          <td>${g.companions ?? g.acompanantes ?? 0}</td>
          <td>${g.specialMenu || g.menuEspecial || ''}</td>
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
        if (action==='del'){
          if (!confirm('Delete this guest?')) return;
          const r = await api(`/api/admin/invitados/${id}`, { method:'DELETE' });
          if (r.ok) showGuests(); else notify('Error deleting', 'error');
        } else if (action==='edit'){
          const name = prompt('Name:'); if (name===null) return;
          const email = prompt('Email:'); if (email===null) return;
          const status = prompt('Status (pending|confirmed|declined):','pending'); if (status===null) return;
          const companions = parseInt(prompt('Companions:','0')||'0',10);
          const specialMenu = prompt('Special menu:','')||'';
          const r = await api(`/api/admin/invitados/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, status, companions, specialMenu })});
          if (r.ok) showGuests(); else notify('Error updating','error');
        }
      });
      content.querySelector('#addGuest').addEventListener('click', async ()=>{
        const name = prompt('Name:'); if (!name) return;
        const email = prompt('Email:'); if (!email) return;
        const r = await api('/api/admin/invitados', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email })});
        if (r.ok) showGuests(); else notify('Error creating','error');
      });
    } catch(e){ notify(e.message,'error'); }
  }

  // ========== Gift list ==========
  async function showGifts(){
    activate('regalos');
    setLoading('Loading gift list...');
    const res = await api('/api/admin/regalos');
    const data = res.ok ? await res.json() : [];
    const rows = (data||[]).map(it => `
      <tr>
        <td>${it.nombre || it.name || ''}</td>
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
      if (action==='del'){
        if (!confirm('Delete this gift?')) return;
        const r = await api(`/api/admin/regalos/${id}`, { method:'DELETE' }); if (r.ok) showGifts(); else notify('Error','error');
      } else if (action==='edit'){
        const nombre = prompt('Name:'); if (nombre===null) return;
        const descripcion = prompt('Description:')||'';
        const precio = prompt('Price:')||'';
        const categoria = prompt('Category:')||'';
        const url = prompt('URL:')||'';
        const r = await api(`/api/admin/regalos/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre, descripcion, precio, categoria, url })});
        if (r.ok) showGifts(); else notify('Error','error');
      }
    });
    content.querySelector('#addGift').addEventListener('click', async ()=>{
      const nombre = prompt('Name:'); if (!nombre) return;
      const descripcion = prompt('Description:')||'';
      const precio = prompt('Price:')||'';
      const categoria = prompt('Category:')||'';
      const url = prompt('URL:')||'';
      const r = await api('/api/admin/regalos', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre, descripcion, precio, categoria, url })});
      if (r.ok) showGifts(); else notify('Error','error');
    });
  }

  // ========== Messages ==========
  async function showMessages(){
    activate('mensajes');
    setLoading('Loading messages...');
    const res = await api('/api/admin/mensajes');
    const data = res.ok ? await res.json() : [];
    const rows = (data||[]).map(m => `
      <tr>
        <td>${m.nombre||''}</td>
        <td>${m.email||''}</td>
        <td>${(m.contenido||'').slice(0,120)}</td>
        <td>${new Date(m.createdAt).toLocaleString()}</td>
        <td><button class="admin-action danger" data-id="${m._id}"><i class="fas fa-trash"></i></button></td>
      </tr>`).join('');
    content.innerHTML = renderTable({title:'Messages', columns:['Name','Email','Content','Date','Actions']}, rows);
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      if (!confirm('Delete this message?')) return;
      const r = await api(`/api/admin/mensajes/${btn.dataset.id}`, { method:'DELETE' });
      if (r.ok) showMessages(); else notify('Error','error');
    });
  }

  // ========== Event schedule ==========
  async function showAgenda(){
    activate('agenda');
    setLoading('Loading event schedule...');
    const res = await api('/api/admin/agenda');
    const data = res.ok ? await res.json() : [];
    const rows = (data||[]).map(ev => `
      <tr>
        <td>${ev.evento||ev.nombre||''}</td>
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
      `<button id="addEvt" class="admin-action"><i class=\"fas fa-plus\"></i> Add</button>`);
    const tbody = content.querySelector('tbody');
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return; const id = btn.dataset.id; const action = btn.dataset.action;
      if (action==='del'){
        if (!confirm('Delete this event?')) return;
        const r = await api(`/api/admin/agenda/${id}`, { method:'DELETE' }); if (r.ok) showAgenda(); else notify('Error','error');
      } else if (action==='edit'){
        const evento = prompt('Event:')||''; const fecha = prompt('Date:')||''; const hora = prompt('Time:')||''; const lugar = prompt('Place:')||''; const descripcion = prompt('Description:')||'';
        const r = await api(`/api/admin/agenda/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ evento, fecha, hora, lugar, descripcion })});
        if (r.ok) showAgenda(); else notify('Error','error');
      }
    });
    content.querySelector('#addEvt').addEventListener('click', async ()=>{
      const evento = prompt('Event:'); if (!evento) return; const fecha = prompt('Date:')||''; const hora = prompt('Time:')||''; const lugar = prompt('Place:')||''; const descripcion = prompt('Description:')||'';
      const r = await api('/api/admin/agenda', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ evento, fecha, hora, lugar, descripcion })});
      if (r.ok) showAgenda(); else notify('Error','error');
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
      if (action==='del'){
        if (!confirm('Delete this menu item?')) return;
        const r = await api(`/api/admin/menu/${id}`, { method:'DELETE' }); if (r.ok) showMenu(); else notify('Error','error');
      } else if (action==='edit'){
        const nombre = prompt('Name:')||''; const descripcion = prompt('Description:')||''; const tipo = prompt('Type:')||'';
        const r = await api(`/api/admin/menu/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre, descripcion, tipo })});
        if (r.ok) showMenu(); else notify('Error','error');
      }
    });
    content.querySelector('#addMenu').addEventListener('click', async ()=>{
      const nombre = prompt('Name:'); if (!nombre) return; const descripcion = prompt('Description:')||''; const tipo = prompt('Type:')||'';
      const r = await api('/api/admin/menu', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre, descripcion, tipo })});
      if (r.ok) showMenu(); else notify('Error','error');
    });
  }

  // ========== Settings ==========
  async function showSettings(){
    activate('configuracion');
    setLoading('Loading settings...');
    const res = await api('/api/config/agenda/bloqueo');
    const cfg = res.ok ? await res.json() : {};
    const bloqueada = !!(cfg.agenda && cfg.agenda.bloqueada);
    const motivo = (cfg.agenda && cfg.agenda.motivoBloqueo) || '';
    content.innerHTML = `
      <div class="admin-content">
        <h3><i class="fas fa-cog"></i> Settings</h3>
        <div class="config-grid">
          <div class="config-card">
            <h4>Agenda lock</h4>
            <p>Current state: <strong>${bloqueada?'Locked':'Open'}</strong></p>
            ${bloqueada?`<p>Reason: ${motivo||'-'}</p>`:''}
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button id="btnLock" class="admin-action ${bloqueada?'disabled':''}" ${bloqueada?'disabled':''}><i class="fas fa-lock"></i> Lock</button>
              <button id="btnUnlock" class="admin-action ${!bloqueada?'disabled':''}" ${!bloqueada?'disabled':''}><i class="fas fa-lock-open"></i> Unlock</button>
            </div>
          </div>
        </div>
      </div>`;
    const btnLock = document.getElementById('btnLock');
    const btnUnlock = document.getElementById('btnUnlock');
    if (btnLock) btnLock.addEventListener('click', async ()=>{
      const motivoBloqueo = prompt('Lock reason:')||'';
      const r = await api('/api/config/agenda/bloqueo', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ motivoBloqueo })});
      if (r.ok) showSettings(); else notify('Error','error');
    });
    if (btnUnlock) btnUnlock.addEventListener('click', async ()=>{
      const r = await api('/api/config/agenda/bloqueo', { method:'DELETE' });
      if (r.ok) showSettings(); else notify('Error','error');
    });
  }

  // Router for tabs
  function showTab(tab){
    switch(tab){
      case 'invitados': return showGuests();
      case 'regalos': return showGifts();
      case 'mensajes': return showMessages();
      case 'agenda': return showAgenda();
      case 'menu': return showMenu();
      case 'configuracion': return showSettings();
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
  showTab('invitados');
})();
