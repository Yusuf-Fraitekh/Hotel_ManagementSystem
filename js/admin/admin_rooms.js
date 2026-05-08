(function () {
  "use strict";

  const { escapeHtml } = window.QS_DOM || {
    escapeHtml: str => str ? String(str).replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])) : ''
  };
  const API = window.QS_API;

  let state = {
    rooms: [],
    bookings: [],
    filteredRooms: [],
    currentType: 'all',
    currentSearch: '',
    editingId: null,
    deletingId: null
  };

  document.addEventListener('DOMContentLoaded', () => {
    void loadRooms();
    initEventListeners();
  });

  async function loadRooms() {
    const [roomsResult, bookingsResult] = await Promise.allSettled([
      API.admin.rooms({ page: 1, pageSize: 20 }),
      API.admin.bookings({ page: 1, pageSize: 20 })
    ]);

    if (roomsResult.status === "fulfilled") {
      state.rooms = (roomsResult.value.items || []).map(API.rooms.mapRoom);
    } else {
      state.rooms = [];
      showToast(roomsResult.reason?.message || "Failed to load admin rooms.", "error");
    }

    if (bookingsResult.status === "fulfilled") {
      state.bookings = (bookingsResult.value.items || []).map(API.bookings.mapBooking);
    } else {
      state.bookings = [];
    }

    renderStats();
    applyFilters();
  }

  function renderStats() {
    const total = state.rooms.length;
    const today = new Date().toISOString().split('T')[0];

    let occupied = 0;
    state.rooms.forEach(r => {
      if (state.bookings.some(b => b.roomId === r.id && b.checkin <= today && b.checkout > today)) occupied++;
    });

    setText('rs-total',     total);
    setText('rs-available', total - occupied);
    setText('rs-occupied',  occupied);
    setText('rs-occupancy', total > 0 ? Math.round((occupied / total) * 100) + '%' : '0%');
  }

  function applyFilters() {
    let res = [...state.rooms];
    if (state.currentType !== 'all') res = res.filter(r => r.type === state.currentType);
    if (state.currentSearch) {
      const q = state.currentSearch.toLowerCase();
      res = res.filter(r => r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q));
    }
    state.filteredRooms = res;
    renderGrid();
  }

  function renderGrid() {
    const grid  = document.getElementById('rooms-grid');
    const empty = document.getElementById('empty-state');
    if (!grid) return;

    if (!state.filteredRooms.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    const today = new Date().toISOString().split('T')[0];

    grid.innerHTML = state.filteredRooms.map((r, i) => {
      const isOccupied = state.bookings.some(b => b.roomId === r.id && b.checkin <= today && b.checkout > today);
      const statusClass = isOccupied ? 'occupied' : 'confirmed';
      const statusLabel = isOccupied ? 'Occupied' : 'Available';
      const imgs = r.images || (r.image ? [r.image] : []);
      const coverSrc = imgs[0] || 'https://placehold.co/600x350?text=No+Image';

      // No stars used anymore
      const tagBadges = (r.tags || []).map(t =>
        `<span style="background:#f0f9ff;color:#0369a1;padding:3px 8px;border-radius:6px;font-size:0.7rem;font-weight:800;">${escapeHtml(t)}</span>`
      ).join('');

      return `
        <div class="room-card" style="animation:slideUp 0.3s ease both;animation-delay:${i*0.04}s;">
          <div style="position:relative;height:160px;overflow:hidden;">
            <img src="${escapeHtml(coverSrc)}" style="width:100%;height:100%;object-fit:cover;"
              onerror="this.src='https://placehold.co/600x350?text=No+Image'"/>
            <div style="position:absolute;top:10px;right:10px;">
              <span class="status-badge ${statusClass}"><span class="dot"></span>${statusLabel}</span>
            </div>
            ${imgs.length > 1 ? `<div style="position:absolute;bottom:8px;right:10px;background:rgba(0,0,0,0.6);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;"><i class="fa-solid fa-images"></i> ${imgs.length}</div>` : ''}
          </div>
          <div class="room-card-body">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <div style="font-weight:900;font-size:1.05rem;color:var(--text-primary);flex:1;">${escapeHtml(r.name)}</div>
              <div style="font-weight:900;color:var(--brand);font-size:1.1rem;white-space:nowrap;margin-left:8px;">${(r.price||0).toLocaleString()} SAR</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
              <span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;"><i class="fa-solid fa-bed"></i> ${escapeHtml(r.bed||'')}</span>
              <span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;"><i class="fa-solid fa-eye"></i> ${escapeHtml(r.view||'')}</span>
              <span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;"><i class="fa-solid fa-users"></i> ${r.maxGuests||1}</span>
              ${tagBadges}
            </div>
            <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(r.description||'')}</div>
          </div>
          <div class="room-card-footer">
            <button class="btn btn-ghost edit-btn" style="padding:8px 16px;font-size:0.82rem;" data-id="${r.id}"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn btn-danger del-btn" style="padding:8px 16px;font-size:0.82rem;" data-id="${r.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
    }).join('');
  }

  function openEditModal(id) {
    const r = state.rooms.find(x => x.id === parseInt(id));
    if (!r) return;
    state.editingId = id;
    setText('form-modal-title', 'Edit Room');
    setText('form-submit-btn', '<i class="fa-solid fa-floppy-disk"></i> Save Changes');

    document.getElementById('f-name').value     = r.name || '';
    document.getElementById('f-type').value     = r.type || 'room';
    document.getElementById('f-bed').value      = r.bed  || 'single';
    document.getElementById('f-view').value     = r.view || 'city';
    document.getElementById('f-stayType').value = r.stayType || 'flex';
    document.getElementById('f-floor').value    = r.floor || "1";
    document.getElementById('f-guests').value   = r.maxGuests || "2";
    document.getElementById('f-price').value    = r.price || 0;
    document.getElementById('f-desc').value     = r.description || '';

    // Enforce logic rule refresh
    setTimeout(enforceFormLogic, 10);

    document.querySelectorAll('input[name="rtags"]').forEach(cb => {
      cb.checked = (r.tags || []).includes(cb.value);
    });

    // Load existing images into the uploader
    const imgs = r.images || (r.image ? [r.image] : []);
    if (window._adminRoomImages) window._adminRoomImages.set(imgs);

    openModal('form-modal');
  }

  async function saveRoom() {
    const name     = document.getElementById('f-name').value.trim();
    const type     = document.getElementById('f-type').value;
    const bed      = document.getElementById('f-bed').value;
    const view     = document.getElementById('f-view').value;
    const stayType = document.getElementById('f-stayType').value;
    const floor    = parseInt(document.getElementById('f-floor').value) || 1;
    const guests   = parseInt(document.getElementById('f-guests').value) || 1;
    const price    = parseInt(document.getElementById('f-price').value) || 0;
    const desc     = document.getElementById('f-desc').value.trim();
    const tags     = Array.from(document.querySelectorAll('input[name="rtags"]:checked')).map(c => c.value);
    const images   = window._adminRoomImages ? window._adminRoomImages.get() : [];

    if (!name) { showToast('Room name is required.', 'error'); return; }
    if (!price || price < 1) { showToast('Price must be greater than 0.', 'error'); return; }
    if (!images.length) { showToast('Please upload at least one room photo.', 'error'); return; }

    const payload = { name, type, bedType: bed, viewType: view, stayType, floor, maxGuests: guests, pricePerNight: price, description: desc, tags, images };
    try {
      if (state.editingId) {
        await API.rooms.update(parseInt(state.editingId, 10), payload);
        showToast('Room updated successfully.', 'success');
      } else {
        await API.rooms.create(payload);
        showToast('Room added and synced to user portal!', 'success');
      }
      if (window._adminRoomImages) window._adminRoomImages.clear();
      closeModal('form-modal');
      await loadRooms();
    } catch (err) {
      showToast(err.message || 'Failed to save room.', 'error');
    }
  }

  function initEventListeners() {
    document.getElementById('btn-add-room')?.addEventListener('click', () => {
      state.editingId = null;
      setText('form-modal-title', 'Add New Room');
      setText('form-submit-btn', '<i class="fa-solid fa-floppy-disk"></i> Save Room');
      document.getElementById('room-form').reset();
      document.querySelectorAll('input[name="rtags"]').forEach(cb => cb.checked = false);
      if (window._adminRoomImages) window._adminRoomImages.clear();
      enforceFormLogic();
      openModal('form-modal');
    });

    document.getElementById('f-bed')?.addEventListener('change', enforceFormLogic);
    document.getElementById('f-guests')?.addEventListener('change', enforceFormLogic);
    
    document.getElementById('room-form')?.addEventListener('submit', e => { e.preventDefault(); void saveRoom(); });

    document.getElementById('rooms-grid')?.addEventListener('click', e => {
      const editBtn = e.target.closest('.edit-btn');
      const delBtn  = e.target.closest('.del-btn');
      if (editBtn) openEditModal(editBtn.dataset.id);
      if (delBtn)  openDeleteModal(delBtn.dataset.id);
    });

    document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
      if (!state.deletingId) return;
      const id = state.deletingId;
      state.deletingId = null;
      try {
        await API.rooms.remove(parseInt(id, 10));
        closeModal('delete-modal');
        showToast('Room deleted.', 'success');
        await loadRooms();
      } catch (err) {
        closeModal('delete-modal');
        showToast(err.message || 'Failed to delete room.', 'error');
      }
    });

    document.querySelectorAll('#type-filters .type-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#type-filters .type-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.currentType = chip.dataset.type;
        applyFilters();
      });
    });

    document.getElementById('search-input')?.addEventListener('input', e => {
      state.currentSearch = e.target.value.trim();
      applyFilters();
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
    });
  }

  function enforceFormLogic() {
    const bedEl = document.getElementById('f-bed');
    const guestsEl = document.getElementById('f-guests');
    if (!guestsEl || !bedEl) return;

    const bedVal = bedEl.value;
    const guestVal = parseInt(guestsEl.value);

    // Rule 1: Single bed -> strictly 1 guest
    if (bedVal === 'single') {
      guestsEl.value = "1";
      Array.from(guestsEl.options).forEach(opt => opt.disabled = (parseInt(opt.value) > 1));
    } else {
      Array.from(guestsEl.options).forEach(opt => opt.disabled = false);
    }

    // Rule 2: 1 Guest -> Strictly single/mixed bed, CANNOT be double/king
    if (guestsEl.value === "1") {
      Array.from(bedEl.options).forEach(opt => {
        if (opt.value === 'double' || opt.value === 'king') opt.disabled = true;
        else opt.disabled = false;
      });
      if (bedEl.value === 'double' || bedEl.value === 'king') bedEl.value = 'single';
    } else {
      Array.from(bedEl.options).forEach(opt => opt.disabled = false);
    }
  }

  function openDeleteModal(id) {
    const r = state.rooms.find(x => x.id === parseInt(id));
    if (!r) return;

    // CHECK: block deletion if room has active or future bookings
    const today = new Date().toISOString().split('T')[0];
    const activeBookings = state.bookings.filter(b => b.roomId === r.id && b.checkout > today);

    if (activeBookings.length > 0) {
      const earliest = activeBookings.sort((a, b) => new Date(a.checkin) - new Date(b.checkin))[0];
      showToast(
        `Cannot delete "${r.name}" — it has ${activeBookings.length} active booking(s) until ${earliest.checkout}.`,
        'error'
      );
      return;
    }

    state.deletingId = id;
    setText('delete-room-name', escapeHtml(r.name));
    openModal('delete-modal');
  }

  function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
  function setText(id, val) { const el = document.getElementById(id); if (el) el.innerHTML = val; }

  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = `<i class="fa-solid ${type==='success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${msg}`;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

})();