# Room Management System

A complete three-layer architecture solution with ASP.NET Core API backend and React TypeScript frontend for managing room equipment and reservations.

## Project Structure

```
RoomManagement/
├── Backend/
│   └── RoomManagementAPI/
│       ├── Models/              # Domain models (Account, Room, EquipmentType, etc.)
│       ├── DTOs/                # Data Transfer Objects
│       ├── Presentation/        # Controllers (API endpoints)
│       ├── Business/            # Services & business logic interfaces
│       ├── Data/                # Repositories & data access interfaces
│       └── Program.cs           # Entry point & configuration
└── Frontend/
    └── scems-admin/
        ├── src/
        │   ├── components/      # Reusable React components
        │   ├── pages/           # Page components for different routes
        │   ├── services/        # API service client
        │   ├── context/         # React Context (Authentication)
        │   ├── styles/          # CSS with light/dark mode support
        │   ├── App.tsx          # Main application component
        │   └── main.tsx         # Entry point
        ├── package.json         # Project dependencies
        └── vite.config.ts       # Vite configuration
```

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Language**: C#
- **Architecture**: Three-Layer Architecture (Presentation, Business, Data)
- **Patterns**: Dependency Injection, Repository Pattern, Async/Await
- **Database**: SQL Server (Entity Framework Core ORM)
- **Authentication**: JWT Token-based

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Variables for theming
- **Features**: Light/Dark mode support
- **State Management**: React Context API
- **HTTP Client**: Fetch API

## Features

### Backend Features
- ✅ Account Management (CRUD operations)
- ✅ Room Management (CRUD operations)
- ✅ Equipment Type Management (CRUD operations)
- ✅ JWT Authentication & Authorization
- ✅ Role-based access control
- ✅ Input validation and error handling
- ✅ RESTful API design
- ✅ Swagger/OpenAPI documentation

### Frontend Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Light/Dark mode theme support
- ✅ Account management (list, create, edit, view details)
- ✅ Room management (list, create, edit, view details)
- ✅ Equipment Type management (list, create, edit, view details)
- ✅ Form validation with error messages
- ✅ Loading states and error handling
- ✅ Secure authentication flow
- ✅ Protected routes with role-based access
- ✅ 404 Not Found page

## Quick Start

### Backend Setup

```bash
cd Backend/SCEMS
dotnet restore
dotnet run
```

**API runs on**: `http://localhost:5000`
**Swagger UI**: `http://localhost:5000/swagger`

### Frontend Setup

```bash
cd Frontend/scems-admin
npm install
npm run dev
```

**Frontend runs on**: `http://localhost:5173` (Vite default port)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Accounts
- `GET /api/accounts` - Get all accounts (paginated)
- `GET /api/accounts/{id}` - Get account by ID
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/{id}` - Update account
- `DELETE /api/accounts/{id}` - Delete account

### Rooms
- `GET /api/rooms` - Get all rooms (paginated)
- `GET /api/rooms/{id}` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/{id}` - Update room
- `DELETE /api/rooms/{id}` - Delete room

### Equipment Types
- `GET /api/equipment-types` - Get all equipment types (paginated)
- `GET /api/equipment-types/{id}` - Get equipment type by ID
- `POST /api/equipment-types` - Create new equipment type
- `PUT /api/equipment-types/{id}` - Update equipment type
- `DELETE /api/equipment-types/{id}` - Delete equipment type

## Database Schema

The system uses SQL Server with the following main entities:

- **Accounts**: User accounts with roles
- **Rooms**: Room information and details
- **EquipmentTypes**: Types of equipment available
- **RoomEquipment**: Junction table linking rooms with equipment

## Environment Configuration

### Backend
Configure `appsettings.json` with database connection string and JWT settings.

### Frontend
API endpoint is configured in `src/services/apiClient.ts` to point to the backend.

## Development Guidelines

### Code Structure
- **Services**: Handle API communication
- **Components**: Reusable UI elements
- **Pages**: Route-specific components
- **Context**: Global state management (Auth)
- **Styles**: Organized by theme support

### Styling
- Light mode (default)
- Dark mode (respects system preference)
- CSS variables for consistent theming
- Responsive grid layouts

## Future Enhancements

- Equipment reservation calendar
- Advanced reporting and analytics
- Email notifications
- Bulk operations
- Audit logging
- Performance optimizations
- Mobile app (React Native)
- API caching strategies
