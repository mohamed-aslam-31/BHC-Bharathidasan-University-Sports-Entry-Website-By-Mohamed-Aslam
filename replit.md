# BHC Sports Entry

A student sports data management system for Bharathidasan University — Sports Division.

## Stack
- **Frontend**: React 18 + Vite (port 5000), React Router, Tailwind CSS
- **Backend**: Express.js (port 3001), Mongoose/MongoDB
- **Database**: In-memory MongoDB by default (resets on restart); connect a persistent Atlas instance via `MONGODB_URI` secret

## How to run
`npm run dev` starts both the Express API (port 3001) and the Vite dev server (port 5000) concurrently. The Vite dev server proxies `/api` and `/uploads` to the backend automatically.

## Default credentials
- **Username**: `admin`
- **Password**: `admin123`

The server auto-creates this admin account and seeds 10 sample students on first start.

## Persistent data (optional)
Add a `MONGODB_URI` Replit Secret pointing to a MongoDB Atlas cluster to persist data across restarts. Without it the app uses an in-memory database that resets each time the server restarts.

## Project structure
```
server.js          Express API + Mongoose models
client/            React frontend (Vite)
  src/
    pages/         Route-level page components
    components/    Shared UI components
    contexts/      React context (auth, etc.)
    api/           Axios API helpers
uploads/           Uploaded student photos (served by Express)
```

## User preferences
<!-- Add any remembered preferences here -->
