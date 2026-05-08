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
    try {
      const stats = await API.admin.settingsStats();
      document.getElementById("db-rooms").textContent = stats.rooms;
      document.getElementById("db-bookings").textContent = stats.bookings;
      document.getElementById("db-user").textContent = stats.users;
    } catch (err) {
      showToast(err.message || "Failed to load stats.", false);
    }
  }

  function initHotelInfo() {
    API.admin.hotelInfo()
      .then((info) => {
        document.getElementById("hotel-name").value = info.name || "";
        document.getElementById("hotel-city").value = info.city || "";
        document.getElementById("hotel-country").value = info.country || "";
        document.getElementById("hotel-email").value = info.email || "";
      })
      .catch((err) => showToast(err.message || "Failed to load hotel info.", false));

    document.getElementById("save-hotel-btn").addEventListener("click", async () => {
      const updated = {
        name: document.getElementById("hotel-name").value.trim(),
        city: document.getElementById("hotel-city").value.trim(),
        country: document.getElementById("hotel-country").value.trim(),
        email: document.getElementById("hotel-email").value.trim(),
      };
      try {
        await API.admin.updateHotelInfo(updated);
        const m = document.getElementById("hotel-msg");
        m.textContent = "✓ Information saved successfully.";
        m.style.display = "block";
        setTimeout(() => (m.style.display = "none"), 3000);
      } catch (err) {
        showToast(err.message || "Failed to save hotel info.", false);
      }
    });
  }

  function initActions() {
    document.getElementById("refresh-db-btn").addEventListener("click", async () => {
      await refreshStats();
      showToast("Stats refreshed.");
    });

    document.getElementById("clear-bookings-btn").addEventListener("click", async () => {
      if (!confirm("Delete ALL bookings from the system? This cannot be undone.")) return;
      try {
        await API.admin.clearBookings();
        await refreshStats();
        showToast("All bookings deleted.");
      } catch (err) {
        showToast(err.message || "Failed to clear bookings.", false);
      }
    });

    document.getElementById("reset-rooms-btn").addEventListener("click", async () => {
      if (!confirm("Reset rooms to defaults? All custom rooms will be lost.")) return;
      try {
        await API.admin.resetRooms();
        await refreshStats();
        showToast("Rooms reset to defaults.");
      } catch (err) {
        showToast(err.message || "Failed to reset rooms.", false);
      }
    });

    document.getElementById("clear-all-btn").addEventListener("click", async () => {
      if (!confirm("⚠️ This will DELETE all rooms, bookings, and hotel data. User accounts are NOT deleted. Proceed?")) return;
      try {
        await API.admin.clearAllData();
        window.QS_API.clearSession();
        showToast("Database wiped. Redirecting...");
        setTimeout(() => (window.location.href = "/pages/login-signin-page/authintcate.html"), 2500);
      } catch (err) {
        showToast(err.message || "Failed to wipe data.", false);
      }
    });
  }

  async function init() {
    initHotelInfo();
    initActions();
    await refreshStats();
  }

  document.addEventListener("DOMContentLoaded", () => { void init(); });
})();

