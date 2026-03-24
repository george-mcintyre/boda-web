// Seating Plan Module
// Interactive seating view for wedding guests

// ============================================================================
// TABLE_POSITIONS: Hardcoded percentage-based positions for each table
// on the static seating plan image (seating-plan.png, 1455 x 860 px).
// Key = table number (1 = Head Table). Values = { x, y } as % from top-left.
// 12 tables total: Table 1 (high table) + Tables 2–12.
// ============================================================================
// ============================================================================
// Seat positioning for round tables (2–12).
// 10 seats per table, evenly spaced clockwise, seat 01 at 12 o'clock.
// Radius measured from table center to seat center (70 px on 1455×860 image).
// ============================================================================
const SEATS_PER_TABLE = 10;
const SEAT_RADIUS_X = 3.0;   // 43px / 1455px * 100
const SEAT_RADIUS_Y = 5.0;   // 43px / 860px  * 100

function getSeatPosition(tablePos, seatNumber) {
  if (!seatNumber || seatNumber < 1 || seatNumber > SEATS_PER_TABLE) return tablePos;
  const angle = -Math.PI / 2 + (seatNumber - 1) * (2 * Math.PI / SEATS_PER_TABLE);
  return {
    x: tablePos.x + SEAT_RADIUS_X * Math.cos(angle),
    y: tablePos.y + SEAT_RADIUS_Y * Math.sin(angle)
  };
}

const HEAD_TABLE_SEATS = 6;
const HEAD_TABLE_HALF_WIDTH = 7.0;
const HEAD_TABLE_SEAT_ORDER = [3, 4, 1, 2, 5, 6];

function getHeadTableSeatPosition(tablePos, seatNumber) {
  if (!seatNumber || seatNumber < 1 || seatNumber > HEAD_TABLE_SEATS) return tablePos;
  const posIdx = HEAD_TABLE_SEAT_ORDER.indexOf(seatNumber);
  if (posIdx < 0) return tablePos;
  const step = (2 * HEAD_TABLE_HALF_WIDTH) / (HEAD_TABLE_SEATS - 1);
  return {
    x: tablePos.x - HEAD_TABLE_HALF_WIDTH + posIdx * step,
    y: tablePos.y
  };
}

const TABLE_POSITIONS = {
  1:  { x: 44.5, y: 76.5 },  // Table 1 (High Table) — bottom center, rectangular
  2:  { x: 36.0, y: 72.5 },  // Table 2 — left of dance floor, near bottom
  3:  { x: 52.5, y: 72.5 },  // Table 3 — right of dance floor, near bottom
  4:  { x: 26.75, y: 76.5 },  // Table 4 — bottom-left
  5:  { x: 63.0, y: 75.0 },  // Table 5 — right side, lower
  6:  { x: 27.5, y: 56.5 },  // Table 6 — left-center
  7:  { x: 61.5, y: 56.5 },  // Table 7 — right of dance floor, mid
  8:  { x: 19.5, y: 65.0 },  // Table 8 — left side, between 10 and 4
  9:  { x: 75.0, y: 65.0 },  // Table 9 — far right, mid-lower
  10: { x: 20.0, y: 47.5 },  // Table 10 — upper left
  11: { x: 81.5, y: 48.5 },  // Table 11 — far right, upper
  12: { x: 71.5, y: 40.0 },  // Table 12 — upper right
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
        isHeadTable: assignment ? assignment.isHeadTable : false,
        seatNumber: assignment ? assignment.seatNumber : null
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
      const seatLabelText = member.seatNumber != null
        ? `${translate('guests:seat')} ${member.seatNumber}`
        : '';

      html += `
        <button class="seating-member-btn" data-member-idx="${idx}" data-table-number="${member.tableNumber}" data-is-head="${member.isHeadTable}" onclick="showTableLocation(${idx})">
          <i class="fas fa-user"></i>
          <span class="member-btn-name">${escapeHtml(member.name)}</span>
          <span class="member-btn-table">${tableLabelText}${seatLabelText ? ', ' + seatLabelText : ''}</span>
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
          <img src="/assets/images/seating-plan.png"
               alt="${translate('guests:seatingTitle')}"
               class="seating-plan-image"
               id="seating-plan-image" />
          <img src="/assets/images/location.png"
               alt="Location marker"
               class="seating-location-marker"
               id="seating-location-marker"
               style="display: none;" />
          <div class="seating-companion-marker"
               id="seating-companion-marker"
               style="display: none;">
            <i class="fas fa-map-marker-alt"></i>
          </div>
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

  clearCompanionMarker();

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
  const tableKey = member.tableNumber;
  const pos = TABLE_POSITIONS[tableKey];

  if (!pos) {
    marker.style.display = 'none';
    return;
  }

  const target = member.seatNumber
    ? (member.isHeadTable ? getHeadTableSeatPosition(pos, member.seatNumber) : getSeatPosition(pos, member.seatNumber))
    : pos;

  marker.style.display = 'block';
  marker.style.left = target.x + '%';
  marker.style.top = target.y + '%';
  marker.style.transform = 'translate(-50%, -100%)';

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

    window._seatingCompanions = { tableNumber: data.tableNumber, isHeadTable: data.isHeadTable, companions };

    list.innerHTML = companions.map((c, i) => {
      const isCurrent = c.name === currentMemberName;
      const seatLabel = c.seatNumber != null ? ` (${translate('guests:seat')} ${c.seatNumber})` : '';
      const hasseat = c.seatNumber != null;
      return `<span class="companion-chip${isCurrent ? ' companion-current' : ''} companion-clickable"
        ${hasseat ? `onclick="${isCurrent ? 'clearCompanionMarker()' : `showCompanionLocation(${i})`}"` : ''}>
        <i class="fas fa-user"></i> ${escapeHtml(c.name)}${seatLabel}
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

// ============================================================================
// showCompanionLocation() — Show a distinct marker for a table companion
// ============================================================================
function showCompanionLocation(companionIdx) {
  const data = window._seatingCompanions;
  if (!data || !data.companions[companionIdx]) return;

  const companion = data.companions[companionIdx];
  const marker = document.getElementById('seating-companion-marker');
  const container = document.getElementById('seating-plan-container');
  if (!marker || !container) return;

  if (marker.style.display !== 'none' && marker.dataset.activeIdx === String(companionIdx)) {
    marker.style.display = 'none';
    document.querySelectorAll('.companion-chip.companion-active').forEach(c => c.classList.remove('companion-active'));
    return;
  }

  const tableKey = data.tableNumber;
  const pos = TABLE_POSITIONS[tableKey];
  if (!pos) return;

  const target = companion.seatNumber
    ? (data.isHeadTable ? getHeadTableSeatPosition(pos, companion.seatNumber) : getSeatPosition(pos, companion.seatNumber))
    : pos;

  marker.dataset.activeIdx = String(companionIdx);
  marker.style.display = 'flex';
  marker.style.left = target.x + '%';
  marker.style.top = target.y + '%';

  // Update active chip
  document.querySelectorAll('.companion-chip.companion-active').forEach(c => c.classList.remove('companion-active'));
  const allClickable = document.querySelectorAll('.companion-chip.companion-clickable');
  allClickable[companionIdx]?.classList.add('companion-active');

  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearCompanionMarker() {
  const marker = document.getElementById('seating-companion-marker');
  if (marker) { marker.style.display = 'none'; delete marker.dataset.activeIdx; }
  document.querySelectorAll('.companion-chip.companion-active').forEach(c => c.classList.remove('companion-active'));
}

window.loadSeatingView = loadSeatingView;
window.showTableLocation = showTableLocation;
window.showCompanionLocation = showCompanionLocation;
window.clearCompanionMarker = clearCompanionMarker;
window.checkSeatingDeepLink = checkSeatingDeepLink;
