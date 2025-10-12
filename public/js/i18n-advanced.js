/**
 * Sistema de Internacionalización Avanzado
 * Soporte completo para múltiples idiomas con funcionalidades avanzadas
 */

// Importar librerías desde CDN
import i18next from 'https://cdn.jsdelivr.net/npm/i18next@23.7.16/+esm';
import Backend from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@2.4.2/+esm';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@7.2.0/+esm';
import { initReactI18next } from 'https://cdn.jsdelivr.net/npm/react-i18next@13.5.0/+esm';

// Configuración de idiomas soportados
const SUPPORTED_LANGUAGES = {
  es: {
    name: 'Español',
    flag: '🇪🇸',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    locale: 'es-ES'
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    currency: 'USD',
    locale: 'en-US'
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    locale: 'fr-FR'
  },
  
    
  }
};

// Configuración avanzada de i18next
const i18nConfig = {
  debug: false,
  fallbackLng: 'es',
  supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
  ns: ['common', 'wedding', 'admin', 'forms', 'validation'],
  defaultNS: 'common',
  
  // Configuración del backend
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/add/{{lng}}/{{ns}}',
    crossDomain: false,
    withCredentials: false,
    requestOptions: {
      mode: 'cors',
      credentials: 'same-origin',
      cache: 'default'
    }
  },
  
  // Detección de idioma
  detection: {
    order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
    caches: ['localStorage', 'sessionStorage'],
    lookupLocalStorage: 'i18nextLng',
    lookupSessionStorage: 'i18nextLng',
    lookupFromPathIndex: 0,
    lookupFromSubdomainIndex: 0,
    checkWhitelist: true
  },
  
  // Interpolación avanzada
  interpolation: {
    escapeValue: false,
    skipOnVariables: false,
    format: function(value, format, lng) {
      if (format === 'uppercase') return value.toUpperCase();
      if (format === 'lowercase') return value.toLowerCase();
      if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
      if (format === 'currency') {
        const currency = SUPPORTED_LANGUAGES[lng]?.currency || 'EUR';
        return new Intl.NumberFormat(lng, { style: 'currency', currency }).format(value);
      }
      if (format === 'number') {
        return new Intl.NumberFormat(lng).format(value);
      }
      if (format === 'date') {
        const dateFormat = SUPPORTED_LANGUAGES[lng]?.dateFormat || 'DD/MM/YYYY';
        return new Intl.DateTimeFormat(lng).format(new Date(value));
      }
      return value;
    }
  },
  
  // Configuración de plurales
  pluralSeparator: '_',
  contextSeparator: '_',
  keySeparator: '.',
  
  // Configuración de carga
  load: 'languageOnly',
  preload: ['es', 'en'],
  
  // Configuración de caché
  cache: {
    enabled: true,
    expirationTime: 7 * 24 * 60 * 60 * 1000 // 7 días
  },
  
  // Configuración de fallback
  fallbackNS: false,
  partialBundledLanguages: true,
  resources: {},
  
  // Configuración de debug
  debug: false,
  saveMissing: false,
  saveMissingTo: 'fallback',
  
  // Configuración de react
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
    nsMode: 'default'
  }
};

// Inicializar i18next
i18next
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(i18nConfig);

// Clase principal para gestión de idiomas
class LanguageManager {
  constructor() {
    this.currentLanguage = 'es';
    this.observers = [];
    this.isInitialized = false;
  }

  // Inicializar el gestor de idiomas
  async init() {
    try {
      await i18next.init(i18nConfig);
      this.currentLanguage = i18next.language;
      this.isInitialized = true;
      this.notifyObservers();
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('Error initializing language manager:', error);
      return false;
    }
  }

  // Cambiar idioma
  async changeLanguage(lng) {
    if (!SUPPORTED_LANGUAGES[lng]) {
      console.warn(`Language ${lng} is not supported`);
      return false;
    }

    try {
      await i18next.changeLanguage(lng);
      this.currentLanguage = lng;
      
      // Guardar preferencia
      localStorage.setItem('i18nextLng', lng);
      sessionStorage.setItem('i18nextLng', lng);
      
      // Actualizar dirección del documento para RTL
      this.updateDocumentDirection(lng);
      
      // Actualizar metadatos del documento
      this.updateDocumentMetadata(lng);
      
      // Notificar observadores
      this.notifyObservers();
      
      // Disparar evento personalizado
      this.dispatchLanguageChangeEvent(lng);
      
      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  }

  // Obtener idioma actual
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Obtener información del idioma
  getLanguageInfo(lng) {
    return SUPPORTED_LANGUAGES[lng] || null;
  }

  // Obtener todos los idiomas soportados
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  // Verificar si un idioma es RTL
  isRTL(lng) {
    return SUPPORTED_LANGUAGES[lng]?.rtl || false;
  }

  // Actualizar dirección del documento
  updateDocumentDirection(lng) {
    const isRTL = this.isRTL(lng);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    
    // Agregar/remover clases CSS para RTL
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }

  // Actualizar metadatos del documento
  updateDocumentMetadata(lng) {
    const langInfo = this.getLanguageInfo(lng);
    if (langInfo) {
      document.documentElement.setAttribute('lang', lng);
      document.documentElement.setAttribute('data-locale', langInfo.locale);
    }
  }

  // Traducir texto
  translate(key, options = {}) {
    return i18next.t(key, options);
  }

  // Traducir con interpolación
  translateWithParams(key, params = {}) {
    return i18next.t(key, params);
  }

  // Formatear número
  formatNumber(number, options = {}) {
    const lng = this.getCurrentLanguage();
    const langInfo = this.getLanguageInfo(lng);
    return new Intl.NumberFormat(langInfo?.locale || lng, options).format(number);
  }

  // Formatear fecha
  formatDate(date, options = {}) {
    const lng = this.getCurrentLanguage();
    const langInfo = this.getLanguageInfo(lng);
    return new Intl.DateTimeFormat(langInfo?.locale || lng, options).format(date);
  }

  // Formatear moneda
  formatCurrency(amount, currency = null) {
    const lng = this.getCurrentLanguage();
    const langInfo = this.getLanguageInfo(lng);
    const currencyCode = currency || langInfo?.currency || 'EUR';
    return new Intl.NumberFormat(langInfo?.locale || lng, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  // Agregar observador
  addObserver(callback) {
    this.observers.push(callback);
  }

  // Remover observador
  removeObserver(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // Notificar observadores
  notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error('Error in language observer:', error);
      }
    });
  }

  // Configurar event listeners
  setupEventListeners() {
    // Escuchar cambios de idioma de i18next
    i18next.on('languageChanged', (lng) => {
      this.currentLanguage = lng;
      this.notifyObservers();
    });

    // Escuchar errores de carga
    i18next.on('failedLoading', (lng, ns, msg) => {
      console.warn(`Failed to load language ${lng} namespace ${ns}:`, msg);
    });

    // Escuchar carga exitosa
    i18next.on('loaded', (loaded) => {
      console.log('Languages loaded:', loaded);
    });
  }

  // Disparar evento personalizado
  dispatchLanguageChangeEvent(lng) {
    const event = new CustomEvent('languageChanged', {
      detail: {
        language: lng,
        languageInfo: this.getLanguageInfo(lng),
        timestamp: new Date()
      }
    });
    document.dispatchEvent(event);
  }

  // Cargar idioma específico
  async loadLanguage(lng) {
    try {
      await i18next.loadLanguages(lng);
      return true;
    } catch (error) {
      console.error(`Error loading language ${lng}:`, error);
      return false;
    }
  }

  // Precargar idiomas
  async preloadLanguages(languages = ['en', 'fr']) {
    const promises = languages.map(lng => this.loadLanguage(lng));
    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error preloading languages:', error);
      return false;
    }
  }

  // Detectar idioma del navegador
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0];
    
    if (SUPPORTED_LANGUAGES[langCode]) {
      return langCode;
    }
    
    // Buscar idioma similar
    for (const [code, info] of Object.entries(SUPPORTED_LANGUAGES)) {
      if (browserLang.startsWith(code)) {
        return code;
      }
    }
    
    return 'es'; // Fallback
  }

  // Obtener idioma preferido del usuario
  getUserPreferredLanguage() {
    // 1. Verificar localStorage
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang && SUPPORTED_LANGUAGES[storedLang]) {
      return storedLang;
    }

    // 2. Verificar sessionStorage
    const sessionLang = sessionStorage.getItem('i18nextLng');
    if (sessionLang && SUPPORTED_LANGUAGES[sessionLang]) {
      return sessionLang;
    }

    // 3. Detectar idioma del navegador
    return this.detectBrowserLanguage();
  }
}

// Crear instancia global
const languageManager = new LanguageManager();

// Funciones globales para compatibilidad
window.changeLanguage = (lng) => languageManager.changeLanguage(lng);
window.translate = (key, options) => languageManager.translate(key, options);
window.formatNumber = (number, options) => languageManager.formatNumber(number, options);
window.formatDate = (date, options) => languageManager.formatDate(date, options);
window.formatCurrency = (amount, currency) => languageManager.formatCurrency(amount, currency);

// Clase para el selector de idiomas
class LanguageSelector {
  constructor(container = null) {
    this.container = container || document.querySelector('.language-selector');
    this.manager = languageManager;
    this.isInitialized = false;
  }

  // Inicializar selector
  async init() {
    if (this.isInitialized) return;

    try {
      await this.manager.init();
      this.render();
      this.setupEventListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing language selector:', error);
    }
  }

  // Renderizar selector
  render() {
    if (!this.container) {
      this.createContainer();
    }

    const currentLang = this.manager.getCurrentLanguage();
    const languages = this.manager.getSupportedLanguages();

    this.container.innerHTML = `
      <div class="language-selector-wrapper">
        <div class="language-selector-dropdown">
          <button class="language-selector-toggle" aria-label="Select language">
            <span class="current-language">
              <span class="flag">${languages[currentLang]?.flag}</span>
              <span class="name">${languages[currentLang]?.name}</span>
            </span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="language-selector-menu">
            ${Object.entries(languages).map(([code, info]) => `
              <button class="language-option ${code === currentLang ? 'active' : ''}" 
                      data-lang="${code}" 
                      aria-label="Switch to ${info.name}">
                <span class="flag">${info.flag}</span>
                <span class="name">${info.name}</span>
                ${code === currentLang ? '<i class="fas fa-check"></i>' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Crear contenedor si no existe
  createContainer() {
    const header = document.querySelector('header .header-content');
    if (header) {
      this.container = document.createElement('div');
      this.container.className = 'language-selector';
      header.appendChild(this.container);
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    if (!this.container) return;

    // Toggle del dropdown
    const toggle = this.container.querySelector('.language-selector-toggle');
    const menu = this.container.querySelector('.language-selector-menu');

    if (toggle && menu) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
        toggle.setAttribute('aria-expanded', menu.classList.contains('show'));
      });

      // Cerrar al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Opciones de idioma
      const options = this.container.querySelectorAll('.language-option');
      options.forEach(option => {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          const lang = option.getAttribute('data-lang');
          this.manager.changeLanguage(lang);
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Escuchar cambios de idioma
    this.manager.addObserver(() => {
      this.render();
    });
  }

  // Actualizar selector
  update() {
    this.render();
  }
}

// Clase para actualizar contenido de la página
class ContentUpdater {
  constructor() {
    this.manager = languageManager;
    this.selectors = {
      text: '[data-i18n]',
      attr: '[data-i18n-attr]',
      placeholder: '[data-i18n-placeholder]',
      title: 'title[data-i18n]'
    };
  }

  // Actualizar todo el contenido
  updateAll() {
    this.updateTextElements();
    this.updateAttributeElements();
    this.updatePlaceholderElements();
    this.updateTitle();
    this.updateMetaTags();
  }

  // Actualizar elementos de texto
  updateTextElements() {
    document.querySelectorAll(this.selectors.text).forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const translation = this.manager.translate(key);
        if (translation !== key) {
          element.textContent = translation;
        }
      }
    });
  }

  // Actualizar elementos con atributos
  updateAttributeElements() {
    document.querySelectorAll(this.selectors.attr).forEach(element => {
      const attrData = element.getAttribute('data-i18n-attr');
      if (attrData) {
        const [attr, key] = attrData.split(':');
        if (attr && key) {
          const translation = this.manager.translate(key);
          if (translation !== key) {
            element.setAttribute(attr, translation);
          }
        }
      }
    });
  }

  // Actualizar placeholders
  updatePlaceholderElements() {
    document.querySelectorAll(this.selectors.placeholder).forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key) {
        const translation = this.manager.translate(key);
        if (translation !== key) {
          element.placeholder = translation;
        }
      }
    });
  }

  // Actualizar título de la página
  updateTitle() {
    const title = document.querySelector(this.selectors.title);
    if (title) {
      const key = title.getAttribute('data-i18n');
      if (key) {
        const translation = this.manager.translate(key);
        if (translation !== key) {
          title.textContent = translation;
        }
      }
    }
  }

  // Actualizar meta tags
  updateMetaTags() {
    const lang = this.manager.getCurrentLanguage();
    const langInfo = this.manager.getLanguageInfo(lang);

    // Actualizar meta description si existe
    const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
    if (metaDesc) {
      const key = metaDesc.getAttribute('data-i18n');
      if (key) {
        const translation = this.manager.translate(key);
        if (translation !== key) {
          metaDesc.setAttribute('content', translation);
        }
      }
    }

    // Actualizar meta keywords si existe
    const metaKeywords = document.querySelector('meta[name="keywords"][data-i18n]');
    if (metaKeywords) {
      const key = metaKeywords.getAttribute('data-i18n');
      if (key) {
        const translation = this.manager.translate(key);
        if (translation !== key) {
          metaKeywords.setAttribute('content', translation);
        }
      }
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inicializar gestor de idiomas
    await languageManager.init();
    
    // Crear selector de idiomas
    const languageSelector = new LanguageSelector();
    await languageSelector.init();
    
    // Crear actualizador de contenido
    const contentUpdater = new ContentUpdater();
    
    // Actualizar contenido inicial
    contentUpdater.updateAll();
    
    // Escuchar cambios de idioma
    languageManager.addObserver(() => {
      contentUpdater.updateAll();
    });
    
    // Precargar idiomas adicionales
    languageManager.preloadLanguages(['en', 'fr']);
    
    console.log('Advanced i18n system initialized successfully');
  } catch (error) {
    console.error('Error initializing advanced i18n system:', error);
  }
});

// Exportar para uso en otros archivos
window.i18nAdvanced = {
  languageManager,
  LanguageSelector,
  ContentUpdater,
  SUPPORTED_LANGUAGES
};

// Exportar i18next para compatibilidad
window.i18next = i18next;

