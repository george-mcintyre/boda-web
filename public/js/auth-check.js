/**
 * Authentication utilities for checking login status and redirecting appropriately
 */

// Settings management for guest access control
let settingsCache = null;
let settingsCacheTimestamp = 0;
const SETTINGS_CACHE_DURATION = 300000; // 5 minutes

// Fetch application settings
async function fetchSettings() {
    try {
        // Check if we have cached settings that are still valid
        const now = Date.now();
        if (settingsCache && (now - settingsCacheTimestamp) < SETTINGS_CACHE_DURATION) {
            return settingsCache;
        }

        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
            throw new Error(`Failed to fetch settings: ${response.status}`);
        }
        
        const settings = await response.json();
        settingsCache = settings;
        settingsCacheTimestamp = now;
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

// Check if guests are enabled and show popup if not
async function checkGuestAccess() {
    try {
        const settings = await fetchSettings();
        
        if (!settings.guestsEnabled) {
            // Get current language for popup message
            const currentLang = localStorage.getItem('i18nextLng') || 'es';
            const messages = {
                en: 'Guest entry not yet enabled. Please check back later or contact the organizers for more information.',
                es: 'La entrada de invitados aún no está habilitada. Vuelve a consultar más tarde o contacta con los organizadores para más información.',
                fr: 'L\'accès invités n\'est pas encore activé. Veuillez vérifier plus tard ou contacter les organisateurs pour plus d\'informations.'
            };
            
            alert(messages[currentLang] || messages.es);
            return false; // Prevent access
        }
        
        return true; // Allow access
    } catch (error) {
        console.error('Error checking guest access:', error);
        return false;
    }
}

// Check if a guest is logged in
function isGuestLoggedIn() {
    const token = localStorage.getItem('token');
    return !!token && token.trim() !== '';
}

// Check if an admin is logged in
function isAdminLoggedIn() {
    const token = localStorage.getItem('adminToken');
    return !!token && token.trim() !== '';
}

// Redirect to appropriate dashboard based on login status
function redirectToAppropriateDashboard() {
    if (isAdminLoggedIn() || isGuestLoggedIn()) {
        window.location.href = 'guests.html';
        return true;
    }
    return false;
}

// Handle guest login link click
async function handleGuestLoginClick() {
    try {
        if (redirectToAppropriateDashboard()) {
            return false; // Prevent default link behavior
        }
        
        // Check if guest access is enabled before allowing login
        const guestAccessAllowed = await checkGuestAccess();
        if (!guestAccessAllowed) {
            return false;
        }
        
        return true; // Allow default link behavior (go to login page)
    } catch (error) {
        console.error('Error handling guest login click:', error);
        return false;
    }
}

// Handle admin login link click
function handleAdminLoginClick() {
    try {
        if (isAdminLoggedIn()) {
            window.location.href = '/admin.html';
            return false; // Prevent default link behavior
        } else if (isGuestLoggedIn()) {
            // Guest is logged in but trying to access admin - show message and stay
            const currentLang = localStorage.getItem('i18nextLng') || 'es';
            const messages = {
                en: 'This section is for administrators only. If you need administrator access, contact the organizers.',
                es: 'Esta sección es solo para administradores. Si necesitas acceso de administrador, contacta con los organizadores.',
                fr: 'Cette section est réservée aux administrateurs. Si vous avez besoin d\'un accès administrateur, contactez les organisateurs.'
            };
            
            alert(messages[currentLang] || messages.es);
            return false; // Prevent default link behavior
        }
        return true; // Allow default link behavior (go to admin login page)
    } catch (error) {
        console.error('Error handling admin login click:', error);
        // On error, allow the default behavior
        return true;
    }
}

// Initialize authentication check handlers on DOM load
function initializeAuthHandlers() {
    console.log('initializing auth handlers');
    
    // Handle buttons with data-action attributes (handles both guest and admin login)
    const loginButtons = document.querySelectorAll('[data-action="guest-login"], [data-action="admin-login"]');
    loginButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
          const action = button.getAttribute('data-action');
          const href = button.getAttribute('href'); // if it's an <a>
      
          if (action === 'admin-login') {
            const allow = handleAdminLoginClick();
            if (allow && href) window.location.href = href;
          } else {
            e.preventDefault(); // stop navigation right away
            const allow = await handleGuestLoginClick();
            if (allow && href) window.location.href = href;
          }
        });
      });      
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthHandlers);
} else {
    // DOM is already loaded
    initializeAuthHandlers();
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isGuestLoggedIn,
        isAdminLoggedIn,
        redirectToAppropriateDashboard,
        handleGuestLoginClick,
        handleAdminLoginClick,
        fetchSettings,
        checkGuestAccess
    };
}