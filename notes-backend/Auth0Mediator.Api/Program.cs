// ============================
// using
// ============================
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using Microsoft.Extensions.Caching.Memory;
using Serilog;

// Handlery / repo
using Auth0Mediator.Api.Features.Profile;
using Auth0Mediator.Api.Features.Users;
using Auth0Mediator.Api.Features.Notes;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

// Admin (Auth0 Management API)
using Auth0.ManagementApi;
using Auth0Mediator.Api.Features.Admin;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// ============================
// Serilog: czytaj z appsettings (sekcja "Serilog")
//  - plik: logs/api.log
//  - konsola: TYLKO Microsoft.Hosting.Lifetime
// ============================
builder.Host.UseSerilog((ctx, serilogCfg) =>
{
    serilogCfg
        .ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()

        // Sub-logger na konsolę z filtrem wyłącznie na źródło Microsoft.Hosting.Lifetime
        .WriteTo.Logger(lc =>
            lc.Filter.ByIncludingOnly(le =>
                   le.Properties.TryGetValue("SourceContext", out var sc)
                && sc.ToString().Contains("Microsoft.Hosting.Lifetime"))
              .WriteTo.Console());
});

// ============================
// Konfiguracja podstawowa
// ============================
var auth0Domain = cfg["Auth0:Domain"]   ?? throw new("Missing Auth0:Domain");
var audience    = cfg["Auth0:Audience"] ?? throw new("Missing Auth0:Audience");

// ============================
// MediatR
// ============================
builder.Services.AddMediatR(o =>
    o.RegisterServicesFromAssemblyContaining<GetProfileHandler>());

// ============================
// MongoDB
// ============================
builder.Services.AddSingleton<IMongoClient>(_ =>
{
    var cs = cfg["Mongo:ConnectionString"] ?? "mongodb://127.0.0.1:27017";
    return new MongoClient(cs);
});
builder.Services.AddScoped(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    var dbName = cfg["Mongo:Database"] ?? "notes";
    return client.GetDatabase(dbName);
});

// ============================
// Repozytoria domenowe
// ============================
builder.Services.AddScoped<IUsersRepository, UsersRepository>();
builder.Services.AddScoped<INotesRepository, NotesRepository>();
builder.Services.AddScoped<IBoardCardsRepository, BoardCardsRepository>();

builder.Services.AddControllers();

// ============================
// JWT Bearer (Auth0)
// ============================
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.Authority = $"https://{auth0Domain}/";
        o.Audience  = audience;
        o.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer   = true,
            ValidIssuer      = $"https://{auth0Domain}/",
            ValidateAudience = true,
            ValidAudiences   = new[] { audience, $"https://{auth0Domain}/userinfo" },
            ValidateLifetime = true,
            ClockSkew        = TimeSpan.Zero,
            NameClaimType    = "sub",
            RoleClaimType    = cfg["Auth0:RoleClaim"] ?? "roles",
        };

        // Logujemy tylko porażki JWT (do pliku przez Serilog)
        o.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Auth");

                logger.LogWarning(ctx.Exception,
                    "JWT authentication failed. Path={Path}, Scheme={Scheme}, Error={Error}",
                    ctx.HttpContext.Request.Path,
                    ctx.Scheme?.Name,
                    ctx.Exception.Message);

                return Task.CompletedTask;
            },
            OnTokenValidated = ctx => Task.CompletedTask
        };
    });

// ============================
// Helper: permissions/scope
// ============================
static bool HasPermission(ClaimsPrincipal user, string permission)
{
    if (user.Claims.Any(c => c.Type == "permissions" && c.Value == permission))
        return true;

    var scope = user.FindFirst("scope")?.Value;
    if (!string.IsNullOrWhiteSpace(scope))
        return scope.Split(' ', StringSplitOptions.RemoveEmptyEntries).Contains(permission);

    return false;
}

// ============================
// Authorization policies
// ============================
builder.Services.AddAuthorization(o =>
{
    // Board cards
    o.AddPolicy("cards:read",   p => p.RequireAssertion(ctx => HasPermission(ctx.User, "read:cards")));
    o.AddPolicy("cards:create", p => p.RequireAssertion(ctx => HasPermission(ctx.User, "create:cards")));
    o.AddPolicy("cards:update", p => p.RequireAssertion(ctx => HasPermission(ctx.User, "update:cards")));
    o.AddPolicy("cards:delete", p => p.RequireAssertion(ctx => HasPermission(ctx.User, "delete:cards")));

    // Notes
    o.AddPolicy("read:notes",   p => p.RequireAssertion(ctx => HasPermission(ctx.User, "read:notes")));
    o.AddPolicy("create:notes", p => p.RequireAssertion(ctx => HasPermission(ctx.User, "create:notes")));
    o.AddPolicy("update:notes", p => p.RequireAssertion(ctx => HasPermission(ctx.User, "update:notes")));
    o.AddPolicy("delete:notes", p => p.RequireAssertion(ctx => HasPermission(ctx.User, "delete:notes")));

    // Admin
    o.AddPolicy("read:admin-secret", p => p.RequireAssertion(ctx => HasPermission(ctx.User, "read:admin-secret")));

    // aliasy / kompatybilność
    o.AddPolicy("manage:users", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "manage:users") ||
        HasPermission(ctx.User, "manage:admin-users") ||
        HasPermission(ctx.User, "update:admin-users") ||
        HasPermission(ctx.User, "read:admin-users") ||
        HasPermission(ctx.User, "reset:admin-passwords")));

    o.AddPolicy("manage:roles", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "manage:roles") ||
        HasPermission(ctx.User, "manage:admin-roles") ||
        HasPermission(ctx.User, "read:admin-roles")));

    o.AddPolicy("read:admin-users",  p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "read:admin-users") ||
        HasPermission(ctx.User, "manage:users") || HasPermission(ctx.User, "manage:admin-users")));

    o.AddPolicy("update:admin-users", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "update:admin-users") ||
        HasPermission(ctx.User, "manage:users") || HasPermission(ctx.User, "manage:admin-users")));

    o.AddPolicy("reset:admin-passwords", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "reset:admin-passwords") ||
        HasPermission(ctx.User, "manage:users") || HasPermission(ctx.User, "manage:admin-users")));

    o.AddPolicy("read:admin-roles", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "read:admin-roles") ||
        HasPermission(ctx.User, "read:roles")));

    o.AddPolicy("manage:admin-roles", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "manage:admin-roles") ||
        HasPermission(ctx.User, "manage:roles") ||
        HasPermission(ctx.User, "read:roles") ||
        HasPermission(ctx.User, "create:role_members") ||
        HasPermission(ctx.User, "delete:role_members")));

    o.AddPolicy("manage:admin-users", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "manage:admin-users") ||
        HasPermission(ctx.User, "read:users") ||
        HasPermission(ctx.User, "update:users") ||
        HasPermission(ctx.User, "create:user_tickets")));

    o.AddPolicy("read:role_permissions", p => p.RequireAssertion(ctx =>
        HasPermission(ctx.User, "read:roles") ||
        HasPermission(ctx.User, "read:admin-roles")));
});

// ============================
// CORS
// ============================
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173", "https://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

// ============================
// Swagger
// ============================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Notes API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Wklej token typu Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ============================
// Admin – Auth0 Management API (M2M)
// ============================
builder.Services.AddMemoryCache();
builder.Services.Configure<Auth0MgmtOptions>(cfg.GetSection("Auth0"));
builder.Services.AddSingleton<Auth0MgmtTokenProvider>();
builder.Services.AddScoped<IManagementApiClient>(sp =>
{
    var provider = sp.GetRequiredService<Auth0MgmtTokenProvider>();
    var domain   = cfg["Auth0:Domain"] ?? throw new("Missing Auth0:Domain");
    var token    = provider.GetTokenAsync().GetAwaiter().GetResult(); // cached inside
    return new ManagementApiClient(token, new Uri($"https://{domain}/api/v2"));
});
builder.Services.AddScoped<IAuth0MgmtService, Auth0MgmtService>();

var app = builder.Build();

// ============================
// Middleware
// ============================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Brak UseSerilogRequestLogging — aby nie drukować requestów na konsolę
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
