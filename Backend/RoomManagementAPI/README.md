# Room Management Backend API

ASP.NET Core Web API with three-layer architecture for Room Management System.

## Architecture

The project follows a three-layer architecture pattern:

1. **Presentation Layer** (`Presentation/`)
   - Controllers that handle HTTP requests
   - `RoomController.cs` - Handles room CRUD operations

2. **Business Logic Layer** (`Business/`)
   - Service interfaces and implementations
   - `IRoomService.cs` - Service contract
   - `RoomService.cs` - Business logic implementation

3. **Data Access Layer** (`Data/`)
   - Repository interfaces and implementations
   - `IRepository.cs` - Generic repository contract
   - `RoomRepository.cs` - Data access implementation

## Models

- **Room** - Entity representing a room with properties like name, number, capacity, location, and status

## Prerequisites

- .NET 8.0 SDK or higher
- Visual Studio, VS Code, or another C# IDE

## Setup

1. Navigate to the project directory:
```bash
cd Backend/RoomManagementAPI
```

2. Restore NuGet packages:
```bash
dotnet restore
```

3. Build the project:
```bash
dotnet build
```

## Running the Application

```bash
dotnet run
```

The API will start on `https://localhost:5000` (or `http://localhost:5001`)

## API Endpoints

### Rooms

- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/{id}` - Get a specific room by ID
- `POST /api/rooms` - Create a new room
- `PUT /api/rooms/{id}` - Update a room
- `DELETE /api/rooms/{id}` - Delete a room

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3000`
- `http://localhost:5173`

## Swagger Documentation

When running in Development mode, Swagger UI is available at:
- `https://localhost:5000/swagger`

## Database

Currently uses in-memory storage. To implement a real database:

1. Add Entity Framework Core package:
```bash
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```

2. Create a DbContext class
3. Update the `RoomRepository` to use DbContext
4. Configure the database connection in `appsettings.json`
5. Run migrations

## Notes

- All endpoints are async
- Comprehensive error handling and validation
- Generic repository pattern for code reuse
- Dependency injection configured in Program.cs
