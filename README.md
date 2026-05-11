# QuickStay Hotel Management

A full-stack hotel management system: guests browse rooms and manage bookings, while staff and administrators operate a separate console for rooms, guests, and reservations. The backend is an ASP.NET Core Web API with JWT authentication and SQL Server; the frontend is static HTML, CSS, and JavaScript served by the same host in development for a simple single-command workflow.

---

## Table of contents

- [QuickStay Hotel Management](#quickstay-hotel-management)
  - [Table of contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Tech stack](#tech-stack)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started)
  - [Configuration](#configuration)
    - [Development (recommended)](#development-recommended)
  - [Running the application](#running-the-application)
    - [Default administrator (after seeding)](#default-administrator-after-seeding)
    - [Stopping the server](#stopping-the-server)
  - [Using the application](#using-the-application)
    - [Entry point](#entry-point)
    - [Guest workflow](#guest-workflow)
    - [Administrator workflow](#administrator-workflow)
    - [Roles](#roles)
  - [Project structure](#project-structure)
  - [Troubleshooting](#troubleshooting)
  - [License](#license)


---

## Features

- **Guests** — Register, sign in, search rooms with filters, create bookings with date overlap protection, view and cancel bookings, extend stays, and manage profile.
- **Administrators** — Dashboard, room CRUD with image uploads, booking oversight, guest management, and hotel settings.
- **Data** — Entity Framework Core with SQL Server, automatic migrations on startup, and seeded demo data (admin user, hotel info, catalog rooms).

---

## Architecture

The backend follows **Clean Architecture** so that business rules stay independent of databases, frameworks, and HTTP details.

- **`HotelManagement.Domain`** — Core entities and enums; no references to other projects.
- **`HotelManagement.Application`** — Use-case contracts (interfaces) and shared application types; depends only on **Domain**.
- **`HotelManagement.Infrastructure`** — EF Core, SQL Server, concrete services, JWT wiring, and data access; implements **Application** interfaces and depends on **Domain** and **Application**.
- **`HotelManagement.Api`** — HTTP API (controllers, DTOs, validation, middleware), static files, and composition root; references **Application** and **Infrastructure**.

**Dependency rule:** inner layers never depend on outer layers. The UI under **`frontend/`** (`pages/`, `js/`, `css/`) is a separate static front end that talks to the API over HTTP.

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Runtime & API** | .NET 10, ASP.NET Core Web API |
| **Data** | SQL Server, Entity Framework Core 10 |
| **Auth** | JWT Bearer, ASP.NET Core Identity password hashing (`PasswordHasher<T>`) |
| **Validation** | FluentValidation |
| **Frontend** | HTML5, CSS3, vanilla JavaScript |

---

## Prerequisites

Install the following on your machine:

1. **[.NET 10 SDK](https://dotnet.microsoft.com/download)** — required to build and run the API.
2. **[SQL Server](https://www.microsoft.com/sql-server)** — LocalDB, Express, or full instance. The default development settings assume a local server (see [Configuration](#configuration)).

Optional: **Git** for cloning the repository.

---

## Getting started

```bash
git clone https://github.com/Yusuf-Fraitekh/Hotel_ManagementSystem.git
cd Hotel_Mangment
```
---

## Configuration

The API reads **`ConnectionStrings:DefaultConnection`** (see `backend/src/HotelManagement.Infrastructure/DependencyInjection.cs`).

### Development (recommended)

Edit **`backend/src/HotelManagement.Api/appsettings.Development.json`** and set `ConnectionStrings:DefaultConnection` to your SQL Server instance, for example:

- **SQL authentication**:

  `"Server=.;Database=HotelManagementDb_Dev;Trusted_Connection=True;TrustServerCertificate=True"`

---

## Running the application

From the **repository root**:

```bash
dotnet run --project backend/src/HotelManagement.Api
```

By default (see `Properties/launchSettings.json`):

On first run, the app:

1. Applies EF Core **migrations** to the configured database.
2. Runs **`DbSeeder`**, which creates a default **admin** user, **hotel** profile, and **seed rooms** when the database is empty.

### Default administrator (after seeding)

| Field | Value |
|--------|--------|
| **Email** | `admin@quickstay.com` |
| **Password** | `Admin123!` |

Change this password immediately in any shared or production environment.

### Stopping the server

Press `Ctrl+C` in the terminal where `dotnet run` is executing.

---

## Using the application

### Entry point

With the API running, open the root URL in a browser. The host serves the static site from the **`frontend/`** folder; the default document is the **login / registration** page.

### Guest workflow

1. **Register** a new account or **sign in** with an existing user.
2. After login, use **Home**, **Rooms**, and **My Bookings** from the navigation.
3. Pick dates and guest count on the rooms listing, open a room, and **complete a booking** (availability respects confirmed overlapping bookings).
4. **Profile** — update display name; sign out clears the JWT from session storage.

### Administrator workflow

1. Sign in with an **Admin** account (use the seeded admin above, or promote a user in the database if you add that capability).
2. You are redirected to the **admin dashboard**.
3. Use the sidebar for **Rooms** (create/edit rooms, upload images), **Bookings**, **Guests**, and **Settings** as implemented in each page.

### Roles

The system supports **`User`**, and **`Admin`** roles. Room and booking management APIs enforce policies (`RequireAdmin`) according to controller attributes. New self-service registrations are typically **`User`**; create **Staff** users through your chosen operational process (e.g. SQL or future admin UI).

---

## Project structure

```text
Hotel_Mangment/
├── backend/
│   ├── HotelManagement.slnx           # Solution (open in Visual Studio / VS Code)
│   └── src/
│       ├── HotelManagement.Api/       # Web host, controllers, middleware, wwwroot (uploads)
│       ├── HotelManagement.Application/
│       ├── HotelManagement.Domain/
│       └── HotelManagement.Infrastructure/
└── frontend/
    ├── pages/                         # HTML (user, admin, auth)
    ├── js/                            # Scripts
    └── css/                           # Stylesheets
```

---

## Troubleshooting

| Issue | Suggestion |
|--------|------------|
| **Cannot connect to database** | Verify SQL Server is running and `DefaultConnection` matches your instance and database name. |
| **401 on API calls** | Sign in again; JWT is stored in `sessionStorage`. Ensure clock skew is not invalidating tokens. |
| **Room images 404** | Image URLs are usually `/uploads/...` under the API site. Ensure you open the app from the **same origin** as the API when using defaults, or set `API_BASE_URL` appropriately. |
| **Seeded data missing** | Seeding runs only when tables such as `Rooms` or admin user are empty. Use a fresh database or clear data if you need to re-seed (be careful in production). |

---

## License

Specify your license here (for example MIT, proprietary, or academic use only).
