

# Wedding Web · George & Iluminada

## Quick Start (local)
- Requirements: Node 18+, Docker (optional, for local MongoDB), or a MongoDB URI (Atlas/local)
- 1) Copy env template: cp env-vercel.example .env and edit as needed (at least MONGODB_URI, JWT_SECRET). Defaults work for local mongodb://127.0.0.1:27017
- 2) Install deps: npm install
- 3) Start: npm start (serves http://localhost:3000)
- 4) Visit: http://localhost:3000/index.html → Login → guests.html
- Optional: use ./start-server.sh (macOS/Linux) or start-server.bat/ps1 (Windows)

Quick index:
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
- Guests: login by email, guest profile, menu selection, messages, gift list.
- Admin: manage guests and other entities (extensible), JWT authentication.
- Modular backend with Express + MongoDB (Mongoose) and JWT.

## 📁 Project structure (current)
```
boda-web/
├─ public/            # client static files (HTML, CSS, JS, assets, locales)
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
├─ scripts/           # local utilities (e.g., DB: inspect, clean)
├─ infra/             # local infrastructure
│  └─ docker-compose.yml  # local MongoDB
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

# Stripe (only required if you enable payments/donations)
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
- One Admin user (collection `admins`) with `email` and `password` (plaintext for current compatibility).
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
   - `server/data/invitados.json`
   ```json
   [
     { "nombre": "Juan Pérez", "email": "juan@example.com" }
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
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const {Admin,Guest}=require('./server/models'); (async()=>{ await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',{dbName:process.env.MONGODB_DB||'boda-web'}); await Admin.updateOne({email:'admin@example.com'},{email:'admin@example.com',password:'admin123'},{upsert:true}); await Guest.updateOne({email:'juan@example.com'},{nombre:'Juan Pérez',email:'juan@example.com'},{upsert:true}); console.log('Seed OK'); await mongoose.connection.close(); process.exit(0); })().catch(e=>{console.error(e);process.exit(1);});"
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
  { $set: { nombre: 'Juan Pérez', email: 'juan@example.com' } },
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

## 🔐 API and authentication
- Login: `POST /api/login`  { email, password? }
  - Guest: email without password → returns `{ token, tipo:"invitado" }`.
  - Admin: email + password → `{ token, tipo:"admin" }`.
- Guest profile: `GET /api/invitado` with `Authorization: Bearer <token>` (guest role).
- Guest administration (admin role):
  - `GET /api/invitados`
  - `POST /api/invitados`
  - `PUT /api/invitados/:id`
  - `DELETE /api/invitados/:id`

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

## 📄 Notes
- This README replaces the older scattered documents: ESQUEMA_DISENO_PROYECTO.md, ESTRATEGIA_ESTILOS_CENTRALIZADOS.txt, ESTRUCTURA_SITIO_WEB.txt, GUIA_ESTILOS_BODA_WEB.txt, README-GESTION-EVENTOS.md, STRIPE_SETUP.md, and STRIPE_WEBHOOKS_SETUP.md.
- If you need to recover any detail, check the Git history prior to this consolidation.
