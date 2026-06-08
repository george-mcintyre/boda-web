// Countdown
function updateCountdown() {
    const weddingDate = new Date('2026-06-06T14:00:00+02:00').getTime();
    const now = new Date().getTime();
    // Clamp at zero so the countdown stops instead of going negative.
    const distance = Math.max(weddingDate - now, 0);
  
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
    // The countdown elements are removed once the date passes (see below),
    // so guard against missing elements on later interval ticks.
    const daysEl = document.getElementById('days');
    if (daysEl) {
      daysEl.textContent = days.toString().padStart(2, '0');
      document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
      document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
      document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
  
    if (distance <= 0) {
      // The wedding has happened: the "We're married!" headline already says it,
      // so just remove the countdown rather than showing a duplicate message.
      const container = document.querySelector('.countdown-container');
      if (container) {
        container.remove();
      }
      clearInterval(countdownInterval);
    }
  }
  
  // Update countdown every second
  const countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();
  
  // Scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe elements with animation
  document.querySelectorAll('.fade-in-up').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
  
  // Update guest access visibility based on settings
  async function updateGuestAccessVisibility() {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const settings = await response.json();
      const guestsEnabled = settings.guestsEnabled !== undefined ? settings.guestsEnabled : true;
      
      // Find all guest login buttons
      const guestLoginButtons = document.querySelectorAll('[data-action="guest-login"]');
      
      guestLoginButtons.forEach(button => {
        // Check if the button should be hidden based on its parent container
        // Header button is in .login-access-icon, bottom button is in .cta-row
        const parent = button.closest('.login-access-icon, .cta-row');
        
        if (parent && !guestsEnabled) {
          parent.style.display = 'none';
        } else if (parent && guestsEnabled) {
          parent.style.display = '';
        }
      });
      
      console.log('Guest access visibility updated:', { guestsEnabled, buttonCount: guestLoginButtons.length });
    } catch (error) {
      console.error('Error fetching guest settings:', error);
      // On error, show the buttons as default (fail-safe behavior)
      const guestLoginButtons = document.querySelectorAll('[data-action="guest-login"]');
      guestLoginButtons.forEach(button => {
        const parent = button.closest('.login-access-icon, .cta-row');
        if (parent) parent.style.display = '';
      });
    }
  }

  // Home page i18n
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing i18n system...');
    
    // Configure language selector
    const toggle = document.getElementById('language-toggle');
    const menu = document.getElementById('language-menu');
    
    if (toggle && menu) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
        toggle.setAttribute('aria-expanded', menu.classList.contains('show'));
      });
      
      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target)) {
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Language options
      document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          const lang = option.getAttribute('data-lang');
          changeLanguage(lang);
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
    
    // Load preferred language
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && languages[savedLang]) {
      currentLanguage = savedLang;
    }
    
    // Initialize
    updateDocumentDirection();
    updatePageContent();
    updateLanguageSelector();
    updateFormatting();
    
    // Update guest access visibility based on settings
    updateGuestAccessVisibility();
    
    console.log(`i18n system initialized, language: ${currentLanguage}`);
  });