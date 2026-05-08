(function () {
  "use strict";

  const API_BASE_URL =
    window.API_BASE_URL ||
    (window.location.origin + "/api");

  const TOKEN_KEY = "qs_access_token";

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setSession(authResponse) {
    if (!authResponse) return;
    sessionStorage.setItem(TOKEN_KEY, authResponse.accessToken || "");
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function decodeJwtPayload(token) {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64);
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  }

  function getAuthUser() {
    const token = getToken();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    const role =
      String(payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "user")
        .toLowerCase();
    const name =
      String(payload.name || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "User");
    const idRaw =
      payload.nameid ||
      payload.sub ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    const id = Number(idRaw);

    return {
      id: Number.isFinite(id) ? id : null,
      name,
      email: String(payload.email || ""),
      role,
    };
  }

  async function request(path, options) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };
    if (token) headers.Authorization = "Bearer " + token;

    const response = await fetch(API_BASE_URL + path, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let payload = null;
      try {
        payload = await response.json();
      } catch (_) {
        payload = null;
      }
      if (response.status === 401 || response.status === 403) {
        const p = window.location.pathname.toLowerCase();
        const isProtected =
          p.includes("/pages/admin/") ||
          p.includes("/user/account.html") ||
          p.includes("/user/bookings.html");
        if (isProtected) {
          clearSession();
          window.location.href = "/pages/login-signin-page/authintcate.html";
        }
      }
      let message =
        payload?.message ||
        payload?.detail ||
        payload?.title ||
        "Request failed.";
      if (payload?.errors && typeof payload.errors === "object") {
        const all = Object.values(payload.errors).flat();
        if (all.length) {
          message = all.join(" | ");
        }
      }
      throw new Error(message);
    }

    if (response.status === 204) return null;
    return await response.json();
  }

  function mapRoom(r) {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      bed: r.bedType,
      view: r.viewType,
      floor: r.floor,
      maxGuests: r.maxGuests,
      price: r.pricePerNight,
      stayType: r.stayType,
      description: r.description || "",
      tags: r.tags || [],
      images: r.images || [],
      image: (r.images || [])[0] || "",
    };
  }

  function mapBooking(b) {
    const nights = Math.max(
      1,
      Math.round(
        (new Date(b.checkOutDate + "T00:00:00Z") - new Date(b.checkInDate + "T00:00:00Z")) / 86400000
      )
    );
    return {
      id: b.id,
      userId: String(b.userId),
      userName: b.userName,
      roomId: b.roomId,
      roomName: b.roomName,
      checkin: b.checkInDate,
      checkout: b.checkOutDate,
      guests: b.guestsCount,
      stayType: b.stayType,
      pricePerNight: b.pricePerNight,
      total: b.total,
      nights,
      status: (b.status || "Confirmed").toLowerCase(),
      notes: b.notes || null,
      createdAt: b.createdAt,
    };
  }

  window.QS_API = {
    baseUrl: API_BASE_URL,
    getToken,
    getAuthUser,
    setSession,
    clearSession,
    request,
    auth: {
      login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
      register: (fullName, email, password, phone) =>
        request("/auth/register", { method: "POST", body: JSON.stringify({ fullName, email, password, phone: phone || null }) }),
      logout: () => request("/auth/logout", { method: "POST" }),
    },
    users: {
      me: () => request("/users/me"),
      updateMe: (fullName, phone) => request("/users/me", { method: "PUT", body: JSON.stringify({ fullName, phone: phone || null }) }),
    },
    rooms: {
      list: (query) => {
        const p = new URLSearchParams();
        Object.entries(query || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
        });
        return request("/rooms" + (p.toString() ? "?" + p.toString() : ""));
      },
      get: (id) => request("/rooms/" + id),
      create: (payload) => request("/rooms", { method: "POST", body: JSON.stringify(payload) }),
      update: (id, payload) => request("/rooms/" + id, { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id) => request("/rooms/" + id, { method: "DELETE" }),
      mapRoom,
    },
    bookings: {
      mine: (query) => {
        const p = new URLSearchParams();
        Object.entries(query || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
        });
        return request("/bookings/me" + (p.toString() ? "?" + p.toString() : ""));
      },
      create: (payload) => request("/bookings", { method: "POST", body: JSON.stringify(payload) }),
      extend: (id, newCheckOutDate) =>
        request("/bookings/" + id + "/extend", { method: "PATCH", body: JSON.stringify({ newCheckOutDate }) }),
      cancel: (id) => request("/bookings/" + id + "/cancel", { method: "PATCH" }),
      mapBooking,
    },
    admin: {
      rooms: (query) => {
        const p = new URLSearchParams();
        Object.entries(query || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
        });
        return request("/admin/rooms" + (p.toString() ? "?" + p.toString() : ""));
      },
      bookings: (query) => {
        const p = new URLSearchParams();
        Object.entries(query || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
        });
        return request("/admin/bookings" + (p.toString() ? "?" + p.toString() : ""));
      },
      deleteBooking: (id) => request("/admin/bookings/" + id, { method: "DELETE" }),
      guests: (search) => request("/admin/guests" + (search ? "?search=" + encodeURIComponent(search) : "")),
      dashboard: () => request("/admin/dashboard/summary"),
      dashboardDetails: () => request("/admin/dashboard/details"),
      hotelInfo: () => request("/admin/settings/hotel-info"),
      updateHotelInfo: (payload) => request("/admin/settings/hotel-info", { method: "PUT", body: JSON.stringify(payload) }),
      settingsStats: () => request("/admin/settings/stats"),
      clearBookings: () => request("/admin/settings/bookings", { method: "DELETE" }),
      resetRooms: () => request("/admin/settings/reset-rooms", { method: "POST" }),
      clearAllData: () => request("/admin/settings/all-data", { method: "DELETE" }),
    },
  };
})();
