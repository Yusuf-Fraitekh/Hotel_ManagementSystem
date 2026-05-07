(function () {
  "use strict";

  const { byId, escapeHtml } = window.QS_DOM || {
    byId:       id  => document.getElementById(id),
    escapeHtml: str => str ? String(str).replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])) : ''
  };

  const API = window.QS_API;
  const { todayIsoDate, formatDateLong } = window.QS_DATES || {
    todayIsoDate: () => new Date().toISOString().split("T")[0],
    formatDateLong: (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""),
  };

  let state = {
    bookings:  [],
    rooms: [],
    guests:    [],
    calYear:   new Date().getFullYear(),
    calMonth:  new Date().getMonth()
  };

  document.addEventListener('DOMContentLoaded', () => { void init(); });

  async function init() {
    injectModalHTML();
    await loadDashboard();
    initGlobalListeners();
    initLiveClock();
  }

  function initLiveClock() {
    const el = byId("live-time");
    if (!el) return;
    setInterval(() => {
      el.textContent = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }, 1000);
  }

  async function loadDashboard() {
    try {
      const details = await API.admin.dashboardDetails();
      const summary = details.summary || { totalRevenue: 0, totalBookings: 0, activeRooms: 0, totalGuests: 0 };
      state.bookings = (details.recentBookings || []).map(API.bookings.mapBooking);

      const avgStay = state.bookings.length
        ? (state.bookings.reduce((sum, b) => sum + (b.nights || 1), 0) / state.bookings.length).toFixed(1)
        : 0;

      renderStats({
        totalRevenue: summary.totalRevenue || 0,
        totalBookings: summary.totalBookings || 0,
        occupancyRate: summary.activeRooms || 0,
        avgStayDuration: avgStay
      });
      
      // Render Bookings Table (Last 10)
      const recent = [...state.bookings].slice(0, 10);
      renderBookingsTable(recent);
      
      renderCalendar();
      initFilterTabs();

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast(err.message || 'Failed to load dashboard data. Please refresh.');
    }
  }

  function renderStats(stats) {
    if (!stats) return;
    setText('stat-revenue',  `${stats.totalRevenue.toLocaleString()} SAR`);
    setText('stat-bookings', stats.totalBookings);
    setText('stat-occupancy', `${stats.occupancyRate}<span>%</span>`);
    setText('stat-avgstay',  `${stats.avgStayDuration}<span> nights</span>`);
  }

  function renderBookingsTable(bookingsList) {
    const tbody = byId('bookings-tbody');
    if (!tbody) return;

    if (!bookingsList.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px;">No recent bookings found in database.</td></tr>`;
      return;
    }

    tbody.innerHTML = bookingsList.map(b => {
      const displayName = b.userName || b.userId || 'Unknown';
      const initials = displayName.split(/[\s@]+/).filter(p => p.length > 0)
                                  .map(p => p[0].toUpperCase()).slice(0, 2).join('');
      return `
      <tr data-id="${escapeHtml(b.id)}">
        <td>
          <div class="guest-cell">
            <div class="guest-av" style="background:#3b82f6">${initials}</div>
            <div>
              <div class="guest-name">${escapeHtml(b.userName || 'Guest')}</div>
              <div class="guest-id">${escapeHtml(b.userId || `#${String(b.id).substring(0,6)}`)}</div>
            </div>
          </div>
        </td>
        <td><div class="room-badge"><i class="fa-solid fa-door-open" style="color:var(--gold);font-size:10px;"></i> ${escapeHtml(b.roomName)}</div></td>
        <td><div class="date-text">${formatDateLong(b.checkin)}</div></td>
        <td><div class="date-text">${formatDateLong(b.checkout)}</div></td>
        <td><div class="amount">${(b.total||0).toLocaleString()} SAR</div></td>
        <td><span class="status-badge confirmed"><span class="dot"></span>Confirmed</span></td>
        <td>
          <div class="row-actions">
             <div class="icon-btn red del-btn" title="Delete" data-id="${escapeHtml(b.id)}"><i class="fa-solid fa-trash"></i></div>
          </div>
        </td>
        </td>
      </tr>
      `;
    }).join('');
  }

  function renderCalendar() {
    // simplified mock or placeholder since dynamic implementation requires massive logic
    // we'll keep basic logic using state.bookings "checkin"
    const miniCal = document.querySelector('.mini-cal');
    if (!miniCal) return;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const bookedDays = new Set();
    state.bookings.forEach(b => {
      const ci = new Date(b.checkin);
      if (ci.getFullYear() === state.calYear && ci.getMonth() === state.calMonth) bookedDays.add(ci.getDate());
    });

    const today      = new Date();
    const firstDay   = new Date(state.calYear, state.calMonth, 1).getDay();
    const daysInMon  = new Date(state.calYear, state.calMonth + 1, 0).getDate();
    const daysInPrev = new Date(state.calYear, state.calMonth, 0).getDate();

    let html = `
      <div class="cal-month" style="margin-bottom:12px; font-weight:800; font-size:1.1rem; color:var(--brand);">${monthNames[state.calMonth]} ${state.calYear}</div>
      <div class="cal-grid">
        <div class="cal-day-header">Su</div><div class="cal-day-header">Mo</div><div class="cal-day-header">Tu</div>
        <div class="cal-day-header">We</div><div class="cal-day-header">Th</div><div class="cal-day-header">Fr</div><div class="cal-day-header">Sa</div>
    `;

    for (let i = firstDay - 1; i >= 0; i--) html += `<div class="cal-day other-month">${daysInPrev - i}</div>`;

    for (let d = 1; d <= daysInMon; d++) {
      const isToday = d === today.getDate() && state.calMonth === today.getMonth() && state.calYear === today.getFullYear();
      const hasBook = bookedDays.has(d);
      const classes = ['cal-day', isToday ? 'today' : '', hasBook ? 'has-booking' : ''].filter(Boolean).join(' ');
      html += `<div class="${classes}">${d}</div>`;
    }

    const totalCells = firstDay + daysInMon;
    const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let d = 1; d <= remainder; d++) html += `<div class="cal-day other-month">${d}</div>`;

    html += `</div>`;
    miniCal.innerHTML = html;
  }

  function initGlobalListeners() {
    const tbody = byId('bookings-tbody');
    if (tbody) {
      tbody.addEventListener('click', e => {
        const btn = e.target.closest('.icon-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.classList.contains('del-btn'))  openDeleteConfirm(id);
      });
    }

    document.body.addEventListener('click', e => {
      if (e.target.id === 'modal-overlay' || e.target.closest('.modal-close-btn')) {
        closeModal();
      }
    });
  }

  function initFilterTabs() {} // Simplified

  // Basic modaling 
  function injectModalHTML() {
    const wrapper = document.createElement('div');
    wrapper.id = 'modal-root';
    wrapper.innerHTML = `
      <div id="modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;backdrop-filter:blur(2px);"></div>
      <div id="modal-delete" class="ad-modal" style="display:none;max-width:400px;background:#fff;padding:24px;border-radius:16px;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1001;">
          <h3 style="color:#ef4444; margin-bottom:12px;">Confirm Deletion</h3>
          <p id="delete-confirm-text" style="color:#475569;font-size:14px;margin-bottom:20px;"></p>
          <div style="display:flex; justify-content:flex-end; gap:8px;">
             <button class="ad-btn ghost modal-close-btn" style="padding:10px 18px; border:none; border-radius:8px; cursor:pointer;">Cancel</button>
             <button class="ad-btn" id="delete-confirm-btn" style="background:#ef4444; color:#fff; border:none; padding:10px 18px; border-radius:8px; cursor:pointer;">Purge Booking</button>
          </div>
      </div>
      <div id="ad-toast" style="display:none;position:fixed;bottom:24px;right:24px;z-index:2000;background:#111;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:700;"></div>
    `;
    document.body.appendChild(wrapper);
  }

  function openDeleteConfirm(id) {
    const b = state.bookings.find(x => String(x.id) === String(id));
    if (!b) return;

    byId('delete-confirm-text').innerHTML = `Delete booking for room: <strong>${escapeHtml(b.roomName)}</strong>?`;
    byId('delete-confirm-btn').onclick = async () => {
      await API.admin.deleteBooking(id);
      state.bookings = state.bookings.filter(x => String(x.id) !== String(id));
      closeModal();
      await loadDashboard();
      showToast('Booking successfully annihilated.');
    };
    byId('modal-overlay').style.display='block';
    byId('modal-delete').style.display='block';
  }

  function closeModal(){
     if(byId('modal-overlay')) byId('modal-overlay').style.display = 'none';
     if(byId('modal-delete')) byId('modal-delete').style.display = 'none';
  }

  function showToast(msg) {
    const t = byId('ad-toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
  }

  function setText(id, value) {
    const el = byId(id);
    if (el) el.innerHTML = value;
  }
})();