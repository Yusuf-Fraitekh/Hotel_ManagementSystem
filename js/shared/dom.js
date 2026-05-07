(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function byId(id) {
    return document.getElementById(id);
  }

  window.QS_DOM = {
    escapeHtml,
    byId,
  };

  // --- GLOBAL AUTH GUARD ---
  document.addEventListener("DOMContentLoaded", () => {
    const currentUser = (() => {
      try {
        return JSON.parse(sessionStorage.getItem("qs_user") || "null");
      } catch (_) {
        return null;
      }
    })();
    const hasToken = !!sessionStorage.getItem("qs_access_token");
    const path = window.location.pathname.toLowerCase();

    // 1. If hitting Auth page while already logged in
    if (path.includes("authintcate.html")) {
      if (currentUser && hasToken) {
        if (String(currentUser.role || "").toLowerCase() === "admin") {
          window.location.replace("/pages/admin/dashboard.html");
        } else {
          window.location.replace("/pages/user/index.html");
        }
      }
      return;
    }

    // 2. Admin Route Protection
    if (path.includes("/admin/")) {
      if (!currentUser || !hasToken || String(currentUser.role || "").toLowerCase() !== "admin") {
        window.location.replace("/pages/login-signin-page/authintcate.html");
      }
      return;
    }

    // 3. User Route Protection (Account, Bookings)
    // We leave index.html, rooms.html, and room_details.html accessible to guests
    if (path.includes("/user/account.html") || path.includes("/user/bookings.html")) {
      if (!currentUser || !hasToken) {
        window.location.replace("/pages/login-signin-page/authintcate.html");
      }
      return;
    }
  });

})();
