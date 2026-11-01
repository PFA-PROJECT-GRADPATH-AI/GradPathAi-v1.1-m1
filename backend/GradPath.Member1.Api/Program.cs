using GradPath.Member1.Api.Domain;
using GradPath.Member1.Api.Infrastructure;
using GradPath.Member1.Api.Middleware;
using GradPath.Member1.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ─── Singleton Logger Pipeline (Serilog) ─────────────────────────────────────
// Singleton Design Pattern: Single Log.Logger instance across the entire process lifetime
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Module", "Member1-Identity-Profiles")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/member1-log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// ─── Database (SQLite) & ASP.NET Core Identity ───────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=gradpath_member1.db"));

builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ─── BFF Cookie Auth (HttpOnly — no JWT in localStorage) ─────────────────────
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.Name = "gradpath.session";
    options.LoginPath = null;
    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// ─── Application Services (DI) ───────────────────────────────────────────────
// Singleton: PrivacyPolicyRegistry — holds immutable policy config across all requests
builder.Services.AddSingleton<IPrivacyPolicyRegistry, PrivacyPolicyRegistry>();

// Scoped: ProfileService — Controller-Service layering pattern
builder.Services.AddScoped<IProfileService, ProfileService>();

// Transient: CvExtractor Adapter — Adapter pattern decouples PDF parsing from domain
builder.Services.AddTransient<ICvExtractor, SimulatedPdfCvExtractorAdapter>();

// ─── MVC + Swagger ────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GradPath Member1 API", Version = "v1" });
});

// ─── CORS (for Vite frontend at localhost:5173) ───────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()); // Required for HttpOnly cookie cross-origin
});

var app = builder.Build();

// ─── Auto-migrate and seed demo data on startup ───────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Seed a demo user for quick testing
    var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    const string demoEmail = "demo@gradpath.ai";
    if (await userMgr.FindByEmailAsync(demoEmail) is null)
    {
        var demoUser = new ApplicationUser
        {
            UserName = demoEmail,
            Email = demoEmail,
            FullName = "Demo Student",
            EmailConfirmed = true
        };
        await userMgr.CreateAsync(demoUser, "Demo@123");
        Log.Information("Seeded demo user: {Email}", demoEmail);
    }
}

// ─── Middleware Pipeline ──────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Log.Information("GradPath Member1 API starting on {Env}", app.Environment.EnvironmentName);
app.Run();
