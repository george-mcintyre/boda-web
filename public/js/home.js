// Countdown
function updateCountdown() {
    const weddingDate = new Date('2026-06-06T14:00:00+02:00').getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;
  
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
  
    if (distance < 0) {
      const currentLang = localStorage.getItem('i18nextLng') || 'es';
      const message = translate('common:countdownMessage', currentLang);
      document.querySelector('.countdown-container').innerHTML = `<h3>${message}</h3>`;
    }
  }
  
  // Update countdown every second
  setInterval(updateCountdown, 1000);
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
    
    console.log(`i18n system initialized, language: ${currentLanguage}`);
  });