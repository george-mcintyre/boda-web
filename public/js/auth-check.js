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

// Redirect to appropriate dashboard based on login status
function redirectToAppropriateDashboard() {
    if (isAdminLoggedIn()) {
        window.location.href = '/admin.html';
        return true;
    } else if (isGuestLoggedIn()) {
        window.location.href = 'guests.html';
        return true;
    }
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
    // Handle guest login links by href
    const guestLoginLinks = document.querySelectorAll('a[href="login.html"], a[href="/login.html"]');
    guestLoginLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            if (!handleGuestLoginClick()) {
                e.preventDefault();
            }
        });
    });

    // Handle admin login links by href
    const adminLoginLinks = document.querySelectorAll('a[href="/admin-login.html"]');
    adminLoginLinks.forEach((link) => {
        link.addEventListener('click', function(e) {
            if (!handleAdminLoginClick()) {
                e.preventDefault();
            }
        });
    });

    // Handle buttons with data-action attributes
    const loginButtons = document.querySelectorAll('[data-action="guest-login"], [data-action="admin-login"]');
    loginButtons.forEach((button) => {
        button.addEventListener('click', function(e) {
            const action = this.getAttribute('data-action');
            if (action === 'admin-login') {
                handleAdminLoginClick();
            } else {
                handleGuestLoginClick();
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
        handleAdminLoginClick
    };
}