# Sistema de Gestión de Eventos - Boda de Iluminada y George

## Descripción General

Este sistema permite al administrador gestionar completamente los eventos de la boda, incluyendo eventos principales y subeventos, con una interfaz moderna y fácil de usar integrada en el panel de administración i18n.

## Características Principales

### 🎯 Gestión Completa de Eventos
- **Eventos Principales**: Crear, editar, eliminar eventos principales de la boda
- **Subeventos**: Añadir subeventos dentro de cada evento principal
- **Iconos Personalizables**: Selección de iconos de una amplia biblioteca de Font Awesome
- **Información Detallada**: Título, descripción, fechas, horas, ubicaciones y coordenadas

### 🎨 Interfaz de Usuario
- **Diseño Moderno**: Interfaz responsive y atractiva
- **Selector de Iconos**: Búsqueda y categorización de iconos
- **Modales Intuitivos**: Formularios fáciles de usar
- **Validación en Tiempo Real**: Validación de campos obligatorios

### 📍 Información de Ubicación
- **Lugar y Dirección**: Campos para ubicación física
- **Coordenadas de Google Maps**: Latitud y longitud para integración con mapas
- **Visualización de Mapas**: Enlace directo a Google Maps

## Estructura de Archivos

```
frontend/public/
├── js/
│   ├── eventos-icons.js          # Biblioteca de iconos
│   └── eventos-admin.js          # Lógica principal del sistema
├── assets/css/
│   └── eventos-admin.css         # Estilos del sistema
└── admin-i18n.html              # Panel de administración (modificado)

backend/
├── data/
│   └── eventos.json             # Almacenamiento de datos de eventos
└── server.js                    # Endpoints de la API (ya existentes)
```

## Estructura de Datos

### Evento Principal
```json
{
  "id": 1,
  "icono": "fas fa-church",
  "titulo": "Ceremonia Religiosa",
  "descripcion": "Ceremonia religiosa de Iluminada y George",
  "fecha": "2026-06-06",
  "horaInicio": "12:00",
  "horaFin": "13:30",
  "lugar": "Iglesia de San Miguel",
  "direccion": "Plaza Mayor, 1",
  "ciudad": "Madrid, España",
  "coordenadas": {
    "lat": 40.4155,
    "lng": -3.7074
  },
  "subeventos": [...]
}
```

### Subevento
```json
{
  "id": 1,
  "icono": "fas fa-music",
  "titulo": "Entrada de los Novios",
  "descripcion": "Entrada procesional de los novios al altar",
  "horaInicio": "12:00",
  "horaFin": "12:15",
  "lugar": "Iglesia de San Miguel",
  "direccion": "Plaza Mayor, 1",
  "ciudad": "Madrid, España",
  "coordenadas": {
    "lat": 40.4155,
    "lng": -3.7074
  }
}
```

## API Endpoints

### Obtener Todos los Eventos
```
GET /api/eventos
```

### Guardar Todos los Eventos
```
POST /api/eventos
Content-Type: application/json
Authorization: <admin-token>

{
  "eventos": [...]
}
```

### Obtener Evento Específico
```
GET /api/eventos/:id
```

### Actualizar Evento
```
PUT /api/eventos/:id
Content-Type: application/json
Authorization: <admin-token>

{
  "titulo": "Nuevo título",
  ...
}
```

### Eliminar Evento
```
DELETE /api/eventos/:id
Authorization: <admin-token>
```

## Biblioteca de Iconos

### Categorías Disponibles
- **Ceremonias**: Iconos religiosos y ceremoniales
- **Celebración**: Iconos de fiesta y celebración
- **Música**: Instrumentos y elementos musicales
- **Comida**: Alimentos y bebidas
- **Decoración**: Elementos decorativos
- **Transporte**: Medios de transporte
- **Tiempo**: Relojes y calendarios

### Funciones de Búsqueda
- **Búsqueda por Texto**: Filtrar iconos por nombre o descripción
- **Filtrado por Categoría**: Mostrar iconos de categorías específicas
- **Selección Visual**: Vista previa de iconos con descripciones

## Instalación y Configuración

### 1. Verificar Dependencias
Asegúrate de que los siguientes archivos estén presentes:
- `frontend/public/js/eventos-icons.js`
- `frontend/public/js/eventos-admin.js`
- `frontend/public/assets/css/eventos-admin.css`
- `backend/data/eventos.json`

### 2. Acceso al Sistema
1. Navega a `http://localhost:3000/login-i18n.html`
2. Inicia sesión como administrador
3. Accede al panel de administración en `http://localhost:3000/admin-i18n.html`
4. Haz clic en la pestaña "Agenda de Eventos"

### 3. Configuración Inicial
El sistema se carga automáticamente cuando accedes a la pestaña de eventos. Los scripts y estilos se cargan dinámicamente.

## Uso del Sistema

### Crear un Nuevo Evento
1. Haz clic en "Nuevo Evento"
2. Selecciona un icono del selector
3. Completa los campos obligatorios:
   - Título del evento
   - Fecha
   - Hora de inicio y fin
   - Lugar
   - Dirección
4. Opcionalmente añade coordenadas de Google Maps
5. Haz clic en "Crear Evento"

### Añadir Subeventos
1. En un evento existente, haz clic en "Subevento"
2. Completa la información del subevento
3. Los subeventos heredan la fecha del evento principal
4. Guarda el subevento

### Editar Eventos
1. Haz clic en "Editar" en cualquier evento
2. Modifica los campos necesarios
3. Guarda los cambios

### Eliminar Eventos
1. Haz clic en "Eliminar" en el evento
2. Confirma la eliminación
3. El evento y todos sus subeventos se eliminarán

## Características Técnicas

### Frontend
- **JavaScript ES6+**: Código moderno y modular
- **CSS Grid y Flexbox**: Layout responsive
- **Font Awesome**: Iconos profesionales
- **Modales Dinámicos**: Interfaz sin recargas

### Backend
- **Node.js + Express**: API RESTful
- **Almacenamiento JSON**: Datos persistentes
- **Validación de Datos**: Verificación de integridad
- **Autenticación**: Protección con tokens

### Seguridad
- **Validación de Entrada**: Verificación de datos del cliente
- **Autenticación de Admin**: Solo administradores pueden modificar
- **Sanitización**: Limpieza de datos de entrada

## Personalización

### Añadir Nuevos Iconos
1. Edita `frontend/public/js/eventos-icons.js`
2. Añade nuevos iconos al objeto `EVENTOS_ICONS`
3. Opcionalmente, añádelos a una categoría en `ICON_CATEGORIES`

### Modificar Estilos
1. Edita `frontend/public/assets/css/eventos-admin.css`
2. Los estilos usan variables CSS para consistencia
3. Diseño responsive incluido

### Extender Funcionalidad
1. Modifica `frontend/public/js/eventos-admin.js`
2. Añade nuevos métodos a la clase `EventosAdmin`
3. Actualiza los endpoints del servidor si es necesario

## Solución de Problemas

### Error: "Biblioteca de iconos no cargada"
- Verifica que `eventos-icons.js` esté presente
- Revisa la consola del navegador para errores

### Error: "Contenedor de eventos no encontrado"
- Asegúrate de estar en la pestaña correcta
- Verifica que `admin-i18n.html` esté actualizado

### Error de Conexión con el Servidor
- Verifica que el servidor esté ejecutándose
- Comprueba que los endpoints estén disponibles
- Revisa los logs del servidor

### Problemas de Autenticación
- Verifica que el token de administrador sea válido
- Asegúrate de estar logueado como administrador

## Mejoras Futuras

### Funcionalidades Planificadas
- **Importación/Exportación**: Backup y restauración de datos
- **Plantillas**: Eventos predefinidos para bodas
- **Notificaciones**: Alertas para eventos próximos
- **Integración con Calendario**: Sincronización con Google Calendar
- **Fotos de Eventos**: Galería de imágenes por evento
- **Comentarios**: Sistema de notas por evento

### Optimizaciones Técnicas
- **Caché**: Mejora de rendimiento
- **Compresión**: Reducción de tamaño de archivos
- **Lazy Loading**: Carga diferida de componentes
- **PWA**: Aplicación web progresiva

## Soporte

Para soporte técnico o preguntas sobre el sistema:
- Revisa este documento
- Consulta los logs del navegador y servidor
- Verifica la configuración de archivos

---

**Desarrollado para la Boda de Iluminada y George**  
*Sistema de Gestión de Eventos v1.0*
