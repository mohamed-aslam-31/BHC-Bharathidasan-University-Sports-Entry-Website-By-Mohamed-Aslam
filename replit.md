# BHC Sports Entry

A modern student sports data management system for Bharathidasan University, rebuilt in React + Tailwind CSS.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS (white/blue theme, dark mode)
- **Backend**: Express.js + better-sqlite3
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **File uploads**: Multer (stored in `/uploads`)

## Running the app

```bash
npm run dev
```

This starts:
- Express API on port **3001** (internal)
- Vite dev server on port **5000** (proxies `/api` and `/uploads` to Express)

## Default credentials

- Username: `admin`
- Password: `admin123`

## Features

- Login with JWT session
- Student list with filters (roll no, name, game, gender, department, year)
- Student CRUD (create/edit/delete)
- Printable eligibility proforma view
- Admin approval workflow for non-admin submissions
- User account management (admin only)
- Dark mode toggle (persists via localStorage)

## User preferences

- White and blue theme with dark mode support
- Modern, clean UI with Tailwind CSS
