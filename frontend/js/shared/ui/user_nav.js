(function () {
  "use strict";

  function getInitials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "U";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
  }

  async function renderUserNavAuthArea() {
    if (!window.QS_DOM || !window.QS_API) return;
    const { escapeHtml, byId } = window.QS_DOM;

    const authArea = byId("authArea");
    const navBookings = byId("navBookings");
    if (!authArea || !navBookings) return;

    const authUser = window.QS_API.getAuthUser();
    if (!authUser) {
      navBookings.style.display = "none";
      authArea.innerHTML = `
        <a class="btn btn-primary" href="../login-signin-page/authintcate.html">
          <i class="fa-regular fa-user"></i> Sign In
        </a>
      `;
      return;
    }

    let displayName = authUser.name;
    try {
      const me = await window.QS_API.users.me();
      displayName = me?.fullName || displayName;
    } catch (_) {
      // Keep JWT-derived user name if profile endpoint fails.
    }

    navBookings.style.display = "inline";
    const initials = getInitials(displayName);
    authArea.innerHTML = `
      <a class="user-chip" href="account.html" aria-label="Profile">
        <span class="avatar">${escapeHtml(initials)}</span>
        <span>${escapeHtml(displayName)}</span>
        <i class="fa-solid fa-chevron-right muted" style="font-size:0.7rem;"></i>
      </a>
    `;
  }

  window.QS_USER_NAV = {
    getInitials,
    renderUserNavAuthArea,
  };
})();

