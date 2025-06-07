# Veeda Wallet Backend API

A backend server built with Hono.js and deployed on Cloudflare Workers to provide API abstraction layer between the frontend and Supabase database.

## Features

- **RESTful API** for transactions, subscriptions, and dashboard data
- **JWT Authentication** middleware
- **CORS support** for cross-origin requests
- **Error handling** and logging
- **Future AI integration** endpoints prepared
- **Cloudflare Workers** deployment ready

## Architecture

```
Frontend (Next.js) → Backend API (Hono.js/Cloudflare Workers) → Supabase Database
```

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify JWT token

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction

### Subscriptions
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription

### Dashboard
- `GET /api/dashboard/summary` - Dashboard summary

## Setup

### Prerequisites
- Node.js 18+
- Cloudflare account
- Supabase project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Cloudflare secrets:
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put JWT_SECRET
```

### Development

```bash
npm run dev
```

### Deployment

```bash
npm run deploy
```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret for JWT token verification

## Security

- JWT token verification for all protected endpoints
- User-scoped data access
- CORS configuration for allowed origins
- Security headers in production
