(function () {
  "use strict";

  const { escapeHtml } = window.QS_DOM || {
    escapeHtml: str => str ? String(str).replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])) : ''
  };
  const API = window.QS_API;

  let state = {
    bookings: [],
    filtered: [],
    currentSearch: '',
    deletingId: null
  };

  document.addEventListener('DOMContentLoaded', () => {
    void loadBookings();
    initEventListeners();
  });

  async function loadBookings() {
    try {
      const response = await API.admin.bookings({ page: 1, pageSize: 20 });
      state.bookings = (response.items || []).map(API.bookings.mapBooking);
      // Sort newest first
      state.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderStats();
      applyFilters();
    } catch (err) {
      state.bookings = [];
      renderStats();
      renderGrid([]);
      showToast(err.message || "Failed to load bookings.");
    }
  }

  function renderStats() {
    const total = state.bookings.length;
    const today = new Date().toISOString().split('T')[0];
    const confirmed = state.bookings.filter(b => b.status !== 'cancelled').length;
    const checkedin = state.bookings.filter(b => b.status !== 'cancelled' && b.checkin <= today && b.checkout > today).length;
    const revenue = state.bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.total || 0), 0);

    setText('st-total',     total);
    setText('st-confirmed', confirmed);
    setText('st-checkedin', checkedin);
    setText('st-revenue',   revenue.toLocaleString() + ' SAR');
  }

  function applyFilters() {
    let res = [...state.bookings];
    if (state.currentSearch) {
      const q = state.currentSearch.toLowerCase();
      res = res.filter(b =>
        (b.id       && String(b.id) === q)                   ||
        (b.roomName && b.roomName.toLowerCase().includes(q)) ||
        (b.userName && b.userName.toLowerCase().includes(q))
      );
    }
    state.filtered = res;
    renderGrid(state.filtered);
  }

  function renderGrid(list) {
    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:50px;color:var(--text-muted);font-weight:700;">
        <i class="fa-solid fa-calendar-xmark" style="font-size:2rem;color:#e2e8f0;display:block;margin-bottom:12px;"></i>
        No bookings found in the system.
      </td></tr>`;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const avatarColors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6'];

    tbody.innerHTML = list.map(b => {
      const nights = b.nights || 1;
      // Derive initials from userName or userId (email)
      const displayName = String(b.userName || b.userId || 'Unknown');
      const initials = displayName
        .split(/[\s@]+/).filter(p => p.length > 0)
        .map(p => p[0].toUpperCase()).slice(0, 2).join('');
      const colorKey = displayName.charCodeAt(0) || 0;
      const avatarColor = avatarColors[colorKey % avatarColors.length];

      const isCancelled = b.status === 'cancelled';
      const isActive = !isCancelled && b.checkin <= today && b.checkout > today;
      let statusClass, statusLabel;
      if (isCancelled) {
        statusClass = 'cancelled';
        statusLabel = 'Cancelled';
      } else if (isActive) {
        statusClass = 'checkedin';
        statusLabel = 'Checked-In';
      } else {
        statusClass = 'confirmed';
        statusLabel = 'Confirmed';
      }

      return `
        <tr>
          <td style="font-family:monospace;font-weight:800;color:var(--brand);font-size:0.8rem;">#${escapeHtml(String(b.id).slice(-8).toUpperCase())}</td>
          <td>
            <div class="guest-info">
              <div class="guest-av" style="background:${avatarColor}">${initials}</div>
              <div>
                <div class="guest-name">${escapeHtml(b.userName || 'Guest')}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">${escapeHtml(b.userId || '')}</div>
              </div>
            </div>
          </td>
          <td><span style="background:#f1f5f9;padding:4px 10px;border-radius:8px;font-weight:700;font-size:0.85rem;">${escapeHtml(b.roomName || '')}</span></td>
          <td style="font-weight:600;color:var(--text-secondary);">${formatDate(b.checkin)}</td>
          <td style="font-weight:600;color:var(--text-secondary);">${formatDate(b.checkout)}</td>
          <td><span style="background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:8px;font-weight:800;font-size:0.85rem;">${nights} night${nights > 1 ? 's' : ''}</span></td>
          <td style="font-weight:900;color:#0f172a;">${(b.total || 0).toLocaleString()} SAR</td>
          <td><span class="status-badge ${statusClass}"><span class="dot"></span>${statusLabel}</span></td>
          <td>
            <div class="action-btns">
              <button class="icon-btn del-btn" data-id="${b.id}" title="Delete Booking"><i class="fa-solid fa-trash" style="color:#ef4444;"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function initEventListeners() {
    document.getElementById('search-input')?.addEventListener('input', e => {
      state.currentSearch = e.target.value.trim();
      applyFilters();
    });

    document.getElementById('bookings-tbody')?.addEventListener('click', e => {
      const btn = e.target.closest('.del-btn');
      if (btn) openDeleteModal(btn.dataset.id);
    });

    document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
      if (!state.deletingId) return;
      const id = state.deletingId;
      state.deletingId = null;
      closeModal('modal-overlay');
      try {
        await API.admin.deleteBooking(id);
        showToast('Booking permanently deleted.', 'success');
        await loadBookings();
      } catch (err) {
        showToast(err.message || 'Failed to delete booking.', 'error');
        await loadBookings();
      }
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    document.getElementById('modal-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') closeModal('modal-overlay');
    });
  }

  function openDeleteModal(id) {
    const b = state.bookings.find(x => String(x.id) === String(id));
    if (!b) return;
    state.deletingId = id;
    setText('del-booking-id', `<strong>${escapeHtml(b.userName || b.userId || 'Guest')}</strong> — ${escapeHtml(b.roomName || '')} (${formatDate(b.checkin)} → ${formatDate(b.checkout)})`);
    document.getElementById('modal-overlay')?.classList.add('open');
    document.getElementById('delete-modal')?.classList.add('open');
  }

  function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
    document.getElementById('delete-modal')?.classList.remove('open');
  }

  function setText(id, val) { const el = document.getElementById(id); if (el) el.innerHTML = val; }
  function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }

  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

})();