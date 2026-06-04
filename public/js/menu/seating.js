// Seating Plan Module
// Interactive seating view for wedding guests

// ============================================================================
// TABLE_POSITIONS: Hardcoded percentage-based positions for each table
// on the static seating plan image (seating-plan.png, 1456 x 861 px).
// Key = table number (1 = Head Table). Values = { x, y } as % from top-left.
// 10 tables total: Table 1 (high table) + round Tables 2–10.
// Centres measured from the rendered image (white table disk centroids).
// ============================================================================
// ============================================================================
// Seat positioning for round tables (2–10).
// Seats evenly spaced clockwise, seat 01 at 12 o'clock. The seat ring radius
// is NOT constant: larger tables (11–12 places) are drawn bigger than the
// standard 10-place tables, so the radius scales with the table's seat count.
// Radii measured from the image (seat-box centroids to disk centre):
//   10 places → 40.1 px;  11–12 places → 47.3 px  (on the 1456×861 image).
// ============================================================================
const SEATS_PER_TABLE = 10;

// Seat-ring radius as a % of image width/height, keyed by total places at the
// table. Falls back to the 10-place radius for any unlisted count.
const SEAT_RADIUS_BY_SEATS = {
  10: { x: 2.75, y: 4.66 },   // 40.1px / 1456 , 40.1px / 861
  11: { x: 3.25, y: 5.49 },   // 47.3px / 1456 , 47.3px / 861
  12: { x: 3.25, y: 5.49 },   // 11- and 12-place tables share the larger disk
};
const SEAT_RADIUS_DEFAULT = SEAT_RADIUS_BY_SEATS[10];

function getSeatPosition(tablePos, seatNumber, totalSeats) {
  const divisor = totalSeats > SEATS_PER_TABLE ? totalSeats : SEATS_PER_TABLE;
  if (!seatNumber || seatNumber < 1 || seatNumber > divisor) return tablePos;
  const radius = SEAT_RADIUS_BY_SEATS[divisor] || SEAT_RADIUS_DEFAULT;
  const angle = -Math.PI / 2 + (seatNumber - 1) * (2 * Math.PI / divisor);
  return {
    x: tablePos.x + radius.x * Math.cos(angle),
    y: tablePos.y + radius.y * Math.sin(angle)
  };
}

const HEAD_TABLE_HALF_WIDTH = 4.22;
const HEAD_TABLE_SEAT_ORDER = [3, 4, 1, 2, 5, 6];

function getHeadTableSeatPosition(tablePos, seatNumber) {
  const totalSeats = HEAD_TABLE_SEAT_ORDER.length;
  if (!seatNumber || seatNumber < 1 || seatNumber > totalSeats) return tablePos;
  const posIdx = HEAD_TABLE_SEAT_ORDER.indexOf(seatNumber);
  if (posIdx < 0) return tablePos;
  const step = (2 * HEAD_TABLE_HALF_WIDTH) / (totalSeats - 1);
  return {
    x: tablePos.x - HEAD_TABLE_HALF_WIDTH + posIdx * step,
    y: tablePos.y
  };
}

const TABLE_POSITIONS = {
  1:  { x: 44.5,  y: 79.5 },  // Table 1 (High Table) — bottom centre, rectangular
  2:  { x: 36.15, y: 70.85 }, // Table 2 — left of dance floor, near bottom
  3:  { x: 52.46, y: 71.77 }, // Table 3 — right of dance floor, near bottom (11)
  4:  { x: 26.65, y: 74.86 }, // Table 4 — bottom-left
  5:  { x: 62.73, y: 74.08 }, // Table 5 — right side, lower (11)
  6:  { x: 26.99, y: 56.01 }, // Table 6 — left-centre (12)
  7:  { x: 61.20, y: 55.89 }, // Table 7 — right of dance floor, mid (11)
  8:  { x: 19.37, y: 64.50 }, // Table 8 — left side, between 10 and 4
  9:  { x: 75.09, y: 64.52 }, // Table 9 — far right, mid-lower
  10: { x: 19.82, y: 47.34 }, // Table 10 — upper left
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
async function showTableLocation(memberIdx) {
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

  const companionsSection = document.getElementById('seating-companions');
  const companionsList = document.getElementById('companions-list');
  const companionsTableName = document.getElementById('companions-table-name');

  if (member.tableNumber == null && !member.isHeadTable) {
    marker.style.display = 'none';
    if (companionsSection) companionsSection.style.display = 'none';
    if (typeof showToast === 'function') {
      showToast(translate('guests:notAssigned'), 'info');
    }
    return;
  }

  const tableKey = member.tableNumber;
  const pos = TABLE_POSITIONS[tableKey];

  if (!pos) {
    marker.style.display = 'none';
    return;
  }

  const totalSeats = await loadTableCompanions(tableKey, member.name, companionsSection, companionsList, companionsTableName);

  const target = member.seatNumber
    ? (member.isHeadTable ? getHeadTableSeatPosition(pos, member.seatNumber) : getSeatPosition(pos, member.seatNumber, totalSeats))
    : pos;

  marker.style.display = 'block';
  marker.style.left = target.x + '%';
  marker.style.top = target.y + '%';
  marker.style.transform = 'translate(-50%, -100%)';

  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================================================
// loadTableCompanions() — Fetch and display who else is at the same table
// ============================================================================
async function loadTableCompanions(tableNumber, currentMemberName, section, list, titleEl) {
  if (!section || !list || !titleEl) return SEATS_PER_TABLE;

  try {
    const res = await fetch(`/api/guest/table-companions/${tableNumber}`, {
      method: 'GET',
      headers: { 'Authorization': window.token }
    });

    if (!res.ok) {
      section.style.display = 'none';
      return SEATS_PER_TABLE;
    }

    const data = await res.json();
    const companions = (data.companions || []).sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999));

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
    return companions.length;
  } catch (err) {
    console.error('Error loading table companions:', err);
    section.style.display = 'none';
    return SEATS_PER_TABLE;
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
    ? (data.isHeadTable ? getHeadTableSeatPosition(pos, companion.seatNumber) : getSeatPosition(pos, companion.seatNumber, data.companions.length))
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
