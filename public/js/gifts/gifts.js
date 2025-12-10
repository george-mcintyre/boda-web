// Gifts Management Module

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
    const [giftChoicesRes, giftsRes] = await Promise.all([
    fetch('/api/guest/gift-choices', {
        method: 'GET',
        headers: { 'Authorization': window.token }
    }),
    fetch(`/api/guest/gifts?lang=${window.currentLanguage}`, {
        method: 'GET',
        headers: { 'Authorization': window.token }
    })
    ]);
    
    let giftChoices = [];
    let gifts = [];
    
    if (giftChoicesRes.ok) {
    giftChoices = await giftChoicesRes.json();
    }
    
    if (!giftsRes.ok) {
    throw new Error('Failed to load gifts');
    }
    gifts = await giftsRes.json();
    
    // Helper to escape HTML
    const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
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
        </div>
        <h1 data-i18n="guests:giftsPaymentCancelledTitle">${translate('guests:giftsPaymentCancelledTitle')}</h1>
        <p class="cancelled-message" data-i18n="guests:giftsPaymentCancelled">${translate('guests:giftsPaymentCancelled')}</p>
    `;
    }

    // ========== Section 1: Thank You Section (if there are donated gifts) ==========
    if (giftChoices.length > 0) {
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
        const donatedOnText = translate('guests:giftsDonatedOn:rich').replace('{{date}}', formatDate(choice.date));
        html += `
        <div class="donated-gift-card" style="background-image: url('${escapeHtml(choice.giftImageUrl)}');">
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
    
    // ========== Section 2: Available Gifts Grid ==========
    html += `
    <div class="gifts-available-section">
        <div class="available-gifts-header">
        <i class="fas fa-gift"></i>
        <h3><span data-i18n="guests:giftsRegistryTitle">${translate('guests:giftsRegistryTitle')}</span></h3>
        <p><span data-i18n="guests:giftsRegistrySubtitle">${translate('guests:giftsRegistrySubtitle')}</span></p>
        </div>
        <div class="gift-cards-grid">
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
    gifts.forEach(gift => {
        const isAvailable = gift.stock > 0;
        
        html += `
        <div class="card gift-credit-card ${!isAvailable ? 'sold-out' : ''}" data-gift-id="${gift.id}">
            <div class="gift-card-image-section" style="background-image: url('${escapeHtml(gift.imageUrl)}');">
            <div class="gift-card-image-overlay">
                <h4 class="gift-card-title">${escapeHtml(gift.title)}</h4>
                <div class="gift-card-price">${escapeHtml(gift.priceDisplay)}</div>
            </div>
            </div>
            <div class="gift-card-details">
            <p class="gift-card-description">${gift.description}</p>
            <div class="gift-card-stock">
                ${isAvailable
                ? `<span class="stock-available"><i class="fas fa-check-circle"></i> ${gift.stock} <span data-i18n="guests:giftsAvailable">${translate('guests:giftsAvailable')}</span></span>`
                : `<span class="stock-sold-out"><i class="fas fa-times-circle"></i> <span data-i18n="guests:giftsSoldOut">${translate('guests:giftsSoldOut')}</span></span>`
                }
            </div>
            <div class="action-container">
                ${isAvailable ? `
                <button class="btn-base btn-primary btn-sm" onclick="purchaseGift('${gift.id}', '${escapeHtml(gift.title).replace(/'/g, "\\'")}', ${gift.amount})">
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
    });
    }
    
    html += `
        </div>
    </div>
    `;
    
    html += '</div>'; // Close gifts-container
    
    giftsContent.innerHTML = html;
    
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

// Global function to purchase a gift
window.purchaseGift = async (giftId, giftTitle, giftAmount) => {
// Show a confirmation dialog with optional message
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
        <strong>${giftTitle}</strong>
        <span class="gift-purchase-amount">€${giftAmount}</span>
        </div>
        <div class="gift-message-input">
        <label for="giftMessage"><span data-i18n="guests:giftsPurchaseMessageLabel">${translate('guests:giftsPurchaseMessageLabel')}</span></label>
        <textarea id="giftMessage" placeholder="${translate('guests:giftsPurchaseMessagePlaceholder')}" data-i18n-placeholder="guests:giftsPurchaseMessagePlaceholder" rows="3"></textarea>
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
        body: JSON.stringify({ giftId, message })
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

