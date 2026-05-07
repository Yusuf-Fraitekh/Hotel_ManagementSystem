(function () {
  "use strict";

  function getInitials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "U";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
  }

  function renderUserNavAuthArea() {
    if (!window.QS_STORAGE || !window.QS_DOM) return;

    const { KEYS, getJson } = window.QS_STORAGE;
    const { escapeHtml, byId } = window.QS_DOM;

    const user = getJson(KEYS.user, null);
    const authArea = byId("authArea");
    const navBookings = byId("navBookings");
    if (!authArea || !navBookings) return;

    if (user) {
      navBookings.style.display = "inline";
      const initials = user.initials || getInitials(user.name);
      authArea.innerHTML = `
        <a class="user-chip" href="account.html" aria-label="Profile">
          <span class="avatar">${escapeHtml(initials)}</span>
          <span>${escapeHtml(user.name)}</span>
          <i class="fa-solid fa-chevron-right muted" style="font-size:0.7rem;"></i>
        </a>
      `;
    } else {
      navBookings.style.display = "none";
      authArea.innerHTML = `
        <a class="btn btn-primary" href="../login-signin-page/authintcate.html">
          <i class="fa-regular fa-user"></i> Sign In
        </a>
      `;
    }
  }

  window.QS_USER_NAV = {
    getInitials,
    renderUserNavAuthArea,
  };
})();

