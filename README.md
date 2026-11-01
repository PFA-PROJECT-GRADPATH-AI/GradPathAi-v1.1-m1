# GradPath AI — Identity, Academic Profiles & Document Retrieval Service

> **Member 1 Standalone Service:** Authentication, Student Academic Profile Management, AI-driven Document Information Retrieval (IR), and Downstream Handoff Contracts for GradPath AI.

---

## 📌 Executive Overview

GradPath AI is an intelligent graduate school admissions advisor designed to streamline university program matching and faculty alignment. This repository encompasses **Member 1's standalone module**, responsible for:

1. **Secure Identity & BFF Session Management:** Cookie-based session authentication eliminating client-side token theft vulnerabilities.
2. **Student Academic Profile Studio:** End-to-end credential creation, GPA normalization, and study abroad ambition tracking.
3. **Information Retrieval (IR) from Document CVs:** Parsing uploaded PDF resumes using in-memory PDF extraction (`UglyToad.PdfPig`) and extracting candidate name, degree, GPA, skills, research concentrations, certifications, and engineering projects.
4. **Member 2 Integration Contract (`ProfileSnapshot v1`):** Delivering verified immutable candidate data to downstream recommendation engines via direct file download and dedicated API endpoints.
5. **Modern SaaS Frontend:** A responsive React + Vite application engineered with a left-sidebar navigation layout and clean monochromatic typography.

---

## 🏛️ Software Architecture & Design Patterns

The backend follows a **Layered Modular Architecture** with strict separation of concerns:

```text
GradPath.Member1.Api/
├── Controllers/         # API HTTP layer (AuthController, ProfileController, CvController)
├── Services/            # Core business logic & domain validation (IProfileService, ProfileService)
├── Domain/              # Entity models (ApplicationUser, StudentProfile, UploadedDocument)
├── Contracts/           # DTO records & Member 2 integration envelopes (ProfileSnapshotV1, AuthDtos)
├── Infrastructure/      # Data persistence & external adapters (AppDbContext, PdfCvExtractorAdapter, PrivacyPolicyRegistry)
├── Middleware/          # Centralized RFC 9110 ProblemDetails exception handling
└── Program.cs           # Host pipeline, Serilog configuration, and DI container setup
```

### Applied Design Patterns

- **Singleton Pattern:**
  - `PrivacyPolicyRegistry` (`IPrivacyPolicyRegistry`): Holds application-wide immutable policies, allowed MIME types (`application/pdf`), file size constraints (5 MB), and consent versions across the process lifetime.
  - `Log.Logger`: Process-wide Serilog root logging pipeline writing structured diagnostic events to console and rolling daily log files (`logs/member1-log-.txt`).

- **Scoped Controller-Service Layering & Dependency Injection:**
  - `ProfileService` (`IProfileService`) isolates domain rules (validating `0 < CGPA <= Scale` and `2020 <= Year <= 2032`) away from the HTTP transport layer.
  - **IDOR / BOLA Prevention:** Identity `studentId` is strictly bound to `ClaimTypes.NameIdentifier` extracted from the authenticated session cookie—never trusted from user request bodies.

- **Adapter Pattern:**
  - `SimulatedPdfCvExtractorAdapter` implements `ICvExtractor`, decoupling PDF parsing libraries (`UglyToad.PdfPig`) from core business services. This allows hot-swapping extraction engines (e.g. Azure Document Intelligence or Gemini API) without modifying profile services.

- **Backend-for-Frontend (BFF) Cookie Security:**
  - Authentication uses ASP.NET Core Identity with `HttpOnly = true`, `SameSite = SameSiteMode.Lax`, and `CookieSecurePolicy.SameAsRequest`. No JWTs or sensitive credentials are stored in browser `localStorage`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | C# 13, ASP.NET Core 9.0 Web API |
| **Identity & Security** | ASP.NET Core Identity (GUID keys, UUIDv7), BFF Secure Cookie Session |
| **Data Persistence** | Entity Framework Core 9.0, SQLite (`gradpath_member1.db`), Auto-Migration |
| **PDF Extraction & IR** | `UglyToad.PdfPig` (In-memory stream text parsing and semantic entity extraction) |
| **Diagnostics & Logs** | Serilog (`Serilog.AspNetCore`, Console & File sinks) |
| **API Documentation** | Swashbuckle OpenAPI / Swagger UI |
| **Frontend Framework** | React 18, Vite 6, Modern CSS with Grid & Flexbox |
| **Icons & Assets** | Custom lightweight inline SVG system |

---

## 🚀 Quick Start Guide

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js (v18+)](https://nodejs.org/) & `npm`

### 1. Run Backend Web API
```bash
# Navigate to the backend project
cd backend/GradPath.Member1.Api

# Restore and run the API
dotnet run
```
- **API URL:** `http://localhost:5259`
- **Swagger Documentation:** `http://localhost:5259/swagger`
- *Note:* SQLite database is automatically generated and seeded on first run.

### 2. Run React Frontend Client
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev
```
- **Frontend URL:** `http://localhost:5173`
- *Proxy:* Automatically proxies `/api` calls to `http://localhost:5259`.

### 🔑 Demo Credentials
- **Email:** `demo@gradpath.ai`
- **Password:** `Demo@123`
- *Or use the 1-Click Demo Login button on the sign-in screen.*

---

## 📡 API Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Create a new student user and issue session cookie | No |
| `POST` | `/api/v1/auth/login` | Sign in with email and password | No |
| `POST` | `/api/v1/auth/logout` | Revoke session cookie | Yes |
| `GET` | `/api/v1/auth/me` | Fetch active user credentials and profile status | Yes |

### Academic Profile (`/api/v1/profile`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/profile/me` | Retrieve authenticated student's profile | Yes |
| `PUT` | `/api/v1/profile/me` | Upsert academic profile (degree, GPA, skills, targets) | Yes |
| `GET` | `/api/v1/profile/me/consented-summary` | Retrieve `ProfileSnapshot v1` JSON payload | Yes |
| `GET` | `/api/v1/profile/me/export` | Download official snapshot contract file (`.json`) | Yes |
| `GET` | `/api/v1/profile/privacy-audit` | Expose active Singleton privacy policy configuration | No |

### Document Retrieval & CV Processing (`/api/v1/profile/me/cv`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/profile/me/cv` | Upload PDF CV (max 5 MB) and extract credentials | Yes |

---

## 🤝 Member 2 Integration Contract (`ProfileSnapshot v1`)

Downstream modules (Recommendation Engines & University Matching) consume the immutable snapshot payload exported from Member 1:

```json
{
  "contractVersion": "v1.0",
  "targetModule": "Member2-RecommendationEngine",
  "schema": "https://schemas.gradpath.ai/contracts/member2/profile-snapshot-v1.json",
  "exportedAtUtc": "2026-11-02T03:20:00.000Z",
  "data": {
    "studentId": "5f43371d-0a12-4175-89de-260975db9fc4",
    "degree": "BS in Computer Science",
    "cgpa": 3.45,
    "cgpaScale": 4.0,
    "graduationYear": 2027,
    "skills": ["Python", "TensorFlow", "React.js", "SQL", "AWS"],
    "researchInterests": ["Natural Language Processing", "Computer Vision"],
    "targetCountries": ["United States", "Canada", "Germany"],
    "targetIntake": "Fall",
    "fundingPreference": "Scholarship",
    "consentVersion": "v1.0",
    "snapshotGeneratedAtUtc": "2026-11-02T03:20:00.000Z"
  }
}
```

---

## 🧪 Testing & Verification

Comprehensive end-to-end test cases can be verified using PowerShell or cURL:

```powershell
# 1. Sign in as demo student
$login = @{ email = "demo@gradpath.ai"; password = "Demo@123" } | ConvertTo-Json
$sess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri "http://localhost:5259/api/v1/auth/login" -Method Post -Body $login -ContentType "application/json" -WebSession $sess

# 2. Retrieve Profile Snapshot
$snapshot = Invoke-RestMethod -Uri "http://localhost:5259/api/v1/profile/me/consented-summary" -Method Get -WebSession $sess
$snapshot | ConvertTo-Json -Depth 4

# 3. Download Member 2 Export
Invoke-WebRequest -Uri "http://localhost:5259/api/v1/profile/me/export" -Method Get -WebSession $sess -OutFile "snapshot_export.json"
```
