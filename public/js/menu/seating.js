// Seating Plan Module
// Interactive seating view for wedding guests

// ============================================================================
// TABLE_POSITIONS: Hardcoded percentage-based positions for each table
// on the static seating plan image (seating plan.png, 1543 x 1148 px).
// Key = table number (0 = Head Table). Values = { x, y } as % from top-left.
// ============================================================================
const TABLE_POSITIONS = {
  0:  { x: 47.0, y: 78.0 },  // Head Table — bottom center
  1:  { x: 37.5, y: 75.5 },  // Table 1 — just left of HT
  2:  { x: 57.5, y: 75.5 },  // Table 2 — just right of HT
  3:  { x: 20.0, y: 74.0 },  // Table 3 — further left of Table 1
  4:  { x: 73.5, y: 66.5 },  // Table 4 — further right of Table 2
  5:  { x: 29.0, y: 61.6 },  // Table 5 — left mid-lower
  6:  { x: 61.8, y: 56.8 },  // Table 6 — right middle
  7:  { x: 19.9, y: 50.9 },  // Table 7 — left middle
  8:  { x: 83.3, y: 53.3 },  // Table 8 — far right
  9:  { x: 10.1, y: 61.4 },  // Table 9 — lower left
  10: { x: 63.6, y: 40.5 },  // Table 10 — upper right
  11: { x: 29.1, y: 39.0 },  // Table 11 — upper left-mid
  12: { x: 75.9, y: 37.7 },  // Table 12 — upper right
  13: { x: 10.1, y: 39.0 },  // Table 13 — top far-left
};


// ============================================================================
// loadSeatingView() — Main entry point, called from menu.js switchMenuView
// ============================================================================
async function loadSeatingView() {
  const viewContainer = document.getElementById('menu-view-container');
  if (!viewContainer) return;

  // Show loading
  viewContainer.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>${translate('guests:menuLoading')}</p>
    </div>
  `;

  try {
    // Fetch party members and table assignments in parallel
    const [partyResponse, assignmentsResponse] = await Promise.all([
      fetch('/api/guest/party', {
        method: 'GET',
        headers: { 'Authorization': window.token }
      }),
      fetch('/api/guest/table-assignments', {
        method: 'GET',
        headers: { 'Authorization': window.token }
      })
    ]);

    if (!partyResponse.ok) {
      viewContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>${translate('guests:menuErrorTitle')}</h3>
          <p>${translate('guests:menuErrorMessage')}</p>
          <button class="btn-retry" onclick="loadSeatingView()">
            <i class="fas fa-redo"></i> ${translate('guests:retry')}
          </button>
        </div>
      `;
      return;
    }

    const partyData = await partyResponse.json();
    const assignments = assignmentsResponse.ok ? await assignmentsResponse.json() : [];

    // Build assignment lookup: partyMemberName → assignment
    // For primary guest, partyMemberName is null
    const assignmentMap = {};
    assignments.forEach(a => {
      const key = a.partyMemberName || '__primary__';
      assignmentMap[key] = a;
    });

    // Match party members to assignments
    const partyWithTables = partyData.map(member => {
      // Primary guest: partyMemberName is null in assignment
      let assignment;
      if (member.primary) {
        assignment = assignmentMap['__primary__'];
      } else {
        assignment = assignmentMap[member.name];
      }
      return {
        ...member,
        tableNumber: assignment ? assignment.tableNumber : null,
        tableName: assignment ? assignment.tableName : null,
        isHeadTable: assignment ? assignment.isHeadTable : false
      };
    });

    // Build HTML
    let html = '<div class="seating-view-container">';

    // Header
    html += `
      <div class="intro-card intro-section">
        <h2 class="card-title">
          <i class="fas fa-chair"></i>
          <span data-i18n="guests:seatingTitle">${translate('guests:seatingTitle')}</span>
        </h2>
        <p class="card-description" data-i18n="guests:seatingDescription">${translate('guests:seatingDescription')}</p>
      </div>
    `;

    // Party member buttons
    html += `
      <div class="seating-party-buttons">
        <p class="seating-select-label" data-i18n="guests:selectPartyMember">${translate('guests:selectPartyMember')}</p>
        <div class="seating-buttons-row">
    `;

    partyWithTables.forEach((member, idx) => {
      const tableLabelText = member.isHeadTable
        ? translate('guests:headTable')
        : member.tableNumber != null
          ? `${translate('guests:table')} ${member.tableNumber}`
          : translate('guests:notAssigned');

      html += `
        <button class="seating-member-btn" data-member-idx="${idx}" data-table-number="${member.tableNumber}" data-is-head="${member.isHeadTable}" onclick="showTableLocation(${idx})">
          <i class="fas fa-user"></i>
          <span class="member-btn-name">${escapeHtml(member.name)}</span>
          <span class="member-btn-table">${tableLabelText}</span>
        </button>
      `;
    });

    html += `
        </div>
      </div>
    `;

    // Seating plan image with overlay container
    html += `
      <div class="seating-plan-wrapper">
        <div class="seating-plan-container" id="seating-plan-container">
          <img src="/assets/images/seating%20plan.png"
               alt="${translate('guests:seatingTitle')}"
               class="seating-plan-image"
               id="seating-plan-image" />
          <img src="/assets/images/location.png"
               alt="Location marker"
               class="seating-location-marker"
               id="seating-location-marker"
               style="display: none;" />
        </div>
      </div>
    `;

    // Table companions section (populated on click)
    html += `
      <div class="seating-companions-section" id="seating-companions" style="display:none;">
        <h3 class="companions-title"><i class="fas fa-users"></i> <span id="companions-table-name"></span></h3>
        <div class="companions-list" id="companions-list"></div>
      </div>
    `;

    html += '</div>'; // Close seating-view-container

    viewContainer.innerHTML = html;

    // Store party data for click handler
    window._seatingPartyData = partyWithTables;


    // Translate newly loaded content
    if (typeof updatePageContent === 'function') {
      updatePageContent();
    }

  } catch (err) {
    console.error('Error loading seating view:', err);
    viewContainer.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>${translate('guests:menuErrorTitle')}</h3>
        <p>${translate('guests:menuErrorMessage2')}</p>
        <button class="btn-retry" onclick="loadSeatingView()">
          <i class="fas fa-redo"></i> ${translate('guests:retry')}
        </button>
      </div>
    `;
  }
}

// ============================================================================
// showTableLocation() — Overlay location.png on the correct table
// ============================================================================
function showTableLocation(memberIdx) {
  const partyData = window._seatingPartyData;
  if (!partyData || !partyData[memberIdx]) return;

  const member = partyData[memberIdx];
  const marker = document.getElementById('seating-location-marker');
  const container = document.getElementById('seating-plan-container');

  if (!marker || !container) return;

  // Update active button state
  document.querySelectorAll('.seating-member-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-member-idx="${memberIdx}"]`)?.classList.add('active');

  // Companions section ref
  const companionsSection = document.getElementById('seating-companions');
  const companionsList = document.getElementById('companions-list');
  const companionsTableName = document.getElementById('companions-table-name');

  if (member.tableNumber == null && !member.isHeadTable) {
    // Not assigned — hide marker and companions, show toast
    marker.style.display = 'none';
    if (companionsSection) companionsSection.style.display = 'none';
    if (typeof showToast === 'function') {
      showToast(translate('guests:notAssigned'), 'info');
    }
    return;
  }

  // Get position from TABLE_POSITIONS
  const tableKey = member.isHeadTable ? 0 : member.tableNumber;
  const pos = TABLE_POSITIONS[tableKey];

  if (!pos) {
    marker.style.display = 'none';
    return;
  }

  // Position the marker so its bottom-center tip points at the table center
  // Use percentage positioning + transform for responsive scaling
  marker.style.display = 'block';
  marker.style.left = pos.x + '%';
  marker.style.top = pos.y + '%';
  marker.style.transform = 'translate(-50%, -100%)'; // center horizontally, anchor at bottom

  // Smooth scroll to the image area
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Fetch and show table companions
  loadTableCompanions(tableKey, member.name, companionsSection, companionsList, companionsTableName);
}

// ============================================================================
// loadTableCompanions() — Fetch and display who else is at the same table
// ============================================================================
async function loadTableCompanions(tableNumber, currentMemberName, section, list, titleEl) {
  if (!section || !list || !titleEl) return;

  try {
    const res = await fetch(`/api/guest/table-companions/${tableNumber}`, {
      method: 'GET',
      headers: { 'Authorization': window.token }
    });

    if (!res.ok) {
      section.style.display = 'none';
      return;
    }

    const data = await res.json();
    const companions = data.companions || [];

    // Table display name
    const tableName = data.isHeadTable
      ? translate('guests:headTable')
      : `${translate('guests:table')} ${data.tableNumber}`;
    titleEl.textContent = tableName;

    // Build companion chips (highlight current member)
    list.innerHTML = companions.map(c => {
      const isCurrent = c.name === currentMemberName;
      return `<span class="companion-chip${isCurrent ? ' companion-current' : ''}">
        <i class="fas fa-user"></i> ${escapeHtml(c.name)}
      </span>`;
    }).join('');

    section.style.display = companions.length > 0 ? '' : 'none';
  } catch (err) {
    console.error('Error loading table companions:', err);
    section.style.display = 'none';
  }
}


// ============================================================================
// Deep link handling
// ============================================================================
function checkSeatingDeepLink() {
  const params = new URLSearchParams(window.location.search);
  return params.get('seating') === 'show';
}

// Make functions globally accessible
window.loadSeatingView = loadSeatingView;
window.showTableLocation = showTableLocation;
window.checkSeatingDeepLink = checkSeatingDeepLink;
