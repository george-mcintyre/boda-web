# Sistema de Internacionalización Avanzado (i18n)

## 📋 Descripción

Este sistema proporciona una solución completa y robusta para la internacionalización de aplicaciones web, con soporte para múltiples idiomas, RTL, formateo de fechas, números y monedas, y una interfaz de usuario moderna.

## ✨ Características Principales

### 🌍 Soporte Multiidioma
- **Español (es)** - Idioma por defecto
- **Inglés (en)** - Soporte completo
- **Francés (fr)** - Soporte completo


### 🎨 Funcionalidades Avanzadas
- ✅ **Detección automática** del idioma del navegador
- ✅ **Persistencia** de preferencias en localStorage/sessionStorage

- ✅ **Formateo inteligente** de fechas, números y monedas
- ✅ **Interpolación** de variables en traducciones
- ✅ **Carga lazy** de archivos de traducción
- ✅ **Fallback** automático a idioma por defecto
- ✅ **Selector visual** con banderas y nombres nativos
- ✅ **Accesibilidad** completa (ARIA, navegación por teclado)
- ✅ **Responsive** design para móviles
- ✅ **Temas oscuros** automáticos
- ✅ **Reduced motion** para accesibilidad

## 🚀 Instalación

### 1. Incluir los archivos necesarios

```html
<!-- CSS para el selector de idiomas -->
<link rel="stylesheet" href="assets/css/i18n-advanced.css">

<!-- Script principal (módulo ES6) -->
<script type="module" src="js/i18n-advanced.js"></script>
```

### 2. Estructura de archivos de traducción

```
frontend/public/locales/
├── es/
│   ├── common.json
│   └── wedding.json
├── en/
│   ├── common.json
│   └── wedding.json
├── fr/
│   ├── common.json
│   └── wedding.json
└── ar/
    ├── common.json
    └── wedding.json
```

## 📝 Uso Básico

### 1. Marcar elementos para traducción

```html
<!-- Traducción de texto -->
<h1 data-i18n="wedding:title">Título por defecto</h1>

<!-- Traducción de atributos -->
<img data-i18n-attr="alt:wedding:image.alt" src="image.jpg">

<!-- Traducción de placeholders -->
<input data-i18n-placeholder="wedding:form.email.placeholder" type="email">

<!-- Traducción de títulos de página -->
<title data-i18n="wedding:title">Título por defecto</title>
```

### 2. Usar funciones de traducción en JavaScript

```javascript
// Traducción simple
const message = translate('common:welcome');

// Traducción con parámetros
const welcome = translateWithParams('common:welcomeBack', { name: 'John' });

// Formateo de números
const price = formatNumber(1000, { style: 'currency', currency: 'EUR' });

// Formateo de fechas
const date = formatDate(new Date(), { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

// Formateo de moneda
const amount = formatCurrency(150, 'USD');
```

### 3. Cambiar idioma programáticamente

```javascript
// Cambiar a inglés
await changeLanguage('en');

// Cambiar a francés
await changeLanguage('fr');

// Cambiar a árabe (RTL)
await changeLanguage('ar');
```

## 🎯 Funcionalidades Avanzadas

### 1. Interpolación de Variables

```json
{
  "wedding": {
    "welcome": "Bienvenido, {{name}}!",
    "countdown": "Faltan {{days}} días para la boda"
  }
}
```

```javascript
const message = translateWithParams('wedding:welcome', { name: 'María' });
// Resultado: "Bienvenido, María!"
```

### 2. Formateo Inteligente

```javascript
// Números
formatNumber(1234.56, { style: 'decimal', minimumFractionDigits: 2 });
// Español: "1.234,56"
// Inglés: "1,234.56"

// Porcentajes
formatNumber(0.85, { style: 'percent' });
// Español: "85%"
// Inglés: "85%"

// Monedas
formatCurrency(150, 'EUR');
// Español: "150,00 €"
// Inglés: "€150.00"
```

### 3. Soporte RTL

El sistema detecta automáticamente los idiomas RTL y ajusta:
- Dirección del texto (`dir="rtl"`)
- Alineación de elementos
- Orden de iconos y botones
- Posicionamiento de menús

### 4. Eventos Personalizados

```javascript
// Escuchar cambios de idioma
document.addEventListener('languageChanged', (event) => {
  console.log('Idioma cambiado a:', event.detail.language);
  console.log('Información del idioma:', event.detail.languageInfo);
});

// Escuchar cuando el sistema está listo
document.addEventListener('i18nReady', () => {
  console.log('Sistema de i18n inicializado');
});
```

## 🎨 Personalización

### 1. Agregar nuevos idiomas

```javascript
// En i18n-advanced.js, agregar al objeto SUPPORTED_LANGUAGES
const SUPPORTED_LANGUAGES = {
  // ... idiomas existentes
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    locale: 'de-DE'
  }
};
```

### 2. Personalizar estilos CSS

```css
/* Personalizar el selector de idiomas */
.language-selector-toggle {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

/* Personalizar opciones del menú */
.language-option:hover {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}
```

### 3. Configuración avanzada

```javascript
// Acceder al gestor de idiomas
const manager = window.i18nAdvanced.languageManager;

// Obtener información del idioma actual
const currentLang = manager.getCurrentLanguage();
const langInfo = manager.getLanguageInfo(currentLang);

// Verificar si es RTL
const isRTL = manager.isRTL(currentLang);

// Obtener todos los idiomas soportados
const languages = manager.getSupportedLanguages();
```

## 📱 Responsive Design

El selector de idiomas se adapta automáticamente:

- **Desktop**: Muestra bandera + nombre del idioma
- **Tablet**: Muestra solo bandera + nombre corto
- **Mobile**: Muestra solo bandera

## ♿ Accesibilidad

- **Navegación por teclado**: Tab, Enter, Escape
- **ARIA labels**: Etiquetas descriptivas para lectores de pantalla
- **Focus visible**: Indicadores claros de foco
- **Reduced motion**: Respeta preferencias de movimiento reducido
- **Contraste**: Cumple estándares WCAG

## 🔧 API Completa

### LanguageManager

```javascript
// Métodos principales
await manager.init()                    // Inicializar
await manager.changeLanguage(lng)       // Cambiar idioma
manager.getCurrentLanguage()           // Obtener idioma actual
manager.getLanguageInfo(lng)           // Información del idioma
manager.isRTL(lng)                     // Verificar si es RTL
manager.translate(key, options)        // Traducir
manager.translateWithParams(key, params) // Traducir con parámetros
manager.formatNumber(number, options)  // Formatear número
manager.formatDate(date, options)      // Formatear fecha
manager.formatCurrency(amount, currency) // Formatear moneda
manager.addObserver(callback)          // Agregar observador
manager.removeObserver(callback)       // Remover observador
```

### LanguageSelector

```javascript
const selector = new LanguageSelector(container);
await selector.init();                 // Inicializar selector
selector.render();                     // Renderizar
selector.update();                     // Actualizar
```

### ContentUpdater

```javascript
const updater = new ContentUpdater();
updater.updateAll();                   // Actualizar todo el contenido
updater.updateTextElements();          // Solo elementos de texto
updater.updateAttributeElements();     // Solo atributos
updater.updatePlaceholderElements();   // Solo placeholders
```

## 🐛 Solución de Problemas

### 1. Las traducciones no se cargan

```javascript
// Verificar que los archivos existen
fetch('/locales/es/common.json')
  .then(response => response.json())
  .then(data => console.log('Archivo cargado:', data))
  .catch(error => console.error('Error cargando archivo:', error));
```

### 2. El selector no aparece

```javascript
// Verificar que el header existe
const header = document.querySelector('header .header-content');
if (!header) {
  console.error('No se encontró el header para el selector de idiomas');
}
```

### 3. Problemas con RTL

```javascript
// Verificar configuración RTL
const manager = window.i18nAdvanced.languageManager;
console.log('Es RTL:', manager.isRTL('ar'));
console.log('Dirección del documento:', document.documentElement.dir);
```

## 📚 Ejemplos

Ver `index-i18n.html` para un ejemplo completo de implementación.

## 🤝 Contribuir

Para agregar nuevos idiomas o funcionalidades:

1. Agregar el idioma a `SUPPORTED_LANGUAGES`
2. Crear archivos de traducción en `/locales/[código]/`
3. Probar con diferentes configuraciones de navegador
4. Verificar accesibilidad y responsive design

## 📄 Licencia

Este sistema está diseñado para uso en el proyecto de boda de Iluminada & George.







