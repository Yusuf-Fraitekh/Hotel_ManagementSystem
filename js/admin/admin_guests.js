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

  let allGuests = [];

  function buildGuestMap(bookings) {
    const map = {};
    bookings.forEach((b) => {
      const key = b.userId || "unknown";
      if (!map[key]) {
        map[key] = {
          email: b.userId || "—",
          name: b.userName || b.userId || "Unknown Guest",
          bookings: [],
          totalSpent: 0,
          lastBooking: null,
        };
      }
      map[key].bookings.push(b);
      map[key].totalSpent += b.total || 0;
      if (!map[key].lastBooking || b.createdAt > map[key].lastBooking) {
        map[key].lastBooking = b.createdAt;
      }
    });
    return Object.values(map);
  }

  function renderTable(guests) {
    const tbody = document.getElementById("guests-tbody");
    if (!tbody) return;

    const today = todayIsoDate();
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
        const isActive = false;

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
      const guests = await API.admin.guests(search);
      allGuests = (guests || []).map(g => ({
        email: g.email,
        name: g.fullName,
        bookings: [],
        totalSpent: 0,
        lastBooking: null
      }));
      allGuests.sort((a, b) => a.name.localeCompare(b.name));

      document.getElementById("g-total").textContent = allGuests.length;
      document.getElementById("g-active").textContent = "0";
      document.getElementById("g-revenue").textContent = "0 SAR";
      renderTable(allGuests);
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

