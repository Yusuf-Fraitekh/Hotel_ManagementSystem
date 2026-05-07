(function () {
  "use strict";

  const API = window.QS_API;

  function showToast(msg, success = true) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.background = success ? "#0f172a" : "#ef4444";
    t.style.color = "#fff";
    t.style.display = "block";
    setTimeout(() => (t.style.display = "none"), 3000);
  }

  async function refreshStats() {
    const stats = await API.admin.settingsStats();
    document.getElementById("db-rooms").textContent = stats.rooms;
    document.getElementById("db-bookings").textContent = stats.bookings;
    document.getElementById("db-user").textContent = stats.users;
  }

  function initHotelInfo() {
    API.admin.hotelInfo().then((info) => {
      document.getElementById("hotel-name").value = info.name || "";
      document.getElementById("hotel-city").value = info.city || "";
      document.getElementById("hotel-country").value = info.country || "";
      document.getElementById("hotel-email").value = info.email || "";
    });

    document.getElementById("save-hotel-btn").addEventListener("click", async () => {
      const updated = {
        name: document.getElementById("hotel-name").value.trim(),
        city: document.getElementById("hotel-city").value.trim(),
        country: document.getElementById("hotel-country").value.trim(),
        email: document.getElementById("hotel-email").value.trim(),
      };
      await API.admin.updateHotelInfo(updated);
      const m = document.getElementById("hotel-msg");
      m.textContent = "✓ Information saved successfully.";
      m.style.display = "block";
      setTimeout(() => (m.style.display = "none"), 3000);
    });
  }

  function initActions() {
    document.getElementById("refresh-db-btn").addEventListener("click", async () => {
      await refreshStats();
      showToast("Stats refreshed.");
    });

    document.getElementById("clear-bookings-btn").addEventListener("click", async () => {
      if (!confirm("Delete ALL bookings from the system? This cannot be undone.")) return;
      await API.admin.clearBookings();
      await refreshStats();
      showToast("All bookings deleted.");
    });

    document.getElementById("reset-rooms-btn").addEventListener("click", async () => {
      if (!confirm("Reset rooms to 3 defaults? All custom rooms will be lost.")) return;
      await API.admin.resetRooms();
      await refreshStats();
      showToast("Rooms reset to defaults.");
    });

    document.getElementById("clear-all-btn").addEventListener("click", async () => {
      if (!confirm("⚠️ This will DELETE everything — rooms, bookings, and user account. Proceed?")) return;
      await API.admin.clearAllData();
      window.QS_API.clearSession();
      showToast("Database wiped. Redirecting...");
      setTimeout(() => (window.location.href = "/pages/login-signin-page/authintcate.html"), 2500);
    });
  }

  async function init() {
    initHotelInfo();
    initActions();
    await refreshStats();
  }

  void init();
})();

