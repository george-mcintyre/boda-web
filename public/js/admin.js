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
    const target = getContentTarget();
    target.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i><p >${msg||'Loading...'}</p></div>`;
  }

  function notify(msg, type){
    showToast(msg, type || 'success');
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

  async function downloadAuthenticatedFile(path) {
    try {
      const res = await api(path);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notify(err.error || 'Download failed', 'error');
        return;
      }
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match ? match[1] : 'download.json';
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Download failed', err);
      notify('Download failed', 'error');
    }
  }

  // Load images that require auth headers (blob URL approach)
  function loadAuthImages(container) {
    if (!container) return;
    container.querySelectorAll('img[data-auth-src]').forEach(async (img) => {
      const url = img.getAttribute('data-auth-src');
      if (!url) return;
      try {
        const res = await api(url);
        if (res.ok) {
          const blob = await res.blob();
          img.src = URL.createObjectURL(blob);
          img.style.display = '';
          // Hide "no image" sibling if present
          const noImgSibling = img.nextElementSibling;
          if (noImgSibling) noImgSibling.style.display = 'none';
        } else {
          img.style.display = 'none';
          const noImgSibling = img.nextElementSibling;
          if (noImgSibling) noImgSibling.style.display = '';
        }
      } catch(e) {
        img.style.display = 'none';
        const noImgSibling = img.nextElementSibling;
        if (noImgSibling) noImgSibling.style.display = '';
      }
    });
  }

  // Translate dietary/allergy badge values
  function translateDietary(value) {
    const map = {
      'vegetarian': 'admin:dietary.vegetarian',
      'lactose-intolerant': 'admin:dietary.lactoseIntolerant',
      'gluten-intolerant': 'admin:dietary.glutenIntolerant',
      'nut-allergy': 'admin:dietary.nutAllergy',
      'other': 'admin:dietary.other'
    };
    return map[value] ? translate(map[value]) : value;
  }

  // Get table display name
  function getTableDisplayName(t) {
    if (t.isHeadTable) return translate('admin:tables.headTable');
    // If name is just the default "Table N" pattern, use translated label instead
    if (!t.name || /^Table\s+\d+$/i.test(t.name)) return translate('admin:tables.tableLabel') + ' ' + t.number;
    return t.name;
  }

  // Tab activation helper
  function activate(tab){
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  }

  // ========== Two-Level Navigation (Sub-tabs) ==========
  const SUB_TABS = {
    guests: [
      { id: 'summary', i18nKey: 'admin:subtab.guestSummary', icon: 'fa-chart-bar' },
      { id: 'management', i18nKey: 'admin:subtab.guestManagement', icon: 'fa-users-cog' },
      { id: 'noParty', i18nKey: 'admin:subtab.guestsNoParty', icon: 'fa-user-slash' }
    ],
    menu: [
      { id: 'banquet', i18nKey: 'admin:subtab.banquetMenu', icon: 'fa-utensils' },
      { id: 'tables', i18nKey: 'admin:subtab.tableAllocation', icon: 'fa-th' },
      { id: 'responses', i18nKey: 'admin:subtab.menuResponses', icon: 'fa-clipboard-list' },
      { id: 'noChoices', i18nKey: 'admin:subtab.menuNoChoices', icon: 'fa-times-circle' }
    ],
    event: [
      { id: 'schedule', i18nKey: 'admin:subtab.eventSchedule', icon: 'fa-calendar-alt' },
      { id: 'attendance', i18nKey: 'admin:subtab.eventAttendance', icon: 'fa-chart-bar' },
      { id: 'noChoices', i18nKey: 'admin:subtab.eventNoChoices', icon: 'fa-user-times' }
    ],
    gifts: [
      { id: 'list', i18nKey: 'admin:subtab.giftList', icon: 'fa-gift' },
      { id: 'purchases', i18nKey: 'admin:subtab.giftPurchases', icon: 'fa-shopping-cart' }
    ]
  };

  function getContentTarget() {
    return document.getElementById('sub-tab-content') || content;
  }

  function renderSubTabs(primaryTab) {
    const tabConfig = SUB_TABS[primaryTab];
    if (!tabConfig) return '';
    const savedSubTab = localStorage.getItem('adminSubPage_' + primaryTab) || tabConfig[0].id;
    const buttons = tabConfig.map(st => {
      const isActive = st.id === savedSubTab ? ' active' : '';
      return `<button class="sub-tab${isActive}" data-subtab="${st.id}"><i class="fas ${st.icon}"></i> <span>${translate(st.i18nKey)}</span></button>`;
    }).join('');
    return `<div class="sub-tab-bar">${buttons}</div><div id="sub-tab-content"></div>`;
  }

  function showSubTab(primaryTab, subTab) {
    localStorage.setItem('adminSubPage_' + primaryTab, subTab);
    // Update active class on sub-tab buttons
    document.querySelectorAll('.sub-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subTab);
    });
    // Dispatch to the appropriate show function
    switch (primaryTab + '/' + subTab) {
      case 'guests/summary': return showGuestSummary();
      case 'guests/management': return showGuests();
      case 'guests/noParty': return showGuestsNoParty();
      case 'menu/banquet': return showMenu();
      case 'menu/tables': return showTableAllocation();
      case 'menu/responses': return showMenuResponses();
      case 'menu/noChoices': return showMenuNoChoices();
      case 'gifts/list': return showGifts();
      case 'gifts/purchases': return showGiftPurchases();
      case 'event/schedule': return showEvent();
      case 'event/attendance': return showEventAttendance();
      case 'event/noChoices': return showEventNoChoices();
      default:
        getContentTarget().innerHTML = '<div class="admin-content"><p>' + translate('admin:comingSoon') + '</p></div>';
    }
  }

  // ========== Sub-tab View Implementations ==========

  // Guest Summary sub-tab
  async function showGuestSummary() {
    const target = getContentTarget();
    setLoading(translate('admin:loadingGuests'));
    try {
      const res = await api('/api/admin/guest-summary');
      if (!res.ok) throw new Error('Failed to load guest summary');
      const data = await res.json();


      target.innerHTML = `
        <div class="admin-content">
          <h3><i class="fas fa-chart-bar"></i> ${translate('admin:subtab.guestSummary')}</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${data.totalGuests}</div>
              <div class="stat-label">${translate('admin:guests.totalGuests')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.totalAdults}</div>
              <div class="stat-label">${translate('admin:guests.adults')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.totalChildren}</div>
              <div class="stat-label">${translate('admin:guests.children')}</div>
            </div>
          </div>
          <div style="margin-top:20px;">
            <div class="admin-card">
              <h4><i class="fas fa-exclamation-circle"></i> ${translate('admin:guests.actionRequired')}</h4>
              <ul style="list-style:none;padding:0;">
                <li style="padding:8px 0;border-bottom:1px solid var(--gray-200);">
                  <i class="fas fa-utensils" style="color:var(--primary-color);width:20px;"></i>
                  <strong>${data.guestsWithoutMenuChoices}</strong> ${translate('admin:guests.withoutMenuChoices')}
                </li>
                <li style="padding:8px 0;border-bottom:1px solid var(--gray-200);">
                  <i class="fas fa-calendar" style="color:var(--primary-color);width:20px;"></i>
                  <strong>${data.guestsWithoutEventChoices}</strong> ${translate('admin:guests.withoutEventResponses')}
                </li>
                <li style="padding:8px 0;">
                  <i class="fas fa-users" style="color:var(--primary-color);width:20px;"></i>
                  <strong>${data.guestsWithoutPartyMembers}</strong> ${translate('admin:guests.withoutPartyMembers')}
                </li>
              </ul>
            </div>
          </div>
        </div>`;
    } catch(e) {
      console.error('Error loading guest summary:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  // Event Attendance sub-tab (under Events Management)
  async function showEventAttendance() {
    const target = getContentTarget();
    setLoading(translate('admin:subtab.eventAttendance'));
    try {
      const [summaryRes, guestsRes, eventsRes, choicesRes] = await Promise.all([
        api(`/api/admin/guest-summary?lang=${getUserLanguage()}`),
        api('/api/admin/guests?limit=9999'),
        api(`/api/admin/events?lang=${getUserLanguage()}`),
        api('/api/admin/event-choices')
      ]);
      if (!summaryRes.ok) throw new Error('Failed to load attendance data');
      const data = await summaryRes.json();
      const allGuests = guestsRes.ok ? (await guestsRes.json()).items || await guestsRes.json() : [];
      const events = eventsRes.ok ? await eventsRes.json() : [];
      const eventChoices = choicesRes.ok ? await choicesRes.json() : [];

      const eventRows = (data.perEventAttendance || []).map(e => `
        <tr>
          <td>${e.eventName}</td>
          <td><strong>${e.count}</strong></td>
        </tr>`).join('');

      const choiceMap = {};
      eventChoices.forEach(ec => { choiceMap[ec.guestId.toString ? ec.guestId.toString() : ec.guestId] = ec; });

      const rows = [];
      const sortedGuests = [...allGuests].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      sortedGuests.forEach(g => {
        const guestId = g.id || g._id;
        const ec = choiceMap[guestId] || { partyChoices: [] };
        const members = [
          { partyGuestId: guestId, name: g.name, isPrimary: true },
          ...(g.partyMembers || []).map(pm => ({
            partyGuestId: pm.id || pm.name,
            name: pm.name,
            isPrimary: false
          }))
        ];
        members.forEach((m, mi) => {
          const pc = ec.partyChoices.find(p => String(p.partyGuestId) === String(m.partyGuestId));
          const eventChecks = events.map(ev => {
            const evId = ev.id || ev._id;
            const choice = pc?.choices?.find(c => (c.eventId.toString ? c.eventId.toString() : c.eventId) === evId);
            const checked = choice?.attending ? 'checked' : '';
            return `<td class="center"><input type="checkbox" ${checked} data-guest-id="${guestId}" data-party-guest-id="${m.partyGuestId}" data-event-id="${evId}" class="attendance-cb"></td>`;
          }).join('');
          const nameClass = m.isPrimary ? 'font-weight:600;' : 'padding-left:16px;color:var(--text-light);';
          const partyCol = m.isPrimary ? '' : g.name;
          const isFirst = mi === 0;
          rows.push(`<tr class="attendance-row${isFirst ? ' party-first' : ''}" style="${isFirst ? 'border-top:2px solid var(--purple-light,#e8dced);' : ''}">
            <td style="${nameClass}">${m.name || '—'}</td>
            <td style="color:var(--text-light);font-size:0.85em;">${partyCol}</td>
            ${eventChecks}
          </tr>`);
        });
      });

      const eventHeaders = events.map(ev => {
        const evName = typeof ev.name === 'object' ? (ev.name[getUserLanguage()] || ev.name.en || Object.values(ev.name)[0]) : ev.name;
        return `<th class="center" style="white-space:nowrap;">${evName}</th>`;
      }).join('');

      target.innerHTML = `
        <div class="admin-content">
          <h3><i class="fas fa-chart-bar"></i> ${translate('admin:subtab.eventAttendance')}</h3>
          <div class="admin-card">
            <table class="data-table">
              <thead><tr><th>${translate('admin:attendance.event')}</th><th>${translate('admin:attendance.attending')}</th></tr></thead>
              <tbody>${eventRows || '<tr><td colspan="2">' + translate('admin:attendance.noEvents') + '</td></tr>'}</tbody>
            </table>
          </div>
          <h3 style="margin-top:24px;"><i class="fas fa-clipboard-check"></i> ${translate('admin:attendance.checklist')}</h3>
          <div style="margin-bottom:12px;">
            <input type="text" id="attendanceFilter" placeholder="${translate('admin:attendance.filterPlaceholder')}" style="padding:6px 12px;border:1px solid var(--gray-300,#ddd);border-radius:6px;width:280px;font-size:13px;">
          </div>
          <div class="admin-card" style="overflow-x:auto;">
            <table class="data-table" id="attendanceTable">
              <thead><tr>
                <th>${translate('admin:attendance.name')}</th>
                <th>${translate('admin:attendance.party')}</th>
                ${eventHeaders}
              </tr></thead>
              <tbody>${rows.join('')}</tbody>
            </table>
          </div>
        </div>`;

      const filterInput = document.getElementById('attendanceFilter');
      if (filterInput) {
        filterInput.addEventListener('input', function() {
          const q = this.value.toLowerCase();
          document.querySelectorAll('#attendanceTable tbody tr.attendance-row').forEach(tr => {
            const name = tr.querySelector('td')?.textContent?.toLowerCase() || '';
            const party = tr.querySelectorAll('td')[1]?.textContent?.toLowerCase() || '';
            tr.style.display = (name.includes(q) || party.includes(q)) ? '' : 'none';
          });
        });
      }

      let saveTimeout = null;
      document.querySelectorAll('.attendance-cb').forEach(cb => {
        cb.addEventListener('change', function() {
          const gId = this.dataset.guestId;
          const guest = sortedGuests.find(g => (g.id || g._id) === gId);
          if (!guest) return;

          const ec = choiceMap[gId] || { partyChoices: [] };
          const members = [
            { partyGuestId: gId },
            ...(guest.partyMembers || []).map(pm => ({ partyGuestId: pm.id || pm.name }))
          ];

          const updatedPartyChoices = members.map(m => {
            const existingPc = ec.partyChoices.find(p => String(p.partyGuestId) === String(m.partyGuestId));
            const choices = events.map(ev => {
              const evId = ev.id || ev._id;
              const checkbox = document.querySelector(`.attendance-cb[data-guest-id="${gId}"][data-party-guest-id="${m.partyGuestId}"][data-event-id="${evId}"]`);
              if (checkbox) return { eventId: evId, attending: checkbox.checked };
              const existingChoice = existingPc?.choices?.find(c => (c.eventId.toString ? c.eventId.toString() : c.eventId) === evId);
              return { eventId: evId, attending: existingChoice?.attending || false };
            });
            return { partyGuestId: String(m.partyGuestId), choices };
          });

          choiceMap[gId] = { guestId: gId, partyChoices: updatedPartyChoices };

          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(async () => {
            try {
              const saveRes = await api(`/api/admin/event-choices/${gId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyChoices: updatedPartyChoices })
              });
              if (!saveRes.ok) throw new Error('Save failed');
              showToast(translate('admin:attendance.saved'), 'success');
            } catch (err) {
              showToast(translate('admin:attendance.error'), 'error');
              console.error('Error saving attendance:', err);
            }
          }, 500);
        });
      });
    } catch(e) {
      console.error('Error loading event attendance:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  let showUnassignedOnly = false;

  async function showTableAllocation() {
    const target = getContentTarget();
    setLoading(translate('admin:subtab.tableAllocation'));
    try {
      // Fetch tables, guests, assignments, and event choices in parallel
      const BANQUET_EVENT_ID = '69237e6b76402958d7ee1956';
      const [tablesRes, guestsRes, assignmentsRes, eventChoicesRes] = await Promise.all([
        api('/api/admin/tables'),
        api('/api/admin/guests?limit=999'),
        api('/api/admin/table-assignments'),
        api('/api/admin/event-choices')
      ]);
      const tables = tablesRes.ok ? await tablesRes.json() : [];
      const guestsData = guestsRes.ok ? await guestsRes.json() : { items: [] };
      const allGuests = guestsData.items || [];
      const assignments = assignmentsRes.ok ? await assignmentsRes.json() : [];
      const eventChoices = eventChoicesRes.ok ? await eventChoicesRes.json() : [];

      // Build set of guestIds where at least one party member is attending the banquet
      // Also count total confirmed attendees (individual people attending)
      const validPartyIds = new Map();
      allGuests.forEach(g => {
        const ids = new Set([g.id]);
        (g.partyMembers || []).forEach(pm => {
          if (pm.id) ids.add(pm.id);
          if (pm.name) ids.add(pm.name);
        });
        validPartyIds.set(g.id, ids);
      });
      const banquetGuestIds = new Set();
      const banquetAttendeeIds = new Set();
      let totalConfirmed = 0;
      eventChoices.forEach(ec => {
        const gId = ec.guestId && ec.guestId.toString ? ec.guestId.toString() : ec.guestId;
        const valid = validPartyIds.get(gId);
        if (!valid) return;
        (ec.partyChoices || []).forEach(pc => {
          const pmId = pc.partyGuestId && pc.partyGuestId.toString ? pc.partyGuestId.toString() : pc.partyGuestId;
          if (!valid.has(pmId)) return;
          (pc.choices || []).forEach(c => {
            const eId = c.eventId && c.eventId.toString ? c.eventId.toString() : c.eventId;
            if (eId === BANQUET_EVENT_ID && c.attending) {
              banquetGuestIds.add(gId);
              banquetAttendeeIds.add(pmId);
              totalConfirmed++;
            }
          });
        });
      });
      const guests = allGuests.filter(g => banquetGuestIds.has(g.id));

      // Build assignment lookup early so head-table injection affects card rendering
      const assignmentMap = {};
      assignments.forEach(a => {
        const key = a.partyMemberName ? `${a.guestId}_${a.partyMemberName}` : a.guestId;
        assignmentMap[key] = a;
      });

      const headTable = tables.find(t => t.isHeadTable);
      const fixedGuestIds = new Set();
      if (headTable) {
        const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const fixedNames = (headTable.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg)));
        for (const g of guests) {
          if (fixedNames.some(fn => norm(g.name).includes(fn) || fn.includes(norm(g.name)))) {
            fixedGuestIds.add(g.id);
          }
        }
      }

      if (tables.length === 0) {
        target.innerHTML = `
          <div class="admin-content">
            <h3><i class="fas fa-th"></i> ${translate('admin:subtab.tableAllocation')}</h3>
            <div style="text-align:center;padding:40px;">
              <i class="fas fa-chair" style="font-size:3em;color:var(--gray-300);margin-bottom:15px;"></i>
              <p style="color:var(--text-light);">${translate('admin:tables.noTablesConfigured')}</p>
              <button class="btn btn-primary" id="seedTablesBtn"><i class="fas fa-magic"></i> ${translate('admin:tables.seedTables')}</button>
            </div>
          </div>`;
        target.querySelector('#seedTablesBtn')?.addEventListener('click', async () => {
          const r = await api('/api/admin/tables/seed', { method: 'POST' });
          if (r.ok) showTableAllocation();
          else notify('Failed to seed tables', 'error');
        });
        return;
      }

      const childNames = new Set();
      allGuests.forEach(g => {
        if (g.adult === false) childNames.add(g.name);
        (g.partyMembers || []).forEach(pm => { if (pm.adult === false) childNames.add(pm.name); });
      });

      const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
      let totalAssigned = tables.reduce((sum, t) => sum + (t.assignedCount || 0), 0);

      const tableCards = tables.map(t => {
        const pct = t.capacity > 0 ? Math.round((t.assignedCount / t.capacity) * 100) : 0;
        const barColor = pct > 100 ? '#dc3545' : pct >= 100 ? '#28a745' : pct >= 50 ? '#ffc107' : 'var(--gray-300)';
        const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const fixedNames = new Set((t.fixedGuests || []).map(fg => norm(typeof fg === 'string' ? fg : (fg.name || fg))));
        const fixedBadges = (t.fixedGuests || []).map((fg, i) => {
          const name = typeof fg === 'string' ? fg : (fg.name || fg);
          return `<span class="badge badge-primary" style="margin:2px;cursor:default;" title="Seat ${i + 1}"><small style="opacity:.5">${i + 1}.</small> ${name}</span>`;
        }).join('');
        const draggableBadges = (t.assignments || [])
          .filter(a => !fixedNames.has(norm(a.guestName)))
          .map((a, i) => {
            const sn = (t.fixedGuests || []).length + i + 1;
            const displayName = a.partyMemberName || a.guestName;
            const isChild = childNames.has(displayName);
            return `<span class="badge badge-secondary seat-badge" draggable="true" data-assignment-id="${a.id}" data-table-id="${t.id}" style="margin:2px;cursor:grab;" title="Seat ${sn}"><small style="opacity:.5">${sn}.</small> ${displayName}${isChild ? ' <span style="background:#4a90d9;color:#fff;font-size:0.7em;padding:1px 4px;border-radius:3px;vertical-align:middle;">child</span>' : ''}</span>`;
          }).join('');
        const assignedNames = fixedBadges + draggableBadges;

        return `
          <div class="admin-card seat-drop-zone" data-table-id="${t.id}" style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h4 style="margin:0;">${t.isHeadTable ? '<i class="fas fa-crown" style="color:gold;"></i> ' : ''}${getTableDisplayName(t)}</h4>
              <span style="font-size:0.85em;color:var(--text-light);">${t.assignedCount}/${t.capacity}</span>
            </div>
            <div style="background:var(--gray-200);border-radius:4px;height:6px;margin:8px 0;">
              <div style="background:${barColor};width:${Math.min(pct, 100)}%;height:100%;border-radius:4px;"></div>
            </div>
            <div class="seat-list" data-table-id="${t.id}" style="display:flex;flex-wrap:wrap;gap:2px;">${assignedNames || '<span style="color:var(--text-light);font-size:0.85em;">' + translate('admin:tables.noGuestsAssigned') + '</span>'}</div>
          </div>`;
      }).join('');

      target.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:8px;flex-wrap:wrap;">
            <h3 style="margin:0;"><i class="fas fa-th"></i> ${translate('admin:subtab.tableAllocation')}</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onclick="window.openVenuePrintTokenDialog()" class="btn" style="background:var(--gray-200);color:var(--text-dark);"><i class="fas fa-store"></i> ${translate('admin:tables.venueAccess') || 'Venue Access'}</button>
              <button onclick="window.open('admin-banquet-print.html','_blank')" class="btn" style="background:var(--gray-200);color:var(--text-dark);"><i class="fas fa-print"></i> <span data-i18n="admin:tables.printBanquet">${translate('admin:tables.printBanquet')}</span></button>
            </div>
          </div>
          <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
              <div class="stat-number">${tables.length}</div>
              <div class="stat-label">${translate('admin:tables.tables')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${totalCapacity}</div>
              <div class="stat-label">${translate('admin:tables.totalCapacity')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${totalConfirmed}</div>
              <div class="stat-label">${translate('admin:tables.totalConfirmed')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${totalAssigned}</div>
              <div class="stat-label">${translate('admin:tables.assigned')}</div>
            </div>
          </div>

          <!-- Floor Plan -->
          <div style="max-width:700px;margin:0 auto 30px;">
            <div class="admin-card" style="padding:0;overflow:hidden;">
              <img src="/assets/images/seating-plan.png" alt="Banquet Seating Plan" style="width:100%;height:auto;display:block;border-radius:8px;">
            </div>
            <div class="admin-card" style="text-align:center;margin-top:12px;padding:16px;">
              <p style="margin:0 0 8px;font-size:0.85em;color:var(--text-light);"><i class="fas fa-qrcode"></i> ${translate('admin:tables.qrDeepLink')}</p>
              <img src="/api/admin/seating-qr" alt="Seating QR Code" style="width:180px;height:180px;" />
              <p style="margin:8px 0 0;font-size:0.75em;color:var(--text-light);word-break:break-all;">george-and-iluminada.com/guests.html?tab=menu&seating=show</p>
            </div>
          </div>
          
          <!-- Table Cards -->
          <div style="margin-bottom:30px;">
            ${tableCards}
          </div>

          <!-- Guest Assignment Grid -->
          <div style="margin-top:30px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h4 style="margin:0;"><i class="fas fa-users"></i> ${translate('admin:tables.guestAssignments')}</h4>
              <button class="filter-btn" id="filterUnassignedBtn">${translate('admin:tables.showUnassigned')}</button>
            </div>
            <div class="assignment-grid">
              <table class="data-table" id="assignmentTable">
                <thead>
                  <tr>
                    <th>${translate('admin:tables.party')}</th>
                    <th>${translate('admin:tables.partyMember')}</th>
                    <th>${translate('admin:tables.tableAssignment')}</th>
                  </tr>
                </thead>
                <tbody id="assignmentBody"></tbody>
              </table>
            </div>
          </div>
        </div>`;


      // Table options for dropdown
      const tableOptions = tables.map(t => `<option value="${t.id}">${getTableDisplayName(t)}</option>`).join('');

      const staleDeletes = [];
      guests.forEach(g => {
        const primaryAttending = banquetAttendeeIds.has(g.id);
        if (!primaryAttending && !fixedGuestIds.has(g.id)) {
          const staleAssignment = assignmentMap[g.id];
          if (staleAssignment) staleDeletes.push(api(`/api/admin/table-assignments/${staleAssignment.id}`, { method: 'DELETE' }));
        }
        (g.partyMembers || []).forEach(pm => {
          if (!banquetAttendeeIds.has(pm.id)) {
            const pmKey = `${g.id}_${pm.name}`;
            const staleAssignment = assignmentMap[pmKey];
            if (staleAssignment) staleDeletes.push(api(`/api/admin/table-assignments/${staleAssignment.id}`, { method: 'DELETE' }));
          }
        });
      });
      if (staleDeletes.length > 0) {
        await Promise.all(staleDeletes).catch(() => {});
        showTableAllocation();
        return;
      }

      const tbody = target.querySelector('#assignmentBody');
      let allRows = [];

      guests.forEach(g => {
        const primaryAttending = banquetAttendeeIds.has(g.id);

        if (!primaryAttending && !fixedGuestIds.has(g.id)) {
          (g.partyMembers || []).filter(pm => banquetAttendeeIds.has(pm.id)).forEach(pm => {
            const pmKey = `${g.id}_${pm.name}`;
            const pmAssignment = assignmentMap[pmKey];
            const pmAssignId = pmAssignment ? pmAssignment.id : '';
            allRows.push({
              isAssigned: !!pmAssignment,
              html: `<tr class="assignment-row" data-guest-id="${g.id}" data-assigned="${!!pmAssignment}" style="background:var(--gray-50);">
                <td><strong>${g.name}</strong></td>
                <td style="padding-left:24px;"><i class="fas fa-user-friends" style="color:var(--text-light);font-size:0.8em;"></i> ${pm.name}${pm.adult === false ? ' <span style="color:var(--text-light);font-size:0.75em;">(child)</span>' : ''}</td>
                <td>
                  <select class="table-assign-select" data-guest-id="${g.id}" data-party-member="${pm.name}" data-assignment-id="${pmAssignId}">
                    <option value="">${translate('admin:tables.unassigned')}</option>
                    ${tableOptions}
                  </select>
                </td>
              </tr>`
            });
          });
          return;
        }

        const primaryAssignment = assignmentMap[g.id];
        const isFixed = fixedGuestIds.has(g.id);
        const primaryAssignId = primaryAssignment ? primaryAssignment.id : '';
        const partyCount = (g.partyMembers || []).length;
        allRows.push({
          isAssigned: !!primaryAssignment,
          html: `<tr class="assignment-row" data-guest-id="${g.id}" data-assigned="${!!primaryAssignment}">
            <td><strong>${g.name}</strong>${isFixed ? ' <i class="fas fa-crown" style="color:gold;font-size:0.75em;" title="' + translate('admin:tables.headTable') + '"></i>' : ''}</td>
            <td><i class="fas fa-user" style="color:var(--primary);font-size:0.8em;"></i> ${g.name}</td>
            <td>
              ${isFixed ? '<span style="color:var(--text-light);font-size:0.85em;"><i class="fas fa-lock"></i></span>' : `<select class="table-assign-select" data-guest-id="${g.id}" data-party-member="" data-assignment-id="${primaryAssignId}">
                <option value="">${translate('admin:tables.unassigned')}</option>
                ${tableOptions}
              </select>`}
            </td>
          </tr>`
        });

        (g.partyMembers || []).filter(pm => banquetAttendeeIds.has(pm.id)).forEach(pm => {
          const pmKey = `${g.id}_${pm.name}`;
          const pmAssignment = assignmentMap[pmKey];
          const pmAssignId = pmAssignment ? pmAssignment.id : '';
          allRows.push({
            isAssigned: !!pmAssignment,
            guestId: g.id,
            html: `<tr class="assignment-row" data-guest-id="${g.id}" data-assigned="${!!pmAssignment}" style="background:var(--gray-50);">
              <td style="color:var(--text-light);font-size:0.9em;">${g.name}</td>
              <td style="padding-left:24px;"><i class="fas fa-user-friends" style="color:var(--text-light);font-size:0.8em;"></i> ${pm.name}${pm.adult === false ? ' <span style="color:var(--text-light);font-size:0.75em;">(child)</span>' : ''}</td>
              <td>
                <select class="table-assign-select" data-guest-id="${g.id}" data-party-member="${pm.name}" data-assignment-id="${pmAssignId}">
                  <option value="">${translate('admin:tables.unassigned')}</option>
                  ${tableOptions}
                </select>
              </td>
            </tr>`
          });
        });
      });

      if (tbody) {
        tbody.innerHTML = allRows.map(r => r.html).join('');

        // Set selected values for dropdowns
        target.querySelectorAll('.table-assign-select').forEach(sel => {
          const guestId = sel.dataset.guestId;
          const partyMember = sel.dataset.partyMember;
          const key = partyMember ? `${guestId}_${partyMember}` : guestId;
          const assignment = assignmentMap[key];
          if (assignment) sel.value = assignment.tableId;
        });

        // Handle dropdown changes
        target.querySelectorAll('.table-assign-select').forEach(sel => {
          sel.addEventListener('change', async function() {
            const guestId = this.dataset.guestId;
            const partyMember = this.dataset.partyMember || null;
            const assignmentId = this.dataset.assignmentId;
            const newTableId = this.value;

            try {
              let res;
              if (!newTableId && assignmentId) {
                res = await api(`/api/admin/table-assignments/${assignmentId}`, { method: 'DELETE' });
              } else if (newTableId && !assignmentId) {
                const body = { tableId: newTableId, guestId };
                if (partyMember) body.partyMemberName = partyMember;
                res = await api('/api/admin/table-assignments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
              } else if (newTableId && assignmentId) {
                res = await api(`/api/admin/table-assignments/${assignmentId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tableId: newTableId })
                });
              }
              if (res && !res.ok) {
                const err = await res.json().catch(() => ({}));
                notify(err.error || 'Failed to update assignment', 'error');
              }
              showTableAllocation();
            } catch (e) {
              notify('Error updating assignment: ' + e.message, 'error');
              showTableAllocation();
            }
          });
        });
      }

      let dragEl = null;
      const dropZones = target.querySelectorAll('.seat-drop-zone');

      dropZones.forEach(zone => {
        const container = zone.querySelector('.seat-list');
        if (!container) return;

        container.addEventListener('dragstart', e => {
          const badge = e.target.closest('.seat-badge');
          if (!badge) return;
          dragEl = badge;
          badge.style.opacity = '0.4';
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', badge.dataset.assignmentId);
        });

        container.addEventListener('dragend', () => {
          if (dragEl) dragEl.style.opacity = '1';
          target.querySelectorAll('.seat-drop-zone.drag-over').forEach(z => z.classList.remove('drag-over'));
          dragEl = null;
        });

        zone.addEventListener('dragover', e => {
          if (!dragEl) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', e => {
          if (!zone.contains(e.relatedTarget)) {
            zone.classList.remove('drag-over');
          }
        });

        zone.addEventListener('drop', async e => {
          e.preventDefault();
          zone.classList.remove('drag-over');
          if (!dragEl) return;

          const fromTableId = dragEl.dataset.tableId;
          const toTableId = zone.dataset.tableId;
          const assignmentId = dragEl.dataset.assignmentId;
          const toContainer = zone.querySelector('.seat-list');

          if (fromTableId !== toTableId) {
            try {
              const res = await api(`/api/admin/table-assignments/${assignmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: toTableId })
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                notify(err.error || 'Failed to move guest', 'error');
              }
              showTableAllocation();
            } catch (err) {
              notify('Error moving guest: ' + err.message, 'error');
            }
            return;
          }

          const dropTarget = e.target.closest('.seat-badge');
          if (!dropTarget || dropTarget === dragEl) return;
          const badges = [...toContainer.querySelectorAll('.seat-badge')];
          const fromIdx = badges.indexOf(dragEl);
          const toIdx = badges.indexOf(dropTarget);
          if (fromIdx < 0 || toIdx < 0) return;
          if (fromIdx < toIdx) dropTarget.after(dragEl);
          else dropTarget.before(dragEl);

          const orderedIds = [...toContainer.querySelectorAll('.seat-badge')].map(b => b.dataset.assignmentId);
          try {
            await api('/api/admin/table-seats/reorder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tableId: toTableId, orderedIds })
            });
            showTableAllocation();
          } catch (err) {
            notify('Error reordering seats: ' + err.message, 'error');
          }
        });
      });

      const filterBtn = target.querySelector('#filterUnassignedBtn');
      if (filterBtn) {
        if (showUnassignedOnly) {
          filterBtn.textContent = translate('admin:tables.showAll');
          filterBtn.classList.add('active');
          target.querySelectorAll('.assignment-row').forEach(row => {
            row.style.display = row.dataset.assigned === 'true' ? 'none' : '';
          });
        }
        filterBtn.addEventListener('click', function() {
          showUnassignedOnly = !showUnassignedOnly;
          this.textContent = showUnassignedOnly ? translate('admin:tables.showAll') : translate('admin:tables.showUnassigned');
          this.classList.toggle('active', showUnassignedOnly);
          target.querySelectorAll('.assignment-row').forEach(row => {
            row.style.display = (showUnassignedOnly && row.dataset.assigned === 'true') ? 'none' : '';
          });
        });
      }
    } catch(e) {
      console.error('Error loading tables:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  // Menu Responses sub-tab
  async function showMenuResponses() {
    const target = getContentTarget();
    setLoading(translate('admin:subtab.menuResponses'));
    try {
      const res = await api(`/api/admin/menu-responses?lang=${getUserLanguage()}`);
      const tableGroups = res.ok ? await res.json() : [];

      if (tableGroups.length === 0) {
        target.innerHTML = `
          <div class="admin-content">
            <h3><i class="fas fa-clipboard-list"></i> ${translate('admin:subtab.menuResponses')}</h3>
            <div style="text-align:center;padding:40px;">
              <i class="fas fa-clipboard" style="font-size:3em;color:var(--gray-300);margin-bottom:15px;"></i>
              <p style="color:var(--text-light);">${translate('admin:menuResponses.noResponses')}</p>
            </div>
          </div>`;
        return;
      }

      const seatBadgeStyle = 'display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;font-weight:700;font-size:11px;margin-right:6px;';
      const seatBadgeRegular = `${seatBadgeStyle}background:#e8dced;color:#8B5A96;`;
      const seatBadgeFixed = `${seatBadgeStyle}background:#d4a5a5;color:#fff;`;

      let totalResponses = 0;
      const groupHtml = tableGroups.map(group => {
        totalResponses += group.guests.length;
        const guestRows = group.guests.map(g => {
          const choiceLabels = (g.choices || []).map(c => {
            if (!c.optionLabel || c.optionLabel === '—') return null;
            if (c.cookingPreference) return `${c.optionLabel} (${translate('menu.cooking.' + c.cookingPreference)})`;
            return c.optionLabel;
          }).filter(Boolean).join(', ') || '—';
          const specReq = g.specialRequest ? `<span class="badge badge-info">${g.specialRequest.split(', ').map(s => translateDietary(s.trim())).join(', ')}</span>` : '';
          const seatBadge = g.seatNumber != null
            ? `<span style="${g.isFixed ? seatBadgeFixed : seatBadgeRegular}">${g.seatNumber}</span>`
            : '';
          return `<tr><td>${seatBadge}${g.guestName}${g.partyMemberName ? ' <small>(' + g.partyMemberName + ')</small>' : ''}</td><td>${choiceLabels}</td><td>${specReq}${g.specialRequestDetail ? ' ' + g.specialRequestDetail : ''}</td></tr>`;
        }).join('');

        return `
          <div class="admin-card" style="margin-bottom:15px;">
            <h4>${group.isHeadTable ? '<i class="fas fa-crown" style="color:gold;"></i> ' + translate('admin:tables.headTable') : (group.tableName || (group.tableNumber !== null ? translate('admin:tables.tableLabel') + ' ' + group.tableNumber : translate('admin:tables.unassigned')))}</h4>
            <table class="data-table">
              <thead><tr><th>${translate('admin:menuResponses.guest')}</th><th>${translate('admin:menuResponses.menuChoices')}</th><th>${translate('admin:menuResponses.specialRequests')}</th></tr></thead>
              <tbody>${guestRows}</tbody>
            </table>
          </div>`;
      }).join('');

      target.innerHTML = `
        <div class="admin-content">
          <h3><i class="fas fa-clipboard-list"></i> ${translate('admin:subtab.menuResponses')} <span class="count-badge">${totalResponses}</span></h3>
          ${groupHtml}
        </div>`;
    } catch(e) {
      console.error('Error loading menu responses:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  // Gift Purchases sub-tab
  async function showGiftPurchases() {
    const target = getContentTarget();
    setLoading(translate('admin:subtab.giftPurchases'));
    try {
      const res = await api(`/api/admin/gift-purchases?lang=${getUserLanguage()}`);
      const data = res.ok ? await res.json() : { purchases: [], totalAmount: 0 };

      if (data.purchases.length === 0) {
        target.innerHTML = `
          <div class="admin-content">
            <h3><i class="fas fa-shopping-cart"></i> ${translate('admin:subtab.giftPurchases')}</h3>
            <div style="text-align:center;padding:40px;">
              <i class="fas fa-gift" style="font-size:3em;color:var(--gray-300);margin-bottom:15px;"></i>
              <p style="color:var(--text-light);">No gift purchases yet.</p>
            </div>
          </div>`;
        return;
      }

      const escapeHtml = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

      const purchaseById = new Map(data.purchases.map(p => [p.id, p]));

      const rows = data.purchases.map(p => {
        const date = p.date ? new Date(p.date).toLocaleDateString() : '—';
        const snippetHtml = p.cubeDescriptionSnippet
          ? ` — <span style="color:var(--text-light);font-style:italic;">"${escapeHtml(p.cubeDescriptionSnippet)}"</span>`
          : '';
        const giftCell = p.cubeId
          ? (p.cubeFaces
              ? `<button type="button" data-action="view-block" data-purchase-id="${p.id}" title="View 3D block" style="background:none;border:none;padding:0;font:inherit;color:inherit;cursor:pointer;text-align:left;">Block #${p.cubeId}${snippetHtml} <i class="fas fa-cube" style="margin-left:6px;color:var(--primary-color,#8B5A96);"></i></button>`
              : `Block #${p.cubeId}${snippetHtml}`)
          : escapeHtml(p.giftTitle);
        const undoTitle = p.cubeId
          ? `Block #${p.cubeId}${p.cubeDescriptionSnippet ? ` — ${p.cubeDescriptionSnippet}` : ''}`
          : (p.giftTitle || '');
        const downloadBtn = p.id
          ? `<button class="admin-action" data-action="download-descriptor" data-id="${p.id}" title="Download print artefact descriptor (JSON)"><i class="fas fa-download"></i></button>`
          : '';
        const undoBtn = p.id
          ? `<button class="admin-action danger" data-action="undo-purchase" data-id="${p.id}" data-gift-title="${escapeHtml(undoTitle)}" data-guest-name="${escapeHtml(p.guestName)}" title="Undo purchase (TESTING ONLY)"><i class="fas fa-undo"></i></button>`
          : '';
        const giftFromCell = p.giftFrom ? escapeHtml(p.giftFrom) : '—';
        const messageCell = p.message ? escapeHtml(p.message) : '—';
        return `<tr><td>${escapeHtml(p.guestName)}</td><td>${giftCell}</td><td>€${p.giftAmount}</td><td>${date}</td><td>${giftFromCell}</td><td>${messageCell}</td><td>${downloadBtn} ${undoBtn}</td></tr>`;
      }).join('');

      target.innerHTML = `
        <div class="admin-content">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap;">
            <h3 style="margin:0;"><i class="fas fa-shopping-cart"></i> ${translate('admin:subtab.giftPurchases')}</h3>
            <div style="display:flex;align-items:center;gap:12px;">
              <button id="downloadAllDescriptors" class="admin-action" title="Download all print artefact descriptors as a single JSON bundle"><i class="fas fa-cloud-download-alt"></i> Download all artefacts</button>
              <div class="stat-card" style="margin:0;">
                <div class="stat-number">€${data.totalAmount}</div>
                <div class="stat-label">Total</div>
              </div>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr><th>Guest</th><th>Gift</th><th>Amount</th><th>Date</th><th>From</th><th>Message</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;

      const bulkBtn = target.querySelector('#downloadAllDescriptors');
      if (bulkBtn) {
        bulkBtn.addEventListener('click', () => {
          downloadAuthenticatedFile('/api/admin/gift-purchases/descriptors.json');
        });
      }

      const tbody = target.querySelector('tbody');
      tbody.addEventListener('click', async (e) => {
        const viewBlockBtn = e.target.closest('button[data-action="view-block"]');
        if (viewBlockBtn) {
          const purchase = purchaseById.get(viewBlockBtn.dataset.purchaseId);
          if (purchase) showCubeViewerDialog(purchase);
          return;
        }
        const downloadBtn = e.target.closest('button[data-action="download-descriptor"]');
        if (downloadBtn) {
          downloadAuthenticatedFile(`/api/admin/gift-purchases/${downloadBtn.dataset.id}/descriptor.json`);
          return;
        }
        const btn = e.target.closest('button[data-action="undo-purchase"]');
        if (!btn) return;
        const id = btn.dataset.id;
        const giftTitle = btn.dataset.giftTitle || 'this purchase';
        const guestName = btn.dataset.guestName || 'this guest';

        const warning = '⚠️  TESTING ONLY — DO NOT USE ON THE LIVE SITE\n\n'
          + 'This will permanently delete the purchase record from the database.\n\n'
          + `Gift: ${giftTitle}\n`
          + `Guest: ${guestName}\n\n`
          + 'Effects:\n'
          + '  • Purchase record removed\n'
          + '  • Stock available counter restored\n'
          + '  • Purchased counter decremented\n'
          + '  • Guest will see this gift as "not purchased" again\n\n'
          + 'Continue?';
        if (!window.confirm(warning)) return;

        if (!window.confirm('Final confirmation. This is irreversible. Proceed with undoing this purchase?')) return;

        try {
          const r = await api(`/api/admin/gift-purchases/${id}`, { method: 'DELETE' });
          if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            notify(err.error || 'Failed to undo purchase', 'error');
            return;
          }
          notify('Purchase undone', 'success');
          showGiftPurchases();
        } catch (err) {
          console.error('Undo purchase failed', err);
          notify('Failed to undo purchase', 'error');
        }
      });
    } catch(e) {
      console.error('Error loading gift purchases:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  function showCubeViewerDialog(purchase) {
    if (!purchase || !purchase.cubeFaces || typeof window.createCubeViewer !== 'function') return;

    const escapeHtml = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const overlay = document.createElement('div');
    overlay.className = 'gift-purchase-overlay cube-purchase-overlay';
    overlay.innerHTML = `
      <div class="gift-purchase-dialog cube-purchase-dialog">
        <div class="gift-purchase-header">
          <i class="fas fa-cube"></i>
          <h3>Block #${purchase.cubeId}</h3>
        </div>
        <div class="gift-purchase-content">
          <div class="cube-purchase-viewer" data-cube-detail-mount="true"></div>
          ${purchase.cubeDescription ? `<p class="cube-purchase-description">${escapeHtml(purchase.cubeDescription)}</p>` : ''}
          <div style="margin-top:12px;font-size:.9em;color:var(--text-light);">
            Purchased by <strong>${escapeHtml(purchase.guestName)}</strong>
          </div>
        </div>
        <div class="action-container">
          <button type="button" class="btn-base btn-primary btn-sm btn-close-cube-viewer">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);

    const mount = overlay.querySelector('[data-cube-detail-mount="true"]');
    const viewer = window.createCubeViewer(purchase.cubeFaces, {
      mode: 'detail',
      sold: false,
    });
    mount.appendChild(viewer);

    const cleanup = () => {
      if (viewer && typeof viewer.cubeViewerDestroy === 'function') {
        viewer.cubeViewerDestroy();
      }
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
      document.removeEventListener('keydown', handleEscape);
    };

    const handleEscape = (e) => { if (e.key === 'Escape') cleanup(); };
    document.addEventListener('keydown', handleEscape);

    overlay.querySelector('.btn-close-cube-viewer').addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });
  }

  // Event No Choices sub-tab
  async function showEventNoChoices() {
    const target = getContentTarget();
    setLoading(translate('admin:subtab.eventNoChoices'));
    try {
      const res = await api('/api/admin/guests-without-event-choices');
      if (!res.ok) throw new Error('Failed to load guests without event choices');
      const guests = await res.json();

      if (guests.length === 0) {
        target.innerHTML = `
          <div class="admin-content">
            <h3><i class="fas fa-user-times"></i> ${translate('admin:subtab.eventNoChoices')}</h3>
            <div style="text-align:center;padding:40px;">
              <i class="fas fa-check-circle" style="font-size:3em;color:var(--success-color);margin-bottom:15px;"></i>
              <p style="color:var(--text-light);">All guests have made event choices!</p>
            </div>
          </div>`;
        return;
      }

      const rows = guests.map(g => {
        return `<tr>
          <td>${g.name}</td>
          <td><a href="mailto:${g.email}">${g.email}</a></td>
        </tr>`;
      }).join('');

      target.innerHTML = `
        <div class="admin-content">
          <h3><i class="fas fa-user-times"></i> ${translate('admin:subtab.eventNoChoices')} <span class="count-badge">${guests.length}</span></h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
    } catch(e) {
      console.error('Error loading guests without event choices:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  // Menu No Choices sub-tab
  async function showMenuNoChoices() {
    const target = getContentTarget();
    setLoading(translate('admin:subtab.menuNoChoices'));
    try {
      const res = await api('/api/admin/guests-without-menu-choices');
      if (!res.ok) throw new Error('Failed to load guests without menu choices');
      const guests = await res.json();

      if (guests.length === 0) {
        target.innerHTML = `
          <div class="admin-content">
            <h3><i class="fas fa-times-circle"></i> ${translate('admin:subtab.menuNoChoices')}</h3>
            <div style="text-align:center;padding:40px;">
              <i class="fas fa-check-circle" style="font-size:3em;color:var(--success-color);margin-bottom:15px;"></i>
              <p style="color:var(--text-light);">All guests have made menu choices!</p>
            </div>
          </div>`;
        return;
      }

      const rows = guests.map(g => {
        return `<tr>
          <td>${g.name}</td>
          <td><a href="mailto:${g.email}">${g.email}</a></td>
        </tr>`;
      }).join('');

      target.innerHTML = `
        <div class="admin-content">
          <h3><i class="fas fa-times-circle"></i> ${translate('admin:subtab.menuNoChoices')} <span class="count-badge">${guests.length}</span></h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
    } catch(e) {
      console.error('Error loading guests without menu choices:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  // Guests No Party sub-tab
  async function showGuestsNoParty() {
    const target = getContentTarget();
    setLoading(translate('admin:subtab.guestsNoParty'));
    try {
      const res = await api('/api/admin/guests-without-party');
      if (!res.ok) throw new Error('Failed to load guests with incomplete party names');
      const guests = await res.json();

      if (guests.length === 0) {
        target.innerHTML = `
          <div class="admin-content">
            <h3><i class="fas fa-user-slash"></i> ${translate('admin:subtab.guestsNoParty')}</h3>
            <div style="text-align:center;padding:40px;">
              <i class="fas fa-check-circle" style="font-size:3em;color:var(--success-color);margin-bottom:15px;"></i>
              <p style="color:var(--text-light);">All guests have completed party member names!</p>
            </div>
          </div>`;
        return;
      }

      const rows = guests.map(g => {
        const escapedName = g.name.replace(/'/g, "&#39;");
        return `<tr>
          <td>${g.name}</td>
          <td><a href="mailto:${g.email}">${g.email}</a></td>
          <td>${g.incompleteCount} of ${g.totalPartyMembers}</td>
          <td><button class="btn-icon" onclick="managePartyForGuest('${g.id}', '${escapedName}')" title="Manage Party"><i class="fas fa-users"></i></button></td>
        </tr>`;
      }).join('');

      target.innerHTML = `
        <div class="admin-content">
          <h3><i class="fas fa-user-slash"></i> ${translate('admin:subtab.guestsNoParty')} <span class="count-badge">${guests.length}</span></h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Email</th>
                  <th>Incomplete</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
    } catch(e) {
      console.error('Error loading guests with incomplete party:', e);
      target.innerHTML = '<div class="admin-content"><div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>' + e.message + '</p></div></div>';
    }
  }

  // Helper function to manage party for a specific guest
  window.managePartyForGuest = async function(guestId, guestName) {
    // Call showPartyManager directly with the guest ID and name
    showPartyManager(guestId, guestName || '');
  };


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

  function attachImagePreview(fileInput, previewContainer) {
    if (!fileInput || !previewContainer) return;
    const fresh = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(fresh, fileInput);
    const resetHtml = `
      <div style="text-align:center; color:#999;">
        <i class="fas fa-image" style="font-size:2em; margin-bottom:10px; display:block;"></i>
        <div>Image preview will appear here</div>
      </div>`;
    fresh.addEventListener('change', () => {
      const file = fresh.files[0];
      if (!file) { previewContainer.innerHTML = resetHtml; return; }
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        fresh.value = '';
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        fresh.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewContainer.innerHTML = `
          <div style="text-align:center;">
            <img src="${ev.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="margin-top:8px; color:#666; font-size:0.9em;">
              <i class="fas fa-info-circle"></i>
              ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          </div>`;
      };
      reader.onerror = () => alert('Error reading file');
      reader.readAsDataURL(file);
    });
  }

  function setupImagePreview(modal) {
    const primary = modal.querySelector('#f_image');
    const primaryPreview = modal.querySelector('#image-preview-container');
    if (primary && primaryPreview) attachImagePreview(primary, primaryPreview);

    modal.querySelectorAll('input[type="file"]').forEach(input => {
      if (input.id === 'f_image') return;
      const preview = modal.querySelector(`#${input.id}-preview`);
      if (preview) attachImagePreview(input, preview);
    });
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
        <button id="mfClose" class="btn btn-secondary">${translate('admin:form.close')}</button>
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
          <button type="button" id="mfCancel" class="btn btn-secondary">${translate('admin:form.cancel')}</button>
          <button type="submit" class="btn btn-success">${submitText}</button>
        </div>
      </form>`;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    // Load auth-protected images in modal (e.g. chef photo, section image previews)
    loadAuthImages(modal);

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

    if (typeof additionalOptions.afterRender === 'function') {
      try { additionalOptions.afterRender(modal); } catch (e) { console.error('afterRender failed:', e); }
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
    setLoading(translate('admin:loadingGuests'));
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
      
      getContentTarget().innerHTML = `
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
              <button onclick="window.open('admin-guest-list-print.html','_blank')" class="btn" style="margin-left:8px;background:var(--gray-200);color:var(--text-dark);"><i class="fas fa-print"></i> 
              <span data-i18n="admin:guests.printList">${translate('admin:guests.printList')}</span></button>
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
      
      const tbody = getContentTarget().querySelector('tbody');
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
      
      getContentTarget().querySelector('#addGuest').addEventListener('click', async ()=>{
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
      getContentTarget().querySelector('#bulkUploadGuests').addEventListener('click', async ()=>{
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
            
            setLoading(translate('admin:guests.uploadingGuests'));
            
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
      getContentTarget().innerHTML = `
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
          <td><div data-i18n="common:party.${member.adult ? 'adult' : 'child'}" class="badge badge-info">${translate('common:party.' + (member.adult ? 'adult' : 'child'))}</div></td>
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
      
      getContentTarget().innerHTML = `
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
                <div data-i18n="common:party.${primaryGuest && primaryGuest.adult === false ? 'child' : 'adult'}">${translate('common:party.' + (primaryGuest && primaryGuest.adult === false ? 'child' : 'adult'))}</div>
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
      const tbody = getContentTarget().querySelector('tbody');
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
      getContentTarget().innerHTML = `
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
  function resolveGiftPrice(gift) {
    if (Number.isFinite(gift.amount)) return gift.amount;
    if (Array.isArray(gift.amountOptions) && gift.amountOptions.length) {
      return Math.min(...gift.amountOptions.map(Number).filter(Number.isFinite));
    }
    return null;
  }

  async function showGifts(){
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
      const price = resolveGiftPrice(it);
      const priceCell = price != null ? `€${price}` : '—';
      const isCube = it.type === 'cube' && it.faces;
      const isFigurine = it.type === 'figurine';
      let imageCell;
      if (isCube) {
        imageCell = `<div class="admin-gift-cube-thumb" data-gift-id="${it.id}" style="width:64px;height:64px;display:inline-block;--cube-size:64px;"></div>`;
      } else if (isFigurine) {
        imageCell = `<div class="admin-gift-figurine-thumb" data-gift-id="${it.id}" data-figurine-id="${it.figurineId || ''}" style="width:64px;height:64px;display:inline-block;"></div>`;
      } else if (imageUrl) {
        imageCell = `<img src="${imageUrl}" alt="Gift card" style="width: 40px; height: 25px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" onload="this.style.display='block';this.nextElementSibling.style.display='none';"><span style="color: #999; display: none;"><div data-i18n="admin:gifts.noImage">${translate('admin:gifts.noImage')}</div></span>`;
      } else {
        imageCell = '<span style="color: #999;"><div data-i18n="admin:gifts.noImage">' + translate('admin:gifts.noImage') + '</div></span>';
      }

      const remaining = Math.max(0, (parseInt(it.available) || 0) - (parseInt(it.purchased) || 0));

      return `
      <tr>
        <td>${it.title || ''}</td>
        <td>${it.description || ''}</td>
        <td>${imageCell}</td>
        <td>${remaining}</td>
        <td>${priceCell}</td>
        <td>${it.purchased}</td>
        <td>
          <button class="admin-action" data-action="edit" data-id="${it.id}"><i class="fas fa-edit"></i></button>
          <button class="admin-action danger" data-action="del" data-id="${it.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
    
    // Calculate Grand Total
    const totalAvailable = (gifts||[]).reduce((sum, gift) => {
      const remaining = Math.max(0, (parseInt(gift.available) || 0) - (parseInt(gift.purchased) || 0));
      return sum + remaining;
    }, 0);
    const totalPurchased = (gifts||[]).reduce((sum, gift) => sum + (parseInt(gift.purchased) || 0), 0);
    const totalValue = (gifts||[]).reduce((sum, gift) => {
      const price = resolveGiftPrice(gift);
      const remaining = Math.max(0, (parseInt(gift.available) || 0) - (parseInt(gift.purchased) || 0));
      return sum + (remaining * (Number.isFinite(price) ? price : 0));
    }, 0);

    // Add Grand Total row
    const grandTotalRow = `
      <tr style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
        <td><div data-i18n="admin:gifts.grandTotal">${translate('admin:gifts.grandTotal')}</div></td>
        <td><div data-i18n="admin:gifts.grandTotalDescription">${translate('admin:gifts.grandTotalDescription')}</div></td>
        <td></td>
        <td><div data-i18n="admin:gifts.data.totalAvailable">${totalAvailable}</div></td>
        <td><div data-i18n="admin:gifts.data.totalValue">€${totalValue}</div></td>
        <td><div data-i18n="admin:gifts.data.totalPurchased">${totalPurchased}</div></td>
        <td></td>
      </tr>`;
    
    const allRows = rows + grandTotalRow;
      
    getContentTarget().innerHTML = renderTable({
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

    if (typeof window.createCubeViewer === 'function') {
      const giftById = new Map((gifts || []).map(g => [String(g.id), g]));
      getContentTarget().querySelectorAll('.admin-gift-cube-thumb').forEach(mount => {
        const gift = giftById.get(mount.getAttribute('data-gift-id'));
        if (!gift || !gift.faces) return;
        mount.innerHTML = '';
        const viewer = window.createCubeViewer(gift.faces, {
          mode: 'thumb',
          sold: false,
        });
        viewer.style.setProperty('--cube-size', '64px');
        mount.appendChild(viewer);
      });
    }

    if (typeof window.createFigurineViewer === 'function') {
      getContentTarget().querySelectorAll('.admin-gift-figurine-thumb').forEach(mount => {
        const figurineId = parseInt(mount.getAttribute('data-figurine-id'), 10);
        if (!Number.isFinite(figurineId)) return;
        mount.innerHTML = '';
        const viewer = window.createFigurineViewer(figurineId, { mode: 'thumb' });
        mount.appendChild(viewer);
      });
    }

    const tbody = getContentTarget().querySelector('tbody');
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
        const isCube = current.type === 'cube';
        const isFigurine = current.type === 'figurine';
        const isTextOnlyEdit = isCube || isFigurine;

        const editFields = isTextOnlyEdit
          ? [
              { name:'title', label: translate('admin:gifts.field.title'), required:true },
              { name:'description', label: translate('admin:gifts.field.description'), type:'textarea', required:true },
            ]
          : [
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
            ];

        const editInitialValues = isTextOnlyEdit
          ? { title: current.title || '', description: current.description || '' }
          : {
              title: current.title || '',
              description: current.description || '',
              available: current.available,
              amount: String(current.amount)
            };

        openFormModal({
          title: `<div data-i18n="admin:gifts.edit">${translate('admin:gifts.edit')}</div>`, 
          submitText: `<span data-i18n="admin:gifts.save">${translate('admin:gifts.save')}</span>`,
          showCurrentImage: isTextOnlyEdit ? false : showCurrentImage,
          currentImageUrl: isTextOnlyEdit ? null : imageUrl,
          fields: editFields,
          initialValues: editInitialValues,
          onSubmit: async (values, close, modal) => {
            try {
              let giftData;
              if (isTextOnlyEdit) {
                // Cube and figurine gifts: only allow editing title/description. Other fields (type,
                // amountOptions, cubeId/figurineId, image, available) are preserved server-side
                // because updateGift only writes fields that are explicitly present in the body.
                giftData = {
                  title: values.title,
                  description: values.description,
                };
              } else {
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
                    imageReference = { imageId: uploadData.imageId };
                  }
                } else if (current.image) {
                  if (typeof current.image === 'string') {
                    imageReference = current.image;
                  } else if (current.image && typeof current.image === 'object') {
                    if (current.image.imageId) {
                      imageReference = { imageId: current.image.imageId };
                    } else if (current.image._id) {
                      imageReference = current.image._id.toString();
                    } else {
                      imageReference = current.image;
                    }
                  }
                }

                giftData = {
                  title: values.title,
                  description: values.description,
                  available: parseInt(values.available),
                  amount: parseInt(values.amount),
                  image: imageReference
                };
              }

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
    
    getContentTarget().querySelector('#addGift').addEventListener('click', async ()=>{
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
          ${imageUrl ? (imageUrl.startsWith('data:') || imageUrl.startsWith('/assets') ? `<img src="${imageUrl}" alt="Event image" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" onload="this.style.display='block';this.nextElementSibling.style.display='none';"><span style="color: #999; display: none;"><div data-i18n="admin:events.noImage">${translate('admin:events.noImage')}</div></span>` : `<img data-auth-src="${imageUrl}" alt="Event image" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;"><span style="color: #999; display: none;"><div data-i18n="admin:events.noImage">${translate('admin:events.noImage')}</div></span>`) : '<span style="color: #999;"><div data-i18n="admin:events.noImage">' + translate('admin:events.noImage') + '</div></span>'}
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
    
    getContentTarget().innerHTML = renderTable({
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
    
    const target = getContentTarget();
    const tbody = target.querySelector('tbody');
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
    
    target.querySelector('#addEvent').addEventListener('click', async ()=>{
      openEventForm({}, true);
    });
    // Load auth-protected event images
    loadAuthImages(target);
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
    setLoading(translate('admin:loadingCourses'));
    
    try {
      const res = await api(`/api/admin/courseData?lang=${getUserLanguage()}`);
      const data = res.ok ? await res.json() : [];
      
      // Group by course type for better organization
      const courseGroups = {
        welcome_cocktails: [],
        starter: [],
        main: [],
        dessert: [],
        late_night_snacks: [],
        drinks: []
      };
      
      (data || []).forEach(part => {
        if (courseGroups[part.course]) {
          courseGroups[part.course].push(part);
        }
      });
      
      const courseIcons = {
        welcome_cocktails: 'fa-glass-cheers',
        starter: 'fa-utensils',
        main: 'fa-drumstick-bite',
        dessert: 'fa-birthday-cake',
        late_night_snacks: 'fa-moon',
        drinks: 'fa-wine-glass-alt'
      };
      
      const courseNames = {
        welcome_cocktails: translate('admin:menu.courseType.welcome_cocktails'),
        starter: translate('admin:menu.courseType.starter'),
        main: translate('admin:menu.courseType.main'),
        dessert: translate('admin:menu.courseType.dessert'),
        late_night_snacks: translate('admin:menu.courseType.late_night_snacks'),
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
                      ${option.imageCloseup ? `<img src="${option.imageCloseup}" alt="${option.label} close-up" class="option-image option-image-closeup" onerror="this.style.display='none'">` : ''}
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
      
      getContentTarget().innerHTML = menuContent;

      // Load auth-protected images (chef profile photo)
      loadAuthImages(getContentTarget());
      
      // Add global add button handler
      getContentTarget().querySelector('#addMenuCourse')?.addEventListener('click', () => {
        openAddMenuForm();
      });
      
    } catch(e) { 
      console.error('Error loading menu:', e); 
      notify('Error loading menu: ' + e.message, 'error'); 
      getContentTarget().innerHTML = `
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
              { value: 'welcome_cocktails', label: translate('admin:menu.option.welcome_cocktails') },
              { value: 'starter', label: translate('admin:menu.option.starter') },
              { value: 'main', label: translate('admin:menu.option.main') },
              { value: 'dessert', label: translate('admin:menu.option.dessert') },
              { value: 'late_night_snacks', label: translate('admin:menu.option.late_night_snacks') },
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

      const currentImageUrl = existingData?.image || null;
      const currentImageCloseupUrl = existingData?.imageCloseup || null;
      const showCurrentImage = isEditing && currentImageUrl;

      openFormModal({
        title: isEditing ? `<div data-i18n="admin:menu.editCourseOption">${translate('admin:menu.editCourseOption')}</div>` : `<div data-i18n="admin:menu.addCourseOption">${translate('admin:menu.addCourseOption')}</div>`,
        submitText: isEditing ? `<span data-i18n="admin:menu.save">${translate('admin:menu.save')}</span>` : `<span data-i18n="admin:menu.add">${translate('admin:menu.add')}</span>`,
        showCurrentImage: showCurrentImage,
        currentImageUrl: currentImageUrl,
        afterRender: (modal) => {
          const imageField = modal.querySelector('[data-field="image"]');
          if (!imageField) return;
          const placeholderImg = currentImageCloseupUrl
            ? `<img src="${currentImageCloseupUrl}" alt="Current close-up" style="max-width:100%; max-height:200px; object-fit:contain; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
               <div style="margin-top:8px; color:#666; font-size:0.9em;"><i class="fas fa-info-circle"></i> ${translate('admin:menu.field.imageCloseupCurrent') || 'Current close-up image'}</div>`
            : `<div style="text-align:center; color:#999;">
                 <i class="fas fa-image" style="font-size:2em; margin-bottom:10px; display:block;"></i>
                 <div>${translate('admin:menu.field.imageCloseupPreviewHint') || 'Close-up preview will appear here'}</div>
               </div>`;
          const block = document.createElement('div');
          block.style.marginBottom = '14px';
          block.dataset.field = 'imageCloseup';
          block.innerHTML = `
            <label for="f_imageCloseup" style="display:block;margin:6px 0 6px 0;font-weight:600;color:#333;">
              ${translate('admin:menu.field.imageCloseup') || 'Close-up image (optional)'}
            </label>
            <input id="f_imageCloseup" name="imageCloseup" type="file" accept="image/*" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
            <small style="display:block;color:#6c757d;margin-top:4px;">
              ${translate('admin:menu.field.imageCloseupHelp') || 'Optional close-up shot shown in the photo viewer'}
            </small>
            <div id="f_imageCloseup-preview" style="margin-top:10px; padding:10px; border:1px dashed #ddd; border-radius:8px; background:#f8f9fa; min-height:120px; display:flex; align-items:center; justify-content:center;">
              <div style="text-align:center;">${placeholderImg}</div>
            </div>`;
          imageField.insertAdjacentElement('afterend', block);
          attachImagePreview(modal.querySelector('#f_imageCloseup'), modal.querySelector('#f_imageCloseup-preview'));
        },
        fields: [
          { name: 'label', label: translate('admin:menu.field.option'), required: true, help: translate('admin:menu.field.optionHelp') },
          { name: 'image', label: translate('admin:menu.field.image'), type: 'file', help: translate('admin:menu.field.imageHelp') },
          { name: 'description', label: translate('admin:menu.field.optionDescription'), type: 'textarea', required: false, help: translate('admin:menu.field.optionDescriptionHelp') },
          // Special Dietary Indicators
          { name: 'isVegetarian', label: translate('admin:menu.field.isVegetarian'), type: 'checkbox', help: translate('admin:menu.field.helpVegetarian') },
          { name: 'isVegan', label: translate('admin:menu.field.isVegan'), type: 'checkbox', help: translate('admin:menu.field.helpVegan') },
          { name: 'containsAllergens', label: translate('admin:menu.field.containsAllergens'), type: 'checkbox', help: translate('admin:menu.field.helpAllergens') },
          { name: 'containsLactose', label: translate('admin:menu.field.containsLactose'), type: 'checkbox', help: translate('admin:menu.field.helpLactose') },
          { name: 'isSpicy', label: translate('admin:menu.field.isSpicy'), type: 'checkbox', help: translate('admin:menu.field.helpSpicy') },
          { name: 'containsNuts', label: translate('admin:menu.field.containsNuts'), type: 'checkbox', help: translate('admin:menu.field.helpNuts') },
          { name: 'allowsCookingPreference', label: translate('admin:menu.field.allowsCookingPreference'), type: 'checkbox', help: translate('admin:menu.field.helpAllowsCookingPreference') },
        ],
        initialValues: {
          label: existingData?.label || '',
          image: existingData?.image || '',
          description: existingData?.description || '',
          isVegetarian: existingData?.isVegetarian || false,
          isVegan: existingData?.isVegan || false,
          containsAllergens: existingData?.containsAllergens || false,
          containsLactose: existingData?.containsLactose || false,
          isSpicy: existingData?.isSpicy || false,
          containsNuts: existingData?.containsNuts || false,
          allowsCookingPreference: existingData?.allowsCookingPreference || false
        },
        onSubmit: async (values, close, modal) => {
          try {
            const uploadField = async (file) => {
              const fd = new FormData();
              fd.append('image', file);
              const r = await fetch('/api/admin/menu-options/upload-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd
              });
              if (!r.ok) throw new Error(`Upload failed: HTTP ${r.status}`);
              const d = await r.json();
              return { imageId: d.imageId };
            };
            const keepExistingRef = (img) => {
              if (!img) return null;
              if (typeof img === 'string') return img;
              if (img.imageId) return { imageId: img.imageId };
              if (img._id) return img._id.toString();
              return img;
            };

            const imageFile = document.getElementById('f_image')?.files[0];
            const imageCloseupFile = document.getElementById('f_imageCloseup')?.files[0];

            const imageReference = imageFile
              ? await uploadField(imageFile)
              : keepExistingRef(existingData?.image);
            const imageCloseupReference = imageCloseupFile
              ? await uploadField(imageCloseupFile)
              : keepExistingRef(existingData?.imageCloseup);

            const courseData = {
              label: values.label,
              image: imageReference,
              imageCloseup: imageCloseupReference,
              description: values.description,
              isVegetarian: values.isVegetarian || false,
              isVegan: values.isVegan || false,
              containsAllergens: values.containsAllergens || false,
              containsLactose: values.containsLactose || false,
              isSpicy: values.isSpicy || false,
              containsNuts: values.containsNuts || false,
              allowsCookingPreference: values.allowsCookingPreference || false
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
      giftsEnabled: false,
      seatingEnabled: false
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
              { key: 'seatingEnabled', label: 'admin:settings.seating', icon: 'fa-chair', desc: 'admin:settings.seatingDesc' },
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
        guestsEnabled: featureKey === 'guestsEnabled' ? enabled : (document.getElementById('toggle-guestsEnabled')?.checked || false),
        eventsEnabled: featureKey === 'eventsEnabled' ? enabled : (document.getElementById('toggle-eventsEnabled')?.checked || false),
        menuEnabled: featureKey === 'menuEnabled' ? enabled : (document.getElementById('toggle-menuEnabled')?.checked || false),
        seatingEnabled: featureKey === 'seatingEnabled' ? enabled : (document.getElementById('toggle-seatingEnabled')?.checked || false),
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

  window.openVenuePrintTokenDialog = async function() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
    overlay.innerHTML = `
      <div class="admin-card" style="max-width:480px;width:90%;padding:24px;background:#fff;border-radius:12px;text-align:center;">
        <h3 style="margin:0 0 8px;"><i class="fas fa-store" style="color:var(--primary-color);"></i> Venue Access</h3>
        <p style="margin:0 0 16px;color:var(--text-light);font-size:0.9em;">Token-protected URL for venue staff to view and print the seating plan in Spanish. Read-only.</p>
        <div id="venueTokenContent" style="min-height:200px;"></div>
        <div style="margin-top:20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button id="venueTokenRotate" class="btn" style="background:var(--primary-color);color:#fff;"><i class="fas fa-sync-alt"></i> Generate / Rotate</button>
          <button id="venueTokenClose" class="btn" style="background:var(--gray-200);color:var(--text-dark);">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#venueTokenClose');
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const renderTokenState = (data) => {
      const contentEl = overlay.querySelector('#venueTokenContent');
      if (!data || !data.hasToken) {
        contentEl.innerHTML = `
          <div style="padding:24px;color:var(--text-light);">
            <i class="fas fa-info-circle" style="font-size:2em;margin-bottom:8px;color:var(--primary-color);"></i>
            <p style="margin:0;">No token generated yet. Click "Generate / Rotate" to create one.</p>
          </div>`;
      } else {
        contentEl.innerHTML = `
          <img src="${data.qrDataUrl}" alt="Venue Print QR" style="width:240px;height:240px;border:1px solid var(--gray-200);border-radius:8px;" />
          <p style="margin:12px 0 4px;font-size:0.8em;color:var(--text-light);">Scan to open the venue print page.</p>
          <p style="margin:0;font-size:0.7em;color:var(--text-light);word-break:break-all;"><a href="${data.url}" target="_blank" style="color:var(--primary-color);">${data.url}</a></p>
          <p style="margin:8px 0 0;font-size:0.75em;color:#dc3545;"><i class="fas fa-exclamation-triangle"></i> Rotating invalidates any URL/QR previously shared.</p>
        `;
      }
    };

    overlay.querySelector('#venueTokenRotate').addEventListener('click', async () => {
      const btn = overlay.querySelector('#venueTokenRotate');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…';
      try {
        const r = await api('/api/admin/venue-print-token/rotate', { method: 'POST' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        renderTokenState({ hasToken: true, ...data });
        notify('Venue access token rotated.', 'success');
      } catch (e) {
        notify('Failed to rotate token: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Generate / Rotate';
      }
    });

    try {
      const r = await api('/api/admin/venue-print-token');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      renderTokenState(data);
    } catch (e) {
      overlay.querySelector('#venueTokenContent').innerHTML = `<p style="color:#dc3545;">Failed to load token state: ${e.message}</p>`;
    }
  };



  // Router for tabs
  function showTab(tab){
    localStorage.setItem('adminPage', tab);
    activate(tab);

    // Tabs with sub-tabs: render sub-tab bar then dispatch
    if (SUB_TABS[tab]) {
      content.innerHTML = renderSubTabs(tab);
      // Attach click handlers to sub-tab buttons
      document.querySelectorAll('.sub-tab').forEach(btn => {
        btn.addEventListener('click', () => showSubTab(tab, btn.dataset.subtab));
      });
      // Show the saved or default sub-tab
      const savedSubTab = localStorage.getItem('adminSubPage_' + tab) || SUB_TABS[tab][0].id;
      showSubTab(tab, savedSubTab);
      return;
    }

    // Tabs without sub-tabs: direct dispatch
    switch(tab){
      case 'messages': return showMessages();
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

