# SCEMS Admin Frontend

React + TypeScript admin dashboard for the SCEMS (Smart Equipment and Class Management System).

## Setup

```bash
cd Frontend/scems
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

## Build & Deployment

```bash
npm run build  # Creates optimized dist/ folder
npm run preview  # Test production build locally
```

## Tech Stack

- React 18.2.0
- TypeScript 5.3 (strict mode)
- Vite 5.0
- React Router 6.20
- Axios 1.6
- Light mode CSS (no UI framework)

## Features

- JWT authentication with auto-refresh on 401
- Accounts, Rooms, Equipment Types CRUD
- Pagination, search, filtering
- Responsive admin UI with sidebar + header
- Status management (Active/Hidden/Disabled)
- Confirmation dialogs for delete operations
