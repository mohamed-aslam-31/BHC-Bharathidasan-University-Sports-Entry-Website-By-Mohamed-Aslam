# BHC Sports Entry

**Bharathidasan University — Sports Management System**

A full-stack web app for managing student sports registrations, document uploads, and admin approvals.

## Stack

- **Frontend:** React 18 + Vite (port 5000) — `client/`
- **Backend:** Express.js (port 3001) — `server.js`
- **Database:** MongoDB via Mongoose; uses `mongodb-memory-server` (in-memory) by default — data resets on server restart

## Running the app

```
npm run dev
```

This starts both the backend (`node server.js` on port 3001) and the frontend (`vite --port 5000`) concurrently. The Vite dev server proxies `/api` and `/uploads` requests to the backend.

## Default credentials

On first start, a default admin account is seeded automatically:
- **Username:** `admin`
- **Password:** `admin123`

10 sample student records are also seeded.

## Persisting data

By default the app uses an in-memory MongoDB instance (data is lost on restart). To persist data across restarts, add a `MONGODB_URI` secret pointing to a MongoDB Atlas cluster.

## Secrets

| Secret | Purpose |
|--------|---------|
| `SESSION_SECRET` | JWT signing key (already set) |
| `MONGODB_URI` | (Optional) MongoDB Atlas connection string for persistent storage |

## User preferences

<!-- Add user preferences here -->
