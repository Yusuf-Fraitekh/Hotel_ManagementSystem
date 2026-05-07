(function () {
  "use strict";

  const API_BASE_URL =
    window.API_BASE_URL ||
    (window.location.origin + "/api");

  const TOKEN_KEY = "qs_access_token";
  const USER_KEY = "qs_user";

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setSession(authResponse) {
    if (!authResponse) return;
    sessionStorage.setItem(TOKEN_KEY, authResponse.accessToken || "");
    if (authResponse.user) {
      sessionStorage.setItem(
        USER_KEY,
        JSON.stringify({
          id: authResponse.user.id,
          name: authResponse.user.fullName,
          email: authResponse.user.email,
          role: String(authResponse.user.role || "User").toLowerCase(),
          phone: authResponse.user.phone || "",
          initials: getInitials(authResponse.user.fullName),
        })
      );
    }
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function getInitials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "U";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
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
        if (window.location.pathname.toLowerCase().includes("/pages/admin/")) {
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
      status: b.status,
      createdAt: b.createdAt,
    };
  }

  window.QS_API = {
    baseUrl: API_BASE_URL,
    getToken,
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
