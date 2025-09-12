# 🎉 Sitio Web de Boda - Iluminada & George

Sitio web personalizado para la boda de Iluminada y George, con funcionalidades para invitados y administración.

## ✨ Características

### Para Invitados
- 🔐 **Sistema de login** con email
- 🍽️ **Selección de menú** para la boda
- 📅 **Confirmación de asistencia** a eventos
- 🎁 **Lista de regalos** con reservas
- 💌 **Sistema de mensajes** para los novios
- 🌍 **Soporte multiidioma** (Español, Inglés, Francés, Árabe)

### Para Administración
- 👥 **Gestión de invitados**
- 🎁 **Gestión de lista de regalos**
- 📝 **Gestión de mensajes**
- 📅 **Gestión de agenda**
- 📊 **Estadísticas y reportes**

## 🚀 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU-USUARIO/boda-web.git
   cd boda-web
   ```

2. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```

3. **Iniciar el servidor:**
   ```bash
   npm start
   ```

4. **Acceder al sitio:**
   - Página principal: `http://localhost:3000/`
   - Zona de invitados: `http://localhost:3000/invitados-i18n.html`
   - Panel de administración: `http://localhost:3000/admin-fixed.html`

## 📁 Estructura del Proyecto

```
boda-web/
├── backend/           # Servidor Node.js/Express
│   ├── server.js     # Servidor principal
│   ├── data/         # Archivos JSON con datos
│   └── package.json  # Dependencias del backend
├── frontend/         # Archivos del frontend
│   └── public/       # Archivos estáticos (HTML, CSS, JS)
└── README.md         # Este archivo
```

## 🔧 Tecnologías Utilizadas

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Base de datos:** Archivos JSON
- **Internacionalización:** Sistema i18n personalizado

## 👤 Credenciales de Prueba

### Invitados (solo email):
- josejimenez@example.com
- ilu@ejemplo.com
- mcl@ejemplo.com
- fcojajico@example.com
- mama@ejemplo.com

### Administración:
- Email: `admin@boda.com`
- Contraseña: `admin123`

## 🌐 APIs Disponibles

- `GET /api/regalos` - Obtener lista de regalos
- `POST /api/regalos/reservar` - Reservar un regalo
- `GET /api/agenda` - Obtener agenda de eventos
- `POST /api/agenda/confirmar` - Confirmar asistencia
- `GET /api/menu` - Obtener opciones de menú
- `POST /api/menu/seleccion` - Guardar selección de menú
- `GET /api/mensajes` - Obtener mensajes
- `POST /api/mensajes` - Enviar mensaje

## 📝 Licencia

Este proyecto es privado y personal para la boda de Iluminada y George.

## 👨‍💻 Desarrollador

Desarrollado con ❤️ para celebrar el amor de Iluminada y George.

---

*¡Gracias por visitar nuestro sitio web de boda!* 🎊

