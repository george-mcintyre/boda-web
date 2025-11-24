# Web de Boda · George & Iluminada

## Inicio Rápido (local)
  - Requisitos: Node 18+, Docker (opcional, para MongoDB local), o una URI de MongoDB (Atlas/local)
  - 1)  Copiar plantilla env: `cp env-vercel.example .env` y editar según sea necesario (al menos `MONGODB_URI`, `JWT_SECRET`). Los valores predeterminados funcionan para `mongodb://127.0.0.1:27017` local.
  - 2)  Instalar dependencias: `npm install`
  - 3)  Iniciar: `npm start` (sirve en http://localhost:3000)
  - 4)  Visitar: http://localhost:3000/index.html → Login → guests.html
  - Opcional: usar `./start-server.sh` (macOS/Linux) o `start-server.bat`/`ps1` (Windows)

# Índice rápido:
  - Resumen y características
  - Estructura del proyecto
  - Configuración y ejecución
  - Variables de entorno (plantilla .env)
  - Datos mínimos requeridos en la base de datos (bootstrap)
  - Migración de datos a MongoDB
  - API y autenticación
  - Frontend y cabeceras de Autorización
  - Sistema de diseño (colores, tipografía, componentes)
  - Estrategia de estilos y estructura del sitio
  - Stripe (configuración, variables y webhooks)

## ✨ Resumen
  - Invitados: inicio de sesión por email → perfil de invitado, asistencia a eventos, selección de menú, mensajes, lista de regalos.
  - Admin: gestionar invitados, eventos, menús, mensajes, lista de regalos y configuración global.
  - Autenticación JWT.
  - Backend modular con Express + MongoDB (Mongoose) y JWT.

## 📁 Estructura del proyecto
```
boda-web/
├─ public/            # archivos estáticos del cliente (HTML, CSS, JS, assets, locales)
├─ scripts/           # utilidades locales (ej: BD: inspeccionar, limpiar)
├─ server/            # código Node (auth, api, vistas protegidas)
│  ├─ auth/           # manejadores de auth, utilidades JWT/sesión
│  ├─ api/            # rutas de la API (CRUD, etc.)
│  ├─ views/          # páginas HTML protegidas (UI de admin)
│  ├─ config/         # env, conexiones, etc.
│  ├─ models/         # modelos Mongoose
│  ├─ middleware/     # middlewares (auth, error, etc.)
│  ├─ utils/          # utilidades del servidor
│  ├─ app.js          # app Express
│  └─ server.js       # arranque del servidor
├─ start-server.sh | start-server.bat | start-server.ps1
├─ env-vercel.example
└─ README.md (este archivo)
```

## 🚀 Configuración y ejecución
1)  Variables de entorno: crea un archivo `.env` en la raíz del repositorio (ver plantilla abajo).
2)  Instalar e iniciar:
  - Linux/macOS: `./start-server.sh` (auto-inicia MongoDB en macOS si Docker/Homebrew están disponibles)
  - Windows: `start-server.bat` o `start-server.ps1`
3)  Servido en: `http://localhost:${PORT || 3000}`

## 🔧 Variables de entorno (plantilla .env)
Copia y pega lo siguiente en un nuevo archivo `.env` en la raíz del proyecto. Ajusta los valores para tu entorno.

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
# Cambia este secreto en producción.
JWT_SECRET=dev-secret-change-me

# Stripe (solo requerido si habilitas pagos)
# Clave secreta de Stripe (test o live). Requerida para operaciones del servidor con Stripe.
STRIPE_SECRET_KEY=sk_test_xxx
# Opcional: clave publicable para el frontend, si integras Stripe Elements/Checkout en el cliente.
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
# Opcional: secreto del webhook si configuras webhooks.
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Notas:

  - En producción, `MONGODB_URI` y `JWT_SECRET` son obligatorios (el backend los requiere). `STRIPE_SECRET_KEY` es obligatorio si usas funciones relacionadas con pagos.
  - En desarrollo, si no configuras `MONGODB_URI` y estás en macOS, `start-server.sh` intentará levantar un MongoDB local vía Docker/Homebrew.

## 🧪 Datos mínimos requeridos en la base de datos (bootstrap)
Para que el sitio funcione en un estado mínimamente funcional, necesitas al menos:
  - Un usuario Admin (colección `admins`) con `email` y `password`.
  - Al menos un Invitado (colección `guests`) con `email` y, opcionalmente, `name`.

Hay varias formas de crear estos datos iniciales:

### Opción A) Usar el script de migración con archivos JSON simples
1.  Crea el directorio `server/data` (si no existe).
2.  Crea archivos con contenido mínimo:
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
3.  Ejecuta la migración:
```
node scripts/inspect-db.js
```

Esto listará las colecciones existentes en tu base de datos MongoDB.

### Opción B) Sembrar datos con una sola línea de Node (sin archivos JSON)
Con tu `.env` configurado y MongoDB corriendo, ejecuta:

```
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const {Admin,Guest}=require('./server/models'); (async()=>{ await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',{dbName:process.env.MONGODB_DB||'boda-web'}); await Admin.updateOne({email:'admin@example.com'},{email:'admin@example.com',password:'admin123'},{upsert:true}); await Guest.updateOne({email:'juan@example.com'},{nombre:'Juan Pérez',email:'juan@example.com'},{upsert:true}); console.log('Seed OK'); await mongoose.connection.close(); process.exit(0); })().catch(e=>{console.error(e);process.exit(1);});"
```

### Opción C) Usar la shell de MongoDB
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
1)  Iniciar sesión como invitado (sin contraseña):

```
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"juan@example.com"}'
```

2)  Usar el token para acceder a `/api/invitado`:

```
TOKEN=... # pega el token recibido
curl -s http://localhost:3000/api/invitado -H "Authorization: Bearer $TOKEN"
```

3)  Iniciar sesión como admin (con contraseña):

```
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🔄 Utilidades de base de datos
  - Inspeccionar colecciones: `node scripts/inspect-db.js`
  - Limpiar colecciones o ELIMINAR BD: `node scripts/clean-db.js [--drop] [--force]`
  - Sembrar datos de ejemplo (no producción): `node scripts/seed-db.js` (usa `--force` para limpiar y luego sembrar)

Comportamiento de siembra (seeding):
  - Al iniciar el servidor en entorno no-producción, la app auto-siembra si las colecciones están vacías.
      - Invitados: `guests.json`.
      - Eventos: `events.json`.
      - Mensajes: `messages.json`.
      - Menú: `menu.json`.
      - Tarjetas de regalo en efectivo: `cash-gift-cards.json`.
      - Config: `config.json`.

Notas de compatibilidad de esquema:
  - Invitados: Campos en español como `nombre`, `estado`/`asistencia`, `acompañantes`, `menuEspecial` y `notas` se mapean a los nuevos campos del esquema (`name`, `status`, `companions`, `specialMenu`, `message`).
  - Eventos: Se mapean cadenas localizadas; las fechas de `fecha` se analizan; `hora` va a `time`.
  - Mensajes: `mensaje` → `content`; se preserva el mapa de reacciones; `fecha` mapeada a timestamps.

## 🌐 Frontend
  - Al llamar a endpoints autenticados, enviar la cabecera: `Authorization: Bearer <token>`.
  - Los archivos estáticos se sirven desde `public/`.

## 🎨 Sistema de diseño (consolidado)
  - Paleta principal:
      - Primario #8B5A96 (púrpura suave)
      - Secundario #D4A5A5 (rosa pálido)
      - Acento #F4E4D6 (beige cálido)
      - Texto oscuro #2C1810, texto claro #6B4E3D, blanco #FFFFFF, fondo claro #FDFBF7
  - Degradados disponibles: primario, secundario, acento (135deg)
  - Tipografía: Encabezados = Playfair Display; Cuerpo = Inter
  - Guía de tamaños: H1 3.5rem, H2 2.5rem, H3 1.8rem, H4 1.3rem
  - Componentes: Cabecera con degradado, botones redondeados, tarjetas con sombra suave, formularios con foco púrpura
  - Efectos: transiciones de 0.3s, sombras rgba(139,90,150, .1/.2), cursor decorativo opcional
  - Responsive: puntos de ruptura móvil ≤768, tablet ≤1024, escritorio ≥1025
  - Variables CSS sugeridas en :root (ver public/assets/css)

## 🧩 Estrategia de estilos y estructura del sitio (consolidado)
  - Estilos centralizados vía variables CSS (colores, tipografía, espaciado) para cambios rápidos.
  - Diseño usando Flexbox/Grid con adaptaciones por puntos de ruptura.
  - Secciones principales: Hero, Formularios, Listas, Modales.
  - Estados interactivos: hover/focus/active uniformes.
  - Guía de cambios rápidos: usar variables para ajustes globales; modificar reglas específicas para cambios moderados; rediseños parciales para cambios complejos.

## 💳 Stripe (configuración, variables y webhooks)

  - La `STRIPE_SECRET_KEY` se carga desde `.env`. Solo se requiere si habilitas funciones relacionadas con pagos/donaciones (ej: regalos en efectivo). Si no la configuras, el servidor arranca pero esas funciones deberían estar deshabilitadas o fallarán con un mensaje claro.
  - Si integras Stripe en el frontend, usa `STRIPE_PUBLISHABLE_KEY` en el cliente (no compartas la clave secreta).
  - Para webhooks, configura `STRIPE_WEBHOOK_SECRET` y apunta Stripe a tu endpoint público (ej: vía ngrok o un despliegue en la nube).

# 🔐 Especificación de la API de Boda

API para los portales de invitados y administración de la boda.

  - **URL Base**: `/api`
  - **Auth**: JWT en `Authorization: Bearer <token>`
  - **Roles**: `guest` (invitado), `admin` (administrador)
  - **Espacios de nombres**:
      - Portal de invitados: `/api/guest/...`
      - Portal de administración: `/api/admin/...`

-----

## 1. Autenticación

### `POST /api/login`

Autenticar a un usuario como invitado o administrador basándose en si se proporciona una contraseña.

**Cuerpo de la petición**

```
{
  "email": "string",
  "password": "string | null"
}
```

**Comportamiento**

  - **Inicio de sesión de invitado**: solo email (sin contraseña)
    Devuelve un token de invitado.
  - **Inicio de sesión de admin**: email + contraseña
    Devuelve un token de admin.

**Respuesta (ambos casos)**

```
{
  "token": "jwt-string",
  "type": "guest | admin"
}
```

Usa el token en todas las llamadas subsiguientes:

```
Authorization: Bearer <token>
```

-----

## 2. API del Portal de Invitados

Todos los endpoints requieren un token válido de **guest** (invitado).

Ruta base: `/api/guest`

### 2.1 Perfil del Invitado y Grupo (Party)

#### `GET /api/guest/profile`

Devuelve información sobre el invitado principal asociado con el token.

**Respuesta**

```json
    {
      "id": "string",
      "name": "string",
      "email": "string",
    }
```

Notas:

  - El invitado principal es el que inicia sesión y es el dueño del grupo.

#### `GET /api/guest/party`

Devuelve todos los miembros del grupo del invitado.

**Respuesta**

```json
    [
      {
        "id": "string",
        "name": "string",
        "adult": true,
        "primary": true
      }
    ]
```

Notas:

  - `primary: true` para el invitado principal.
  - Los adultos son invitados mayores de 18 años (`adult: true`).
  - Los miembros del grupo pueden ser emparejados en el servidor usando nombres insensibles a mayúsculas/minúsculas y espacios.
  - El invitado principal se añade automáticamente a la lista de miembros del grupo por el servidor.

#### `PUT /api/guest/party`

Reemplazar/actualizar el grupo completo para este invitado.

**Cuerpo de la petición**

```json
    [
      {
        "id": "string | null",
        "name": "string",
        "adult": true
      }
    ]
```

  - `id` puede ser `null` para nuevos miembros del grupo.
  - el invitado (guest) no debe incluirse en la lista de miembros del grupo, es añadido automáticamente por el servidor.

**Respuesta**

  - Igual que `GET /api/guest/party`.

-----

### 2.2 Eventos

#### `GET /api/guest/events`

Lista de eventos configurados por la pareja.

**Respuesta**

```json
    [
      {
        "id": "string",
        "name": "string",
        "date": "ISO8601",
        "end": "ISO8601",
        "location": "string",
        "title": "string",
        "description": "string | null",
        "image": "string | null",
        "sub_events" : [
          {
            "name": "string",
            "date": "ISO8601",
            "end": "ISO8601",
            "description": "string | null",
            "icon": "string" 
          }
        ]
      }
    ]
```

`icon` es uno de "ceremony", "cocktails", "reception", "dancing"

#### `GET /api/guest/event-choices`

Obtener opciones de asistencia por miembro del grupo para cada evento.

**Respuesta**

```json
    [
      {
        "partyGuestId": "string",
        "choices": [
          {
            "eventId": "string",
            "attending": true
          }
        ]
      }
    ]

```

#### `PUT /api/guest/event-choices`

Crear o actualizar opciones de asistencia a eventos.

**Cuerpo de la petición**

Misma forma que la respuesta anterior:

````json
    [
      {
        "partyGuestId": "string",
        "choices": [
          {
            "eventId": "string",
            "attending": true
          }
        ]
      }
    ]

```**Respuesta**

- Opciones actualizadas (misma forma).


---

### 2.3 Mensajes (Vista de Invitado)

Mensajes visibles para el invitado (anuncios, notas, etc.).

#### `GET /api/guest/messages?cursor=&limit=`

Devuelve una lista paginada de mensajes.

**Respuesta**
```json
    {
      "items": [
        {
          "id": "string",
          "body": "string",
          "createdAt": "ISO8601",
          "author": "string | null",
          "reactions": [
            {
              "emoji": "string",
              "count": 3,
              "reacted": true
            }
          ]
        }
      ],
      "nextCursor": "string | null"
    }

```Notas:

- `author` puede ser `null` para mensajes del sistema.
- `reacted: true` indica que el invitado actual ha reaccionado con ese emoji.


#### `POST /api/guest/messages`

El invitado envía un mensaje (ej: a la pareja).

**Cuerpo de la petición**
```json
    {
      "body": "string"
    }
````

**Respuesta**

  - Mensaje creado, misma forma que los items en `GET /api/guest/messages`.

#### `POST /api/guest/messages/:id/reaction`

Establecer o cambiar la reacción del invitado actual a un mensaje.

**Cuerpo de la petición**

````json
    {
      "emoji": "string"
    }

```**Respuesta**

Confirmación:
```json
    {
      "status": "ok"
    }

````

-----

### 2.4 Menú (Elecciones del Invitado)

#### `GET /api/guest/menu`

Listar partes del menú y opciones (entrantes, principales, postres, etc.).

**Respuesta**

```json
    [
      {
        "id": "string",
        "course": "starter | main | dessert | drinks",
        "label": "string",
        "options": [
          {
            "id": "string",
            "label": "string",
            "image": "string",
            "description": "string | null"
          }
        ]
      }
    ]

```

#### `GET /api/guest/menu-choices`

Obtener selecciones de menú por miembro del grupo.

**Respuesta**

```json
    [
      {
        "partyGuestId": "string",
        "choices": [
          {
            "menuPartId": "string",
            "optionId": "string | null"
          }
        ],
        "specialRequest": "string | null",
        "specialRequestDetail": "string | null"
      }
    ]
```

  - `specialRequest` se selecciona de un conjunto de opciones "vegan", "vegetarian", "nut allergy", "other". Si es "other", entonces `specialRequestDetail` es un campo de texto libre para describir la petición especial.

#### `PUT /api/guest/menu-choices`

Actualizar selecciones de menú.

**Cuerpo de la petición**

Misma forma que la respuesta anterior.

**Respuesta**

  - Opciones actualizadas.

-----

### 2.5 Regalos

#### `GET /api/guest/gifts`

Listar opciones de tarjetas de regalo disponibles.

**Respuesta**

```json
    [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "amount": 100,
        "available": 1,
        "image": 10
      }
    ]
```

  - solo muestra regalos cuyo campo oculto `enabled` es true.
  - `amount` se selecciona de un conjunto fijo de valores `25`, `50`, `100`, `200`, y `500`
  - `image` se selecciona de un conjunto fijo de imágenes que están integradas en el sitio: `/images/gift-cards/image_01.jpg` - `/images/gift-cards/image_30.jpg` solo necesita almacenarse el número ya que el resto de la uri es fija.
  - el número de estos regalos que todavía están disponibles.

#### `GET /api/guest/gift-choices`

Listar regalos ya donados por este invitado.

**Respuesta**

```json
    [
      {
        "giftId": "string",
        "date": "ISO8601",
        "message": "string | null"
      }
    ]
```

#### `POST /api/guest/create-payment-session`

Crear una sesión de pago de Stripe para un regalo específico.

**Cuerpo de la petición**

```json
    {
      "giftId": "string",
      "message": "string | null"
    }
```

**Respuesta**

```json
    {
      "checkoutUrl": "string"
    }

```

  - cuando la transacción se completa exitosamente, la cantidad restante de ese regalo se decrementa en uno.

-----

## 3. API del Portal de Administración

Todos los endpoints requieren un token válido de **admin**.

Ruta base: `/api/admin`

### 3.1 Gestión de Eventos

#### `GET /api/admin/events`

Listar todos los eventos.

**Respuesta**

```json
    [
      {
        "id": "string",
        "name": "string",
        "date": "ISO8601",
        "end": "ISO8601",
        "location": "string",
        "title": "string",
        "description": "string | null",
        "image": "string | null",
        "sub_events" : [
          {
            "name": "string",
            "date": "ISO8601",
            "end": "ISO8601",
            "description": "string | null",
            "icon": "string" 
          }
        ]
      }
    ]
```

#### `POST /api/admin/events`

Crear un nuevo evento.

**Cuerpo de la petición**

```json
    {
      "name": "string",
      "date": "ISO8601",
      "end": "ISO8601",
      "location": "string",
      "title": "string",
      "description": "string | null",
      "image": "string | null",
      "sub_events" : [
        {
          "name": "string",
          "date": "ISO8601",
          "end": "ISO8601",
          "description": "string | null",
          "icon": "string" 
        }
      ]
    }
```

**Respuesta**

  - Evento creado (con `id`).

#### `PUT /api/admin/events/:id`

Actualizar un evento existente.

**Cuerpo de la petición**

  - Igual que `POST /api/admin/events` (completo).

#### `DELETE /api/admin/events/:id`

Eliminar (o borrado lógico) un evento.

**Respuesta**

```json
    {
      "status": "ok"
    }

```

-----

### 3.2 Gestión de Invitados y Grupos

#### `GET /api/admin/guests?cursor=&limit=`

Listar todos los invitados (paginado).

**Respuesta**

```json
    {
      "items": [
        {
          "id": "string",
          "name": "string",
          "email": "string",
        }
      ],
      "nextCursor": "string | null"
    }
```

#### `POST /api/admin/guests`

Crear un nuevo invitado (principal).

**Cuerpo de la petición**

```json
    {
      "name": "string",
      "email": "string",
    }
```

**Respuesta**

  - Invitado creado (con `id`).

#### `GET /api/admin/guests/:id`

Obtener un solo invitado.

**Respuesta**

```json
    {
      "id": "string",
      "name": "string",
      "email": "string",
    }

```

#### `PUT /api/admin/guests/:id`

Actualizar detalles del invitado.

**Cuerpo de la petición**

```json
    {
      "name": "string",
      "email": "string",
    }

```

#### `DELETE /api/admin/guests/:id`

Eliminar invitado y su grupo.

**Respuesta**

```json
    {
      "status": "ok"
    }

```

#### `GET /api/admin/guests/:id/party`

Obtener el grupo completo para este invitado.

**Respuesta**

Mismo esquema que `/api/guest/party`, pero para cualquier invitado elegido, por ejemplo:

```json
    [
      {
        "id": "string",
        "name": "string",
        "adult": true,
        "primary": true
      }
    ]
```

#### `PUT /api/admin/guests/:id/party`

Reemplazar/actualizar el grupo del invitado.

**Cuerpo de la petición**

Igual que el `PUT /api/guest/party` del lado del invitado, pero apuntando al invitado especificado, no incluye al invitado en sí mismo:

```json
    [
      {
        "id": "string | null",
        "name": "string",
        "adult": true
      }
    ]
```

**Respuesta**

  - Lista del grupo actualizada.

-----

### 3.3 Definición y Resumen del Menú

#### `GET /api/admin/courseData`

Obtener la lista de todas las partes del menú.

**Respuesta**

Mismo esquema que `GET /api/guest/menu`:

```json
    [
      {
        "id": "string",
        "course": "starter | main | dessert | drinks",
        "label": "string",
        "options": [
          {
            "id": "string",
            "label": "string",
            "image": "string",
            "description": "string | null"
          }
        ]
      }
    ]
```

#### `POST /api/admin/courseData`

Crear una nueva parte del menú.

**Cuerpo de la petición**

```json
    {
      "course": "starter | main | dessert | drinks",
      "label": "string",
      "options": [
        {
          "label": "string",
          "image": "string",
          "description": "string | null"
        }
      ]
    }
```

**Respuesta**

  - Parte del menú creada (con `id` e `id`s de opciones).

#### `PUT /api/admin/courseData/:id`

Actualizar una parte del menú existente.

**Cuerpo de la petición**

```json
    {
      "course": "starter | main | dessert | drinks",
      "label": "string",
      "options": [
        {
          "id": "string | null",
          "label": "string",
          "image": "string",
          "description": "string | null"
        }
      ]
    }
```

#### `DELETE /api/admin/courseData/:id`

Eliminar una parte del menú.

**Respuesta**

```json
    {
      "status": "ok"
    }
```

#### `GET /api/admin/course-choices`

Resumen de selecciones de menú por invitado.

**Respuesta**

```json
    [
      {
        "guestId": "string",
        "guestName": "string",
        "partyGuestId": "string",
        "partyGuestName": "string",
        "choices": [
          {
            "menuPartId": "string",
            "optionId": "string | null"
          }
        ],
        "specialRequest": "string | null",
        "specialRequestDetail": "string | null"
      }
    ]
```

  - `specialRequest` se selecciona de un conjunto de opciones "vegan", "vegetarian", "nut allergy", "other". Si es "other", entonces `specialRequestDetail` es un campo de texto libre para describir la petición especial.

-----

### 3.4 Mensajes (Consola de Admin)

#### `GET /api/admin/messages?cursor=&limit=`

Listar todos los mensajes (invitado y admin/sistema), paginado.

**Respuesta**

Mismo esquema de mensaje que los mensajes de invitado pero incluye todos los mensajes, por ejemplo:

```json
    {
      "items": [
        {
          "id": "string",
          "body": "string",
          "createdAt": "ISO8601",
          "author": "string | null",
          "reactions": [
            {
              "emoji": "string",
              "count": 3,
              "reacted": false
            }
          ]
        }
      ],
      "nextCursor": "string | null"
    }
```

#### `POST /api/admin/messages`

Crear un nuevo mensaje (ej: anuncio).

**Cuerpo de la petición**

```json
    {
      "body": "string"
    }
```

**Respuesta**

  - Objeto de mensaje creado.

#### `POST /api/admin/messages/:id/reaction`

Añadir o cambiar una reacción de admin a un mensaje.

**Cuerpo de la petición**

```json
    {
      "emoji": "string"
    }
```

#### `PUT /api/admin/messages/:id`

Editar un mensaje.

**Cuerpo de la petición**

```json
    {
      "body": "string"
    }
```

#### `DELETE /api/admin/messages/:id`

Eliminar un mensaje.

**Respuesta**

```json
    {
      "status": "ok"
    }
```

-----

### 3.5 Gestión de Regalos

#### `GET /api/admin/gifts`

Obtener lista de todos los regalos definidos.

**Respuesta**

```json
    [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "amount": 100,
        "available": 1,
        "image": 10
      }
    ]
```

  - solo muestra regalos cuyo campo oculto `enabled` es true. (se establece a false cuando se elimina)
  - `amount` se selecciona de un conjunto fijo de valores `25`, `50`, `100`, `200`, y `500`
  - `image` se selecciona de un conjunto fijo de imágenes que están integradas en el sitio: `/images/gift-cards/image_01.jpg` - `/images/gift-cards/image_30.jpg` solo necesita almacenarse el número ya que el resto de la uri es fija.
  - el número de estos regalos que todavía están disponibles.

#### `POST /api/admin/gifts`

Crear un nuevo regalo.

**Cuerpo de la petición**

```json
    {
      "title": "string",
      "description": "string",
      "amount": 100,
      "available": 1,
      "image": 10
    }
```

**Respuesta**

  - Regalo creado (con `id`).

#### `PUT /api/admin/gifts/:id`

Actualizar un regalo existente.

**Cuerpo de la petición**

```json
    {
      "title": "string",
      "description": "string",
      "amount": 100,
      "available": 4,
      "image": 10
    }
```

#### `DELETE /api/admin/gifts/:id`

Borrado lógico de un regalo (ej: campo oculto `enabled = false`).

**Respuesta**

```json
    {
      "status": "ok"
    }
```

#### `GET /api/admin/gift-choices`

Listar todas las elecciones de regalos/donaciones agrupadas por invitado.

**Respuesta**

```json
    [
      {
        "guestId": "string",
        "guestName": "string",
        "giftId": "string",
        "amount": 100,
        "date": "ISO8601",
        "message": "string | null"
      }
    ]

```

-----

### 3.6 Configuración / Feature Toggles

#### `GET /api/admin/settings`

Devuelve los interruptores de funcionalidad del frontend.

**Respuesta**

```json
    {
      "eventsEnabled": true,
      "guestsEnabled": true,
      "menuEnabled": true,
      "messagesEnabled": true,
      "giftsEnabled": true
    }
```

#### `PUT /api/admin/settings`

Actualizar interruptores de funcionalidad.

**Cuerpo de la petición**

```json
    {
      "eventsEnabled": true,
      "guestsEnabled": true,
      "menuEnabled": false,
      "messagesEnabled": false,
      "giftsEnabled": false
    }
```

**Respuesta**

  - Ajustes actualizados:

```json
    {
      "eventsEnabled": true,
      "guestsEnabled": true,
      "menuEnabled": false,
      "messagesEnabled": false,
      "giftsEnabled": false
    }
```

-----

## 4\. Convenciones Globales

  - **Auth**:  
    `Authorization: Bearer <jwt>`

  - **Roles**:  
    Codificados en JWT (`guest` vs `admin`); el backend fuerza el acceso a `/api/guest/*` y `/api/admin/*`.

  - **Pluralización**:  
    Las colecciones usan nombres de recursos en plural (ej: `/guests`, `/gifts`, `/events`, `/messages`).

  - **Fechas**:  
    Cadenas ISO 8601, ej: `"2026-06-06T17:00:00Z"`.

  - **Paginación**:  
    Para listas grandes (mensajes, invitados), usar paginación basada en cursor:

```http
    GET /api/.../resource?cursor=<cursor>&limit=<n>
```

Respuestas:

```json
    {
      "items": [ /* ... */ ],
      "nextCursor": "string | null"
    }
```

  - **Errores** (formato de ejemplo):
```json
    {
      "error": {
        "code": "INVALID_INPUT",
        "message": "Email is required",
        "details": {
          "field": "email"
        }
      }
    }
```