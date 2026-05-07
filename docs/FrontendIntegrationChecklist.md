# Frontend Integration Checklist

## Auth Page (`pages/login-signin-page/authintcate.html`)
- Login -> `POST /api/auth/login`
- Register -> `POST /api/auth/register`
- Save `accessToken` and attach as `Authorization: Bearer <token>`

## User Home + Rooms (`pages/user/index.html`, `pages/user/rooms.html`)
- Rooms list -> `GET /api/rooms`
- Pass filters as query params: `checkIn`, `checkOut`, `guests`, `type`, `bed`, `view`, `floor`, `stayType`, `tag`, `priceMin`, `priceMax`, `sort`, `page`, `pageSize`
- Replace local availability/filter logic with backend response

## Room Details + Booking (`pages/user/room_details.html`)
- Room details -> `GET /api/rooms/{id}`
- Create booking -> `POST /api/bookings`
- Extend booking -> `PATCH /api/bookings/{id}/extend`

## User Bookings + Account (`pages/user/bookings.html`, `pages/user/account.html`)
- My bookings -> `GET /api/bookings/me`
- Cancel booking -> `PATCH /api/bookings/{id}/cancel`
- Profile -> `GET /api/users/me`, `PUT /api/users/me`

## Admin Pages (`pages/admin/*`)
- Rooms CRUD -> `POST/PUT/DELETE /api/rooms`
- All bookings -> `GET /api/admin/bookings`, `DELETE /api/admin/bookings/{id}`
- Guests -> `GET /api/admin/guests`
- Dashboard -> `GET /api/admin/dashboard/summary`
- Settings -> `GET/PUT /api/admin/settings/hotel-info`

## Storage Migration Notes
- Keep localStorage only for temporary UI draft state.
- Remove local role-based auth checks and use JWT + 401/403 handling.
