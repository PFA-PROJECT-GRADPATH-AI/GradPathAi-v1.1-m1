# GradPath AI — Member 1 Implementation Plan (Revised for Monday Sprint)
## Standalone Identity, OAuth/Cookie Auth, Student Profiles & Architecture Skeleton

**Repository:** `gradpath-org/member1-identity-profiles` (Standalone Repo)  
**IDE Environment:** Antigravity IDE (Agentic VS Code-based environment)  
**Stack:** ASP.NET Core 10 Web API (C#), React + Vite (JavaScript), EF Core + SQLite/PostgreSQL, Serilog  
**Sprint Target (4-5 Hours):**
1. **Working User Authentication:** Register, Login, Logout, and `/api/v1/auth/me` using ASP.NET Core Identity + BFF Secure HttpOnly Cookies.
2. **One Complete Working Use Case (M1-UC03):** End-to-End Student Academic Profile Creation, Validation & Persistence (`GET/PUT /api/v1/profile/me`) + `ProfileSnapshot v1` DTO endpoint.
3. **Full Architectural Skeleton:** Interfaces, Service Layer, Adapter Stubs (`ICvExtractor`), Singleton Configuration/Diagnostics, and Serilog Structured Logging wired up for the remaining use cases.

---

## 1. Antigravity IDE Setup, Extensions & CLI Tools (For Coding Agent & Developer)
Because Member 1 is switching from Visual Studio 2022 to **Antigravity** (which uses the VS Code extension ecosystem and integrated terminal), the coding agent and developer must use CLI-driven scaffolding and these extensions:

- **Required Extensions in Antigravity (Open VSX / Marketplace):**
  1. **C# Dev Kit** (`ms-dotnettools.csdevkit`) & **C#** (`ms-dotnettools.csharp`) — For C# IntelliSense, Roslyn diagnostics, and debugging.
  2. **REST Client** (`humao.rest-client`) or **Thunder Client** — Test `.http` API endpoints directly inside Antigravity.
  3. **SQLite Viewer** (`qwtel.sqlite-viewer`) — Inspect the local SQLite database tables (`AspNetUsers`, `StudentProfiles`) with zero external DB server setup.
  4. **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`) — For React frontend components.

- **Required .NET CLI Global Tools (Agent must run in Antigravity Integrated Terminal):**
  ```bash
  dotnet tool install --global dotnet-ef
  dotnet dev-certs https --trust
  ```

- **Antigravity Terminal Scaffolding Commands for the Coding Agent:**
  Instead of Visual Studio's GUI Package Manager Console, the Antigravity agent must execute these exact CLI commands:
  ```bash
  # 1. Scaffold Solution and Web API Project
  dotnet new sln -n GradPath.Member1
  mkdir backend
  dotnet new webapi -n GradPath.Member1.Api -o backend/GradPath.Member1.Api --use-controllers
  dotnet sln add backend/GradPath.Member1.Api/GradPath.Member1.Api.csproj

  # 2. Install Required NuGet Packages via CLI
  cd backend/GradPath.Member1.Api
  dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
  dotnet add package Microsoft.EntityFrameworkCore.Sqlite
  dotnet add package Microsoft.EntityFrameworkCore.Design
  dotnet add package Serilog.AspNetCore
  dotnet add package Serilog.Sinks.Console
  dotnet add package Serilog.Sinks.File
  dotnet add package Swashbuckle.AspNetCore

  # 3. Create & Apply EF Core Migrations via CLI (Replaces VS2022 Update-Database)
  dotnet ef migrations add InitialMember1Schema
  dotnet ef database update
  ```
- **Workspace Config:** The agent should also generate `.vscode/launch.json` and `.vscode/tasks.json` so Member 1 can run/debug directly inside Antigravity, or run `dotnet watch run` in Terminal 1 and `npm run dev` in Terminal 2.

---

## 2. Software Architecture (Layered Modular Monolith in Standalone Repo)
Even though each member builds in a separate repository for individual rubric evaluation, the internal structure strictly follows the **GradPath AI Layered Modular Architecture**:
```text
member1-identity-profiles/
├── .vscode/                      # launch.json & tasks.json for Antigravity debugging
├── backend/
│   └── GradPath.Member1.Api/
│       ├── Controllers/          # MVC API Layer (AuthController, ProfileController, CvController)
│       ├── Services/             # Application Business Layer (IProfileService, ProfileService)
│       ├── Domain/               # Entities (ApplicationUser, StudentProfile, ResearchInterest, UploadedDocument)
│       ├── Contracts/            # DTOs (RegisterDto, LoginDto, ProfileDto, ProfileSnapshotV1)
│       ├── Infrastructure/       # Persistence & External Adapters (AppDbContext, PdfCvExtractorAdapter, PrivacyPolicyRegistry)
│       ├── Middleware/           # GlobalExceptionMiddleware (ProblemDetails + TraceId)
│       └── Program.cs            # DI Container, Serilog Bootstrap, Cookie Auth
└── frontend/                     # React + Vite SPA
    └── src/
        ├── api/client.js         # Fetch wrapper with credentials: 'include'
        ├── pages/AuthPage.jsx    # Working Login / Register UI
        └── pages/ProfilePage.jsx # Working M1-UC03 Student Profile Editor + Skeleton tabs for CV Upload
```

---

## 3. Mandatory Design Patterns & Exact Code Implementation

### 3.1 Singleton Pattern (`PrivacyPolicyRegistry` & Serilog Root Pipeline)
- **Where used:** `Log.Logger` (Serilog root pipeline) and `PrivacyPolicyRegistry` registered via `builder.Services.AddSingleton<IPrivacyPolicyRegistry, PrivacyPolicyRegistry>()`.
- **Why used:** Holds immutable application-wide configuration, allowed CV MIME types (`.pdf`), max upload size limits (5 MB), PII redaction rules, and current `ConsentVersion` across the entire process lifetime without re-allocating memory per HTTP request.

### 3.2 MVC / Controller-Service Layering + Dependency Injection (Scoped)
- **Where used:** `ProfileController` injects `IProfileService` (registered via `AddScoped<IProfileService, ProfileService>()`).
- **Why used:** Keeps HTTP serialization and status codes (`200 OK`, `400 BadRequest`, `401 Unauthorized`) inside controllers while isolating domain validation (e.g., `CGPA <= CgpaScale`) inside testable C# services.

### 3.3 Adapter Pattern (`ICvExtractor` -> `PdfCvExtractorAdapter`)
- **Where used:** `ICvExtractor` interface in `Services/`, implemented by `SimulatedPdfCvExtractorAdapter` in `Infrastructure/`.
- **Why used:** Decouples third-party PDF/OCR/LLM parsing libraries from the core student profile domain. Allows swapping a mock extractor today for Azure Document Intelligence or Gemini API later without modifying `ProfileService`.

### 3.4 Backend-for-Frontend (BFF) Cookie Session Pattern
- **Where used:** ASP.NET Core Identity cookie configuration (`HttpOnly = true`, `SameSite = SameSiteMode.Lax`, `SecurePolicy = CookieSecurePolicy.SameAsRequest`).
- **Why used:** Prevents XSS token theft by never exposing JWTs or OAuth tokens to browser `localStorage`.

---

## 4. Mandatory Serilog Configuration (`Program.cs`)
The Antigravity coding agent must wire Serilog behind `ILogger<T>` at startup:
```csharp
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Singleton Logger Pipeline configured at Host Startup
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Module", "Member1-Identity-Profiles")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{CorrelationId}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/member1-log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();
```
**Structured Log Events to Emit in Code:**
- `_logger.LogInformation("Auth.RegisterSucceeded UserId={UserId}", user.Id);`
- `_logger.LogInformation("Auth.LoginSucceeded UserId={UserId}", user.Id);`
- `_logger.LogWarning("Auth.LoginFailed Reason={Reason}", "InvalidCredentials");`
- `_logger.LogInformation("Profile.Updated StudentId={StudentId} Cgpa={Cgpa}/{Scale} DurationMs={Elapsed}", userId, dto.Cgpa, dto.CgpaScale, sw.ElapsedMilliseconds);`
- `_logger.LogWarning("Cv.UploadRejected StudentId={StudentId} Reason={Reason}", userId, "InvalidFileExtension");`
*(Never log passwords, raw CV contents, or session cookies).*

---

## 5. Step-by-Step Coding Agent Execution Prompt (4-Hour Build in Antigravity)

### Step 1: Database & Identity Setup (Working Auth)
1. Use SQLite (`Data Source=gradpath_member1.db`) in `AppDbContext` so database creation works immediately in Antigravity without external server setup, and auto-apply migrations or `EnsureCreated()` on startup alongside seeded demo data.
2. Create `ApplicationUser : IdentityUser<Guid>` with `FullName` and `CreatedAtUtc`.
3. Create `StudentProfile` entity with `Id (Guid, UUIDv7 via Guid.CreateVersion7())`, `StudentId (Guid FK)`, `Degree`, `Cgpa`, `CgpaScale`, `GraduationYear`, `SkillsCsv`, `ResearchInterestsCsv`, `TargetCountriesCsv`, `TargetIntake`, `FundingPreference`, `ConsentVersion`, `UpdatedAtUtc`.
4. Implement `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me`.

### Step 2: Complete Working Use Case — `M1-UC03: Create & Edit Academic Profile`
1. Implement `IProfileService` and `ProfileService`:
   - Validate `Cgpa > 0 && Cgpa <= CgpaScale` (e.g., 3.65 / 4.00).
   - Validate `GraduationYear >= 2020 && GraduationYear <= 2032`.
   - Upsert `StudentProfile` tied strictly to the authenticated `ClaimTypes.NameIdentifier` (never trust `studentId` from request body — prevents IDOR/BOLA).
   - Emit structured `Profile.Updated` Serilog event.
2. Implement `GET /api/v1/profile/me`, `PUT /api/v1/profile/me`, and `GET /api/v1/profile/me/consented-summary` (returns `ProfileSnapshot v1` JSON contract for Member 2).

### Step 3: Architectural Skeleton for Remaining Use Cases (M1-UC04, M1-UC05, M1-UC06)
1. Implement `ICvExtractor` interface and `PdfCvExtractorAdapter` (`POST /api/v1/profile/me/cv`) that checks `.pdf` extension and max 5MB size against the Singleton `IPrivacyPolicyRegistry`, logs `Cv.Uploaded` or `Cv.UploadRejected`, and returns extracted skills for UI confirmation.
2. Implement `GET /api/v1/profile/privacy-audit` returning the active `IPrivacyPolicyRegistry` Singleton settings.

### Step 4: React Frontend (Vite)
1. Scaffold in `frontend/` using `npm create vite@latest . -- --template react` and configure Vite proxy (`/api` -> backend URL) so cookies work seamlessly under same-origin rules.
2. Build a clean Dark-Blue themed React UI with two main views:
   - **Auth Card:** Register, Sign In, and 1-Click Demo Login buttons with live session status badge.
   - **Student Profile Wizard (Working Use Case):** Form inputs for Degree, CGPA, Scale, Graduation Year, Skills tags, Research Interests, Target Intake, and Funding Preference. Includes a "Save Profile" button, live `ProfileSnapshot v1` JSON preview panel, and a "Test CV Adapter" upload card.