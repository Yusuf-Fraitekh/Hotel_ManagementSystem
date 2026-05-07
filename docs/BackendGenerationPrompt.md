# Backend Generation Prompt (Step-by-Step)

Use this prompt to regenerate or extend the backend consistently:

Build a simple, clean, submission-ready backend for my Hotel Management frontend using ASP.NET Core Web API, EF Core, SQL Server, JWT, FluentValidation, Swagger, and global exception middleware. Do not use CQRS, MediatR, microservices, DDD, or advanced enterprise patterns. Use Controller -> Service -> Repository architecture.

1. Create solution structure with `Api`, `Application`, `Domain`, `Infrastructure`, and optional `Tests`.
2. Wire dependency injection, SQL Server `DbContext`, JWT authentication/authorization, Swagger, CORS, and global exception middleware.
3. Implement entities and relationships:
   - `User`, `Room`, `RoomImage`, `RoomTag`, `RoomRoomTag`, `Booking`, `HotelInfo`.
4. Add EF Core configurations and migration with constraints:
   - unique email,
   - valid booking date ranges,
   - room-booking overlap checks.
5. Implement DTOs and FluentValidation validators for auth, room, booking, and profile endpoints.
6. Implement services/business rules:
   - room availability filtering,
   - booking create/extend/cancel rules,
   - room delete protection when active/future bookings exist.
7. Implement controllers/endpoints:
   - Auth, Users, Rooms, Bookings, Admin Bookings, Guests, Dashboard, Settings.
8. Add seed data (admin user + starter rooms + hotel info).
9. Ensure Swagger shows all endpoints and basic request/response contracts.
10. Keep code readable and beginner-friendly with small classes and clear naming.
