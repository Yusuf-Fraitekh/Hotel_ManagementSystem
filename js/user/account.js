(function () {
  "use strict";

  const API = window.QS_API;
  const { escapeHtml, byId } = window.QS_DOM;
  const { formatDateLong } = window.QS_DATES;

  async function loadBookings() {
    const response = await API.bookings.mine({ page: 1, pageSize: 100 });
    return (response.items || []).map(API.bookings.mapBooking);
  }

  function calcStats(list) {
    const totalBookings = list.length;
    const totalNights = list.reduce((s, b) => s + (b.nights || 0), 0);
    const totalAmount = list.reduce((s, b) => s + (b.total || 0), 0);
    return { totalBookings, totalNights, totalAmount };
  }

  function renderUser(user) {
    const avatarInitialsEl = byId("avatarInitials");
    const displayNameEl = byId("displayName");
    const displaySubtitleEl = byId("displaySubtitle");
    const infoNameEl = byId("infoName");
    const infoEmailEl = byId("infoEmail");
    const inputNameEl = byId("inputName");
    const inputEmailEl = byId("inputEmail");

    if (!user) {
      avatarInitialsEl.textContent = "U";
      displayNameEl.textContent = "Guest";
      displaySubtitleEl.textContent = "Not logged in yet";
      infoNameEl.textContent = "Not Available";
      infoEmailEl.textContent = "Not Available";
      inputNameEl.value = "";
      inputEmailEl.value = "";
      return;
    }

    const initials = window.QS_USER_NAV?.getInitials?.(user.name) || "U";
    avatarInitialsEl.textContent = initials;
    displayNameEl.textContent = user.name || "User";
    displaySubtitleEl.textContent = user.email ? user.email : "QuickStay Member";
    infoNameEl.textContent = user.name || "Not Available";
    infoEmailEl.textContent = user.email || "Not Available";
    inputNameEl.value = user.name || "";
    inputEmailEl.value = user.email || "";

    // Email cannot be changed via this form (the API only accepts fullName + phone).
    // Lock the field for all users so there is no false expectation.
    inputEmailEl.readOnly = true;
    inputEmailEl.style.opacity = "0.6";
    inputEmailEl.style.cursor = "not-allowed";
    inputEmailEl.title = String(user.role || "").toLowerCase() === "admin"
      ? "Admin email cannot be altered."
      : "Email cannot be changed here. Contact support if needed.";
  }

  async function renderStatsAndPreview() {
    const bookings = await loadBookings();
    const statsBox = byId("statsBox");
    const previewEl = byId("bookingsPreview");
    const { totalBookings, totalNights, totalAmount } = calcStats(bookings);

    statsBox.innerHTML = `
      <div style="display:flex; flex-direction:row; gap:16px; flex-wrap:wrap; margin-top:16px;">
        <div style="flex:1; min-width:200px; display:flex; align-items:center; justify-content:space-between; background:var(--bg-body); padding:12px 16px; border-radius:12px; border:1px solid var(--border-color);">
          <div style="display:flex; align-items:center; gap:10px; color:var(--muted); font-weight:700;"><i class="fa-solid fa-briefcase" style="color:var(--brand); font-size:1.2rem;"></i> Total Bookings</div>
          <strong style="font-size:1.1rem; color:var(--text); font-weight:900;">${totalBookings}</strong>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-body); padding:12px 16px; border-radius:12px; border:1px solid var(--border-color);">
          <div style="display:flex; align-items:center; gap:10px; color:var(--muted); font-weight:700;"><i class="fa-solid fa-moon" style="color:#6366f1; font-size:1.2rem;"></i> Total Nights</div>
          <strong style="font-size:1.1rem; color:var(--text); font-weight:900;">${totalNights}</strong>
        </div>
        <div style="flex:1; min-width:250px; display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%); padding:16px; border-radius:12px; box-shadow:0 10px 20px rgba(0,0,0,0.15);">
          <div style="display:flex; flex-direction:column; gap:4px; color:#cbd5e1; font-weight:700;">
            <span style="font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">Total Spent</span>
            <strong style="font-size:1.5rem; color:#fff; font-weight:900;">${totalAmount} <span style="font-size:1rem; color:#f59e0b;">SAR</span></strong>
          </div>
          <i class="fa-solid fa-wallet" style="font-size:2.5rem; color:rgba(255,255,255,0.1);"></i>
        </div>
      </div>
    `;

    if (!bookings.length) {
      previewEl.innerHTML = `
        <div class="empty">
          <i class="fa-solid fa-folder-open" style="font-size:2rem; color:var(--muted); margin-bottom:10px; opacity:0.5;"></i><br>
          No bookings yet. Start from the rooms page.
        </div>
      `;
      return;
    }

    const recent = [...bookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    previewEl.innerHTML = `
      <div style="margin-top:24px;">
        <h4 style="font-size:1.05rem; margin-bottom:12px; font-weight:800; color:var(--text);">Recent Activity</h4>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${recent.map((b) => `
            <div style="display:flex; flex-direction:column; padding:16px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; border-left:4px solid var(--brand); box-shadow:var(--shadow-sm); transition:transform 0.2s;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                <span style="font-weight:800; color:var(--text); font-size:.95rem;">${escapeHtml(b.roomName || "Room")}</span>
                <span style="font-weight:900; color:#0f172a;">${b.total} SAR</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:.85rem; color:var(--muted); font-weight:600;">
                <span><i class="fa-regular fa-calendar" style="margin-right:4px;"></i> ${formatDateLong(b.checkin)}</span>
                <span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; color:#475569;">${b.nights || "-"} Night(s)</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div style="margin-top:16px; text-align:center;">
          <a href="bookings.html" class="btn btn-ghost" style="width:100%; justify-content:center; padding:12px; border-radius:10px; font-weight:800;">
            View All Bookings <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;
  }

  function setMessage(msgEl, text, type) {
    msgEl.textContent = text;
    msgEl.className = `message ${type}`;
    msgEl.style.display = "block";
  }

  function initForm(user) {
    const form = byId("accountForm");
    const msg = byId("formMessage");
    const logoutBtn = byId("logoutBtn");
    const clearDataBtn = byId("clearDataBtn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.style.display = "none";

      const name = byId("inputName").value.trim();
      const email = byId("inputEmail").value.trim();
      if (name && name.length < 3) {
        setMessage(msg, "Name must be at least 3 characters.", "error");
        return;
      }

      // Email is read-only and not sent to the API — only fullName and phone are updatable.
      try {
        await API.users.updateMe(name || user.name || "User", user.phone || null);
        const me = await API.users.me();
        const refreshed = {
          id: me.id,
          name: me.fullName,
          email: me.email,
          role: String(me.role || "").toLowerCase(),
          phone: me.phone || "",
        };
        renderUser(refreshed);
        user = refreshed;
        setMessage(msg, "Account changes saved successfully.", "success");
      } catch (err) {
        setMessage(msg, err.message || "Failed to save account changes.", "error");
      }
    });

    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try { await API.auth.logout(); } catch (_) { /* stateless — ignore */ }
      API.clearSession();
      window.location.replace("index.html");
    });

    clearDataBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Sign out and clear your local session?")) return;
      try { await API.auth.logout(); } catch (_) { /* stateless — ignore */ }
      API.clearSession();
      window.location.replace("index.html");
    });
  }

  async function init() {
    let user = API.getAuthUser();
    try {
      const me = await API.users.me();
      user = {
        id: me.id,
        name: me.fullName,
        email: me.email,
        role: String(me.role || "").toLowerCase(),
        phone: me.phone || "",
      };
    } catch (_) {
      user = user ? { ...user, phone: "" } : null;
    }

    renderUser(user);
    void renderStatsAndPreview();
    initForm(user || { name: "User", email: "", phone: "" });
  }

  document.addEventListener("DOMContentLoaded", () => { void init(); });
})();
