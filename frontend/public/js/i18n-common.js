// Sistema i18n común para todas las páginas
class I18nSystem {
    constructor(translations) {
        this.translations = translations;
        this.languages = {
            es: { name: 'Español', flag: '🇪🇸', rtl: false },
            en: { name: 'English', flag: '🇬🇧', rtl: false },
            fr: { name: 'Français', flag: '🇫🇷', rtl: false },
          
        };
        this.currentLanguage = localStorage.getItem('i18nextLng') || 'es';
        this.init();
    }

    init() {
        this.updateDocumentDirection();
        this.updatePageContent();
        this.updateLanguageSelector();
        this.setupEventListeners();
    }

    translate(key, lang = this.currentLanguage) {
        const translation = this.translations[lang]?.[key];
        return translation || key;
    }

    updatePageContent() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            if (translation !== key) {
                element.textContent = translation;
            }
        });

        // Actualizar placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.translate(key);
            if (translation !== key) {
                element.placeholder = translation;
            }
        });
    }

    updateLanguageSelector() {
        const toggle = document.getElementById('language-toggle');
        const currentLang = this.languages[this.currentLanguage];
        
        if (toggle) {
            toggle.innerHTML = `
                <span class="current-language">
                    <span class="flag">${currentLang.flag}</span>
                    <span class="name">${currentLang.name}</span>
                </span>
                <i class="fas fa-chevron-down"></i>
            `;
        }
        
        // Actualizar opciones activas
        document.querySelectorAll('.language-option').forEach(option => {
            const lang = option.getAttribute('data-lang');
            if (lang === this.currentLanguage) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    updateDocumentDirection() {
        const isRTL = this.languages[this.currentLanguage].rtl;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLanguage;
    }

    async changeLanguage(lang) {
        if (!this.languages[lang]) {
            console.warn(`Language ${lang} is not supported`);
            return false;
        }

        try {
            this.currentLanguage = lang;
            
            // Guardar preferencia
            localStorage.setItem('i18nextLng', lang);
            
            // Actualizar dirección del documento
            this.updateDocumentDirection();
            
            // Actualizar contenido
            this.updatePageContent();
            
            // Actualizar selector
            this.updateLanguageSelector();
            
            // Disparar evento de cambio de idioma
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
            
            console.log(`Language changed to: ${lang}`);
            return true;
        } catch (error) {
            console.error(`Error changing language: ${error.message}`);
            return false;
        }
    }

    setupEventListeners() {
        const toggle = document.getElementById('language-toggle');
        const menu = document.getElementById('language-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('show');
                toggle.setAttribute('aria-expanded', menu.classList.contains('show'));
            });
            
            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target)) {
                    menu.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Opciones de idioma
            document.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lang = option.getAttribute('data-lang');
                    this.changeLanguage(lang);
                    menu.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getTranslation(key) {
        return this.translate(key);
    }
}

// Función para inicializar el sistema i18n
function initI18n(translations) {
    return new I18nSystem(translations);
}

// Función para obtener traducción desde cualquier lugar
function getTranslation(key) {
    const currentLang = localStorage.getItem('i18nextLng') || 'es';
    // Esta función necesita acceso a las traducciones específicas de cada página
    // Se puede extender según sea necesario
    return key;
}

// Hacer la función translate disponible globalmente
window.translate = function(key) {
    const currentLang = localStorage.getItem('i18nextLng') || 'es';
    // Buscar en las traducciones de la página actual si están disponibles
    if (window.currentTranslations && window.currentTranslations[currentLang] && window.currentTranslations[currentLang][key]) {
        return window.currentTranslations[currentLang][key];
    }
    return key;
};

