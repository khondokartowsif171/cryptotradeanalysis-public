# Aura CryptoX — Coolify Deployment Guide

## Architecture

```
Frontend (Vercel)
  └── https://cryptox.auraajenticai.cloud

Backend API (Coolify)
  └── https://api.auraajenticai.cloud (your subdomain)
       ├── /api/auth/*       → Auth (register/login)
       ├── /api/watchlist/*  → User watchlist persistence
       ├── /api/portfolio/*  → User portfolio persistence
       ├── /api/subscribe    → Email subscriptions
       ├── /api/news         → Cached news from n8n
       └── /api/signals      → AI trading signals

Databases (Coolify)
  ├── PostgreSQL → Users, watchlists, portfolios, subscribers
  └── MongoDB    → News cache, signals, price alerts

n8n (Coolify)
  ├── News Fetcher (every 30 min)
  ├── Price Alert (every 5 min → Telegram)
  └── RSI Signal Generator (every 1 hour)
```

---

## Step 1: Deploy PostgreSQL

1. Coolify Dashboard → **Databases** → **New Database**
2. Type: **PostgreSQL**
3. Name: `cryptox-pg`
4. User: `cryptox`
5. Password: generate a strong one
6. Database: `cryptox`
7. **Create**

**Note the internal URL** — you'll need it: `postgresql://cryptox:PASSWORD@cryptox-pg:5432/cryptox`

## Step 2: Deploy MongoDB

1. Coolify → **Databases** → **New Database**
2. Type: **MongoDB**
3. Name: `cryptox-mongo`
4. **Create**

**Note the internal URL**: `mongodb://cryptox-mongo:27017`

## Step 3: Deploy Backend API

1. Coolify → **Services** → **New Service**
2. Source: **Git** → Choose `cryptotradeanalysis` repo
3. Build pack: **Docker**
4. Dockerfile location: `/server/Dockerfile`
5. Port: `3001`
6. Name: `cryptox-api`
7. Domain: `api.auraajenticai.cloud` (or your preferred subdomain)

**Environment Variables:**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://cryptox:PASSWORD@cryptox-pg:5432/cryptox
MONGO_URL=mongodb://cryptox-mongo:27017
MONGO_DB=cryptox
JWT_SECRET=your-random-64-char-secret-here
```

8. **Deploy**

## Step 4: Initialize Database Schema

After the API is deployed, run:

```bash
# Exec into the API container and run migration
docker exec -it cryptox-api node dist/db/migrate.js
```

Or manually copy the SQL from `server/migrations/001_init.sql` and run in PostgreSQL.

## Step 5: Deploy n8n (if not already running)

1. Coolify → **Services** → **New Service**
2. Type: **n8n**
3. Set env: `MONGO_URL=mongodb://cryptox-mongo:27017`
4. **Deploy**

Then import the workflow JSONs from `n8n-workflows/` folder:
- `news-fetcher.json`
- `price-alert.json`
- `signal-generator.json`

## Step 6: Update Frontend (Vercel)

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL=https://api.auraajenticai.cloud
```

Then redeploy.

---

## Testing

```bash
# Health check
curl https://api.auraajenticai.cloud/api/health

# Register
curl -X POST https://api.auraajenticai.cloud/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}'

# Login
curl -X POST https://api.auraajenticai.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}'
```
