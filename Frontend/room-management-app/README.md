# Room Management Frontend

React-based frontend for the Room Management System.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will start on `http://localhost:3000`

## Build

```bash
npm run build
```

## Features

- Create, Read, Update, Delete (CRUD) rooms
- Real-time table view of all rooms
- Form validation
- Error and success messages
- Responsive UI

## API Configuration

Update the `API_BASE_URL` in `src/services/roomService.js` if your backend is running on a different port or host.

Default: `http://localhost:5000/api`
