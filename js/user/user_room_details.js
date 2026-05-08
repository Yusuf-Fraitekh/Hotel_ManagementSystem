(function () {
  "use strict";

  const { KEYS, getJson, setJson } = window.QS_STORAGE;
  const API = window.QS_API;
  const { escapeHtml, byId } = window.QS_DOM;
  const { calcNights } = window.QS_DATES;

  const style = document.createElement('style');
  style.innerHTML = `
    .modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
    .modal-content { background: #ffffff !important; color: #1e293b !important; width: 90%; max-width: 450px; border-radius: 16px; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid #e2e8f0; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
    .modal-header h3 { margin: 0; font-size: 1.3rem; color: #0f172a; display: flex; align-items: center; gap: 8px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 1rem; color: #334155; }
    .summary-row span:last-child { font-weight: 600; color: #0f172a; text-align: right; }
    .summary-row.total { font-size: 1.25rem; border-top: 2px dashed #cbd5e1; padding-top: 16px; margin-top: 16px; }
    .summary-row.total span { color: #2563eb !important; font-weight: 800 !important; }
    .modal .btn { border-radius: 8px; font-weight: 600; padding: 12px; }
  `;
  document.head.appendChild(style);

  function getUser() {
    return API.getAuthUser();
  }

  async function getRoomById(id) {
    try {
      const room = await API.rooms.get(id);
      return API.rooms.mapRoom(room);
    } catch (_) {
      return null;
    }
  }

  function renderRoomPage(room) {
    const main = byId("mainContent");
    const draft = getJson(KEYS.bookingDraft, null);

    const typeLabel = room.type === "suite" ? "Suite" : "Room";
    const viewLabel = room.view === "sea" ? "Sea View" : "City View";
    const stayTypeLabel = room.stayType === "business" ? "Business" :
                          room.stayType === "family" ? "Family" : "Flexible";

    main.innerHTML = `
      <section class="page-hero">
        <div class="container">
          <div class="page-breadcrumb">
            <a href="index.html">Home</a>
            <i class="fa-solid fa-chevron-right"></i>
            <a href="rooms.html">Rooms</a>
            <i class="fa-solid fa-chevron-right"></i>
            <span>${escapeHtml(room.name)}</span>
          </div>
          <h1 class="page-title">${escapeHtml(room.name)}</h1>
          <div class="room-meta-top">
            <span class="chip"><i class="fa-solid fa-bed"></i> ${typeLabel}</span>
            <span class="chip"><i class="fa-solid fa-eye"></i> ${viewLabel}</span>
            <span class="chip"><i class="fa-solid fa-user-group"></i> Up to ${room.maxGuests} Guests</span>
            <span class="chip"><i class="fa-solid fa-layer-group"></i> ${stayTypeLabel}</span>
          </div>
        </div>
      </section>

      <section class="page-section">
        <div class="container">
          <div class="layout">
            <div>
              <div class="room-gallery">
                <div class="room-gallery__main">
                  <img id="mainImage" src="${escapeHtml((room.images && room.images[0]) || room.image || 'https://placehold.co/800x500?text=No+Image')}" alt="${escapeHtml(room.name)}">
                </div>
                <div class="room-gallery__thumbs" id="thumbs">
                  ${(room.images || [room.image || 'https://placehold.co/800x500?text=No+Image']).map((src, index) => `
                    <button type="button" class="thumb ${index === 0 ? "is-active" : ""}" data-index="${index}">
                      <img src="${escapeHtml(src)}" alt="Image ${index + 1}">
                    </button>
                  `).join("")}
                </div>
              </div>

              <div class="room-content">
                <div>
                  <h2 class="section-title">Room Description</h2>
                  <p class="room-description">${escapeHtml(room.description)}</p>
                </div>
                <div>
                  <h2 class="section-title">Key Features</h2>
                  <div class="features-grid">
                    ${(room.features || []).map(f => `
                      <div class="feature-item">
                        <i class="fa-solid fa-check-circle"></i>
                        <div>
                          <span>${escapeHtml(f.split(" ")[0] || "")}</span>
                          <small>${escapeHtml(f)}</small>
                        </div>
                      </div>
                    `).join("")}
                    ${(room.features || []).length === 0 ? '<p style="color:var(--text-muted);font-weight:600;">No special features listed for this room.</p>' : ''}
                  </div>
                </div>
                <div>
                  <h2 class="section-title">Notes</h2>
                  <p class="notes">
                    Check-in time is from 3:00 PM to 11:00 PM, and check-out is until 12:00 PM.
                    Additional facilities (baby cot, extra bed) can be requested upon availability.
                  </p>
                </div>
              </div>
            </div>

            <aside class="sidebar">
              <div class="sidebar-card">
                <h3>Book Now</h3>
                <div>
                  <div class="price-big">
                    ${room.price} SAR <span>/ Night</span>
                  </div>
                  <span class="badge">
                    <i class="fa-solid fa-circle-check"></i>
                    Flexible cancellation
                  </span>
                </div>

                <form class="booking-form" id="roomBookingForm">
                  <div class="field">
                    <label class="field-label">
                      <i class="fa-regular fa-calendar-check"></i> Check-in Date
                    </label>
                    <div class="field-control">
                      <input type="date" id="bkCheckin" required>
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-label">
                      <i class="fa-regular fa-calendar-xmark"></i> Check-out Date
                    </label>
                    <div class="field-control">
                      <input type="date" id="bkCheckout" required>
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-label">
                      <i class="fa-solid fa-user-group"></i> Guests
                    </label>
                    <div class="field-control">
                      <select id="bkGuests" required>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-label">
                      <i class="fa-solid fa-layer-group"></i> Stay Type
                    </label>
                    <div class="field-control">
                      <select id="bkStayType" required>
                        <option value="flex">Flexible</option>
                        <option value="business">Business</option>
                        <option value="family">Family</option>
                      </select>
                    </div>
                  </div>
                  
                  <button type="submit" class="btn btn-primary btn-full">
                    <i class="fa-solid fa-arrow-right"></i> Confirm Booking
                  </button>
                  <button type="button" class="btn btn-ghost btn-full" onclick="window.history.back()">
                    <i class="fa-solid fa-arrow-left"></i> Back
                  </button>
                </form>

                <div class="alert">
                  Booking availability is validated in real-time before confirmation.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <!-- Booking Confirmation Modal -->
      <div class="modal" id="bookingModal" style="display:none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fa-solid fa-bell-concierge"></i> Confirm Booking</h3>
            <button class="btn btn-ghost modal-close" id="closeModalBtn"><i class="fa-solid fa-times"></i></button>
          </div>
          <div class="modal-body" id="modalSummaryContent">
            <!-- Dynamic Summary Here -->
          </div>
          <div class="modal-footer" style="display:flex; gap:12px; margin-top:20px;">
            <button class="btn btn-ghost" id="cancelConfirmBtn" style="flex:1;">Cancel</button>
            <button class="btn btn-primary" id="finalConfirmBtn" style="flex:1;">Confirm & Book</button>
          </div>
        </div>
      </div>

    `;

    initGallery(room);
    initBookingForm(room, draft);
  }

  function initGallery(room) {
    const mainImg = byId("mainImage");
    const thumbs = Array.from(document.querySelectorAll(".thumb"));

    thumbs.forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index, 10);
        if (!isNaN(index) && room.images[index]) {
          mainImg.src = room.images[index];
          thumbs.forEach(t => t.classList.remove("is-active"));
          btn.classList.add("is-active");
        }
      });
    });
  }

  function initBookingForm(room, draft) {
    const checkinEl = byId("bkCheckin");
    const checkoutEl = byId("bkCheckout");
    const guestsEl = byId("bkGuests");
    const stayTypeEl = byId("bkStayType");
    const form = byId("roomBookingForm");
    
    // Modal Elements
    const modal = byId("bookingModal");
    const closeBtn = byId("closeModalBtn");
    const cancelBtn = byId("cancelConfirmBtn");
    const confirmBtn = byId("finalConfirmBtn");
    const summaryBody = byId("modalSummaryContent");

    let pendingBooking = null;

    const today = window.QS_DATES.todayIsoDate();
    checkinEl.min = today;
    checkoutEl.min = today;

    checkinEl.addEventListener("change", () => {
      checkoutEl.min = checkinEl.value || today;
      if (checkoutEl.value && checkoutEl.value <= checkinEl.value) {
        checkoutEl.value = "";
      }
    });

    if (draft) {
      if (draft.checkin) checkinEl.value = draft.checkin;
      if (draft.checkout) checkoutEl.value = draft.checkout;
      if (draft.guests) guestsEl.value = String(draft.guests);
      if (draft.stayType) stayTypeEl.value = draft.stayType;
    } else {
      checkinEl.value = today;
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      checkoutEl.value = tomorrow.toISOString().split("T")[0];
    }
    
    function closeModal() {
        modal.style.display = "none";
        pendingBooking = null;
    }

    if(closeBtn) closeBtn.onclick = closeModal;
    if(cancelBtn) cancelBtn.onclick = closeModal;

    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        if (!pendingBooking) return;
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Processing…";
        try {
          await API.bookings.create({
            roomId: pendingBooking.roomId,
            checkInDate: pendingBooking.checkin,
            checkOutDate: pendingBooking.checkout,
            guestsCount: pendingBooking.guests,
            stayType: pendingBooking.stayType,
            notes: pendingBooking.notes || null,
          });
          setJson(KEYS.bookingDraft, null);
          window.location.href = "bookings.html";
        } catch (err) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = "Confirm & Book";
          alert(err.message || "Booking failed. Please try again.");
        }
      };
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const user = getUser();
      if (!user) {
          alert("Please sign in to confirm your booking.");
          window.location.href = "../login-signin-page/authintcate.html?redirect=room_details.html?id=" + room.id;
          return;
      }

      const checkin = checkinEl.value;
      const checkout = checkoutEl.value;
      const guests = parseInt(guestsEl.value, 10) || 1;
      const stayType = stayTypeEl.value;

      const nights = calcNights(checkin, checkout);
      if (!nights) {
        alert("Please select valid dates. Checkout must be after check-in.");
        return;
      }
      if (checkin < today) {
        alert("Check-in date cannot be in the past.");
        return;
      }
      if (guests < 1 || guests > room.maxGuests) {
        alert(`This room accommodates up to ${room.maxGuests} guests.`);
        return;
      }
      try {
        const availability = await API.rooms.list({
          checkIn: checkin,
          checkOut: checkout,
          guests,
          page: 1,
          pageSize: 100,
        });
        const available = (availability.items || []).some((x) => x.id === room.id);
        if (!available) {
          alert("This room is no longer available for the selected dates. Please choose different dates.");
          return;
        }
      } catch (err) {
        alert(err.message || "Failed to validate room availability.");
        return;
      }

      const total = nights * room.price;
      pendingBooking = {
        roomId: room.id,
        checkin,
        checkout,
        guests,
        stayType,
        notes: null
      };
      
      summaryBody.innerHTML = `
        <div class="summary-row"><span>Room:</span> <span>${escapeHtml(room.name)}</span></div>
        <div class="summary-row"><span>Dates:</span> <span>${checkin} → ${checkout}</span></div>
        <div class="summary-row"><span>Duration:</span> <span>${nights} Night(s)</span></div>
        <div class="summary-row"><span>Guests:</span> <span>${guests} Person(s)</span></div>
        <div class="summary-row total"><span>Total Cost:</span> <span>${total} SAR</span></div>
      `;

      modal.style.display = "flex";
    });
  }

  function renderError(message) {
    const main = byId("mainContent");
    main.innerHTML = `
      <section class="page-hero">
        <div class="container">
          <div class="page-breadcrumb">
            <a href="index.html">Home</a>
            <i class="fa-solid fa-chevron-right"></i>
            <a href="rooms.html">Rooms</a>
          </div>
        </div>
      </section>
      <section>
        <div class="container">
          <div class="error-state">
            <h2>Room Not Found</h2>
            <p>${escapeHtml(message || "Check the link or go back to rooms page.")}</p>
            <a class="btn btn-primary" href="rooms.html">
              <i class="fa-solid fa-arrow-left"></i> Back to Rooms
            </a>
          </div>
        </div>
      </section>
    `;
  }

  async function init() {
    window.QS_USER_NAV?.renderUserNavAuthArea();
    window.QS_HEADER?.initHeaderScroll(byId("siteHeader"));

    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const id = parseInt(idParam, 10);

    if (!idParam || isNaN(id)) {
      renderError("Invalid Room ID.");
      return;
    }

    const room = await getRoomById(id);
    if (!room) {
      renderError("Room not found or no longer available.");
      return;
    }

    renderRoomPage(room);
  }

  document.addEventListener("DOMContentLoaded", () => { void init(); });
})();
