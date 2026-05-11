(function () {
  "use strict";

  const API = window.QS_API;
  const { todayIsoDate, formatDateLong } = window.QS_DATES || {
    todayIsoDate: () => new Date().toISOString().split("T")[0],
    formatDateLong: (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"),
  };

  function escapeHtml(str) {
    return str
      ? String(str).replace(/[&<>'"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[t]))
      : "";
  }

  function normalizeGuest(g) {
    return {
      id: g?.id ?? g?.Id ?? null,
      email: g?.email ?? g?.Email ?? "—",
      fullName: g?.fullName ?? g?.FullName ?? g?.name ?? g?.Name ?? "Unknown Guest",
    };
  }

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase();
  }

  function normalizeBooking(b) {
    return {
      userId: String(b?.userId ?? b?.UserId ?? "").trim(),
      userName: b?.userName ?? b?.UserName ?? "",
      total: Number(b?.total ?? b?.Total ?? 0) || 0,
      createdAt: b?.createdAt ?? b?.CreatedAt ?? null,
      checkin: b?.checkin ?? b?.checkInDate ?? b?.CheckInDate ?? "",
      checkout: b?.checkout ?? b?.checkOutDate ?? b?.CheckOutDate ?? "",
      status: String(b?.status ?? b?.Status ?? "").toLowerCase(),
    };
  }

  async function fetchAllAdminBookings() {
    const pageSize = 20;
    let page = 1;
    const all = [];
    while (true) {
      const res = await API.admin.bookings({ page, pageSize });
      const items = (res.items || []).map(API.bookings.mapBooking);
      all.push(...items);
      if (items.length < pageSize) break;
      page += 1;
      if (page > 250) break; // safety guard
    }
    return all;
  }

  function buildGuestMap(guests, bookings) {
    const map = {};
    const idIndex = {};
    const emailIndex = {};
    const nameIndex = {};

    (guests || []).forEach((rawGuest) => {
      const g = normalizeGuest(rawGuest);
      const idKey = normalizeText(g.id);
      const emailKey = normalizeText(g.email);
      const nameKey = normalizeText(g.fullName);
      const key = idKey || emailKey || nameKey;
      if (!key) return;

      map[key] = {
        id: g.id,
        email: g.email || "—",
        name: g.fullName || g.email || "Unknown Guest",
        bookings: [],
        totalSpent: 0,
        lastBooking: null,
        isActive: false,
      };

      if (idKey) idIndex[idKey] = key;
      if (emailKey && emailKey !== "—") emailIndex[emailKey] = key;
      if (nameKey) nameIndex[nameKey] = key;
    });

    (bookings || []).forEach((rawBooking) => {
      const b = normalizeBooking(rawBooking);
      const bookingIdKey = normalizeText(b.userId);
      const bookingNameKey = normalizeText(b.userName);
      const bookingEmailKey = bookingIdKey.includes("@") ? bookingIdKey : "";

      let key =
        (bookingIdKey && idIndex[bookingIdKey]) ||
        (bookingEmailKey && emailIndex[bookingEmailKey]) ||
        (bookingNameKey && nameIndex[bookingNameKey]) ||
        bookingIdKey ||
        bookingEmailKey ||
        bookingNameKey;
      if (!key) return;

      if (!map[key]) {
        map[key] = {
          id: /^\d+$/.test(bookingIdKey) ? Number(bookingIdKey) : b.userId,
          email: bookingEmailKey || "—",
          name: b.userName || "Unknown Guest",
          bookings: [],
          totalSpent: 0,
          lastBooking: null,
          isActive: false,
        };
      }

      if (bookingIdKey && !idIndex[bookingIdKey]) idIndex[bookingIdKey] = key;
      if (bookingEmailKey && !emailIndex[bookingEmailKey]) emailIndex[bookingEmailKey] = key;
      if (bookingNameKey && !nameIndex[bookingNameKey]) nameIndex[bookingNameKey] = key;

      if ((!map[key].name || map[key].name === "Unknown Guest") && b.userName) {
        map[key].name = b.userName;
      }
      if ((map[key].email === "—" || !map[key].email) && bookingEmailKey) {
        map[key].email = bookingEmailKey;
      }

      map[key].bookings.push(b);

      const isCancelled = String(b.status || "").toLowerCase() === "cancelled";
      if (!isCancelled) {
        map[key].totalSpent += b.total || 0;
      }

      if (b.createdAt && (!map[key].lastBooking || new Date(b.createdAt) > new Date(map[key].lastBooking))) {
        map[key].lastBooking = b.createdAt;
      }
    });

    const today = todayIsoDate();
    Object.values(map).forEach((g) => {
      g.isActive = g.bookings.some((b) => {
        const status = String(b.status || "").toLowerCase();
        return status !== "cancelled" && b.checkin <= today && b.checkout > today;
      });
    });

    return Object.values(map);
  }

  function renderTable(guests) {
    const tbody = document.getElementById("guests-tbody");
    if (!tbody) return;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

    if (!guests.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted);font-weight:700;">
        <i class="fa-solid fa-user-slash" style="font-size:2rem;color:#e2e8f0;display:block;margin-bottom:12px;"></i>
        No guest records found.
      </td></tr>`;
      return;
    }

    tbody.innerHTML = guests
      .map((g, i) => {
        const initials = String(g.name || "")
          .split(/[\s@.]+/)
          .filter((p) => p.length > 0)
          .map((p) => p[0].toUpperCase())
          .slice(0, 2)
          .join("");
        const color = colors[(g.email.charCodeAt(0) || i) % colors.length];
        const isActive = !!g.isActive;

        return `
        <tr>
          <td>
            <div class="guest-info">
              <div class="guest-av" style="background:${color}">${initials}</div>
              <div>
                <div class="guest-name">${escapeHtml(g.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">${g.bookings.length} booking${
          g.bookings.length !== 1 ? "s" : ""
        }</div>
              </div>
            </div>
          </td>
          <td style="color:var(--text-secondary);font-weight:600;">${escapeHtml(g.email)}</td>
          <td>
            <span style="background:#dbeafe;color:#1e40af;padding:5px 12px;border-radius:99px;font-weight:800;font-size:0.82rem;">
              ${g.bookings.length}
            </span>
          </td>
          <td style="font-weight:800;color:#0f172a;">${g.totalSpent.toLocaleString()} SAR</td>
          <td style="color:var(--text-secondary);font-weight:600;">${formatDateLong(g.lastBooking)}</td>
          <td>
            <span class="status-badge ${isActive ? "checkedin" : "confirmed"}">
              <span class="dot"></span>${isActive ? "Checked-In" : "Confirmed"}
            </span>
          </td>
        </tr>`;
      })
      .join("");
  }

  async function load(search) {
    try {
      const [guestResponse, bookings] = await Promise.all([
        API.admin.guests(search),
        fetchAllAdminBookings(),
      ]);

      const guests = (guestResponse || []).map(normalizeGuest);
      const guestsData = buildGuestMap(guests, bookings || []);
      guestsData.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

      // When a search is active, filter the built map to only show matching guests.
      // buildGuestMap creates entries for all booking users, so without this filter
      // the search would have no effect.
      const q = search ? search.trim().toLowerCase() : "";
      const filteredGuests = q
        ? guestsData.filter(g =>
            g.name.toLowerCase().includes(q) ||
            g.email.toLowerCase().includes(q)
          )
        : guestsData;

      const activeCount = filteredGuests.filter(g => g.isActive).length;
      const totalRevenue = filteredGuests.reduce((sum, g) => sum + (g.totalSpent || 0), 0);

      document.getElementById("g-total").textContent = String(filteredGuests.length);
      document.getElementById("g-active").textContent = String(activeCount);
      document.getElementById("g-revenue").textContent = `${totalRevenue.toLocaleString()} SAR`;
      renderTable(filteredGuests);
    } catch (err) {
      document.getElementById("guests-tbody").innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#ef4444;font-weight:700;">${escapeHtml(err.message || "Failed to load guests data.")}</td></tr>`;
    }
  }

  document.getElementById("search-input")?.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      void load();
      return;
    }
    void load(q);
  });

  document.addEventListener("DOMContentLoaded", () => { void load(); });
})();

