# BHC Sports Entry

Student sports data management system for Bharathidasan University — Sports Division.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS (port 5000)
- **Backend:** Node.js + Express (port 3001)
- **Database:** MongoDB via Mongoose (defaults to in-memory; set `MONGODB_URI` secret to persist data)
- **Auth:** JWT (secret read from `SESSION_SECRET` env var)

## How to run

```
npm run dev
```

This starts both the Express API (port 3001) and the Vite dev server (port 5000) concurrently. The Vite server proxies `/api` and `/uploads` requests to the backend.

## Default credentials

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |

The server seeds this account and 10 sample students on first boot.

## Data persistence

By default the server uses an **in-memory MongoDB** instance — all data resets on restart. To persist data across restarts, add a `MONGODB_URI` Replit Secret pointing to a MongoDB Atlas (or other hosted) cluster.

## Key directories

- `client/src/` — React app source
- `client/src/pages/` — route-level page components
- `client/src/components/` — shared UI components
- `server.js` — Express API, Mongoose models, all route handlers
- `uploads/` — user-uploaded files (Aadhaar PDFs, ID cards, marksheets, fee receipts, avatars)

## User preferences
