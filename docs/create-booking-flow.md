# Create booking — end-to-end flow

This document describes how **creating a booking** works in this solution: HTTP entry point, validation, domain model, infrastructure rules, persistence, and how a frontend should call it.

---

## Quick reference

| Item | Value |
|------|--------|
| **HTTP method & path** | `POST /api/bookings` |
| **Auth** | Required: `Authorization: Bearer <JWT>` |
| **User identity** | `UserId` is taken from the JWT (`sub` / `NameIdentifier` claim), not from the request body |
| **Default booking status** | `Confirmed` (see `Booking` entity) |
| **Implementation** | `BookingService.CreateAsync` in Infrastructure |

---

## Layer diagram (create booking only)

```
Browser / SPA / Postman
        │
        ▼ POST /api/bookings + JSON body + Bearer token
HotelManagement.Api
  • BookingsController.Create
  • CreateBookingValidator (FluentValidation)
  • Builds domain Booking, maps to BookingResponseDto
        │
        ▼ IBookingService.CreateAsync(booking)
HotelManagement.Application
  • Interface only: IBookingService
        │
        ▼
HotelManagement.Infrastructure
  • BookingService.CreateAsync → AppDbContext → SQL Server
        │
        ▼
HotelManagement.Domain
  • Booking entity, BookingStatus enum
```

**Project references:** API → Application + Infrastructure; Infrastructure → Application + Domain; Application → Domain. The API resolves `IBookingService` to `BookingService` inside `Infrastructure.DependencyInjection.AddInfrastructure`.

---

## Step-by-step request flow

### 1. Client sends HTTP request

Example:

```http
POST /api/bookings HTTP/1.1
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "roomId": 1,
  "checkInDate": "2026-06-01",
  "checkOutDate": "2026-06-05",
  "guestsCount": 2,
  "stayType": "Leisure",
  "notes": "Late arrival"
}
```

The frontend must obtain a JWT first (for example via `POST /api/auth/login` or `register`) and attach it on every protected call.

**Claims used later:** JWT generation puts the user id in both `JwtRegisteredClaimNames.Sub` and `ClaimTypes.NameIdentifier` (`JwtTokenService`). `BookingsController` uses `User.GetUserId()` which reads those claims (`ClaimsPrincipalExtensions`).

---

### 2. API: routing and authorization

File: `src/HotelManagement.Api/Controllers/BookingsController.cs`

- Class attributes: `[ApiController]`, `[Authorize]`, `[Route("api/bookings")]`.
- Every action on this controller requires an authenticated user unless overridden (create is not anonymous).

So **unauthenticated requests get 401** before the action runs.

---

### 3. API: FluentValidation on the request DTO

File: `src/HotelManagement.Api/Validators/BookingValidators.cs` — `CreateBookingValidator`

Rules applied to `CreateBookingRequestDto`:

| Rule | Purpose |
|------|--------|
| `RoomId` > 0 | Valid room identifier |
| `CheckInDate` ≥ today (UTC) | Aligns with “no past check-in” at API boundary |
| `CheckOutDate` > `CheckInDate` | Valid stay span |
| `GuestsCount` > 0 | At least one guest |
| `StayType` not empty | Required label/type |

Configured from `Program.cs` via `AddFluentValidationAutoValidation()` and validators discovered from the API assembly.

**Note:** The Infrastructure layer repeats some date/capacity checks in `BookingService`; API validation rejects bad shapes early; the service enforces domain/data rules (active room, overlap, guests vs `MaxGuests`).

---

### 4. Controller: map DTO → domain entity + call service

Still in `BookingsController.Create`:

1. Instantiate a **`HotelManagement.Domain.Entities.Booking`**:
   - `UserId` = `User.GetUserId()` from JWT  
   - `RoomId`, `CheckInDate`, `CheckOutDate`, `GuestsCount`, `StayType`, `Notes` from `CreateBookingRequestDto`
2. **Do not set `Status` in the controller** — it defaults to **`BookingStatus.Confirmed`** on the entity (`Booking.cs`).
3. Call `await _bookingService.CreateAsync(booking, cancellationToken)`.

---

### 5. Infrastructure: `BookingService.CreateAsync`

File: `src/HotelManagement.Infrastructure/Services/BookingService.cs`

Execution order:

1. **Serializable transaction**  
   `BeginTransactionAsync(IsolationLevel.Serializable)` — reduces race conditions when two users try to book overlapping dates on the same room.

2. **Date rules (business)**  
   - Check-in cannot be before **today** (UTC `DateOnly`).  
   - Check-out must be **after** check-in.  
   On failure → `AppException` with HTTP **400**.

3. **Load room**  
   First active room (`IsActive`) with matching `RoomId`.  
   If missing → **404**.

4. **Capacity**  
   If `GuestsCount` > `room.MaxGuests` → **400**.

5. **Overlap check**  
   Any **other** booking for the same `RoomId` with `Status == Confirmed` whose interval overlaps the new `[CheckInDate, CheckOutDate)` interval (half-open style comparison in LINQ):

   ```text
   new.CheckIn < existing.CheckOut AND new.CheckOut > existing.CheckIn
   ```

   If overlap → **409** (“Selected dates are not available.”).

6. **Persist**  
   `DbSet<Booking>.AddAsync(booking)`, `SaveChangesAsync`, **commit transaction**.

7. Returns the same `booking` instance with **`Id`** and timestamps populated by EF (and `CreatedAt` from `BaseEntity` defaults / DB defaults as configured).

---

### 6. API: enrich for response (navigation properties)

The controller **injects `AppDbContext`** and, after create, reloads the booking:

```csharp
_dbContext.Bookings
  .Include(x => x.User)
  .Include(x => x.Room)
  .FirstAsync(x => x.Id == created.Id)
```

So `ToBookingDto()` can fill `UserName`, `RoomName`, `PricePerNight`, and **`Total`** (nights × price per night).

Mapping: `src/HotelManagement.Api/Common/MappingExtensions.cs` — `ToBookingDto`.

Response type: `BookingResponseDto` (`src/HotelManagement.Api/DTOs/Bookings/BookingDtos.cs`).

**HTTP status:** `201 Created` with `CreatedAtAction(nameof(GetMine), ...)`.

---

## Domain model (booking)

File: `src/HotelManagement.Domain/Entities/Booking.cs`

- Inherits `BaseEntity` (`Id`, `CreatedAt`, `UpdatedAt`).
- Foreign keys: `UserId`, `RoomId`.
- Dates: `DateOnly CheckInDate`, `CheckOutDate`.
- `GuestsCount`, `StayType`, optional `Notes`.
- `BookingStatus Status` — default **`Confirmed`**.

Enums: `src/HotelManagement.Domain/Enums/BookingStatus.cs` — `Confirmed`, `Cancelled`.

Overlap logic only considers **`Confirmed`** bookings; cancelled stays do not block new reservations.

---

## Database

- **`AppDbContext`** defines `DbSet<Booking> Bookings` and configures relationships to `User` and `Room` (`src/HotelManagement.Infrastructure/Data/AppDbContext.cs`).
- Table name: **`Bookings`** (see EF migrations under `Infrastructure/Data/Migrations`).

---

## Dependencies registered for this flow

File: `src/HotelManagement.Infrastructure/DependencyInjection.cs`

- `AddDbContext<AppDbContext>` (SQL Server).
- `services.AddScoped<IBookingService, BookingService>();`

The API registers infrastructure in `Program.cs`: `builder.Services.AddInfrastructure(builder.Configuration)`.

---

## Errors the client might see

| Situation | Typical HTTP code | Source |
|-----------|-------------------|--------|
| No / invalid JWT | 401 | Auth middleware / `GetUserId` |
| Invalid DTO (FluentValidation) | 400 | Validation filter |
| Check-in in past | 400 | `BookingService` |
| Invalid date range | 400 | Validator + service |
| Room missing / inactive | 404 | `BookingService` |
| Too many guests | 400 | `BookingService` |
| Date overlap | 409 | `BookingService` |
| Unexpected server errors | Mapped by middleware | `GlobalExceptionMiddleware` (see Api middleware) |

`AppException` carries a status code that the middleware typically maps to the HTTP response (verify `GlobalExceptionMiddleware` for exact shape).

---

## Frontend checklist

1. **Login/register** → store `accessToken` (and optionally `expiresAt`).
2. **Create booking:** `POST /api/bookings` with JSON body matching `CreateBookingRequestDto` property names (**camelCase** in JSON by default in ASP.NET Core).
3. **Header:** `Authorization: Bearer ${accessToken}`.
4. **CORS:** API enables a policy `"Frontend"` in `Program.cs` — ensure your frontend origin/method is allowed for your deployment scenario.
5. **Display:** Use the returned `BookingResponseDto` (totals, room name, etc.).

---

## Files to read in the repo

| Concern | Path |
|---------|------|
| HTTP create action | `src/HotelManagement.Api/Controllers/BookingsController.cs` |
| Request/response DTOs | `src/HotelManagement.Api/DTOs/Bookings/BookingDtos.cs` |
| Validator | `src/HotelManagement.Api/Validators/BookingValidators.cs` |
| Mapping | `src/HotelManagement.Api/Common/MappingExtensions.cs` |
| User id from JWT | `src/HotelManagement.Api/Common/ClaimsPrincipalExtensions.cs` |
| Contract | `src/HotelManagement.Application/Interfaces/IBookingService.cs` |
| Implementation | `src/HotelManagement.Infrastructure/Services/BookingService.cs` |
| Entity | `src/HotelManagement.Domain/Entities/Booking.cs` |
| Status enum | `src/HotelManagement.Domain/Enums/BookingStatus.cs` |
| Db context | `src/HotelManagement.Infrastructure/Data/AppDbContext.cs` |
| JWT claims | `src/HotelManagement.Infrastructure/Auth/JwtTokenService.cs` |
| Startup / CORS | `src/HotelManagement.Api/Program.cs` |

---

## Design note (layering)

`BookingsController` depends on both **`IBookingService`** and **`AppDbContext`**. Strict Clean Architecture sometimes keeps **`AppDbContext` only inside Infrastructure** and returns a fuller DTO from the application layer; here the reload + `Include` is done in the API for convenience. Behavior is unchanged; only the purity of layering differs.
