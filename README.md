# Wedding Web · George & Iluminada

## Quick Start (local)
- Requirements: Node 18+, Docker (optional, for local MongoDB), or a MongoDB URI (Atlas/local)
- 1) Copy env template: cp env-vercel.example .env and edit as needed (at least MONGODB_URI, JWT_SECRET). Defaults work for local mongodb://127.0.0.1:27017
- 2) Install deps: npm install
- 3) Start: npm start (serves http://localhost:3000)
- 4) Visit: http://localhost:3000/index.html → Login → guests.html
- Optional: use ./start-server.sh (macOS/Linux) or start-server.bat/ps1 (Windows)

# Quick index:
- Overview and features
- Project structure
- Setup and run
- Environment variables (.env template)
- Minimum required database data (bootstrap)
- Data migration to MongoDB
- API and authentication
- Frontend and Authorization headers
- Design system (colors, typography, components)
- Styling strategy and site structure
- Stripe (setup, variables, and webhooks)

## ✨ Overview
- Guests: login by email → guest profile, event attendance, menu selection, messages, gift registry.
- Admin: manage guests, events, menus, messags, gift registry, and global settings
- JWT authentication.
- Modular backend with Express + MongoDB (Mongoose) and JWT.

## 📁 Project structure
```
boda-web/
├─ public/            # client static files (HTML, CSS, JS, assets, locales)
├─ scripts/           # local utilities (e.g., DB: inspect, clean)
├─ server/            # Node code (auth, api, protected views)
│  ├─ auth/           # auth handlers, JWT/session utils
│  ├─ api/            # API routes (CRUD, etc.)
│  ├─ views/          # protected HTML pages (admin UI)
│  ├─ config/         # env, connections, etc.
│  ├─ models/         # Mongoose models
│  ├─ middleware/     # middlewares (auth, error, etc.)
│  ├─ utils/          # server utilities
│  ├─ app.js          # Express app
│  └─ server.js       # server bootstrap
├─ start-server.sh | start-server.bat | start-server.ps1
├─ env-vercel.example
└─ README.md (this file)
```

## 🚀 Setup and run
1) Environment variables: create a `.env` file in the repo root (see template below).
2) Install and start:
- Linux/macOS: `./start-server.sh` (auto-starts MongoDB on macOS if Docker/Homebrew are available)
- Windows: `start-server.bat` or `start-server.ps1`
3) Served at: `http://localhost:${PORT || 3000}`

## 🔧 Environment variables (.env template)
Copy and paste the following into a new `.env` file at the project root. Adjust values for your environment.

```
# Environment
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# MongoDB
# In development, the script can start a local Docker container on macOS if not defined.
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=boda-web

# JWT (authentication)
# Change this secret in production.
JWT_SECRET=dev-secret-change-me

# Stripe (only required if you enable payments)
# Stripe secret key (test or live). Required for server-side operations with Stripe.
STRIPE_SECRET_KEY=sk_test_xxx
# Optional: publishable key for the frontend, if you integrate Stripe Elements/Checkout on the client.
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
# Optional: webhook secret if you configure webhooks.
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Notes:
- In production, `MONGODB_URI` and `JWT_SECRET` are mandatory (the backend requires them). `STRIPE_SECRET_KEY` is mandatory if you use payment-related features.
- In development, if you don't set `MONGODB_URI` and you're on macOS, `start-server.sh` will try to spin up a local MongoDB via Docker/Homebrew.

## 🧪 Minimum required data in the database (bootstrap)
To get the site running in a minimally functional state, you need at least:
- One Admin user (collection `admins`) with `email` and `password`.
- At least one Guest (collection `guests`) with `email` and, optionally, `name`.

There are several ways to create this initial data:

### Option A) Use the migration script with simple JSON files
1. Create directory `server/data` (if it doesn't exist).
2. Create files with minimal content:
   - `server/data/admin.json`
   ```json
   [
     { "email": "admin@example.com", "password": "admin123" }
   ]
   ```
   - `server/data/guests.json`
   ```json
   [
     { "name": "Juan Pérez", "email": "juan@example.com" }
   ]
   ```
3. Run the migration:
```
node scripts/inspect-db.js
```
This will list the existing collections in your MongoDB database.

### Option B) Seed data with a Node one-liner (no JSON files)
With your `.env` configured and MongoDB running, execute:
```
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const {Admin,Guest}=require('./server/models'); (async()=>{ await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',{dbName:process.env.MONGODB_DB||'boda-web'}); await Admin.updateOne({email:'admin@example.com'},{email:'admin@example.com',password:'admin123'},{upsert:true}); await Guest.updateOne({email:'juan@example.com'},{name:'Juan Pérez',email:'juan@example.com'},{upsert:true}); console.log('Seed OK'); await mongoose.connection.close(); process.exit(0); })().catch(e=>{console.error(e);process.exit(1);});"
```

### Option C) Use the MongoDB shell
In `mongosh`:
```
use boda-web

db.admins.updateOne(
  { email: 'admin@example.com' },
  { $set: { email: 'admin@example.com', password: 'admin123' } },
  { upsert: true }
)

db.guests.updateOne(
  { email: 'juan@example.com' },
  { $set: { name: 'Juan Pérez', email: 'juan@example.com' } },
  { upsert: true }
)
```

### Test the minimum flow
1) Login as guest (no password):
```
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"juan@example.com"}'
```
2) Use the token to access `/api/invitado`:
```
TOKEN=... # paste the received token
curl -s http://localhost:3000/api/invitado -H "Authorization: Bearer $TOKEN"
```
3) Login as admin (with password):
```
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🔄 Database utilities
- Inspect collections: `node scripts/inspect-db.js`
- Clean collections or DROP DB: `node scripts/clean-db.js [--drop] [--force]`
- Seed example data (non‑production): `node scripts/seed-db.js` (use `--force` to clean then seed)

Seeding behavior:
- On server start in non‑production, the app auto-seeds if collections are empty.
  - Guests: `guests.json`.
  - Events: `events.json`.
  - Messages: `messages.json`.
  - Menu: `menu.json`.
  - Cash gift cards: `cash-gift-cards.json`.
  - Config: `config.json`.

Schema compatibility notes:
- Guests: Spanish fields like `name`, `estado`/`asistencia`, `acompañantes`, `menuEspecial` and `notas` are mapped to the new schema fields (`name`, `status`, `companions`, `specialMenu`, `message`).
- Events: Localized strings are mapped; dates from `fecha` are parsed; `hora` goes into `time`.
- Messages: `mensaje` → `content`; reactions map preserved; `fecha` mapped to timestamps.

## 🌐 Frontend
- When calling authenticated endpoints, send the header: `Authorization: Bearer <token>`.
- Static files are served from `public/`.

## 🎨 Design system (consolidated)
- Main palette:
  - Primary #8B5A96 (soft purple)
  - Secondary #D4A5A5 (pale pink)
  - Accent #F4E4D6 (warm beige)
  - Dark text #2C1810, light text #6B4E3D, white #FFFFFF, light background #FDFBF7
- Available gradients: primary, secondary, accent (135deg)
- Typography: Headings = Playfair Display; Body = Inter
- Size guide: H1 3.5rem, H2 2.5rem, H3 1.8rem, H4 1.3rem
- Components: Gradient header, rounded buttons, cards with soft shadow, forms with purple focus
- Effects: 0.3s transitions, rgba(139,90,150, .1/.2) shadows, optional decorative cursor
- Responsive: breakpoints mobile ≤768, tablet ≤1024, desktop ≥1025
- Suggested CSS variables in :root (see public/assets/css)

## 🧩 Styling strategy and site structure (consolidated)
- Centralized styles via CSS variables (colors, typography, spacing) for quick changes.
- Layout using Flexbox/Grid with breakpoint adaptations.
- Main sections: Hero, Forms, Lists, Modals.
- Interactive states: uniform hover/focus/active.
- Quick change guide: use variables for global tweaks; modify specific rules for moderate changes; partial redesigns for complex changes.

## 💳 Stripe (setup, variables, and webhooks)
- The `STRIPE_SECRET_KEY` is loaded from `.env`. It is required only if you enable payment/donation-related features (e.g., cash gifts). If you don't set it, the server starts but those features should be disabled or will fail with a clear message.
- If you integrate Stripe on the frontend, use `STRIPE_PUBLISHABLE_KEY` on the client (do not share the secret key).
- For webhooks, configure `STRIPE_WEBHOOK_SECRET` and point Stripe to your public endpoint (e.g., via ngrok or a cloud deployment).

# 🔐 Wedding API Specification - Updated

API for the wedding guest & admin portals.

- **Base URL**: `/api`
- **Auth**: JWT in `Authorization: Bearer <token>`
- **Roles**: `guest`, `admin`
- **Namespaces**:
  - Guest portal: `/api/guest/...`
  - Admin portal: `/api/admin/...`
- **Legacy Support**: Some legacy routes exist for backward compatibility (e.g., `/api/invitado`)

---

## 1. Authentication

### `POST /api/login`

Authenticate a user as guest or admin based on whether a password is provided.

**Request body**

    {
      "email": "string",
      "password": "string | null"
    }

**Behaviour**

- **Guest login**: email only (no password)  
  Returns a guest token.
- **Admin login**: email + password  
  Returns an admin token.

**Response (both cases)**

    {
      "token": "jwt-string",
      "type": "guest | admin"
    }

Use the token in all subsequent calls:

    Authorization: Bearer <token>

---

## 2. Guest Portal API

All endpoints require a valid **guest** token.

Base path: `/api/guest`

### 2.1 Guest Profile & Party

#### `GET /api/guest/profile`

Returns information about the primary guest associated with the token.

**Response**
```json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
```

Notes:
- The primary guest is the one who logs in and owns the party.

#### `GET /api/guest/party`

Returns all members of the guest's party.

**Response**
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

Notes:
- `primary: true` for the primary guest.
- Adults are guests over 18 (`adult: true`).
- Party members may be matched server-side using case-insensitive, whitespace-insensitive names.
- The primary guest is automatically added to the list of party members by the server

#### `PUT /api/guest/party`

Replace/update the full party for this guest.

**Request body**
```json
[
  {
    "id": "string | null",
    "name": "string",
    "adult": true
  }
]
```

- `id` may be `null` for new party members.
- Guest must not be included in the list of party members, it is automatically appended by the server.

**Response**
- Same as `GET /api/guest/party`.

### 2.2 Events

#### `GET /api/guest/events`

List of events configured by the couple.

**Response**
```json
[
  {
    "id": "string",
    "name": "string",
    "date": "ISO8601",
    "end": "ISO8601",
    "location": "string",
    "locationAddress": "string",
    "locationLatitude": "number | null",
    "locationLongitude": "number | null",
    "title": "string",
    "description": "string | null",
    "image": "string | null",
    "sub_events": [
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

`icon` is one of: "ceremony", "cocktails", "reception", "dancing"

#### `GET /api/guest/event-choices`

Get attendance choices per party member for each event.

**Response**
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

Create or update event attendance choices.

**Request body**
Same shape as the response above.

**Response**
- Updated choices (same shape).

### 2.3 Messages (Guest View)

Messages visible to the guest (announcements, notes, etc.).

#### `GET /api/guest/messages?cursor=&limit=`

Returns a paginated list of messages.

**Response**
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
```

Notes:
- `author` may be `null` for system messages.
- `reacted: true` indicates the current guest has reacted with that emoji.

#### `POST /api/guest/messages`

Guest sends a message (e.g. to the couple).

**Request body**
```json
{
  "body": "string"
}
```

**Response**
- Created message, same shape as items in `GET /api/guest/messages`.

#### `POST /api/guest/messages/:id/reaction`

Set or change the reaction of the current guest to a message.

**Request body**
```json
{
  "emoji": "string"
}
```

**Response**
```json
{
  "status": "ok"
}
```

### 2.4 Menu (Guest Choices)

#### `GET /api/guest/menu`

List menu courses (starters, mains, desserts, etc.) and options (onion soup, salad, steak tartar).

**Response**
```json
[
  {
    "id": "string",
    "course": "starter | main | dessert | drinks",
    "label": "string",
    "selectionRequired": true,
    "selectionIcon": "string",
    "options": [
      {
        "id": "string",
        "courseId": "string",
        "label": "string",
        "image": "string | null",
        "description": "string | null",
        "isVegetarian": false,
        "containsAllergens": false,
        "containsLactose": false,
        "dietaryIcons": "string"
      }
    ]
  }
]
```

#### `GET /api/guest/menu-choices`

Get menu selections per party member.

**Response**
```json
[
  {
    "partyGuestId": "string",
    "choices": [
      {
        "courseId": "string",
        "optionId": "string"
      }
    ],
    "specialRequest": [
      {
        "name": "vegetarian | lactose-intolerant | gluten-intolerant | nut-allergy | other",
        "selected": true
      }
    ],
    "specialRequestDetail": "string | null"
  }
]
```

- `specialRequest` is selected from a set of choices "vegan", "vegetarian", "nut allergy", "other". If other then `specialRequestDetail` is a free text field to describe the special request.

#### `PUT /api/guest/menu-choices`

Update menu selections.

**Request body**
Same shape as the response above.

**Response**
- Updated choices.

### 2.5 Gifts

#### `GET /api/guest/gifts`

List available gift card options.

**Response**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "amount": 100,
    "available": 1,
    "purchased": 0,
    "stock": 1,
    "image": "string | number",
    "imageUrl": "string",
    "priceDisplay": "€100"
  }
]
```

- only shows gifts whose hidden field `enabled` is true.
- `amount` is selected from a fixed set of values `25`, `50`, `100`, `200`, and `500`
- `image` can be an ObjectId reference to database-stored images or a number for legacy images
- `imageUrl` is the URL to access the gift image
- `stock` shows remaining available quantity after accounting for purchases
- `purchased` shows how many have already been purchased

#### `GET /api/guest/gift-choices`

List gifts already donated by this guest.

**Response**
```json
[
  {
    "id": "string",
    "giftId": "string",
    "giftTitle": "string",
    "giftAmount": "number",
    "giftDescription": "string",
    "giftImageUrl": "string",
    "date": "ISO8601",
    "message": "string | null"
  }
]
```

#### `POST /api/guest/create-payment-session`

Create a Stripe checkout session for a specific gift.

**Request body**
```json
{
  "giftId": "string",
  "message": "string | null"
}
```

**Response**
```json
{
  "checkoutUrl": "string",
  "sessionId": "string"
}
```

- when transaction completes successfully then the amount of that gift remaining is decremented by one.

### 2.6 Stripe Webhooks

#### `POST /api/guest/stripe-webhook`

Handle Stripe payment confirmations. No authentication required.

**Note**: This endpoint requires raw body processing for signature verification. Configure in app.js.

---

## 3. Admin Portal API

All endpoints require a valid **admin** token.

Base path: `/api/admin`

### 3.1 Events Management

#### `GET /api/admin/events`

List all events.

**Response**
```json
[
  {
    "id": "string",
    "name": "string",
    "date": "ISO8601",
    "end": "ISO8601",
    "location": "string",
    "locationAddress": "string",
    "locationLatitude": "number | null",
    "locationLongitude": "number | null",
    "title": "string",
    "description": "string | null",
    "image": "string | null",
    "sub_events": [
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

Create a new event.

**Request body**
```json
{
  "name": "string",
  "date": "ISO8601",
  "end": "ISO8601",
  "location": "string",
  "locationAddress": "string",
  "locationLatitude": "number | null",
  "locationLongitude": "number | null",
  "title": "string",
  "description": "string | null",
  "image": "string | null",
  "sub_events": [
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

**Response**
- Created event (with `id`).

#### `PUT /api/admin/events/:id`

Update an existing event.

**Request body**
- Same as `POST /api/admin/events` (full).

#### `DELETE /api/admin/events/:id`

Delete (or soft-delete) an event.

**Response**
```json
{
  "status": "ok"
}
```

#### `POST /api/admin/events/upload-image`

Upload an event image.

**Request**
- `multipart/form-data` with an `image` file field
- Supports JPEG, PNG, GIF, WebP formats (max 5MB)

**Response**
```json
{
  "imageId": "string",
  "contentType": "string",
  "originalName": "string",
  "size": "number"
}
```

### 3.2 Event Image Serving

#### `GET /api/admin/events/:eventId/image`

Retrieve event image data.

**Response**
- Binary image data with appropriate Content-Type headers.

#### `GET /api/admin/events/:eventId/image/thumbnail`

Retrieve event image thumbnail.

**Response**
- Binary image data with appropriate Content-Type headers.

#### `GET /api/admin/images/:imageId`

Retrieve image by ID.

**Response**
- Binary image data with appropriate Content-Type headers.

### 3.3 Guests & Party Management

#### `GET /api/admin/guests?cursor=&limit=`

List all guests (paginated).

**Response**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  ],
  "nextCursor": "string | null"
}
```

#### `POST /api/admin/guests`

Create a new guest (primary).

**Request body**
```json
{
  "name": "string",
  "email": "string"
}
```

**Response**
- Created guest (with `id`).

#### `POST /api/admin/guests/bulk-upload`

Bulk upload multiple guests.

**Request body**
```json
{
  "guests": [
    {
      "name": "string",
      "email": "string"
    }
  ]
}
```

#### `GET /api/admin/guests/:id`

Get a single guest.

**Response**
```json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
```

#### `PUT /api/admin/guests/:id`

Update guest details.

**Request body**
```json
{
  "name": "string",
  "email": "string"
}
```

#### `DELETE /api/admin/guests/:id`

Delete guest and their party.

**Response**
```json
{
  "status": "ok"
}
```

#### `GET /api/admin/guests/:id/party`

Get full party for this guest.

**Response**
Same schema as `/api/guest/party`, but for any chosen guest.

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

Replace/update the guest's party.

**Request body**
Same as the guest-side `PUT /api/guest/party`, but targeting the specified guest, does not include guest themselves:

```json
[
  {
    "id": "string | null",
    "name": "string",
    "adult": true
  }
]
```

**Response**
- Updated party list.

### 3.4 Menu Management

#### `GET /api/admin/courseData`

Get the list of all menu courses.

**Response**
Same schema as `GET /api/guest/menu`:

```json
[
  {
    "id": "string",
    "course": "starter | main | dessert | drinks",
    "label": "string",
    "selectionRequired": true,
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

Create a new menu course.

**Request body**
```json
{
  "course": "starter | main | dessert | drinks",
  "label": "string",
  "selectionRequired": true
}
```

**Response**
- Created menu course (with generated `id`).

#### `PUT /api/admin/courseData/:id`

Update an existing menu course.

**Request body**
```json
{
  "course": "starter | main | dessert | drinks",
  "label": "string",
  "selectionRequired": true
}
```

#### `DELETE /api/admin/courseData/:id`

Delete a menu course.

**Response**
```json
{
  "status": "ok"
}
```

### 3.5 Menu Options Management

#### `GET /api/admin/courseData/:courseId/options`

Get options for a specific menu course.

**Response**
```json
[
  {
    "id": "string",
    "courseId": "string",
    "label": "string",
    "image": "string | null",
    "description": "string | null",
    "isVegetarian": false,
    "containsAllergens": false,
    "containsLactose": false,
    "dietaryIcons": "string"
  }
]
```

#### `GET /api/admin/courseData/:courseId/options/:optionId`

Get a specific menu option by ID.

**Response**
- Same format as items in the options list above.

#### `POST /api/admin/courseData/:courseId/options`

Create a new menu option.

**Request body**
```json
{
  "label": "string",
  "image": "string | object",
  "description": "string | null",
  "isVegetarian": false,
  "containsAllergens": false,
  "containsLactose": false
}
```

#### `PUT /api/admin/courseData/:courseId/options/:optionId`

Update an existing menu option.

**Request body**
```json
{
  "label": "string",
  "image": "string | object | null",
  "description": "string | null",
  "isVegetarian": false,
  "containsAllergens": false,
  "containsLactose": false
}
```

#### `DELETE /api/admin/courseData/:courseId/options/:optionId`

Delete a menu option.

**Response**
```json
{
  "status": "ok"
}
```

#### `POST /api/admin/menu-options/upload-image`

Upload an image for menu options.

**Request**
- `multipart/form-data` with an `image` file field
- Supports JPEG, PNG, GIF, WebP formats (max 5MB)

**Response**
```json
{
  "imageId": "string",
  "contentType": "string",
  "originalName": "string",
  "size": "number"
}
```

### 3.6 Menu Overview

#### `GET /api/admin/course-choices`

Overview of menu selections per guest.

**Response**
```json
[
  {
    "guestId": "string",
    "guestName": "string",
    "partyGuestId": "string",
    "partyGuestName": "string",
    "choices": [
      {
        "courseId": "string",
        "optionId": "string | null"
      }
    ],
    "specialRequest": "string | null",
    "specialRequestDetail": "string | null"
  }
]
```

- `specialRequest` is selected from a set of choices "vegan", "vegetarian", "nut allergy", "other". If other then `specialRequestDetail` is a free text field to describe the special request.

### 3.7 Messages (Admin Console)

#### `GET /api/admin/messages?cursor=&limit=`

List all messages (guest and admin/system), paginated.

**Response**
Same message schema as guest messages but includes all messages.

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

Create a new message (e.g. announcement).

**Request body**
```json
{
  "body": "string"
}
```

**Response**
- Created message object.

#### `POST /api/admin/messages/:id/reaction`

Add or change an admin reaction to a message.

**Request body**
```json
{
  "emoji": "string"
}
```

#### `PUT /api/admin/messages/:id`

Edit a message.

**Request body**
```json
{
  "body": "string"
}
```

#### `DELETE /api/admin/messages/:id`

Delete a message.

**Response**
```json
{
  "status": "ok"
}
```

### 3.8 Gifts Management

#### `GET /api/admin/gifts`

Get list of all defined gifts.

**Response**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "amount": 100,
    "available": 1,
    "purchased": 0,
    "image": "string | null",
    "priceDisplay": "€100"
  }
]
```

- only shows gifts whose hidden field `enabled` is true. (set to false when deleted)
- `amount` is selected from a fixed set of values `25`, `50`, `100`, `200`, and `500`
- `image` can be an ObjectId reference to database-stored images
- the number of these gifts that are still available

#### `POST /api/admin/gifts`

Create a new gift.

**Request body**
```json
{
  "title": "string",
  "description": "string",
  "amount": 100,
  "available": 1,
  "image": "string | object"
}
```

**Response**
- Created gift (with `id`).

#### `PUT /api/admin/gifts/:id`

Update an existing gift.

**Request body**
```json
{
  "title": "string",
  "description": "string",
  "amount": 100,
  "available": 4,
  "image": "string | object | null"
}
```

#### `DELETE /api/admin/gifts/:id`

Soft-delete a gift (e.g. hidden field `enabled = false`).

**Response**
```json
{
  "status": "ok"
}
```

#### `POST /api/admin/gifts/upload-image`

Upload a gift image.

**Request**
- `multipart/form-data` with an `image` file field
- Supports JPEG, PNG, GIF, WebP formats (max 5MB)

**Response**
```json
{
  "imageId": "string",
  "contentType": "string",
  "originalName": "string",
  "size": "number"
}
```

#### `GET /api/admin/gift-images`

Get list of legacy gift card images (will be removed).

**Response**
```json
[
  {
    "number": 1,
    "name": "image_01.jpg",
    "url": "/assets/images/gift-cards/image_01.jpg"
  }
]
```

### 3.9 Gift Image Serving

#### `GET /api/admin/gifts/:giftId/image`

Retrieve gift image data.

**Response**
- Binary image data with appropriate Content-Type headers.

#### `GET /api/admin/gifts/:giftId/image/thumbnail`

Retrieve gift image thumbnail.

**Response**
- Binary image data with appropriate Content-Type headers.

#### `GET /api/admin/gift-images/:imageId`

Retrieve gift image by ID.

**Response**
- Binary image data with appropriate Content-Type headers.

### 3.10 Gift Choices Overview

#### `GET /api/admin/gift-choices`

List all gift choices/donations grouped by guest.

**Response**
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

### 3.11 Settings / Feature Toggles

#### `GET /api/admin/settings`

Returns frontend feature toggles. (Public endpoint - no auth required)

**Response**
```json
{
  "guestsEnabled": true,
  "eventsEnabled": true,
  "menuEnabled": true,
  "messagesEnabled": true,
  "giftsEnabled": true
}
```

#### `PUT /api/admin/settings`

Update feature toggles.

**Request body**

```json
{
  "guestsEnabled": true,
  "eventsEnabled": true,
  "menuEnabled": false,
  "messagesEnabled": false,
  "giftsEnabled": false
}
```

**Response**
- Updated settings:

```json
{
  "guestsEnabled": true,
  "eventsEnabled": true,
  "menuEnabled": false,
  "messagesEnabled": false,
  "giftsEnabled": false
}
```

---

## 4. Legacy Routes

For backward compatibility, the following legacy routes still exist:

### 4.1 Guest Legacy Routes

#### `GET /api/invitado` 
Legacy Spanish route for guest profile. Same as `/api/guest/profile`.

#### `GET /api/messages`
Public list of messages (using guest endpoint for backwards compatibility).

#### `POST /api/messages`
Guests can create messages.

#### `POST /api/messages/:id/reaction`
Guests can toggle a reaction on a message.

#### `GET /api/event`
Public agenda endpoint with language negotiation.

#### `GET /api/events`
Simple event admin endpoints.

#### `POST /api/events`
Create events (admin only).

---

## 5. Global Conventions

- **Auth**:  
  `Authorization: Bearer <jwt>`

- **Roles**:  
  Encoded in JWT (`guest` vs `admin`); backend enforces access to `/api/guest/*` and `/api/admin/*`.

- **Pluralization**:  
  Collections use plural resource names (e.g. `/guests`, `/gifts`, `/events`, `/messages`).

- **Dates**:  
  ISO 8601 strings, e.g. `"2026-06-06T17:00:00Z"`.

- **Pagination**:  
  For large lists (messages, guests), use cursor-based pagination:

```http
GET /api/.../resource?cursor=<cursor>&limit=<n>
```

  Responses:

```json
{
  "items": [ /* ... */ ],
  "nextCursor": "string | null"
}
```

- **Image References**:  
  Images can be stored either as:
  - ObjectId references to database-stored images
  - Numeric indices for legacy static images
  - Base64 data URLs for inline images

- **Errors** (example format):

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