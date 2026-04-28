# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore as distinct layers
COPY ["SCEMS.Api/SCEMS.Api.csproj", "SCEMS.Api/"]
COPY ["SCEMS.Application/SCEMS.Application.csproj", "SCEMS.Application/"]
COPY ["SCEMS.Domain/SCEMS.Domain.csproj", "SCEMS.Domain/"]
COPY ["SCEMS.Infrastructure/SCEMS.Infrastructure.csproj", "SCEMS.Infrastructure/"]

RUN dotnet restore "SCEMS.Api/SCEMS.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/SCEMS.Api"
RUN dotnet build "SCEMS.Api.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "SCEMS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port 80
EXPOSE 80
ENTRYPOINT ["dotnet", "SCEMS.Api.dll"]
