// Configuración de internacionalización con i18next
import i18next from 'https://cdn.jsdelivr.net/npm/i18next@23.7.16/+esm';
import Backend from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@2.4.2/+esm';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@7.2.0/+esm';

// Configuración de i18next
i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    debug: false,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'fr'],
    ns: ['common', 'wedding'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Función para cambiar idioma
window.changeLanguage = async (lng) => {
  try {
    await i18next.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    updateLanguageSelector();
    updatePageContent();
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Función para actualizar el selector de idioma
function updateLanguageSelector() {
  const currentLang = i18next.language;
  const langButtons = document.querySelectorAll('.lang-btn');
  
  langButtons.forEach(btn => {
    const lang = btn.getAttribute('data-lang');
    if (lang === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Función para actualizar todo el contenido de la página
function updatePageContent() {
  // Actualizar elementos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = i18next.t(key);
    if (translation !== key) {
      element.textContent = translation;
    }
  });

  // Actualizar elementos con data-i18n-attr
  document.querySelectorAll('[data-i18n-attr]').forEach(element => {
    const attrData = element.getAttribute('data-i18n-attr');
    const [attr, key] = attrData.split(':');
    const translation = i18next.t(key);
    if (translation !== key) {
      element.setAttribute(attr, translation);
    }
  });

  // Actualizar placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = i18next.t(key);
    if (translation !== key) {
      element.placeholder = translation;
    }
  });

  // Actualizar títulos de página
  const pageTitle = document.querySelector('title');
  if (pageTitle && pageTitle.getAttribute('data-i18n')) {
    const key = pageTitle.getAttribute('data-i18n');
    const translation = i18next.t(key);
    if (translation !== key) {
      pageTitle.textContent = translation;
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Crear selector de idioma si no existe
  if (!document.querySelector('.language-selector')) {
    createLanguageSelector();
  }
  
  updateLanguageSelector();
  updatePageContent();
  
  // Escuchar cambios de idioma
  i18next.on('languageChanged', () => {
    updatePageContent();
  });
});

// Función para crear el selector de idioma
function createLanguageSelector() {
  const header = document.querySelector('header .header-content');
  if (header) {
    const langSelector = document.createElement('div');
    langSelector.className = 'language-selector';
    langSelector.innerHTML = `
      <div class="lang-buttons">
        <button class="lang-btn" data-lang="es" onclick="changeLanguage('es')">
          <span class="lang-flag">🇪🇸</span>
          <span class="lang-name">ES</span>
        </button>
        <button class="lang-btn" data-lang="en" onclick="changeLanguage('en')">
          <span class="lang-flag">🇺🇸</span>
          <span class="lang-name">EN</span>
        </button>
        <button class="lang-btn" data-lang="fr" onclick="changeLanguage('fr')">
          <span class="lang-flag">🇫🇷</span>
          <span class="lang-name">FR</span>
        </button>
      </div>
    `;
    header.appendChild(langSelector);
  }
}

// Exportar para uso en otros archivos
window.i18next = i18next;

