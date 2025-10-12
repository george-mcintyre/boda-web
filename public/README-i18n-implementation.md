# Guía de Implementación del Sistema i18n

## 📋 Resumen

El sistema i18n (internacionalización) permite que el sitio web de la boda funcione en múltiples idiomas. Actualmente soporta:
- 🇪🇸 Español (por defecto)
- 🇺🇸 Inglés
- 🇫🇷 Francés


## 🎯 Estado Actual

### ✅ Páginas con i18n implementado:
1. **`index-i18n-fixed.html`** - Página principal
2. **`login-i18n.html`** - Login de invitados
3. **`admin-login-i18n.html`** - Login de administradores
4. **`invitados-i18n.html`** - Panel de invitados
5. **`admin-i18n.html`** - Panel de administración ✨ **NUEVO**
6. **`test-i18n-simple.html`** - Página de pruebas

### ❌ Páginas pendientes de implementar:
- Otras páginas del sistema

## 🎛️ Panel de Administración con i18n

### Características implementadas:
- ✅ **Soporte para 2 idiomas**: Español e Inglés
- ✅ **Selector de idiomas** integrado en el header
- ✅ **Traducciones completas** de todos los elementos de la interfaz
- ✅ **Funcionalidad completa** del panel de administración
- ✅ **Mensajes de error y confirmación** traducidos
- ✅ **Estados y badges** traducidos dinámicamente

### Archivo creado:
- **`admin-i18n.html`** - Panel de administración con sistema i18n

### Archivos modificados:
- **`js/admin-login.js`** - Actualizada redirección para usar el nuevo panel con i18n

### Idiomas soportados:
- 🇪🇸 **Español** (idioma por defecto)
- 🇺🇸 **Inglés**

### Funcionalidades traducidas:
- Títulos y subtítulos
- Pestañas de navegación
- Tablas de datos (invitados, regalos, mensajes, agenda)
- Botones de acción
- Estados de confirmación
- Mensajes de error y carga
- Configuración del sistema
- Confirmaciones de eliminación

## 🛠️ Cómo Implementar i18n en una Nueva Página

### Paso 1: Incluir los archivos necesarios

```html
<head>
  <!-- CSS común para el selector de idiomas -->
  <link rel="stylesheet" href="assets/css/i18n-selector.css">
  
  <!-- JavaScript común para el sistema i18n -->
  <script src="js/i18n-common.js"></script>
</head>
```

### Paso 2: Agregar el selector de idiomas en el header

```html
<header>
  <div class="header-content">
    <div class="header-left">
      <!-- Contenido del header -->
      <h1 data-i18n="page:title">Título de la página</h1>
    </div>
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
              <i class="fas fa-check"></i>
            </button>
            <button class="language-option" data-lang="en">
              <span class="flag">🇺🇸</span>
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
  </div>
</header>
```

### Paso 3: Marcar elementos traducibles

```html
<!-- Para texto normal -->
<h1 data-i18n="page:title">Título de la página</h1>
<p data-i18n="page:description">Descripción de la página</p>

<!-- Para placeholders -->
<input type="text" data-i18n-placeholder="form:emailPlaceholder" placeholder="Introduce tu email">

<!-- Para atributos title -->
<button data-i18n-title="button:submitTitle" title="Enviar formulario">Enviar</button>
```

### Paso 4: Definir las traducciones

```html
<script>
  // Definir traducciones para esta página
  const pageTranslations = {
    es: {
      'page:title': 'Título de la página',
      'page:description': 'Descripción de la página',
      'form:emailPlaceholder': 'Introduce tu email',
      'button:submitTitle': 'Enviar formulario',
      'button:submit': 'Enviar'
    },
    en: {
      'page:title': 'Page Title',
      'page:description': 'Page description',
      'form:emailPlaceholder': 'Enter your email',
      'button:submitTitle': 'Submit form',
      'button:submit': 'Submit'
    },
    fr: {
      'page:title': 'Titre de la page',
      'page:description': 'Description de la page',
      'form:emailPlaceholder': 'Entrez votre email',
      'button:submitTitle': 'Soumettre le formulaire',
      'button:submit': 'Soumettre'
    },

  };

  // Inicializar el sistema i18n
  document.addEventListener('DOMContentLoaded', () => {
    const i18n = initI18n(pageTranslations);
  });
</script>
```

### Paso 5: Usar traducciones en JavaScript

```javascript
// Obtener traducción actual
const currentLang = localStorage.getItem('i18nextLng') || 'es';

// Función para obtener traducción
function translate(key) {
  const translations = pageTranslations[currentLang] || pageTranslations.es;
  return translations[key] || key;
}

// Usar en mensajes
alert(translate('message:success'));
```

## 📁 Estructura de Archivos

```
public/
├── assets/css/
│   └── i18n-selector.css          # Estilos del selector de idiomas
├── js/
│   ├── i18n-common.js             # Sistema i18n común
│   ├── login-i18n.js              # Login con i18n
│   ├── invitados-i18n.js          # Panel de invitados con i18n
│   └── login.js                   # Login original
├── index-i18n-fixed.html          # Página principal con i18n
├── login-i18n.html                # Login con i18n
├── admin-login-i18n.html          # Admin login con i18n
├── invitados-i18n.html            # Panel de invitados con i18n
└── test-i18n-simple.html          # Página de pruebas
```

## 🔧 Funcionalidades del Sistema

### ✅ Características implementadas:
- **Selector visual** con banderas y nombres de idiomas
- **Persistencia** de preferencia de idioma en localStorage

- **Traducción automática** de elementos con `data-i18n`
- **Traducción de placeholders** con `data-i18n-placeholder`
- **Formateo de números, fechas y monedas** según el idioma
- **Responsive design** para móviles

### 🎨 Estilos incluidos:
- Selector desplegable con animaciones
- Efectos hover y transiciones suaves

- Diseño responsive

## 🧪 Cómo Probar

### 1. Página principal:
```
http://localhost:3000/index-i18n-fixed.html
```

### 2. Login de invitados:
```
http://localhost:3000/login-i18n.html
```

### 3. Login de administradores:
```
http://localhost:3000/admin-login-i18n.html
```

### 4. Panel de invitados:
```
http://localhost:3000/invitados-i18n.html
```

### 5. Página de pruebas:
```
http://localhost:3000/test-i18n-simple.html
```

## 📝 Convenciones de Nomenclatura

### Claves de traducción:
- `page:element` - Para elementos específicos de la página
- `common:element` - Para elementos comunes (botones, enlaces)
- `form:element` - Para elementos de formularios
- `message:type` - Para mensajes del sistema

### Ejemplos:
```javascript
{
  'page:title': 'Título de la página',
  'common:home': 'Inicio',
  'form:emailLabel': 'Email:',
  'message:success': 'Operación exitosa'
}
```

## 🚀 Próximos Pasos

1. **Implementar i18n en `admin.html`**
2. **Crear archivos de traducción separados** para mejor organización
3. **Agregar más idiomas** si es necesario
4. **Implementar traducción dinámica** desde el servidor
5. **Optimizar el rendimiento** del sistema i18n

## 🔍 Solución de Problemas

### El selector no aparece:
- Verificar que el CSS `i18n-selector.css` esté incluido
- Comprobar que la estructura HTML del selector sea correcta

### Las traducciones no funcionan:
- Verificar que el JavaScript `i18n-common.js` esté incluido
- Comprobar que las traducciones estén definidas correctamente
- Revisar la consola del navegador para errores

### El idioma no se guarda:
- Verificar que localStorage esté habilitado
- Comprobar que la función `changeLanguage()` se ejecute correctamente

## 📞 Soporte

Para implementar i18n en nuevas páginas o resolver problemas, seguir esta guía paso a paso. El sistema está diseñado para ser modular y fácil de implementar.
