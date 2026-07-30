# BHC Sports Entry

Student sports data management system for Bharathidasan University — Sports Division.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS (port 5000)
- **Backend**: Node.js + Express + Mongoose (port 3001)
- **Database**: In-memory MongoDB (data resets on server restart)

## Running the app

The workflow `Start application` runs `npm run dev`, which concurrently starts:
1. The Express API server on port 3001
2. The Vite dev server on port 5000 (proxies `/api` and `/uploads` to port 3001)

The preview pane connects to port 5000.

## Default login

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |

On first start the server seeds 10 sample students automatically.

## Secrets

| Secret           | Purpose                                    |
|------------------|--------------------------------------------|
| `SESSION_SECRET` | JWT signing key (already set)              |
| `MONGODB_URI`    | Optional — connect a persistent MongoDB Atlas instance instead of in-memory |

> **Note**: Without `MONGODB_URI`, all data is stored in-memory and lost on server restart.

## User preferences

_None recorded yet._
