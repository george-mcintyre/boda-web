// Gifts Management Module

function formatPartyNames(partyData) {
  const names = partyData.map(p => p.name);

  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;

// 3 or more: "A, B, & C"
  return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
}

function renderCashGiftCardHtml(gift, isAvailable) {
  const titleEsc = escapeHtml(gift.title);
  const descEsc = escapeHtml(gift.description || '');
  const clickAttrs = isAvailable
    ? `role="button" tabindex="0" onclick="purchaseGift('${gift.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();purchaseGift('${gift.id}');}"`
    : '';
  return `
        <div class="card gift-credit-card ${!isAvailable ? 'sold-out' : ''}" data-gift-id="${gift.id}">
            <div class="gift-card-image-section ${isAvailable ? 'is-clickable' : ''}"
                 style="background-image: url('${escapeHtml(gift.imageUrl)}');"
                 ${clickAttrs}>
                <div class="gift-card-image-overlay">
                    <h4 class="gift-card-title">${titleEsc}</h4>
                    <div class="gift-card-price">${escapeHtml(gift.priceDisplay)}</div>
                </div>
            </div>
            <div class="gift-card-details">
            <p class="gift-card-description">${descEsc}</p>
            <div class="gift-card-stock">
                ${isAvailable
                  ? `<span class="stock-available"><i class="fas fa-check-circle"></i> ${gift.stock} <span data-i18n="guests:giftsAvailable">${translate('guests:giftsAvailable')}</span></span>`
                  : `<span class="stock-sold-out"><i class="fas fa-times-circle"></i> <span data-i18n="guests:giftsSoldOut">${translate('guests:giftsSoldOut')}</span></span>`}
            </div>
            <div class="action-container">
                ${isAvailable ? `
                <button class="btn-base btn-primary btn-sm" onclick="purchaseGift('${gift.id}')">
                    <i class="fas fa-credit-card"></i>
                    <span data-i18n="guests:giftsBuyGift">${translate('guests:giftsBuyGift')}</span>
                </button>
                ` : `
                <button class="btn-disabled" disabled>
                    <i class="fas fa-ban"></i>
                    <span data-i18n="guests:giftsSoldOut">${translate('guests:giftsSoldOut')}</span>
                </button>
                `}
            </div>
            </div>
        </div>
        `;
}

function renderCubeGiftCardHtml(gift, isAvailable) {
  const minPrice = Array.isArray(gift.amountOptions) && gift.amountOptions.length
    ? Math.min(...gift.amountOptions)
    : 0;
  const priceDisplay = `${translate('guests:gifts.cube.priceFrom')} €${minPrice}`;
  const titleEsc = escapeHtml(gift.title);
  const clickableAttrs = isAvailable
    ? `role="button" tabindex="0" onclick="purchaseCube('${gift.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();purchaseCube('${gift.id}');}"`
    : '';
  return `
        <div class="card gift-credit-card gift-cube-card ${!isAvailable ? 'sold-out' : 'is-clickable'}"
             data-gift-id="${gift.id}"
             data-cube-id="${gift.cubeId}"
             ${clickableAttrs}>
            <div class="gift-card-image-section gift-cube-card__viewer-host">
                <div class="gift-cube-card__viewer-mount" data-cube-thumb="true"></div>
                <div class="gift-card-image-overlay">
                    <h4 class="gift-card-title">${titleEsc}</h4>
                    <div class="gift-card-price">${escapeHtml(priceDisplay)}</div>
                </div>
            </div>
            <div class="gift-card-details">
                <p class="gift-card-description">${escapeHtml(gift.description || '')}</p>
                <div class="action-container">
                    ${isAvailable ? `
                    <button class="btn-base btn-primary btn-sm btn-cube-buy"
                            onclick="event.stopPropagation();purchaseCube('${gift.id}')">
                        <i class="fas fa-cube"></i>
                        <span data-i18n="guests:gifts.cube.buyButton">${translate('guests:gifts.cube.buyButton')}</span>
                    </button>
                    ` : `
                    <button class="btn-disabled" disabled>
                        <i class="fas fa-ban"></i>
                        <span data-i18n="guests:gifts.cube.sold">${translate('guests:gifts.cube.sold')}</span>
                    </button>
                    `}
                </div>
            </div>
        </div>
        `;
}

function renderGiftSection({ key, icon, gifts, renderCard }) {
  if (!Array.isArray(gifts) || gifts.length === 0) {
    if (key !== 'figurine') return '';
  }
  const titleKey = `guests:gifts.section.${key}.title`;
  const ledeKey = `guests:gifts.section.${key}.lede`;
  const priceKey = `guests:gifts.section.${key}.priceRange`;
  const deliveryKey = `guests:gifts.section.${key}.delivery`;
  const leadTimeKey = `guests:gifts.section.${key}.leadTime`;

  const cardsHtml = gifts && gifts.length > 0
    ? gifts.map(g => renderCard(g, g.stock > 0)).join('')
    : `<div class="gifts-section--empty-state" data-i18n="guests:gifts.section.${key}.empty">${translate(`guests:gifts.section.${key}.empty`)}</div>`;

  return `
    <section class="gifts-section gifts-section--${key}">
      <div class="gifts-section__divider">
        <h3 class="gifts-section__title">
          <i class="fas ${icon}"></i>
          <span data-i18n="${titleKey}">${translate(titleKey)}</span>
        </h3>
      </div>
      <div class="gifts-section__intro">
        <p class="gifts-section__lede" data-i18n="${ledeKey}">${translate(ledeKey)}</p>
        <div class="gifts-section__meta">
          <span class="gifts-section__meta-item">
            <i class="fas fa-euro-sign"></i>
            <span data-i18n="${priceKey}">${translate(priceKey)}</span>
          </span>
          <span class="gifts-section__meta-item">
            <i class="fas fa-truck"></i>
            <span data-i18n="${deliveryKey}">${translate(deliveryKey)}</span>
          </span>
          <span class="gifts-section__meta-item">
            <i class="fas fa-print"></i>
            <span data-i18n="${leadTimeKey}">${translate(leadTimeKey)}</span>
          </span>
        </div>
      </div>
      <div class="gift-cards-grid">${cardsHtml}</div>
    </section>
  `;
}

function renderFigurineGiftCardHtml(gift, isAvailable) {
  const minPrice = Array.isArray(gift.amountOptions) && gift.amountOptions.length
    ? Math.min(...gift.amountOptions)
    : 0;
  const priceDisplay = `${translate('guests:gifts.cube.priceFrom')} €${minPrice}`;
  const titleEsc = escapeHtml(gift.title);
  const clickableAttrs = isAvailable
    ? `role="button" tabindex="0" onclick="purchaseFigurine('${gift.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();purchaseFigurine('${gift.id}');}"`
    : '';
  return `
        <div class="card gift-credit-card gift-figurine-card ${!isAvailable ? 'sold-out' : 'is-clickable'}"
             data-gift-id="${gift.id}"
             data-figurine-id="${gift.figurineId}"
             ${clickableAttrs}>
            <div class="gift-card-image-section gift-figurine-card__viewer-host">
                <div class="gift-figurine-card__viewer-mount" data-figurine-thumb="true"></div>
                <div class="gift-card-image-overlay">
                    <h4 class="gift-card-title">${titleEsc}</h4>
                    <div class="gift-card-price">${escapeHtml(priceDisplay)}</div>
                </div>
            </div>
            <div class="gift-card-details">
                <p class="gift-card-description">${escapeHtml(gift.description || '')}</p>
                <div class="action-container">
                    ${isAvailable ? `
                    <button class="btn-base btn-primary btn-sm btn-figurine-buy"
                            onclick="event.stopPropagation();purchaseFigurine('${gift.id}')">
                        <i class="fas fa-user"></i>
                        <span data-i18n="guests:gifts.figurine.buyButton">${translate('guests:gifts.figurine.buyButton')}</span>
                    </button>
                    ` : `
                    <button class="btn-disabled" disabled>
                        <i class="fas fa-ban"></i>
                        <span data-i18n="guests:gifts.cube.sold">${translate('guests:gifts.cube.sold')}</span>
                    </button>
                    `}
                </div>
            </div>
        </div>
        `;
}

function mountFigurineViewers(gifts) {
  if (!Array.isArray(gifts) || typeof window.createFigurineViewer !== 'function') return;
  const figById = new Map(gifts.filter(g => g && g.type === 'figurine').map(g => [g.id, g]));
  document.querySelectorAll('.gift-figurine-card').forEach(card => {
    const giftId = card.getAttribute('data-gift-id');
    const gift = figById.get(giftId);
    if (!gift) return;
    const mount = card.querySelector('[data-figurine-thumb="true"]');
    if (!mount) return;
    mount.innerHTML = '';
    const viewer = window.createFigurineViewer(gift.figurineId, { mode: 'thumb' });
    mount.appendChild(viewer);
  });
}

function mountCubeViewers(gifts) {
  if (!Array.isArray(gifts) || typeof window.createCubeViewer !== 'function') return;
  const giftById = new Map(gifts.filter(g => g && g.type === 'cube').map(g => [g.id, g]));
  document.querySelectorAll('.gift-cube-card').forEach(card => {
    const giftId = card.getAttribute('data-gift-id');
    const gift = giftById.get(giftId);
    if (!gift || !gift.faces) return;
    const mount = card.querySelector('[data-cube-thumb="true"]');
    if (!mount) return;
    mount.innerHTML = '';
    const viewer = window.createCubeViewer(gift.faces, {
      mode: 'thumb',
      sold: gift.stock <= 0,
      soldLabel: translate('guests:gifts.cube.sold'),
    });
    mount.appendChild(viewer);
  });
}

function mountPurchasedCubeThumbs(giftChoices) {
  if (!Array.isArray(giftChoices) || typeof window.createCubeViewer !== 'function') return;
  const choiceById = new Map(giftChoices.map(c => [c.id, c]));
  document.querySelectorAll('.donated-gift-card--cube').forEach(card => {
    const choiceId = card.getAttribute('data-purchase-choice-id');
    const choice = choiceById.get(choiceId);
    if (!choice || !choice.faces) return;
    const mount = card.querySelector('[data-cube-thumb-mount="true"]');
    if (mount) {
      mount.innerHTML = '';
      const viewer = window.createCubeViewer(choice.faces, { mode: 'thumb', sold: false });
      mount.appendChild(viewer);
    }
    const open = () => showPurchasedCubeDialog(choice);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

window._cubeGiftCache = null;
window._figurineGiftCache = null;
window._cashGiftCache = null;

// Function to load the gifts content in the gifts tab
async function loadGiftsContent() {
  const giftsContent = document.getElementById('gifts');

  if (!giftsContent) {
    console.error('Gifts content container not found');
    return;
  }

// Show loading state
  giftsContent.innerHTML = `
    <div class="loading-state">
    <i class="fas fa-spinner fa-spin fa-3x"></i>
    <p><span data-i18n="guests:giftsLoading">${translate('guests:giftsLoading')}</span></p>
    </div>
`;

  try {
    // Fetch gift choices (donations) and available gifts in parallel
    const [partyResponse, giftChoicesRes, giftsRes] = await Promise.all([
      fetch('/api/guest/party', {
        method: 'GET',
        headers: {'Authorization': window.token}
      }),
      fetch('/api/guest/gift-choices', {
        method: 'GET',
        headers: {'Authorization': window.token}
      }),
      fetch(`/api/guest/gifts?lang=${window.currentLanguage}`, {
        method: 'GET',
        headers: {'Authorization': window.token}
      })
    ]);

    let partyData = [];
    let giftChoices = [];
    let gifts = [];

    if (partyResponse.ok) {
      partyData = await partyResponse.json();
    }

    if (giftChoicesRes.ok) {
      giftChoices = await giftChoicesRes.json();
    }

    if (!giftsRes.ok) {
      throw new Error('Failed to load gifts');
    }
    gifts = await giftsRes.json();


    // Format date helper
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString(window.currentLanguage || 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    let html = '<div class="gifts-container">';

    html += `
    <div class="intro-card intro-section">
    <h2 class="card-title">
        <div data-i18n="guests:giftsPageTitle">${translate('guests:giftsPageTitle')}</div>
    </h2>
    <p class="card-description">
        <div data-i18n="guests:giftsPageDescription">${translate('guests:giftsPageDescription')}</div>
    </p>
    </div>
`;

    // If purchase has succeeded then show succeess message
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
      html += `
        <div class="payment-success-card">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h1 data-i18n="guests:giftsPaymentSuccessTitle">${translate('guests:giftsPaymentSuccessTitle')}</h1>
            <p class="success-message" data-i18n="guests:giftsPaymentSuccess">${translate('guests:giftsPaymentSuccess')}</p>
        </div>
    `;
    } else if (paymentStatus === 'cancelled') {
      html += `
        <div class="payment-cancelled-card">
            <div class="cancelled-icon">
                <i class="fas fa-times-circle"></i>
            </div>
            <h1 data-i18n="guests:giftsPaymentCancelledTitle">${translate('guests:giftsPaymentCancelledTitle')}</h1>
            <p class="cancelled-message" data-i18n="guests:giftsPaymentCancelled">${translate('guests:giftsPaymentCancelled')}</p>
        </div>
    `;
    }

    // ========== Section 1: Thank You Section (if there are donated gifts) ==========
    if (giftChoices.length > 0) {
      const partyNames = formatPartyNames(partyData);
      html += `
        <div class="gifts-thank-you-section">
            <div class="thank-you-header">
                <i class="fas fa-heart"></i>
                <h3><span data-i18n="guests:giftsThankYouTitle">${translate('guests:giftsThankYouTitle')}</span></h3>
                <p><span data-i18n="guests:giftsThankYouMessage">${translate('guests:giftsThankYouMessage')}</span></p>
            </div>
        <div class="donated-gifts-grid">
    `;

      giftChoices.forEach(choice => {
        const donatedOnText = translateWithVars('guests:giftsDonatedOn:rich', {date: formatDate(choice.date)});
        const isCube = choice.giftType === 'cube';
        const cardClasses = `donated-gift-card${isCube ? ' donated-gift-card--cube is-clickable' : ''}`;
        const cardStyle = isCube ? '' : `style="background-image: url('${escapeHtml(choice.giftImageUrl)}');"`;
        const cardData = isCube ? `data-purchase-choice-id="${escapeHtml(choice.id)}" role="button" tabindex="0"` : '';
        html += `
        <div class="${cardClasses}" ${cardStyle} ${cardData}>
            ${isCube ? `<div class="donated-gift-cube-thumb" data-cube-thumb-mount="true"></div>` : ''}
            <div class="donated-gift-overlay">
                <div class="donated-gift-content">
                    <h4 class="donated-gift-title">${escapeHtml(choice.giftTitle)}</h4>
                    <div class="donated-gift-price">€${choice.giftAmount}</div>
                    <div class="donated-gift-date">
                        <i class="fas fa-calendar-check"></i>
                        <span data-i18n="guests:giftsDonatedOn:rich" data-i18n-options='{"date": "${formatDate(choice.date)}"}'>${donatedOnText}</span>
                    </div>
                    ${choice.message ? `
                    <div class="donated-gift-message">
                        <i class="fas fa-quote-left"></i>
                        ${escapeHtml(choice.message)}
                        <i class="fas fa-quote-right"></i>
                         -- ${partyNames}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
      });

      html += `
        </div>
        </div>
    `;
    }

    // ========== Section 2: Available Gifts (split by type) ==========
    const figurineGifts = gifts.filter(g => g && g.type === 'figurine');
    const cubeGifts = gifts.filter(g => g && g.type === 'cube');
    const cashGifts = gifts.filter(g => !g || (g.type !== 'figurine' && g.type !== 'cube'));

    html += `
    <div class="gifts-available-section">
        <div class="available-gifts-header">
            <i class="fas fa-gift"></i>
            <h3><span data-i18n="guests:giftsRegistryTitle">${translate('guests:giftsRegistryTitle')}</span></h3>
            <p><span data-i18n="guests:giftsRegistrySubtitle">${translate('guests:giftsRegistrySubtitle')}</span></p>
        </div>
    `;

    if (gifts.length === 0) {
      html += `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h4><span data-i18n="guests:giftsNoAvailable">${translate('guests:giftsNoAvailable')}</span></h4>
            <p><span data-i18n="guests:giftsNoAvailableDescription">${translate('guests:giftsNoAvailableDescription')}</span></p>
        </div>
      `;
    } else {
      html += renderGiftSection({
        key: 'figurine',
        icon: 'fa-user',
        gifts: figurineGifts,
        renderCard: renderFigurineGiftCardHtml,
      });
      html += renderGiftSection({
        key: 'cube',
        icon: 'fa-cube',
        gifts: cubeGifts,
        renderCard: renderCubeGiftCardHtml,
      });
      html += renderGiftSection({
        key: 'card',
        icon: 'fa-envelope-open-text',
        gifts: cashGifts,
        renderCard: renderCashGiftCardHtml,
      });
    }

    html += `
    </div>
    `;

    html += '</div>'; // Close gifts-container

    giftsContent.innerHTML = html;

    window._cubeGiftCache = gifts.filter(g => g && g.type === 'cube');
    window._figurineGiftCache = gifts.filter(g => g && g.type === 'figurine');
    window._cashGiftCache = gifts.filter(g => g && (!g.type || g.type === 'cash'));
    window._purchasedChoicesCache = giftChoices;
    mountCubeViewers(gifts);
    mountFigurineViewers(gifts);
    mountPurchasedCubeThumbs(giftChoices);

// Translate the newly loaded content
    if (typeof updatePageContent === 'function') {
      updatePageContent();
    }

  } catch (err) {
    console.error('Error loading gifts:', err);
    giftsContent.innerHTML = `
    <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3><span data-i18n="guests:giftsErrorLoading">${translate('guests:giftsErrorLoading')}</span></h3>
        <p><span data-i18n="guests:giftsErrorLoadingDescription">${translate('guests:giftsErrorLoadingDescription')}</span></p>
        <button class="btn-retry" onclick="loadGiftsContent()">
        <i class="fas fa-redo"></i>
        <span data-i18n="guests:giftsRetry">${translate('guests:giftsRetry')}</span>
        </button>
    </div>
    `;
    // Even on error, try to translate any remaining content
    if (typeof updatePageContent === 'function') {
      updatePageContent();
    }
  }
}

function showPurchasedCubeDialog(choice) {
  if (!choice || !choice.faces) return;

  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay cube-purchase-overlay cube-purchased-overlay';

  const priceChipHtml = `
    <span class="cube-price-option__chip cube-price-option__chip--locked">€${choice.giftAmount}</span>
  `;
  const messageValue = (choice.message || '').replace(/</g, '&lt;');

  const purchasedDescriptionHtml = escapeHtml(choice.giftDescription || translate('guests:gifts.cube.description'));
  overlay.innerHTML = `
    <div class="gift-purchase-dialog cube-purchase-dialog">
      <div class="gift-purchase-header" data-reflection-zone="above">
        <i class="fas fa-cube"></i>
        <h3>${escapeHtml(choice.giftTitle)}</h3>
      </div>
      <div class="gift-purchase-content" data-live="true">
        <div class="cube-purchase-viewer" data-cube-detail-mount="true"></div>
        <p class="cube-purchase-description" data-reflection-zone="below">${purchasedDescriptionHtml}</p>
        <div class="cube-price-selector" data-reflection-zone="below">
          <label class="cube-price-selector__label" data-i18n="guests:gifts.cube.priceLabelYour">${translate('guests:gifts.cube.priceLabelYour')}</label>
          <div class="cube-price-options cube-price-options--locked">${priceChipHtml}</div>
        </div>
        ${choice.message ? `
        <div class="gift-message-input" data-reflection-zone="below">
          <label for="cubePurchasedMessage" data-i18n="guests:giftsPurchasedMessageLabel">${translate('guests:giftsPurchasedMessageLabel')}</label>
          <textarea id="cubePurchasedMessage" rows="3" readonly>${messageValue}</textarea>
        </div>
        ` : ''}
      </div>
      <div class="action-container" data-live="true" data-reflection-zone="below">
        <button class="btn-base btn-primary btn-sm btn-close-purchased">
          <span data-i18n="guests:giftsPurchaseClose">${translate('guests:giftsPurchaseClose')}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  let detailViewer = null;
  const mount = overlay.querySelector('[data-cube-detail-mount="true"]');
  if (mount && typeof window.createCubeViewer === 'function') {
    detailViewer = window.createCubeViewer(choice.faces, {
      mode: 'detail',
      sold: false,
      reflectionRoot: overlay,
    });
    mount.appendChild(detailViewer);
  }

  const cleanup = () => {
    if (detailViewer && typeof detailViewer.cubeViewerDestroy === 'function') {
      detailViewer.cubeViewerDestroy();
    }
    overlay.classList.remove('show');
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
    document.removeEventListener('keydown', handleEscape);
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  document.addEventListener('keydown', handleEscape);

  overlay.querySelector('.btn-close-purchased').addEventListener('click', cleanup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });
}

window.purchaseCube = async (giftId) => {
  const cubes = Array.isArray(window._cubeGiftCache) ? window._cubeGiftCache : [];
  const gift = cubes.find(g => g.id === giftId);
  if (!gift) {
    showToast(translate('guests:giftsPaymentError'), 'error');
    return;
  }
  if (gift.stock <= 0) {
    showToast(translate('guests:gifts.cube.alreadySold'), 'error');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay cube-purchase-overlay';

  const priceOptionsHtml = (gift.amountOptions || []).map((amt, idx) => `
    <label class="cube-price-option">
      <input type="radio" name="cubeAmount" value="${amt}" ${idx === 0 ? 'checked' : ''} />
      <span class="cube-price-option__chip">€${amt}</span>
    </label>
  `).join('');

  const purchaseDescriptionHtml = escapeHtml(gift.description || translate('guests:gifts.cube.description'));

  overlay.innerHTML = `
    <div class="gift-purchase-dialog cube-purchase-dialog">
      <div class="gift-purchase-header" data-reflection-zone="above">
        <i class="fas fa-cube"></i>
        <h3><span data-i18n="guests:gifts.cube.title">${translate('guests:gifts.cube.title')}</span></h3>
      </div>
      <div class="gift-purchase-content" data-live="true">
        <div class="cube-purchase-viewer" data-cube-detail-mount="true"></div>
        <p class="cube-purchase-description" data-reflection-zone="below">${purchaseDescriptionHtml}</p>
        <div class="cube-price-selector" data-reflection-zone="below">
          <label class="cube-price-selector__label" data-i18n="guests:gifts.cube.priceLabel">${translate('guests:gifts.cube.priceLabel')}</label>
          <div class="cube-price-options">${priceOptionsHtml}</div>
        </div>
        <div class="gift-message-input" data-reflection-zone="below">
          <label for="cubeMessage" data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</label>
          <textarea id="cubeMessage" placeholder="${translate('guests:gifts.cube.messagePlaceholder')}" rows="3"></textarea>
        </div>
      </div>
      <div class="action-container" data-live="true" data-reflection-zone="below">
        <button class="btn-base btn-outline btn-sm btn-cancel-purchase">
          <span data-i18n="guests:giftsPurchaseCancel">${translate('guests:giftsPurchaseCancel')}</span>
        </button>
        <button class="btn-base btn-primary btn-sm btn-confirm-cube-purchase">
          <i class="fas fa-credit-card"></i>
          <span data-i18n="guests:gifts.cube.buyButton">${translate('guests:gifts.cube.buyButton')}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  let detailViewer = null;
  const mount = overlay.querySelector('[data-cube-detail-mount="true"]');
  if (mount && typeof window.createCubeViewer === 'function' && gift.faces) {
    detailViewer = window.createCubeViewer(gift.faces, {
      mode: 'detail',
      sold: false,
      reflectionRoot: overlay,
    });
    mount.appendChild(detailViewer);
  }

  const cleanup = () => {
    if (detailViewer && typeof detailViewer.cubeViewerDestroy === 'function') {
      detailViewer.cubeViewerDestroy();
    }
    overlay.classList.remove('show');
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
    document.removeEventListener('keydown', handleEscape);
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  document.addEventListener('keydown', handleEscape);

  const liveActions = overlay.querySelector('.action-container[data-live]');
  const liveContent = overlay.querySelector('.gift-purchase-content[data-live]');
  liveActions.querySelector('.btn-cancel-purchase').addEventListener('click', cleanup);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });

  liveActions.querySelector('.btn-confirm-cube-purchase').addEventListener('click', async () => {
    const selected = liveContent.querySelector('input[name="cubeAmount"]:checked');
    const amount = selected ? Number(selected.value) : null;
    if (!amount) {
      showToast(translate('guests:gifts.cube.priceLabel'), 'error');
      return;
    }
    const message = liveContent.querySelector('#cubeMessage').value.trim();
    const confirmBtn = liveActions.querySelector('.btn-confirm-cube-purchase');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-i18n="guests:giftsPurchaseProcessing">' + translate('guests:giftsPurchaseProcessing') + '</span>';

    try {
      const response = await fetch(`/api/guest/create-payment-session?lang=${window.currentLanguage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.token,
        },
        body: JSON.stringify({ giftId: gift.id, amount, message }),
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        const errMsg = (data && data.error && /stock|sold/i.test(data.error))
          ? translate('guests:gifts.cube.alreadySold')
          : (data && data.error) || translate('guests:giftsPaymentError');
        showToast(errMsg, 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:gifts.cube.buyButton">' + translate('guests:gifts.cube.buyButton') + '</span>';
        if (/stock|sold/i.test(data && data.error || '')) {
          cleanup();
          if (typeof loadGiftsContent === 'function') loadGiftsContent();
        }
      }
    } catch (err) {
      console.error('Error creating cube payment session:', err);
      showToast(translate('guests:giftsPaymentServiceError'), 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:gifts.cube.buyButton">' + translate('guests:gifts.cube.buyButton') + '</span>';
    }
  });
};

window.purchaseFigurine = async (giftId) => {
  const figurines = Array.isArray(window._figurineGiftCache) ? window._figurineGiftCache : [];
  const gift = figurines.find(g => g.id === giftId);
  if (!gift) {
    showToast(translate('guests:giftsPaymentError'), 'error');
    return;
  }
  if (gift.stock <= 0) {
    showToast(translate('guests:gifts.figurine.alreadySold'), 'error');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay figurine-purchase-overlay';

  const priceOptionsHtml = (gift.amountOptions || []).map((amt, idx) => `
    <label class="cube-price-option">
      <input type="radio" name="figurineAmount" value="${amt}" ${idx === 0 ? 'checked' : ''} />
      <span class="cube-price-option__chip">€${amt}</span>
    </label>
  `).join('');

  const purchaseDescriptionHtml = escapeHtml(gift.description || '');

  overlay.innerHTML = `
    <div class="gift-purchase-dialog cube-purchase-dialog">
      <div class="gift-purchase-header">
        <i class="fas fa-user"></i>
        <h3>${escapeHtml(gift.title)}</h3>
      </div>
      <div class="gift-purchase-content" data-live="true">
        <div class="figurine-purchase-viewer" data-figurine-detail-mount="true"></div>
        <p class="cube-purchase-description">${purchaseDescriptionHtml}</p>
        <div class="cube-price-selector">
          <label class="cube-price-selector__label" data-i18n="guests:gifts.figurine.priceLabel">${translate('guests:gifts.figurine.priceLabel')}</label>
          <div class="cube-price-options">${priceOptionsHtml}</div>
        </div>
        <div class="gift-message-input">
          <label for="figurineMessage" data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</label>
          <textarea id="figurineMessage" placeholder="${translate('guests:gifts.figurine.messagePlaceholder')}" rows="3"></textarea>
        </div>
      </div>
      <div class="action-container" data-live="true">
        <button class="btn-base btn-outline btn-sm btn-cancel-purchase">
          <span data-i18n="guests:giftsPurchaseCancel">${translate('guests:giftsPurchaseCancel')}</span>
        </button>
        <button class="btn-base btn-primary btn-sm btn-confirm-figurine-purchase">
          <i class="fas fa-credit-card"></i>
          <span data-i18n="guests:gifts.figurine.buyButton">${translate('guests:gifts.figurine.buyButton')}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  let detailViewer = null;
  const mount = overlay.querySelector('[data-figurine-detail-mount="true"]');
  if (mount && typeof window.createFigurineViewer === 'function') {
    detailViewer = window.createFigurineViewer(gift.figurineId, { mode: 'detail' });
    mount.appendChild(detailViewer);
  }

  const cleanup = () => {
    if (detailViewer && typeof detailViewer.figurineViewerDestroy === 'function') {
      detailViewer.figurineViewerDestroy();
    }
    overlay.classList.remove('show');
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
    document.removeEventListener('keydown', handleEscape);
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  document.addEventListener('keydown', handleEscape);

  const liveActions = overlay.querySelector('.action-container[data-live]');
  const liveContent = overlay.querySelector('.gift-purchase-content[data-live]');
  liveActions.querySelector('.btn-cancel-purchase').addEventListener('click', cleanup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });

  liveActions.querySelector('.btn-confirm-figurine-purchase').addEventListener('click', async () => {
    const selected = liveContent.querySelector('input[name="figurineAmount"]:checked');
    const amount = selected ? Number(selected.value) : null;
    if (!amount) {
      showToast(translate('guests:gifts.figurine.priceLabel'), 'error');
      return;
    }
    const message = liveContent.querySelector('#figurineMessage').value.trim();
    const confirmBtn = liveActions.querySelector('.btn-confirm-figurine-purchase');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-i18n="guests:giftsPurchaseProcessing">' + translate('guests:giftsPurchaseProcessing') + '</span>';

    try {
      const response = await fetch(`/api/guest/create-payment-session?lang=${window.currentLanguage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.token,
        },
        body: JSON.stringify({ giftId: gift.id, amount, message }),
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        const errMsg = (data && data.error && /stock|sold/i.test(data.error))
          ? translate('guests:gifts.figurine.alreadySold')
          : (data && data.error) || translate('guests:giftsPaymentError');
        showToast(errMsg, 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:gifts.figurine.buyButton">' + translate('guests:gifts.figurine.buyButton') + '</span>';
        if (/stock|sold/i.test(data && data.error || '')) {
          cleanup();
          if (typeof loadGiftsContent === 'function') loadGiftsContent();
        }
      }
    } catch (err) {
      console.error('Error creating figurine payment session:', err);
      showToast(translate('guests:giftsPaymentServiceError'), 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:gifts.figurine.buyButton">' + translate('guests:gifts.figurine.buyButton') + '</span>';
    }
  });
};

// Global function to purchase a gift
window.purchaseGift = async (giftId) => {
  const cashGifts = Array.isArray(window._cashGiftCache) ? window._cashGiftCache : [];
  const gift = cashGifts.find(g => g.id === giftId);
  if (!gift) {
    showToast(translate('guests:giftsPaymentError'), 'error');
    return;
  }
  const giftTitle = gift.title || '';
  const giftAmount = gift.amount;

  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay';
  overlay.innerHTML = `
    <div class="gift-purchase-dialog">
    <div class="gift-purchase-header">
        <i class="fas fa-gift"></i>
        <h3><span data-i18n="guests:giftsPurchaseTitle">${translate('guests:giftsPurchaseTitle')}</span></h3>
    </div>
    <div class="gift-purchase-content">
        <p><span data-i18n="guests:giftsPurchaseAbout">${translate('guests:giftsPurchaseAbout')}</span></p>
        <div class="gift-purchase-summary">
        <strong>${escapeHtml(giftTitle)}</strong>
        <span class="gift-purchase-amount">€${giftAmount}</span>
        </div>
        <div class="gift-message-input">
        <label for="giftMessage"><span data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</span></label>
        <textarea id="giftMessage" placeholder="${translate('guests:giftsPurchaseMessage:placeholder')}" data-i18n="guests:giftsPurchaseMessage:placeholder" rows="3"></textarea>
        </div>
    </div>
    <div class="action-container">
        <button class="btn-base btn-outline btn-sm btn-cancel-purchase"><span data-i18n="guests:giftsPurchaseCancel">${translate('guests:giftsPurchaseCancel')}</span></button>
        <button class="btn-base btn-primary btn-sm btn-confirm-purchase">
        <i class="fas fa-credit-card"></i>
        <span data-i18n="guests:giftsPurchaseProceed">${translate('guests:giftsPurchaseProceed')}</span>
        </button>
    </div>
    </div>
`;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

// Handle cancel
  overlay.querySelector('.btn-cancel-purchase').addEventListener('click', () => {
    overlay.classList.remove('show');
    setTimeout(() => document.body.removeChild(overlay), 300);
  });

// Handle confirm
  overlay.querySelector('.btn-confirm-purchase').addEventListener('click', async () => {
    const message = document.getElementById('giftMessage').value.trim();
    const confirmBtn = overlay.querySelector('.btn-confirm-purchase');

    // Show loading state
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-i18n="guests:giftsPurchaseProcessing">' + translate('guests:giftsPurchaseProcessing') + '</span>';

    try {
      const response = await fetch(`/api/guest/create-payment-session?lang=${window.currentLanguage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.token
        },
        body: JSON.stringify({giftId, message})
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        showToast(data.error || translate('guests:giftsPaymentError'), 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:giftsPurchaseProceed">' + translate('guests:giftsPurchaseProceed') + '</span>';
      }
    } catch (err) {
      console.error('Error creating payment session:', err);
      showToast(translate('guests:giftsPaymentServiceError'), 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> <span data-i18n="guests:giftsPurchaseProceed">' + translate('guests:giftsPurchaseProceed') + '</span>';
    }
  });

// Close on escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('show');
      setTimeout(() => document.body.removeChild(overlay), 300);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
};

