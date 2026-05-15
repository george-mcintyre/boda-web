// Gifts Management Module

const CASH_GIFT_COUPLE_INSIDE_URL = '/assets/images/gift-cards/couple-inside-transparent.png';
const CASH_GIFT_COUPLE_PREVIEW_URL = '/assets/images/gift-cards/couple-preview-square.png';
const CUBE_GIFT_PREVIEW_URL = '/assets/images/gift-cards/blocks-section-hero.png';
const COUPLE_CUTOUT_URL = '/assets/images/gift-cards/couple-cutout.png';

const GIFT_FROM_MAX_LENGTH = 80;
const GIFT_MESSAGE_MAX_LENGTH = 240;

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
        <div class="card gift-credit-card gift-credit-card--cash ${!isAvailable ? 'sold-out' : ''} ${isAvailable ? 'is-clickable' : ''}"
             data-gift-id="${gift.id}"
             ${clickAttrs}>
            <div class="gift-card-image-section"
                 style="background-image: url('${escapeHtml(gift.imageUrl)}');">
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
                <button class="btn-base btn-primary btn-sm" onclick="event.stopPropagation();purchaseGift('${gift.id}')">
                    <i class="fas fa-envelope-open-text"></i>
                    <span data-i18n="guests:gifts.card.buyButton">${translate('guests:gifts.card.buyButton')}</span>
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

  const introMediaConfig = key === 'card'
    ? {
        imageUrl: CASH_GIFT_COUPLE_PREVIEW_URL,
        altKey: 'guests:gifts.card.heroAlt',
      }
    : key === 'cube'
      ? {
          imageUrl: CUBE_GIFT_PREVIEW_URL,
          altKey: 'guests:gifts.cube.heroAlt',
        }
      : null;

  const introMediaHtml = introMediaConfig
    ? `
      <div class="gifts-section__intro-media">
        <img src="${introMediaConfig.imageUrl}"
             alt="${translate(introMediaConfig.altKey)}"
             class="gifts-section__intro-image">
      </div>
    `
    : '';

  const introClassName = introMediaConfig
    ? 'gifts-section__intro gifts-section__intro--with-media'
    : 'gifts-section__intro';

  return `
    <section class="gifts-section gifts-section--${key}" id="gifts-section-${key}" data-gifts-section="${key}">
      <div class="gifts-section__divider">
        <h3 class="gifts-section__title">
          <i class="fas ${icon}"></i>
          <span data-i18n="${titleKey}">${translate(titleKey)}</span>
        </h3>
      </div>
      <div class="${introClassName}">
        <div class="gifts-section__intro-body">
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
        ${introMediaHtml}
      </div>
      <div class="gift-cards-grid">${cardsHtml}</div>
    </section>
  `;
}

function getCashGiftPreviewMessage(message) {
  return message || translate('guests:gifts.card.previewMessagePlaceholder');
}

function initGiftsSubnav(rootEl) {
  if (!rootEl) return;
  const subnav = rootEl.querySelector('.gifts-subnav');
  if (!subnav) return;
  const buttons = Array.from(subnav.querySelectorAll('.gifts-subnav__btn'));
  if (buttons.length === 0) return;

  const targets = buttons
    .map(btn => {
      const id = btn.getAttribute('data-gifts-subnav-target');
      const section = id ? rootEl.querySelector(`#${id}`) : null;
      return section ? { btn, section } : null;
    })
    .filter(Boolean);

  if (targets.length === 0) {
    subnav.style.display = 'none';
    return;
  }

  const availableWrapper = rootEl.querySelector('.gifts-available-section');

  const showOnly = (activeBtn) => {
    buttons.forEach(btn => {
      const isActive = btn === activeBtn;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    targets.forEach(({ btn, section }) => {
      section.classList.toggle('is-hidden', btn !== activeBtn);
    });
    if (availableWrapper) {
      const anyVisibleInWrapper = targets.some(({ btn, section }) =>
        btn === activeBtn && availableWrapper.contains(section)
      );
      availableWrapper.classList.toggle('is-hidden', !anyVisibleInWrapper);
    }
  };

  showOnly(targets[0].btn);

  const activateByKey = (key) => {
    const targetId = `gifts-section-${key}`;
    const match = targets.find(t => t.section.id === targetId);
    if (!match) return false;
    showOnly(match.btn);
    const subnavTop = subnav.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > subnavTop) {
      window.scrollTo({ top: Math.max(0, subnavTop - 12), behavior: 'smooth' });
    }
    return true;
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      showOnly(btn);
      const subnavTop = subnav.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > subnavTop) {
        window.scrollTo({ top: Math.max(0, subnavTop - 12), behavior: 'smooth' });
      }
    });
  });

  rootEl.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-gifts-jump-to]');
    if (!trigger || !rootEl.contains(trigger)) return;
    const key = trigger.getAttribute('data-gifts-jump-to');
    if (activateByKey(key)) e.preventDefault();
  });

  rootEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('[data-gifts-jump-to]');
    if (!trigger || !rootEl.contains(trigger)) return;
    const key = trigger.getAttribute('data-gifts-jump-to');
    if (activateByKey(key)) e.preventDefault();
  });
}

function getDefaultGiftFromValue() {
  const partyData = Array.isArray(window._partyDataCache) ? window._partyDataCache : [];
  const firstNames = partyData
    .map(p => (p && typeof p.name === 'string' ? p.name.trim().split(/\s+/)[0] : ''))
    .filter(Boolean);
  if (firstNames.length === 0) return '';
  if (firstNames.length === 1) return firstNames[0];
  if (firstNames.length === 2) return `${firstNames[0]} & ${firstNames[1]}`;
  return `${firstNames.slice(0, -1).join(', ')} & ${firstNames[firstNames.length - 1]}`;
}

function resolveGiftFromValue(rawInput) {
  const trimmed = typeof rawInput === 'string' ? rawInput.trim() : '';
  return trimmed || getDefaultGiftFromValue();
}

function renderGiftFromFieldHtml(inputId) {
  const defaultValue = getDefaultGiftFromValue().slice(0, GIFT_FROM_MAX_LENGTH);
  const counterId = `${inputId}-counter`;
  return `
    <div class="gift-from-input" data-char-limited="true">
      <label for="${inputId}"><span data-i18n="guests:giftsPurchaseFromLabel">${translate('guests:giftsPurchaseFromLabel')}</span></label>
      <input type="text" id="${inputId}" maxlength="${GIFT_FROM_MAX_LENGTH}"
             value="${escapeHtml(defaultValue)}"
             placeholder="${translate('guests:giftsPurchaseFrom:placeholder')}"
             data-i18n="guests:giftsPurchaseFrom:placeholder"
             data-char-counter-target="${counterId}">
      <div class="char-counter" id="${counterId}" aria-live="polite">${defaultValue.length}/${GIFT_FROM_MAX_LENGTH}</div>
    </div>
  `;
}

function attachCharCounter(rootEl, inputSelector, max) {
  const input = rootEl.querySelector(inputSelector);
  if (!input) return;
  const counterId = input.getAttribute('data-char-counter-target');
  const counter = counterId ? rootEl.querySelector(`#${counterId}`) : null;
  const update = () => {
    if (input.value.length > max) {
      input.value = input.value.slice(0, max);
    }
    if (counter) {
      counter.textContent = `${input.value.length}/${max}`;
      counter.classList.toggle('char-counter--full', input.value.length >= max);
    }
  };
  input.addEventListener('input', update);
  update();
}

function renderCashGiftInsertFrontHtml({ giftTitle, imageUrl, isAttached = false }) {
  const modifier = isAttached ? ' cash-insert-card--attached' : '';
  return `
    <div class="cash-insert-card cash-insert-card--front${modifier}" aria-hidden="true">
      <span class="cash-insert-card__tape cash-insert-card__tape--left"></span>
      <span class="cash-insert-card__tape cash-insert-card__tape--right"></span>
      <div class="cash-insert-card__front-art" style="background-image: url('${escapeHtml(imageUrl)}');"></div>
      <div class="cash-insert-card__front-overlay"></div>
      <div class="cash-insert-card__front-copy">
        <h5>${escapeHtml(giftTitle)}</h5>
      </div>
    </div>
  `;
}

function renderCashGiftInsertBackHtml({ giftTitle, giftDescription, message, signerName }) {
  const messageText = getCashGiftPreviewMessage(message);
  const messageEmptyAttr = message ? 'false' : 'true';
  return `
    <div class="cash-insert-card cash-insert-card--back" aria-hidden="true">
      <div class="cash-insert-card__back-copy">
        <h5>${escapeHtml(giftTitle)}</h5>
        <p>${escapeHtml(giftDescription)}</p>
        <div class="cash-insert-card__message" data-insert-card-message="true" data-empty="${messageEmptyAttr}">${escapeHtml(messageText)}</div>
        <div class="cash-insert-card__signature" data-insert-card-signer="true">— ${escapeHtml(signerName)}</div>
      </div>
    </div>
  `;
}

function renderHoneymoonCardPreviewHtml({ giftTitle, giftDescription, imageUrl, message = '', signerName }) {
  const resolvedSigner = signerName != null ? signerName : resolveGiftFromValue('');
  return `
    <div class="honeymoon-card-preview" aria-hidden="true">
      <div class="honeymoon-card-preview__side">
        <div class="honeymoon-card-preview__label" data-i18n="guests:gifts.card.insertPreviewFront">${translate('guests:gifts.card.insertPreviewFront')}</div>
        ${renderCashGiftInsertFrontHtml({ giftTitle, imageUrl })}
      </div>
      <div class="honeymoon-card-preview__side">
        <div class="honeymoon-card-preview__label" data-i18n="guests:gifts.card.insertPreviewBack">${translate('guests:gifts.card.insertPreviewBack')}</div>
        ${renderCashGiftInsertBackHtml({ giftTitle, giftDescription, message, signerName: resolvedSigner })}
      </div>
    </div>
  `;
}

function getGiftNoteTitleKey(giftType) {
  if (giftType === 'cube') return 'guests:gifts.giftNote.title.cube';
  if (giftType === 'figurine') return 'guests:gifts.giftNote.title.figurine';
  return 'guests:gifts.giftNote.title.cash';
}

function getGiftNoteTypeIcon(giftType) {
  if (giftType === 'cube') return 'fa-cube';
  if (giftType === 'figurine') return 'fa-user';
  return 'fa-envelope-open-text';
}

function renderGiftNoteHtml({ giftType, giftTitle, giftDescription, giftAmount, giftImageUrl, message, signerName }) {
  const titleKey = getGiftNoteTitleKey(giftType);
  const iconClass = getGiftNoteTypeIcon(giftType);
  const titleEsc = escapeHtml(giftTitle || '');
  const descEsc = escapeHtml(giftDescription || '');
  const messageText = getCashGiftPreviewMessage(message);
  const messageEmptyAttr = message ? 'false' : 'true';
  const signerEsc = escapeHtml(signerName || resolveGiftFromValue(''));
  const amountDisplay = (typeof giftAmount === 'number' || (typeof giftAmount === 'string' && giftAmount !== ''))
    ? `€${giftAmount}` : '';

  const attachedHtml = (giftType === 'cash' && giftImageUrl) ? `
    <div class="gift-note-card__attached-slot">
      <div class="gift-note-card__attached-label" data-i18n="guests:gifts.card.insertAttachedLabel">${translate('guests:gifts.card.insertAttachedLabel')}</div>
      <div class="gift-note-card__attached-surface">
        ${renderCashGiftInsertFrontHtml({ giftTitle, imageUrl: giftImageUrl, isAttached: true })}
      </div>
    </div>
  ` : '';

  return `
    <div class="gift-note-card gift-note-card--${escapeHtml(giftType)}" aria-hidden="true">
      <section class="gift-note-card__page gift-note-card__page--front">
        <div class="gift-note-card__label" data-i18n="guests:gifts.giftNote.previewFront">${translate('guests:gifts.giftNote.previewFront')}</div>
        <div class="gift-note-card__front">
          <img src="/assets/images/gift-cards/gift-note-cover.jpg" alt="" class="gift-note-card__front-art">
          <div class="gift-note-card__front-caption" data-i18n="guests:gifts.card.frontCaption">${translate('guests:gifts.card.frontCaption')}</div>
        </div>
      </section>
      <section class="gift-note-card__page gift-note-card__page--inside">
        <div class="gift-note-card__label" data-i18n="guests:gifts.giftNote.previewInside">${translate('guests:gifts.giftNote.previewInside')}</div>
        <div class="gift-note-card__inside">
          <div class="gift-note-card__inside-page gift-note-card__inside-page--left">
            <h4 class="gift-note-card__type-title" data-i18n="${titleKey}">${translate(titleKey)}</h4>
            <div class="gift-note-card__gift">
              <div class="gift-note-card__gift-text">
                <h5 class="gift-note-card__gift-title">${titleEsc}</h5>
                ${descEsc ? `<p class="gift-note-card__gift-description">${descEsc}</p>` : ''}
              </div>
              ${amountDisplay ? `<span class="gift-note-card__amount" aria-label="${translate('guests:gifts.giftNote.amountLabel')}">${amountDisplay}</span>` : ''}
            </div>
            <div class="gift-note-card__wish" data-i18n="guests:gifts.giftNote.honeymoonWish">${translate('guests:gifts.giftNote.honeymoonWish')}</div>
            ${attachedHtml}
          </div>
          <div class="gift-note-card__inside-page gift-note-card__inside-page--right">
            <div class="gift-note-card__message" data-gift-note-message="true" data-empty="${messageEmptyAttr}">${escapeHtml(messageText)}</div>
            <div class="gift-note-card__handwriting" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="gift-note-card__signoff">
              <div class="gift-note-card__field-label" data-i18n="guests:gifts.giftNote.fromLabel">${translate('guests:gifts.giftNote.fromLabel')}</div>
              <div class="gift-note-card__signer" data-gift-note-signer="true">${signerEsc}</div>
            </div>
            <div class="gift-note-card__signature-space" aria-hidden="true"></div>
          </div>
        </div>
      </section>
      <p class="gift-note-card__delivery" data-i18n="guests:gifts.giftNote.deliveryNote">${translate('guests:gifts.giftNote.deliveryNote')}</p>
    </div>
  `;
}

function renderShowGiftNoteButtonHtml() {
  return `
    <button type="button" class="btn-base btn-outline btn-sm show-gift-note-button" data-show-gift-note="true">
      <i class="fas fa-envelope-open-text"></i>
      <span data-i18n="guests:gifts.giftNote.showButton">${translate('guests:gifts.giftNote.showButton')}</span>
    </button>
  `;
}

function showGiftNoteOverlay({ giftType, giftTitle, giftDescription, giftAmount, giftImageUrl, message, signerName }) {
  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay gift-note-overlay';
  overlay.innerHTML = `
    <div class="gift-purchase-dialog gift-note-dialog">
      <div class="gift-purchase-header">
        <i class="fas fa-envelope-open-text"></i>
        <h3 data-i18n="guests:gifts.giftNote.dialogTitle">${translate('guests:gifts.giftNote.dialogTitle')}</h3>
      </div>
      <div class="gift-purchase-content gift-note-dialog__content">
        ${renderGiftNoteHtml({ giftType, giftTitle, giftDescription, giftAmount, giftImageUrl, message, signerName })}
      </div>
      <div class="action-container">
        <button class="btn-base btn-primary btn-sm btn-close-gift-note">
          <span data-i18n="guests:giftsPurchaseClose">${translate('guests:giftsPurchaseClose')}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const cleanup = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
    document.removeEventListener('keydown', handleEscape);
  };
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      cleanup();
    }
  };
  document.addEventListener('keydown', handleEscape);

  overlay.querySelector('.btn-close-gift-note').addEventListener('click', cleanup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });
}

function attachShowGiftNoteHandler(rootEl, getPayload) {
  if (!rootEl) return;
  const btn = rootEl.querySelector('[data-show-gift-note="true"]');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = typeof getPayload === 'function' ? getPayload() : getPayload;
    if (payload) showGiftNoteOverlay(payload);
  });
}

function renderPriceSelectorHtml({ name, amountOptions, labelKey, wrapperAttrs = '' }) {
  const presetChips = amountOptions.map((amt, idx) => `
    <label class="cube-price-option">
      <input type="radio" name="${name}" value="${amt}" data-price-mode="preset" ${idx === 0 ? 'checked' : ''} />
      <span class="cube-price-option__chip">€${amt}</span>
    </label>
  `).join('');
  const customChip = `
    <label class="cube-price-option cube-price-option--custom">
      <input type="radio" name="${name}" value="__custom__" data-price-mode="custom" />
      <span class="cube-price-option__chip" data-i18n="guests:gifts.priceCustom.chip">${translate('guests:gifts.priceCustom.chip')}</span>
    </label>
  `;
  return `
    <div class="cube-price-selector" data-custom-price-selector="true" ${wrapperAttrs}>
      <label class="cube-price-selector__label" data-i18n="${labelKey}">${translate(labelKey)}</label>
      <div class="cube-price-options">${presetChips}${customChip}</div>
      <div class="custom-price-input" data-custom-price-input hidden>
        <span class="custom-price-input__currency" aria-hidden="true">€</span>
        <input type="number" inputmode="numeric" min="1" step="1"
               class="custom-price-input__field"
               data-custom-price-field
               placeholder="${translate('guests:gifts.priceCustom.placeholder')}">
        <div class="custom-price-input__hint" data-custom-price-hint></div>
      </div>
    </div>
  `;
}

function attachPriceSelectorHandlers(rootEl, { name, amountOptions, onChange }) {
  if (!rootEl) return null;
  const selector = rootEl.querySelector('[data-custom-price-selector="true"]');
  if (!selector) return null;
  const customWrapper = selector.querySelector('[data-custom-price-input]');
  const customField = selector.querySelector('[data-custom-price-field]');
  const customHint = selector.querySelector('[data-custom-price-hint]');
  const radios = selector.querySelectorAll(`input[name="${name}"]`);
  const maxPreset = Math.max(...amountOptions);

  const setHint = (text, isError) => {
    if (!customHint) return;
    customHint.textContent = text || '';
    customHint.classList.toggle('is-error', !!isError);
  };

  const showCustomInput = (visible) => {
    if (!customWrapper) return;
    customWrapper.hidden = !visible;
    if (visible) {
      setHint(translateWithVars('guests:gifts.priceCustom.hint', { max: maxPreset }), false);
      setTimeout(() => customField && customField.focus(), 0);
    } else {
      setHint('', false);
    }
  };

  const handleChange = () => {
    const checked = selector.querySelector(`input[name="${name}"]:checked`);
    const isCustom = checked && checked.getAttribute('data-price-mode') === 'custom';
    showCustomInput(!!isCustom);
    if (typeof onChange === 'function') onChange();
  };

  radios.forEach(r => r.addEventListener('change', handleChange));
  if (customField) {
    customField.addEventListener('input', () => {
      const value = Number(customField.value);
      if (!customField.value.trim()) {
        setHint(translateWithVars('guests:gifts.priceCustom.hint', { max: maxPreset }), false);
      } else if (!Number.isInteger(value) || value <= maxPreset) {
        setHint(translateWithVars('guests:gifts.priceCustom.errorTooLow', { max: maxPreset }), true);
      } else {
        setHint('', false);
      }
      if (typeof onChange === 'function') onChange();
    });
  }

  const getSelectedAmount = () => {
    const checked = selector.querySelector(`input[name="${name}"]:checked`);
    if (!checked) return null;
    if (checked.getAttribute('data-price-mode') === 'custom') {
      const value = Number(customField && customField.value);
      return Number.isInteger(value) && value > maxPreset ? value : null;
    }
    return Number(checked.value);
  };

  const validate = () => {
    const checked = selector.querySelector(`input[name="${name}"]:checked`);
    if (!checked) {
      return { ok: false, message: '' };
    }
    if (checked.getAttribute('data-price-mode') !== 'custom') {
      return { ok: true, amount: Number(checked.value) };
    }
    if (!customField || !customField.value.trim()) {
      const msg = translate('guests:gifts.priceCustom.errorMissing');
      setHint(msg, true);
      customField && customField.focus();
      return { ok: false, message: msg };
    }
    const value = Number(customField.value);
    if (!Number.isInteger(value) || value <= maxPreset) {
      const msg = translateWithVars('guests:gifts.priceCustom.errorTooLow', { max: maxPreset });
      setHint(msg, true);
      customField && customField.focus();
      return { ok: false, message: msg };
    }
    return { ok: true, amount: value };
  };

  return { getSelectedAmount, validate };
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

function mountPurchasedFigurineThumbs(giftChoices) {
  if (!Array.isArray(giftChoices) || typeof window.createFigurineViewer !== 'function') return;
  const choiceById = new Map(giftChoices.map(c => [c.id, c]));
  document.querySelectorAll('.donated-gift-card--figurine').forEach(card => {
    const choiceId = card.getAttribute('data-purchase-choice-id');
    const choice = choiceById.get(choiceId);
    if (!choice || !choice.figurineId) return;
    const mount = card.querySelector('[data-figurine-thumb-mount="true"]');
    if (mount) {
      mount.innerHTML = '';
      const viewer = window.createFigurineViewer(choice.figurineId, { mode: 'thumb' });
      mount.appendChild(viewer);
    }
    const open = () => showPurchasedFigurineDialog(choice);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

function attachPurchasedCashCardHandlers(giftChoices) {
  if (!Array.isArray(giftChoices)) return;
  const choiceById = new Map(giftChoices.map(c => [c.id, c]));
  document.querySelectorAll('.donated-gift-card--cash').forEach(card => {
    const choiceId = card.getAttribute('data-purchase-choice-id');
    const choice = choiceById.get(choiceId);
    if (!choice) return;
    const open = () => showPurchasedCashDialog(choice);
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
    <nav class="gifts-subnav" role="tablist" aria-label="${translate('guests:gifts.subnav.aria')}">
      <button type="button" class="gifts-subnav__btn" data-gifts-subnav-target="gifts-section-summary" role="tab">
        <i class="fas fa-list-ul" aria-hidden="true"></i>
        <span data-i18n="guests:gifts.subnav.summary">${translate('guests:gifts.subnav.summary')}</span>
      </button>
      <button type="button" class="gifts-subnav__btn" data-gifts-subnav-target="gifts-section-figurine" role="tab">
        <i class="fas fa-user" aria-hidden="true"></i>
        <span data-i18n="guests:gifts.subnav.figurine">${translate('guests:gifts.subnav.figurine')}</span>
      </button>
      <button type="button" class="gifts-subnav__btn" data-gifts-subnav-target="gifts-section-cube" role="tab">
        <i class="fas fa-cube" aria-hidden="true"></i>
        <span data-i18n="guests:gifts.subnav.block">${translate('guests:gifts.subnav.block')}</span>
      </button>
      <button type="button" class="gifts-subnav__btn" data-gifts-subnav-target="gifts-section-card" role="tab">
        <i class="fas fa-envelope-open-text" aria-hidden="true"></i>
        <span data-i18n="guests:gifts.subnav.card">${translate('guests:gifts.subnav.card')}</span>
      </button>
    </nav>
`;

    html += `
    <section class="gifts-section gifts-section--summary" id="gifts-section-summary" data-gifts-section="summary">
    <div class="gifts-registry-card">
        <div class="available-gifts-header">
            <i class="fas fa-gift"></i>
            <h3><span data-i18n="guests:giftsRegistryTitle">${translate('guests:giftsRegistryTitle')}</span></h3>
            <p><span data-i18n="guests:giftsRegistrySubtitle">${translate('guests:giftsRegistrySubtitle')}</span></p>
        </div>
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
      const fallbackPartyNames = formatPartyNames(partyData);
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
        const giftType = choice.giftType || 'cash';
        const isCube = giftType === 'cube';
        const isFigurine = giftType === 'figurine';
        const hasOwnImage = !isCube && !isFigurine && !!choice.giftImageUrl;

        const typeModifier = isCube
          ? ' donated-gift-card--cube'
          : isFigurine
            ? ' donated-gift-card--figurine'
            : ' donated-gift-card--cash';
        const cardClasses = `donated-gift-card is-clickable${typeModifier}`;
        const cardStyle = hasOwnImage
          ? `style="background-image: url('${escapeHtml(choice.giftImageUrl)}');"`
          : '';
        const cardData = `data-purchase-choice-id="${escapeHtml(choice.id)}" data-purchase-choice-type="${giftType}" role="button" tabindex="0"`;
        const thumbMountHtml = isCube
          ? `<div class="donated-gift-cube-thumb" data-cube-thumb-mount="true"></div>`
          : isFigurine
            ? `<div class="donated-gift-figurine-thumb" data-figurine-thumb-mount="true"></div>`
            : '';
        const typeIconClass = isCube ? 'fa-cube' : isFigurine ? 'fa-user' : 'fa-envelope-open-text';

        html += `
        <div class="${cardClasses}" ${cardStyle} ${cardData}>
            ${thumbMountHtml}
            <div class="donated-gift-type-badge" aria-hidden="true"><i class="fas ${typeIconClass}"></i></div>
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
                         -- ${escapeHtml((choice.giftFrom || '').trim() || fallbackPartyNames)}
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

    html += `
    <div class="intro-card intro-section gifts-intro-card">
      <div class="gifts-intro-card__text">
        <h2 class="card-title">
          <div data-i18n="guests:giftsPageTitle">${translate('guests:giftsPageTitle')}</div>
        </h2>
        <div class="card-description gifts-intro-description" data-i18n="guests:giftsPageDescription:rich"></div>
      </div>
      <figure class="gifts-intro-card__couple" aria-hidden="true">
        <img src="/assets/images/gift-cards/couple-cutout.png"
             alt=""
             loading="lazy"
             class="gifts-intro-card__couple-img">
      </figure>
    </div>
    </section>
    `;

    // ========== Section 2: Available Gifts (split by type) ==========
    const figurineGifts = gifts.filter(g => g && g.type === 'figurine');
    const cubeGifts = gifts.filter(g => g && g.type === 'cube');
    const cashGifts = gifts.filter(g => !g || (g.type !== 'figurine' && g.type !== 'cube'));

    html += `
    <div class="gifts-available-section">
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

    window._partyDataCache = partyData;
    window._cubeGiftCache = gifts.filter(g => g && g.type === 'cube');
    window._figurineGiftCache = gifts.filter(g => g && g.type === 'figurine');
    window._cashGiftCache = gifts.filter(g => g && (!g.type || g.type === 'cash'));
    window._purchasedChoicesCache = giftChoices;
    mountCubeViewers(gifts);
    mountFigurineViewers(gifts);
    mountPurchasedCubeThumbs(giftChoices);
    mountPurchasedFigurineThumbs(giftChoices);
    attachPurchasedCashCardHandlers(giftChoices);
    initGiftsSubnav(giftsContent);

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
        <div class="gift-note-cta" data-reflection-zone="below">
          ${renderShowGiftNoteButtonHtml()}
        </div>
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

  const fallbackPartyNames = formatPartyNames(Array.isArray(window._partyDataCache) ? window._partyDataCache : []);
  const purchasedSignerName = (choice.giftFrom || '').trim() || fallbackPartyNames;
  attachShowGiftNoteHandler(overlay, {
    giftType: 'cube',
    giftTitle: choice.giftTitle,
    giftDescription: choice.giftDescription || translate('guests:gifts.cube.description'),
    giftAmount: choice.giftAmount,
    giftImageUrl: '',
    message: choice.message || '',
    signerName: purchasedSignerName,
  });

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

function showPurchasedFigurineDialog(choice) {
  if (!choice || !choice.figurineId) return;

  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay figurine-purchase-overlay figurine-purchased-overlay';

  const priceChipHtml = `
    <span class="cube-price-option__chip cube-price-option__chip--locked">€${choice.giftAmount}</span>
  `;
  const messageValue = (choice.message || '').replace(/</g, '&lt;');
  const purchasedDescriptionHtml = escapeHtml(choice.giftDescription || '');
  const fallbackPartyNames = formatPartyNames(Array.isArray(window._partyDataCache) ? window._partyDataCache : []);
  const signerName = (choice.giftFrom || '').trim() || fallbackPartyNames;

  overlay.innerHTML = `
    <div class="gift-purchase-dialog cube-purchase-dialog">
      <div class="gift-purchase-header">
        <i class="fas fa-user"></i>
        <h3>${escapeHtml(choice.giftTitle)}</h3>
      </div>
      <div class="gift-purchase-content">
        <div class="figurine-purchase-viewer" data-figurine-detail-mount="true"></div>
        ${purchasedDescriptionHtml ? `<p class="cube-purchase-description">${purchasedDescriptionHtml}</p>` : ''}
        <div class="cube-price-selector">
          <label class="cube-price-selector__label" data-i18n="guests:gifts.cube.priceLabelYour">${translate('guests:gifts.cube.priceLabelYour')}</label>
          <div class="cube-price-options cube-price-options--locked">${priceChipHtml}</div>
        </div>
        ${choice.message ? `
        <div class="gift-message-input">
          <label for="figurinePurchasedMessage" data-i18n="guests:giftsPurchasedMessageLabel">${translate('guests:giftsPurchasedMessageLabel')}</label>
          <textarea id="figurinePurchasedMessage" rows="3" readonly>${messageValue}</textarea>
          ${signerName ? `<div class="gift-purchased-signer">— ${escapeHtml(signerName)}</div>` : ''}
        </div>
        ` : ''}
        <div class="gift-note-cta">
          ${renderShowGiftNoteButtonHtml()}
        </div>
      </div>
      <div class="action-container">
        <button class="btn-base btn-primary btn-sm btn-close-purchased">
          <span data-i18n="guests:giftsPurchaseClose">${translate('guests:giftsPurchaseClose')}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  let detailViewer = null;
  const mount = overlay.querySelector('[data-figurine-detail-mount="true"]');
  if (mount && typeof window.createFigurineViewer === 'function') {
    detailViewer = window.createFigurineViewer(choice.figurineId, { mode: 'detail' });
    mount.appendChild(detailViewer);
  }

  attachShowGiftNoteHandler(overlay, {
    giftType: 'figurine',
    giftTitle: choice.giftTitle,
    giftDescription: choice.giftDescription || '',
    giftAmount: choice.giftAmount,
    giftImageUrl: '',
    message: choice.message || '',
    signerName,
  });

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

  overlay.querySelector('.btn-close-purchased').addEventListener('click', cleanup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });
}

function showPurchasedCashDialog(choice) {
  if (!choice) return;

  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay cash-gift-preview-overlay cash-gift-purchased-overlay';

  const giftTitle = choice.giftTitle || '';
  const giftAmount = choice.giftAmount;
  const giftDescription = choice.giftDescription || '';
  const giftImageUrl = choice.giftImageUrl || '';
  const fallbackPartyNames = formatPartyNames(Array.isArray(window._partyDataCache) ? window._partyDataCache : []);
  const signerName = (choice.giftFrom || '').trim() || fallbackPartyNames;
  const messageValue = (choice.message || '').replace(/</g, '&lt;');

  overlay.innerHTML = `
    <div class="gift-purchase-dialog cash-gift-preview-dialog">
      <div class="gift-purchase-header">
        <i class="fas fa-envelope-open-text"></i>
        <h3>${escapeHtml(giftTitle)}</h3>
      </div>
      <div class="gift-purchase-content">
        ${renderHoneymoonCardPreviewHtml({
          giftTitle,
          giftDescription,
          imageUrl: giftImageUrl,
          message: choice.message || '',
          signerName,
        })}
        ${choice.message ? `
        <div class="gift-message-input">
          <label for="cashPurchasedMessage" data-i18n="guests:giftsPurchasedMessageLabel">${translate('guests:giftsPurchasedMessageLabel')}</label>
          <textarea id="cashPurchasedMessage" rows="3" readonly>${messageValue}</textarea>
          ${signerName ? `<div class="gift-purchased-signer">— ${escapeHtml(signerName)}</div>` : ''}
        </div>
        ` : ''}
        <div class="gift-note-cta">
          ${renderShowGiftNoteButtonHtml()}
        </div>
      </div>
      <div class="action-container">
        <button class="btn-base btn-primary btn-sm btn-close-purchased">
          <span data-i18n="guests:giftsPurchaseClose">${translate('guests:giftsPurchaseClose')}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  attachShowGiftNoteHandler(overlay, {
    giftType: 'cash',
    giftTitle,
    giftDescription,
    giftAmount,
    giftImageUrl,
    message: choice.message || '',
    signerName,
  });

  const cleanup = () => {
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

  const cubeAmountOptions = Array.isArray(gift.amountOptions) ? gift.amountOptions : [];
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
        ${renderPriceSelectorHtml({
          name: 'cubeAmount',
          amountOptions: cubeAmountOptions,
          labelKey: 'guests:gifts.cube.priceLabel',
          wrapperAttrs: 'data-reflection-zone="below"',
        })}
        ${renderGiftFromFieldHtml('cubeGiftFromInput')}
        <div class="gift-message-input" data-reflection-zone="below">
          <label for="cubeMessage" data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</label>
          <textarea id="cubeMessage" placeholder="${translate('guests:gifts.cube.messagePlaceholder')}" rows="3" maxlength="${GIFT_MESSAGE_MAX_LENGTH}" data-char-counter-target="cubeMessage-counter"></textarea>
        <div class="char-counter" id="cubeMessage-counter" aria-live="polite">0/${GIFT_MESSAGE_MAX_LENGTH}</div>
        </div>
        <div class="gift-note-cta" data-reflection-zone="below">
          ${renderShowGiftNoteButtonHtml()}
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

  attachCharCounter(overlay, '#cubeGiftFromInput', GIFT_FROM_MAX_LENGTH);
  attachCharCounter(overlay, '#cubeMessage', GIFT_MESSAGE_MAX_LENGTH);

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

  const cubePriceCtl = attachPriceSelectorHandlers(overlay, {
    name: 'cubeAmount',
    amountOptions: cubeAmountOptions,
  });

  attachShowGiftNoteHandler(overlay, () => {
    const amount = (cubePriceCtl && cubePriceCtl.getSelectedAmount()) ?? (cubeAmountOptions[0] || 0);
    return {
      giftType: 'cube',
      giftTitle: gift.title || translate('guests:gifts.cube.title'),
      giftDescription: gift.description || translate('guests:gifts.cube.description'),
      giftAmount: amount,
      giftImageUrl: '',
      message: overlay.querySelector('#cubeMessage').value.trim(),
      signerName: resolveGiftFromValue(overlay.querySelector('#cubeGiftFromInput').value),
    };
  });

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
    const validation = cubePriceCtl ? cubePriceCtl.validate() : { ok: false };
    if (!validation.ok) {
      if (validation.message) showToast(validation.message, 'error');
      else showToast(translate('guests:gifts.cube.priceLabel'), 'error');
      return;
    }
    const amount = validation.amount;
    const message = liveContent.querySelector('#cubeMessage').value.trim();
    const cubeGiftFromInputEl = liveContent.querySelector('#cubeGiftFromInput');
    const giftFrom = resolveGiftFromValue(cubeGiftFromInputEl ? cubeGiftFromInputEl.value : '');
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
        body: JSON.stringify({ giftId: gift.id, amount, message, giftFrom }),
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

  const figurineAmountOptions = Array.isArray(gift.amountOptions) ? gift.amountOptions : [];
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
        ${renderPriceSelectorHtml({
          name: 'figurineAmount',
          amountOptions: figurineAmountOptions,
          labelKey: 'guests:gifts.figurine.priceLabel',
        })}
        ${renderGiftFromFieldHtml('figurineGiftFromInput')}
        <div class="gift-message-input">
          <label for="figurineMessage" data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</label>
          <textarea id="figurineMessage" placeholder="${translate('guests:gifts.figurine.messagePlaceholder')}" rows="3" maxlength="${GIFT_MESSAGE_MAX_LENGTH}" data-char-counter-target="figurineMessage-counter"></textarea>
          <div class="char-counter" id="figurineMessage-counter" aria-live="polite">0/${GIFT_MESSAGE_MAX_LENGTH}</div>
        </div>
        <div class="gift-note-cta">
          ${renderShowGiftNoteButtonHtml()}
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

  attachCharCounter(overlay, '#figurineGiftFromInput', GIFT_FROM_MAX_LENGTH);
  attachCharCounter(overlay, '#figurineMessage', GIFT_MESSAGE_MAX_LENGTH);

  let detailViewer = null;
  const mount = overlay.querySelector('[data-figurine-detail-mount="true"]');
  if (mount && typeof window.createFigurineViewer === 'function') {
    detailViewer = window.createFigurineViewer(gift.figurineId, { mode: 'detail' });
    mount.appendChild(detailViewer);
  }

  const figurinePriceCtl = attachPriceSelectorHandlers(overlay, {
    name: 'figurineAmount',
    amountOptions: figurineAmountOptions,
  });

  attachShowGiftNoteHandler(overlay, () => {
    const amount = (figurinePriceCtl && figurinePriceCtl.getSelectedAmount()) ?? (figurineAmountOptions[0] || 0);
    return {
      giftType: 'figurine',
      giftTitle: gift.title || '',
      giftDescription: gift.description || '',
      giftAmount: amount,
      giftImageUrl: '',
      message: overlay.querySelector('#figurineMessage').value.trim(),
      signerName: resolveGiftFromValue(overlay.querySelector('#figurineGiftFromInput').value),
    };
  });

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
    const validation = figurinePriceCtl ? figurinePriceCtl.validate() : { ok: false };
    if (!validation.ok) {
      if (validation.message) showToast(validation.message, 'error');
      else showToast(translate('guests:gifts.figurine.priceLabel'), 'error');
      return;
    }
    const amount = validation.amount;
    const message = liveContent.querySelector('#figurineMessage').value.trim();
    const figurineGiftFromInputEl = liveContent.querySelector('#figurineGiftFromInput');
    const giftFrom = resolveGiftFromValue(figurineGiftFromInputEl ? figurineGiftFromInputEl.value : '');
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
        body: JSON.stringify({ giftId: gift.id, amount, message, giftFrom }),
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
  if (gift.stock <= 0) {
    showToast(translate('guests:giftsSoldOut'), 'error');
    return;
  }
  const giftTitle = gift.title || '';
  const giftDescription = gift.description || '';
  const cashAmountOptions = Array.isArray(gift.amountOptions) && gift.amountOptions.length
    ? gift.amountOptions
    : (typeof gift.amount === 'number' ? [gift.amount] : []);
  const initialAmount = cashAmountOptions[0];

  const overlay = document.createElement('div');
  overlay.className = 'gift-purchase-overlay cash-gift-preview-overlay';
  overlay.innerHTML = `
    <div class="gift-purchase-dialog cash-gift-preview-dialog">
    <div class="gift-purchase-header">
        <i class="fas fa-envelope-open-text"></i>
        <h3>${escapeHtml(giftTitle)}</h3>
    </div>
    <div class="gift-purchase-content">
        ${renderHoneymoonCardPreviewHtml({
          giftTitle,
          giftDescription,
          imageUrl: gift.imageUrl,
        })}
        ${cashAmountOptions.length >= 1 ? renderPriceSelectorHtml({
          name: 'cashAmount',
          amountOptions: cashAmountOptions,
          labelKey: 'guests:gifts.card.priceLabel',
        }) : `
        <div class="gift-purchase-summary">
          <strong><span data-i18n="guests:giftsPurchaseAbout">${translate('guests:giftsPurchaseAbout')}</span></strong>
          <span class="gift-purchase-amount">€${initialAmount}</span>
        </div>
        `}
        ${renderGiftFromFieldHtml('giftFromInput')}
        <div class="gift-message-input">
        <label for="giftMessage"><span data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</span></label>
        <textarea id="giftMessage" placeholder="${translate('guests:giftsPurchaseMessage:placeholder')}" data-i18n="guests:giftsPurchaseMessage:placeholder" rows="3" maxlength="${GIFT_MESSAGE_MAX_LENGTH}" data-char-counter-target="giftMessage-counter"></textarea>
        <div class="char-counter" id="giftMessage-counter" aria-live="polite">0/${GIFT_MESSAGE_MAX_LENGTH}</div>
        </div>
        <div class="gift-note-cta">
          ${renderShowGiftNoteButtonHtml()}
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

  attachCharCounter(overlay, '#giftFromInput', GIFT_FROM_MAX_LENGTH);
  attachCharCounter(overlay, '#giftMessage', GIFT_MESSAGE_MAX_LENGTH);

  const updatePreviewMessage = () => {
    const textarea = overlay.querySelector('#giftMessage');
    const messageEl = overlay.querySelector('[data-insert-card-message="true"]');
    if (!textarea || !messageEl) return;
    const nextMessage = textarea.value.trim();
    const previewText = getCashGiftPreviewMessage(nextMessage);
    messageEl.textContent = previewText;
    messageEl.setAttribute('data-empty', nextMessage ? 'false' : 'true');
  };

  const updatePreviewSigner = () => {
    const input = overlay.querySelector('#giftFromInput');
    const signerEl = overlay.querySelector('[data-insert-card-signer="true"]');
    if (!input || !signerEl) return;
    signerEl.textContent = `— ${resolveGiftFromValue(input.value)}`;
  };

  overlay.querySelector('#giftMessage').addEventListener('input', updatePreviewMessage);
  overlay.querySelector('#giftFromInput').addEventListener('input', updatePreviewSigner);

  const cashPriceCtl = attachPriceSelectorHandlers(overlay, {
    name: 'cashAmount',
    amountOptions: cashAmountOptions,
  });

  attachShowGiftNoteHandler(overlay, () => ({
    giftType: 'cash',
    giftTitle,
    giftDescription,
    giftAmount: (cashPriceCtl && cashPriceCtl.getSelectedAmount()) ?? initialAmount,
    giftImageUrl: gift.imageUrl,
    message: overlay.querySelector('#giftMessage').value.trim(),
    signerName: resolveGiftFromValue(overlay.querySelector('#giftFromInput').value),
  }));

  const cleanup = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      if (overlay.parentNode) document.body.removeChild(overlay);
    }, 300);
    document.removeEventListener('keydown', handleEscape);
  };

  overlay.querySelector('.btn-cancel-purchase').addEventListener('click', () => {
    cleanup();
  });

  overlay.querySelector('.btn-confirm-purchase').addEventListener('click', async () => {
    const message = document.getElementById('giftMessage').value.trim();
    const giftFrom = resolveGiftFromValue(document.getElementById('giftFromInput').value);
    const validation = cashPriceCtl ? cashPriceCtl.validate() : { ok: true, amount: initialAmount };
    if (!validation.ok) {
      if (validation.message) showToast(validation.message, 'error');
      return;
    }
    const amount = validation.amount;
    const confirmBtn = overlay.querySelector('.btn-confirm-purchase');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-i18n="guests:giftsPurchaseProcessing">' + translate('guests:giftsPurchaseProcessing') + '</span>';

    try {
      const response = await fetch(`/api/guest/create-payment-session?lang=${window.currentLanguage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.token
        },
        body: JSON.stringify({giftId, message, giftFrom, amount})
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
      cleanup();
    }
  };
  document.addEventListener('keydown', handleEscape);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cleanup();
    }
  });
};
