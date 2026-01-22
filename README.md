# Room Management System

Complete three-layer architecture solution with ASP.NET Core API backend and React frontend for managing room bookings.

## Project Structure

```
RoomManagement/
├── Backend/
│   └── RoomManagementAPI/
│       ├── Models/          # Data models
│       ├── Presentation/    # Controllers
│       ├── Business/        # Services & interfaces
│       ├── Data/            # Repositories & interfaces
│       └── Program.cs       # Entry point
└── Frontend/
    └── room-management-app/
        ├── src/
        │   ├── components/  # React components
        │   ├── services/    # API services
        │   ├── pages/       # Page components
        │   └── main.jsx     # Entry point
        └── package.json
```

## Tech Stack

### Backend
- ASP.NET Core 8.0
- C#
- Three-Layer Architecture
- Dependency Injection
- Async/Await pattern

### Frontend
- React 18
- Vite
- CSS3
- Fetch API

## Features

- ✅ Create rooms
- ✅ Read/View all rooms
- ✅ Update room details
- ✅ Delete rooms
- ✅ Form validation
- ✅ Error handling
- ✅ Real-time UI updates
- ✅ Responsive design

## Quick Start

### Backend Setup

```bash
cd Backend/RoomManagementAPI
dotnet restore
dotnet run
```

API runs on: `http://localhost:5000`

### Frontend Setup

```bash
cd Frontend/room-management-app
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

## API Documentation

Swagger UI available at: `http://localhost:5000/swagger` (when running locally)

## Future Enhancements

- Add database integration (SQL Server/PostgreSQL)
- User authentication & authorization
- Room availability calendar
- Booking system
- User roles and permissions
- Email notifications
- Advanced filtering and search
