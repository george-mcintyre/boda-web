/**
 * Authentication utilities for checking login status and redirecting appropriately
 */

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

// Get current authentication status for debugging
function getCurrentAuthStatus() {
    return {
        isGuestLoggedIn: isGuestLoggedIn(),
        isAdminLoggedIn: isAdminLoggedIn(),
        hasAnyAuth: isGuestLoggedIn() || isAdminLoggedIn()
    };
}

// Redirect to appropriate dashboard based on login status
function redirectToAppropriateDashboard() {
    if (isAdminLoggedIn()) {
        console.log('Admin user detected, redirecting to admin dashboard');
        window.location.href = '/admin.html';
        return true;
    } else if (isGuestLoggedIn()) {
        console.log('Guest user detected, redirecting to guest dashboard');
        window.location.href = 'guests.html';
        return true;
    }
    console.log('No authenticated user detected, allowing login page access');
    return false;
}

// Handle guest login link click
function handleGuestLoginClick() {
    try {
        if (redirectToAppropriateDashboard()) {
            return false; // Prevent default link behavior
        }
        return true; // Allow default link behavior (go to login page)
    } catch (error) {
        console.error('Error handling guest login click:', error);
        // On error, allow the default behavior (go to login page)
        return true;
    }
}

// Handle admin login link click
function handleAdminLoginClick() {
    try {
        if (isAdminLoggedIn()) {
            console.log('Admin user detected, redirecting to admin dashboard');
            window.location.href = '/admin.html';
            return false; // Prevent default link behavior
        } else if (isGuestLoggedIn()) {
            // Guest is logged in but trying to access admin - show message and stay
            const currentLang = localStorage.getItem('i18nextLng') || 'es';
            const messages = {
                es: 'Esta sección es solo para administradores. Si necesitas acceso de administrador, contacta con los organizadores.',
                en: 'This section is for administrators only. If you need administrator access, contact the organizers.',
                fr: 'Cette section est réservée aux administrateurs. Si vous avez besoin d\'un accès administrateur, contactez les organisateurs.'
            };
            
            alert(messages[currentLang] || messages.es);
            console.log('Guest user tried to access admin section, access denied');
            return false; // Prevent default link behavior
        }
        console.log('No authenticated user detected, allowing admin login page access');
        return true; // Allow default link behavior (go to admin login page)
    } catch (error) {
        console.error('Error handling admin login click:', error);
        // On error, allow the default behavior
        return true;
    }
}

// Initialize authentication check handlers on DOM load
function initializeAuthHandlers() {
    console.log('Initializing authentication handlers...');
    
    // Handle guest login links by href
    const guestLoginLinks = document.querySelectorAll('a[href="login.html"], a[href="/login.html"]');
    guestLoginLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            console.log(`Guest login link ${index + 1} clicked:`, this.href);
            if (!handleGuestLoginClick()) {
                e.preventDefault();
            }
        });
    });

    // Handle admin login links by href
    const adminLoginLinks = document.querySelectorAll('a[href="/admin-login.html"]');
    adminLoginLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            console.log(`Admin login link ${index + 1} clicked:`, this.href);
            if (!handleAdminLoginClick()) {
                e.preventDefault();
            }
        });
    });

    // Handle buttons with data-action attributes
    const loginButtons = document.querySelectorAll('[data-action="guest-login"], [data-action="admin-login"]');
    loginButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            console.log(`Login button ${index + 1} clicked:`, this.getAttribute('data-action'));
            e.preventDefault();
            const action = this.getAttribute('data-action');
            if (action === 'admin-login') {
                handleAdminLoginClick();
            } else {
                handleGuestLoginClick();
            }
        });
    });

    // Log current authentication status for debugging
    console.log('Current authentication status:', getCurrentAuthStatus());
    
    console.log(`Authentication handlers initialized: ${guestLoginLinks.length} guest links, ${adminLoginLinks.length} admin links, ${loginButtons.length} buttons`);
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
        handleAdminLoginClick
    };
}