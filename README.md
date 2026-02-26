# Room Management System (SCEMS)

A complete three-layer architecture solution with ASP.NET Core API backend and React TypeScript frontend for managing rooms, equipment, teaching schedules, and maintenance.

## Project Structure

```
RoomManagement/
├── Backend/
│   └── SCEMS/
│       ├── SCEMS.Api/           # Presentation Layer (Controllers)
│       ├── SCEMS.Application/   # Business Layer (Services, DTOs, Mapping)
│       ├── SCEMS.Domain/        # Domain Layer (Entities, Enums, Base)
│       └── SCEMS.Infrastructure/# Data Layer (DbContext, Repositories, Migrations)
└── Frontend/
    └── scems/
        ├── src/
        │   ├── components/      # Reusable React components
        │   ├── pages/           # Page components (Admin/User/Security/Security)
        │   ├── services/        # API service clients
        │   ├── context/         # Auth Context & Global State
        │   └── styles/          # Premium CSS with Glassmorphism
        └── vite.config.ts       # Vite configuration
```

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Language**: C#
- **Architecture**: Clean Three-Layer Architecture
- **ORM**: Entity Framework Core
- **Database**: MySQL
- **Authentication**: JWT Token-based (Role-based: Admin, BookingStaff, Lecturer, Student, Guard, AssetStaff)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Custom tokens, Dark Mode, Micro-animations)
- **Icons**: Lucide React

## Key Features

### Core Management
- ✅ **Accounts**: CRUD for users with specific roles and status.
- ✅ **Rooms & Equipment**: Manage room types, equipment inventory, and room-equipment mapping.
- ✅ **Classes**: Manage academic classes and student enrollments.

### Scheduling & Bookings
- ✅ **Teaching Schedule**: Bulk import teaching schedules via Excel with slot-based timing.
- ✅ **Room Booking**: Request and approve room bookings for meetings or extra classes.
- ✅ **Schedule Changes**: Lecturers can request to reschedule class instances (Slot-based selection).

### Maintenance & Security
- ✅ **Equipment Reporting**: Students/Lecturers report broken equipment; Asset Staff manage repairs.
- ✅ **Daily Room Checks**: Automated pending check list for Guards based on daily usage; verification tracking.

### Utilities
- ✅ **Bulk Import**: Excel-based import for Accounts, Schedules, and Student-Class mappings.
- ✅ **Premium UI**: Dynamic scheduler, dark mode, responsive layouts, and interactive modals.

## Quick Start

### Backend Setup
1. **Configure Connection**: Update `Backend/SCEMS/SCEMS.Api/appsettings.json` with your MySQL connection string.
2. **Restore & Run**:
   ```bash
   cd Backend/SCEMS
   dotnet restore
   dotnet run --project SCEMS.Api
   ```

### Database Migrations
```bash
dotnet ef database update --project SCEMS.Infrastructure --startup-project SCEMS.Api
```

### Frontend Setup
```bash
cd Frontend/scems
npm install
npm run dev
```

## API Endpoints Summary

### Management
- `/api/accounts` - User management
- `/api/rooms` - Room & RoomType management
- `/api/equipment` - Inventory & Equipment types
- `/api/classes` - Class management & Bulk Student Import

### Operations
- `/api/bookings` - Booking requests & Schedule changes
- `/api/teachingschedules` - Academic schedule management
- `/api/issuereports` - Equipment maintenance reporting
- `/api/roomchecks` - Daily room verification for Security

### System
- `/api/auth` - Login & Token management
- `/api/import` - Bulk data processing (Excel)

## Database Schema
The system uses MySQL via EF Core. Main entities include:
- `Account`, `Room`, `Equipment`, `Class`, `Teaching_Schedule`, `Booking`, `IssueReport`, `ClassStudent`.

## Environment Configuration
- **Backend**: JWT Secret, Database Connection String (in `appsettings.json`).
- **Frontend**: API Base URL (in `src/services/api.ts`).
