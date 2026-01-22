using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Linq;
using System.Text;
using SCEMS.Application;
using SCEMS.Infrastructure;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Extensions;
using SCEMS.Api.Middleware;
using SCEMS.Api.Services;

using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
var key = Encoding.ASCII.GetBytes(secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddDbContext<ScemsDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policyBuilder =>
    {
        policyBuilder.AllowAnyOrigin()
                     .AllowAnyMethod()
                     .AllowAnyHeader();
    });
});

builder.Services.AddApplicationServices();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddInfrastructureServices(connectionString);
builder.Services.AddScoped<IJwtService, JwtService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ScemsDbContext>();
    dbContext.Database.EnsureCreated();

    // Seed initial data
    var existingAdmin = dbContext.Accounts.IgnoreQueryFilters().FirstOrDefault(a => a.Email == "admin@scems.com");
    
    if (existingAdmin == null)
    {
        var adminAccount = new SCEMS.Domain.Entities.Account
        {
            Email = "admin@scems.com",
            FullName = "System Administrator",
            Role = SCEMS.Domain.Enums.AccountRole.Admin,
            PasswordHash = HashPassword("Admin123!"),
            Status = SCEMS.Domain.Enums.AccountStatus.Active
        };
        dbContext.Accounts.Add(adminAccount);
        dbContext.SaveChanges();
    }
    else if (existingAdmin.IsDeleted)
    {
        existingAdmin.IsDeleted = false;
        dbContext.Accounts.Update(existingAdmin);
        dbContext.SaveChanges();
    }
}

static string HashPassword(string password)
{
    using var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(password, 16, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256);
    var salt = pbkdf2.Salt;
    var hash = pbkdf2.GetBytes(20);
    return Convert.ToBase64String(salt.Concat(hash).ToArray());
}

app.Run();
