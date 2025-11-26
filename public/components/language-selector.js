/**
 * LanguageSelector Component
 * A reusable language selector component that integrates with the i18n system
 */
class LanguageSelector {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      showCurrentLanguage: true,
      onLanguageChange: null,
      ...options
    };
    
    // Use global i18n configuration if available
    this.languages = window.languages || {
      es: { name: 'Español', flag: '🇪🇸', rtl: false },
      en: { name: 'English', flag: '🇬🇧', rtl: false },
      fr: { name: 'Français', flag: '🇫🇷', rtl: false },
    };
    
    const lang = localStorage.getItem('i18nextLng') || window.currentLanguage || 'es';

    this.currentLanguage = lang;
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error('LanguageSelector: Container not found');
      return;
    }
    
    this.render();
    this.attachEventListeners();
    this.updateCurrentLanguage();
  }
  
  render() {
    this.container.innerHTML = `
        <!-- Language Selector -->
        <div class="language-selector">
          <div class="language-selector-wrapper">
            <div class="language-selector-dropdown">
              <button class="language-selector-toggle" id="language-toggle" aria-label="Select language">
                <span class="current-language">
                  <span class="flag">🇪🇸</span>
                  <span class="name">Español</span>
                </span>
                <i class="fas fa-chevron-down"></i>
              </button>
              <div class="language-selector-menu" id="language-menu">
                <button class="language-option active" data-lang="es">
                  <span class="flag">🇪🇸</span>
                  <span class="name">Español</span>
                </button>
                <button class="language-option" data-lang="en">
                  <span class="flag">🇬🇧</span>
                  <span class="name">English</span>
                </button>
                <button class="language-option" data-lang="fr">
                  <span class="flag">🇫🇷</span>
                  <span class="name">Français</span>
                </button>
              </div>
            </div>
          </div>
        </div>
     `;
  }
  
  attachEventListeners() {
    const toggle = this.container.querySelector('.language-selector-toggle');
    const menu = this.container.querySelector('.language-selector-menu');
    const options = this.container.querySelectorAll('.language-option');
    
    // Toggle dropdown
    toggle?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
    
    // Handle language selection
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = option.getAttribute('data-lang');
        if (lang && lang !== this.currentLanguage) {
          this.changeLanguage(lang);
        }
      });
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    const menu = this.container.querySelector('.language-selector-menu');
    menu?.classList.add('show');
    this.isOpen = true;
  }
  
  close() {
    const menu = this.container.querySelector('.language-selector-menu');
    menu?.classList.remove('show');
    this.isOpen = false;
  }
  
  async changeLanguage(lang) {
    if (!this.languages[lang]) {
      console.warn(`Language ${lang} is not supported`);
      return false;
    }
    
    try {
      // Close dropdown
      this.close();
      
      // Use global changeLanguage function if available
      if (typeof window.changeLanguage === 'function') {
        await window.changeLanguage(lang);
      }
      
      // Update component state
      this.currentLanguage = lang;
      this.updateCurrentLanguage();
      
      // Call onLanguageChange callback
      if (this.options.onLanguageChange) {
        this.options.onLanguageChange(lang);
      }
      
      console.log(`Language changed to: ${lang}`);
      return true;
    } catch (error) {
      console.error(`Error changing language: ${error.message}`);
      return false;
    }
  }
  
  updateCurrentLanguage() {
    const toggle = this.container.querySelector('.language-selector-toggle');
    const toggleContent = toggle?.querySelector('.current-language');
    const options = this.container.querySelectorAll('.language-option');
    
    if (toggleContent) {
      const currentLang = this.languages[this.currentLanguage];
      if (currentLang) {
        toggleContent.innerHTML = `
          <span class="flag">${currentLang.flag}</span>
          <span class="name">${currentLang.name}</span>
        `;
      }
    }
    
    // Update active option
    options.forEach(option => {
      const lang = option.getAttribute('data-lang');
      if (lang === this.currentLanguage) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  destroy() {
    // Clean up event listeners
    const toggle = this.container.querySelector('.language-selector-toggle');
    const options = this.container.querySelectorAll('.language-option');
    
    toggle?.removeEventListener('click', this.toggle);
    options.forEach(option => {
      option.removeEventListener('click', this.changeLanguage);
    });
    
    // Clear container
    this.container.innerHTML = '';
  }
}

// Utility function to create and initialize a language selector
window.createLanguageSelector = function(container, options = {}) {
  return new LanguageSelector(container, options);
};

// Auto-initialize if container has data-auto-init attribute
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-auto-init="language-selector"]').forEach(container => {
    new LanguageSelector(container);
  });
});