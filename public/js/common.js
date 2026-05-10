// Common functions shared across all modules

// Get token and current language from localStorage
window.token = localStorage.getItem('token');
window.currentLanguage = localStorage.getItem('i18nextLng') || 'es';

// Wraps window.fetch so 401/403 responses from our own API auto-redirect to
// the matching login page. Installed only on pages that include common.js
// (guests.html, admin.html) - the login pages deliberately do not load this
// file, so wrong-credential 401s from /api/login cannot trigger a redirect
// loop on the login form.
(function installAuthFailureInterceptor() {
  if (typeof window === 'undefined' || !window.fetch) return;
  if (window.__authFailureInterceptorInstalled) return;
  window.__authFailureInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);
  const API_PREFIX = '/api/';
  let redirectInFlight = false;

  function isOwnApiUrl(input) {
    try {
      const url = typeof input === 'string'
        ? input
        : (input && input.url) || '';
      return url.startsWith(API_PREFIX)
          || url.startsWith(window.location.origin + API_PREFIX);
    } catch (e) {
      return false;
    }
  }

  function redirectToLogin() {
    if (redirectInFlight) return;
    redirectInFlight = true;

    const isAdminArea = (window.location.pathname || '')
      .toLowerCase()
      .includes('admin');

    if (isAdminArea) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      window.location.href = 'admin-login.html';
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      window.location.href = 'login.html';
    }
  }

  window.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch(input, init);
    try {
      if ((response.status === 401 || response.status === 403)
          && isOwnApiUrl(input)) {
        redirectToLogin();
      }
    } catch (e) {
      console.error('Auth failure interceptor error:', e);
    }
    return response;
  };
})();

// Tabs functionality with settings-based access control
window.tabButtons = document.querySelectorAll('.tab-btn');
window.tabContents = document.querySelectorAll('.tab-content');

// Settings management for guest access control
window.settingsCache = null;
window.settingsCacheTimestamp = 0;
window.SETTINGS_CACHE_DURATION = 300000; // 5 minutes

// Check if an admin is logged in
window.isAdminLoggedIn = () => {
  const token = localStorage.getItem('adminToken');
  return !!token && token.trim() !== '';
}

// Fetch application settings (same logic as auth-check.js)
window.fetchSettings = async () => {
    if (window.isAdminLoggedIn()) {
      return {
        guestsEnabled: true,
        eventsEnabled: true,
        menuEnabled: true,
        messagesEnabled: true,
        giftsEnabled: true
      };
    }
    try {
        // Check if we have cached settings that are still valid
        const now = Date.now();
        if (window.settingsCache && (now - window.settingsCacheTimestamp) < window.SETTINGS_CACHE_DURATION) {
            return window.settingsCache;
        }

        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
            throw new Error(`Failed to fetch settings: ${response.status}`);
        }
        
        const settings = await response.json();
        window.settingsCache = settings;
        window.settingsCacheTimestamp = now;
        return settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        // Return default settings if fetch fails
        return {
            guestsEnabled: false,
            eventsEnabled: false,
            menuEnabled: false,
            messagesEnabled: false,
            giftsEnabled: false
        };
    }
}

// Apply settings-based visibility control
window.applySettingsVisibility = (settings) => {    
    // Control tabs-header visibility
    const partyTab = document.querySelector('[data-tab="party"]');
    const eventsTab = document.querySelector('[data-tab="events"]');
    const menuTab = document.querySelector('[data-tab="menu"]');
    const giftsTab = document.querySelector('[data-tab="gifts"]');
    
    // Party tab - disable if guestsEnabled is not true
    if (partyTab) {
        if (settings.guestsEnabled) {
            partyTab.style.display = '';
            partyTab.classList.remove('disabled');
        } else {
            partyTab.style.display = 'none';
            partyTab.classList.add('disabled');
        }
    }
    
    // RSVP/Events tab - disable if eventsEnabled is not true
    if (eventsTab) {
        if (settings.eventsEnabled) {
            eventsTab.style.display = '';
            eventsTab.classList.remove('disabled');
        } else {
            eventsTab.style.display = 'none';
            eventsTab.classList.add('disabled');
        }
    }
    
    // Menu tab - disable if menuEnabled is not true
    if (menuTab) {
        if (settings.menuEnabled) {
            menuTab.style.display = '';
            menuTab.classList.remove('disabled');
        } else {
            menuTab.style.display = 'none';
            menuTab.classList.add('disabled');
        }
    }
    
    // Gifts tab - disable if giftsEnabled is not true
    if (giftsTab) {
        if (settings.giftsEnabled) {
            giftsTab.style.display = '';
            giftsTab.classList.remove('disabled');
        } else {
            giftsTab.style.display = 'none';
            giftsTab.classList.add('disabled');
        }
    }
    
    // Control summary-section visibility
    const rsvpSummarySection = document.querySelector('.rsvp-summary-section');
    const menuSummarySection = document.querySelector('.menu-summary-section');
    
  // RSVP summary section - only show if eventsEnabled is true
    if (rsvpSummarySection) {
      if (settings.eventsEnabled) {
            rsvpSummarySection.style.display = '';
        } else {
            rsvpSummarySection.style.display = 'none';
        }
    }
    
    // Menu summary section - only show if menuEnabled is true
    if (menuSummarySection) {
        if (settings.menuEnabled) {
            menuSummarySection.style.display = '';
        } else {
            menuSummarySection.style.display = 'none';
        }
    }
    
    // Comments section - only show if messagesEnabled is true
    const commentsSection = document.querySelector('.comments-card');
    if (commentsSection) {
        if (settings.messagesEnabled) {
            commentsSection.style.display = '';
            // Initialize comments system if messages are enabled and comments system exists
            if (window.commentsSystem) {
                // Refresh comments when becoming visible
                setTimeout(() => {
                    if (typeof window.commentsSystem.loadComments === 'function') {
                        window.commentsSystem.loadComments();
                    }
                }, 100);
            }
        } else {
            commentsSection.style.display = 'none';
        }
    }
    
    // If current active tab is now hidden, switch to summary
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && (activeTab.style.display === 'none' || activeTab.classList.contains('disabled'))) {
        const summaryTab = document.querySelector('[data-tab="summary"]');
        if (summaryTab) {
            summaryTab.click();
        }
    }
}

// Initialize settings and apply visibility
window.initializeSettingsVisibility = async () => {
    try {
        const settings = await window.fetchSettings();
        window.applySettingsVisibility(settings);
    } catch (error) {
        console.error('Error initializing settings visibility:', error);
        // Apply default visibility (hide all conditional sections)
        const defaultSettings = {
            guestsEnabled: false,
            eventsEnabled: false,
            menuEnabled: false,
            messagesEnabled: false,
            giftsEnabled: false
        };
        window.applySettingsVisibility(defaultSettings);
    }
}

// Show welcome message
window.showMessage = (elementId, msg, type = 'error') => {
  const element = document.getElementById(elementId);
  element.textContent = msg;
  element.className = `message ${type}`;
  element.style.display = 'block';
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

window.showToast = function(message, type = 'success') {
  const durations = { success: 5000, warning: 8000, error: 7000, info: 5000 };
  const duration = durations[type] || 5000;

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

// Function to show custom confirmation dialog
window.showConfirmDialog = function(message, onConfirm, onCancel) {
  // Create a confirmation overlay
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-content">
        <i class="fas fa-question-circle"></i>
        <h3 data-i18n="common:confirmAction:rich">${translate("common:confirmAction:rich")}</h3>
        <p>${message}</p> 
        <div class="form-actions">
          <button class="btn-base btn-outline btn-sm" data-i18n="common:cancel:rich">${translate("common:cancel:rich")}</button>
          <button class="btn-base btn-primary btn-sm" data-i18n="common:confirm:rich">${translate("common:confirm:rich")}</button>
        </div>
      </div>
    </div>
  `;
  
  // Add to the body
  document.body.appendChild(overlay);
  
  // Show with animation
  setTimeout(() => overlay.classList.add('show'), 100);
  
  // Event listeners
  overlay.querySelector('.btn-base.btn-outline').addEventListener('click', () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    }, 300);
  });
  
  overlay.querySelector('.btn-base.btn-primary').addEventListener('click', () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(overlay);
      if (onConfirm) onConfirm();
    }, 300);
  });
  
  // Close with Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      }, 300);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// Helper function to escape HTML to prevent injection
window.escapeHtml = function(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Date formatting utilities that adapt to user's language preference
window.getUserLanguage = function() {
  return localStorage.getItem('i18nextLng') || 'es';
}

window.formatDate = function(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const userLang = window.getUserLanguage();
    return date.toLocaleDateString(userLang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Madrid'
    });
  } catch (e) {
    return isoString;
  }
}

window.formatTime = function(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const userLang = window.getUserLanguage();
    return date.toLocaleTimeString(userLang, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Madrid'
    });
  } catch (e) {
    return isoString;
  }
}

window.extractDateFromISO = function(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year  = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day   = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
}

window.extractTimeFromISO = function(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour   = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    return `${hour}:${minute}`;
  } catch (e) {
    return '';
  }
}

   // Global logout function
window.logoutGuest = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('name');
  localStorage.removeItem('email');
  window.location.href = 'index.html';
};

// 24-char hex, looks like a Mongo ObjectId
window.makeObjectIdLike = function() {
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

// Load images that require auth headers (blob URL approach)
window.loadAuthImages = function(container) {
  // If no container specified, use document body
  const target = container || document.body;
  
  target.querySelectorAll('img[data-auth-src]').forEach(async (img) => {
    const url = img.getAttribute('data-auth-src');
    if (!url) return;
    
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': window.token }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        img.src = URL.createObjectURL(blob);
        img.style.display = '';
        
        // Hide "no image" sibling if present
        const noImgSibling = img.nextElementSibling;
        if (noImgSibling && noImgSibling.tagName === 'SPAN') {
          noImgSibling.style.display = 'none';
        }
      } else {
        img.style.display = 'none';
        const noImgSibling = img.nextElementSibling;
        if (noImgSibling && noImgSibling.tagName === 'SPAN') {
          noImgSibling.style.display = '';
        }
      }
    } catch(e) {
      console.error('Error loading auth image:', url, e);
      img.style.display = 'none';
      const noImgSibling = img.nextElementSibling;
      if (noImgSibling && noImgSibling.tagName === 'SPAN') {
        noImgSibling.style.display = '';
      }
    }
  });
};

// Function to switch to a specific tab
window.switchToTab = function(tabName, updateUrl = true) {
  console.log(`Switching to: ${tabName} tab in the Guests Zone` )
  // Find and check if target tab is accessible
  const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (!targetButton) return;
  
  // Check if tab is disabled due to settings
  if (targetButton.style.display === 'none' || targetButton.classList.contains('disabled')) {
    const currentLang = localStorage.getItem('i18nextLng') || 'es';
    const messages = {
      en: 'This section is not yet enabled. Please check back later or contact the organizers for more information.',
      es: 'Esta sección aún no está habilitada. Vuelve a consultar más tarde o contacta con los organizadores para más información.',
      fr: 'Cette section n\'est pas encore activée. Veuillez vérifier plus tard ou contacter les organisateurs pour plus d\'informations.'
    };
    
    showToast(messages[currentLang] || messages.es, 'info');
    return;
  }
  
  // Remove active class from all buttons and contents
  window.tabButtons.forEach(btn => btn.classList.remove('active'));
  window.tabContents.forEach(content => content.classList.remove('active'));

  // Activate the target tab button
  targetButton.classList.add('active');

  // Find and activate the target tab content
  const targetContent = document.getElementById(`${tabName}-tab`);
  if (targetContent) {
    targetContent.classList.add('active');
  }

  // Load content for the specific tab
  if (tabName === 'party') {
    loadPartyContent();
  } else if (tabName === 'menu') {
    if (typeof loadMenuSelections === 'function') {
      loadMenuSelections();
    }
  } else if (tabName === 'events') {
    loadEventsContent();
  } else if (tabName === 'gifts') {
    loadGiftsContent();
  } else if (tabName === 'summary') {
    loadSummaryContent();
  }
  updatePageContent();
  
  // Update URL for deep linking (unless it's the initial load)
  if (updateUrl) {
    updateUrlWithTab(tabName);
  }
}

// Function to update URL with tab parameter for deep linking
window.updateUrlWithTab = function(tabName) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('tab', tabName);
  window.history.replaceState({}, '', url.toString());
}

