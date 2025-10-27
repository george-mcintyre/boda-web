# Boda Web · George & Iluminada

## Inicio rápido (local)
- Requisitos: Node 18+, Docker (opcional, para MongoDB local), o un URI de MongoDB (Atlas/local)
- 1) Copiar plantilla de env: cp env-vercel.example .env y edítelo según sea necesario (al menos MONGODB_URI, JWT_SECRET). Los valores por defecto funcionan en local con mongodb://127.0.0.1:27017
- 2) Instalar dependencias: npm install
- 3) Iniciar: npm start (sirve http://localhost:3000)
- 4) Visitar: http://localhost:3000/index.html → Login → guests.html
- Opcional: use ./start-server.sh (macOS/Linux) o start-server.bat/ps1 (Windows)

Índice rápido:
- Visión general y características
- Estructura del proyecto (actualizada)
- Configuración y arranque
- Variables de entorno (plantilla .env)
- Datos mínimos necesarios en la base de datos (bootstrap)
- Migración de datos a MongoDB
- API y autenticación
- Frontend y cabeceras de autorización
- Sistema de diseño (colores, tipografías, componentes)
- Estrategia de estilos y estructura del sitio
- Stripe (setup, variables y webhooks)

## ✨ Visión general
- guests: login por email, perfil del invitado, selección de menú, mensajes, lista de regalos.
- Administración: gestión de guests y demás entidades (extensible), autenticación JWT.
- Backend modular con Express + MongoDB (Mongoose) y JWT.

## 📁 Estructura del proyecto (actual)
```
boda-web/
├─ public/            # archivos estáticos del cliente (HTML, CSS, JS, assets, locales)
├─ server/            # código Node (auth, api, vistas protegidas)
│  ├─ auth/           # handlers de autenticación, utils de JWT/sesión
│  ├─ api/            # rutas API (CRUD, etc.)
│  ├─ views/          # páginas HTML protegidas (admin UI)
│  ├─ config/         # env, conexiones, etc.
│  ├─ models/         # modelos Mongoose
│  ├─ middleware/     # middlewares (auth, error, etc.)
│  ├─ utils/          # utilidades del servidor
│  ├─ app.js          # app Express
│  └─ server.js       # arranque del servidor
├─ scripts/           # utilidades locales (p.ej., DB: inspect, clean)
├─ infra/             # infraestructura local
│  └─ docker-compose.yml  # MongoDB local
├─ start-server.sh | start-server.bat | start-server.ps1
├─ env-vercel.example
└─ README.es.md (este archivo)
```

## 🚀 Configuración y arranque
1) Variables de entorno: cree un archivo `.env` en la raíz del repo (vea plantilla debajo).
2) Instalar y arrancar:
- Linux/macOS: `./start-server.sh` (auto‑inicia MongoDB en macOS si Docker/Homebrew están disponibles)
- Windows: `start-server.bat` o `start-server.ps1`
3) Servido en: `http://localhost:${PORT || 3000}`

## 🔧 Variables de entorno (plantilla .env)
Copie y pegue lo siguiente en un nuevo archivo `.env` en la raíz del proyecto. Ajuste valores según su entorno.

```
# Entorno
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# MongoDB
# En desarrollo, el script puede iniciar un contenedor Docker local en macOS si no está definido.
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=boda-web

# JWT (autenticación)
# Cambie este secreto en producción.
JWT_SECRET=dev-secret-change-me

# Stripe (solo necesario si habilita pagos/donaciones)
# Clave secreta de Stripe (test o live). Requerida para operaciones del servidor con Stripe.
STRIPE_SECRET_KEY=sk_test_xxx
# Opcional: clave publicable para el frontend, si integra Stripe Elements/Checkout en cliente.
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
# Opcional: secreto de webhook si configura webhooks.
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Notas:
- En producción, `MONGODB_URI` y `JWT_SECRET` son obligatorios (el backend los exige). `STRIPE_SECRET_KEY` es obligatoria si usa funciones de pago.
- En desarrollo, si no define `MONGODB_URI` y está en macOS, `start-server.sh` intentará levantar un MongoDB local vía Docker/Homebrew.

## 🧪 Datos mínimos necesarios en la base de datos (bootstrap)
Para que el sitio arranque en un estado mínimo funcional, necesita al menos:
- Un usuario Administrador (colección `admins`) con `email` y `password` (texto plano por compatibilidad actual).
- Al menos un Invitado (colección `guests`) con `email` y, opcionalmente, `nombre`.

Existen varias formas de crear estos datos iniciales:

### Opción A) Usar el script de migración con JSONs simples
1. Cree directorio `server/data` (si no existe).
2. Cree los archivos con contenido mínimo:
   - `server/data/admin.json`
   ```json
   [
     { "email": "admin@example.com", "password": "admin123" }
   ]
   ```
   - `server/data/guests.json`
   ```json
   [
     { "nombre": "Juan Pérez", "email": "juan@example.com" }
   ]
   ```
3. Ejecute la migración:
```
node scripts/inspect-db.js
```
Esto listará las colecciones existentes en su base de datos MongoDB.

### Opción B) Sembrar datos con un comando Node (sin archivos JSON)
Con su `.env` configurado y MongoDB en marcha, ejecute:
```
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const {Admin,Guest}=require('./server/models'); (async()=>{ await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',{dbName:process.env.MONGODB_DB||'boda-web'}); await Admin.updateOne({email:'admin@example.com'},{email:'admin@example.com',password:'admin123'},{upsert:true}); await Guest.updateOne({email:'juan@example.com'},{nombre:'Juan Pérez',email:'juan@example.com'},{upsert:true}); console.log('Seed OK'); await mongoose.connection.close(); process.exit(0); })().catch(e=>{console.error(e);process.exit(1);});"
```

### Opción C) Usar la consola de MongoDB
En `mongosh`:
```
use boda-web

db.admins.updateOne(
  { email: 'admin@example.com' },
  { $set: { email: 'admin@example.com', password: 'admin123' } },
  { upsert: true }
)

db.guests.updateOne(
  { email: 'juan@example.com' },
  { $set: { nombre: 'Juan Pérez', email: 'juan@example.com' } },
  { upsert: true }
)
```

### Probar el flujo mínimo
1) Login como invitado (sin contraseña):
```
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"juan@example.com"}'
```
2) Usar el token para acceder a `/api/invitado`:
```
TOKEN=... # pegue el token recibido
curl -s http://localhost:3000/api/invitado -H "Authorization: Bearer $TOKEN"
```
3) Login como admin (con contraseña):
```
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🔄 Utilidades de base de datos
- Inspeccionar colecciones: `node scripts/inspect-db.js`
- Limpiar colecciones o DROPar DB: `node scripts/clean-db.js [--drop] [--force]`
- Sembrar datos de ejemplo (no producción): `node scripts/seed-db.js` (use `--force` para limpiar y luego sembrar)

Comportamiento del seeding:
- Al iniciar el servidor en no‑producción, la app auto‑siembra si las colecciones están vacías.
- El seeder soporta archivos de ejemplo en inglés y español y nombres de campos legacy:
  - Guests: `guests.json`.
  - Events: `events.json`.
  - Messages: `mensajes.json` (o legacy `comentarios.example.json`).
  - Menu: `menu.json`.
  - Cash gift cards: `cash-gift-cards.json`.
  - Config: `config.json`.

Notas de compatibilidad de esquema:
- Guests: campos en español como `nombre`, `estado`/`asistencia`, `acompañantes`, `menuEspecial` y `notas` se mapean al nuevo esquema (`name`, `status`, `companions`, `specialMenu`, `message`).
- Events: se mapean cadenas localizadas; fechas desde `fecha` se parsean; `hora` va a `time`.
- Messages: `mensaje` → `content`; se preserva el mapa de reacciones; `fecha` se mapea a timestamps.

## 🔐 API y autenticación
- Login: `POST /api/login`  { email, password? }
  - Invitado: email sin password → devuelve `{ token, tipo:"invitado" }`.
  - Admin: email + password → `{ token, tipo:"admin" }`.
- Perfil de invitado: `GET /api/invitado` con `Authorization: Bearer <token>` (rol invitado).
- Administración de guests (rol admin):
  - `GET /api/guests`
  - `POST /api/guests`
  - `PUT /api/guests/:id`
  - `DELETE /api/guests/:id`

## 🌐 Frontend
- Al consumir endpoints autenticados, envíe el header: `Authorization: Bearer <token>`.
- Los archivos estáticos se sirven desde `public/`.

## 🎨 Sistema de diseño (consolidado)
- Paleta principal:
  - Primario #8B5A96 (púrpura suave)
  - Secundario #D4A5A5 (rosa pálido)
  - Acento #F4E4D6 (beige cálido)
  - Texto oscuro #2C1810, texto claro #6B4E3D, blanco #FFFFFF, fondo claro #FDFBF7
- Gradientes disponibles: primary, secondary, accent (135deg)
- Tipografías: Títulos = Playfair Display; Texto = Inter
- Tallas guía: H1 3.5rem, H2 2.5rem, H3 1.8rem, H4 1.3rem
- Componentes: Header con gradiente, botones redondeados, tarjetas con sombra suave, formularios con focus púrpura
- Efectos: transiciones 0.3s, sombras rgba(139,90,150, .1/.2), cursor decorativo opcional
- Responsive: breakpoints móvil ≤768, tablet ≤1024, desktop ≥1025
- Variables CSS sugeridas en :root (ver public/assets/css)

## 🧩 Estrategia de estilos y estructura del sitio (consolidado)
- Estilos centralizados vía variables CSS (colores, tipografías, espaciados) para cambios rápidos.
- Layout mediante Flexbox/Grid con adaptaciones por breakpoint.
- Secciones principales: Hero, Formularios, Listas, Modales.
- Estados interactivos: hover/focus/active uniformes.
- Guía rápida de cambios: usar variables para ajustes globales; modificar reglas específicas para cambios moderados; rediseños parciales para cambios complejos.

## 💳 Stripe (setup, variables y webhooks)
- La clave `STRIPE_SECRET_KEY` se carga desde `.env`. Es requerida solo si habilita funciones relacionadas con pagos/donaciones (por ejemplo, regalos en efectivo). Si no la define, el servidor arranca pero esas funciones deberán abstenerse o fallarán con mensaje claro.
- Si integra Stripe en el frontend, use `STRIPE_PUBLISHABLE_KEY` en el cliente (no comparta la clave secreta).
- Para webhooks, configure `STRIPE_WEBHOOK_SECRET` y apunte Stripe a su endpoint público (p. ej. vía ngrok o despliegue en la nube).

## 📄 Notas
- Este README reemplaza los antiguos documentos sueltos: ESQUEMA_DISENO_PROYECTO.md, ESTRATEGIA_ESTILOS_CENTRALIZADOS.txt, ESTRUCTURA_SITIO_WEB.txt, GUIA_ESTILOS_BODA_WEB.txt, README-GESTION-EVENTOS.md, STRIPE_SETUP.md y STRIPE_WEBHOOKS_SETUP.md.
- Si necesita recuperar algún detalle, consulte el historial de Git previo a esta consolidación.
