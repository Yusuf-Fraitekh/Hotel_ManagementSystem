(function () {
  "use strict";

  const API = window.QS_API;
  const { escapeHtml, byId } = window.QS_DOM;
  const { formatDateLong } = window.QS_DATES;
  async function loadBookings() {
    const response = await API.bookings.mine({ page: 1, pageSize: 20 });
    return (response.items || []).map(API.bookings.mapBooking);
  }

  function canCancelBooking(checkinStr) {
    const checkinDate = new Date(checkinStr);
    const today = new Date();
    // Normalize to midnight
    checkinDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffMs = checkinDate - today;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { allowed: false, message: "Cancellation denied. This booking is already past or active." };
    if (diffDays < 2) return { allowed: false, message: "Cancellation denied. Real-world policy requires cancelling at least 48 hours before check-in." };
    return { allowed: true, message: "" };
  }

  function sortBookings(list, mode) {
    const sorted = [...list];
    if (mode === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (mode === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (mode === "priceHigh") {
      sorted.sort((a, b) => b.total - a.total);
    } else if (mode === "priceLow") {
      sorted.sort((a, b) => a.total - b.total);
    }
    return sorted;
  }

  function calcStats(list) {
    const totalBookings = list.length;
    const totalNights = list.reduce((sum, b) => sum + (b.nights || 0), 0);
    const totalAmount = list.reduce((sum, b) => sum + (b.total || 0), 0);
    return { totalBookings, totalNights, totalAmount };
  }

  function renderStats(list) {
    const statsBox = byId("statsBox");
    const { totalBookings, totalNights, totalAmount } = calcStats(list);

    statsBox.innerHTML = `
      <span>
        <span>Bookings Count</span>
        <strong>${totalBookings}</strong>
      </span>
      <span>
        <span>Total Nights</span>
        <strong>${totalNights}</strong>
      </span>
      <span>
        <span>Total Amount</span>
        <strong>${totalAmount} SAR</strong>
      </span>
    `;
  }

  
  function renderBookings(list) {
    const grid = byId("bookingsGrid");
    const info = byId("resultsInfo");

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No bookings yet</h3>
          <p>You can book a room from the rooms page then come back here to see your booking details.</p>
          <a class="btn btn-primary" href="rooms.html">
            <i class="fa-solid fa-bed"></i> Go to Rooms Page
          </a>
        </div>
      `;
      info.textContent = "";
      return;
    }

    info.textContent = `Number of bookings: ${list.length}`;

    const today = new Date().toISOString().split("T")[0];

    grid.innerHTML = list.map((b) => {
        const stayTypeLabel = b.stayType === "business" ? "Business" : b.stayType === "family" ? "Family" : "Flexible";
        const isCancelled = b.status === "cancelled";
        const isPast      = b.checkout < today;

        const statusBadge = isCancelled
          ? `<span style="display:inline-flex;align-items:center;gap:5px;background:#fef2f2;color:#b91c1c;padding:3px 10px;border-radius:8px;font-size:0.78rem;font-weight:800;"><i class="fa-solid fa-xmark-circle"></i> Cancelled</span>`
          : isPast
            ? `<span style="display:inline-flex;align-items:center;gap:5px;background:#f1f5f9;color:#64748b;padding:3px 10px;border-radius:8px;font-size:0.78rem;font-weight:800;"><i class="fa-solid fa-clock-rotate-left"></i> Completed</span>`
            : `<span style="display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;color:#15803d;padding:3px 10px;border-radius:8px;font-size:0.78rem;font-weight:800;"><i class="fa-solid fa-circle-check"></i> Confirmed</span>`;

        const actionButtons = isCancelled ? "" : `
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary extent-btn" ${isPast ? 'disabled style="opacity:0.5;"' : ""}>
              <i class="fa-solid fa-calendar-plus"></i> Extend
            </button>
            <button type="button" class="btn btn-outline cancel-btn">
              <i class="fa-solid fa-xmark"></i> Cancel Booking
            </button>
          </div>`;

        return `
          <article class="booking-card" data-id="${b.id}" data-room="${b.roomId}" style="${isCancelled ? 'opacity:0.7;' : ''}">
            <div class="booking-main">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                <div class="booking-title">${escapeHtml(b.roomName || "Room")}</div>
                ${statusBadge}
              </div>
              <div class="booking-meta">
                <span><i class="fa-regular fa-calendar-days"></i> ${formatDateLong(b.checkin)} - ${formatDateLong(b.checkout)}</span>
                <span><i class="fa-solid fa-moon"></i> <span class="nt-count">${b.nights || "-"}</span> Night(s)</span>
                <span><i class="fa-solid fa-user-group"></i> ${b.guests || 1} Guest</span>
                <span><i class="fa-solid fa-layer-group"></i> ${stayTypeLabel}</span>
              </div>
              ${b.notes ? `<div class="booking-notes"><i class="fa-solid fa-note-sticky"></i> Notes: ${escapeHtml(b.notes)}</div>` : ""}
            </div>
            <div class="booking-side">
              <div class="price-line">
                <div class="price-main">
                  <span class="tot-price">${b.total}</span> SAR <span>/ Total</span>
                </div>
                <div class="price-sub">
                  ${b.pricePerNight} SAR per night
                </div>
              </div>
              ${actionButtons}
            </div>
          </article>
        `;
      }).join("");

    // --- CANCELLATION LOGIC ---
    document.querySelectorAll(".cancel-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".booking-card");
        if (!card) return;
        const id = Number(card.dataset.id);
        const booking = list.find(bk => bk.id === id);
        
        // Remove existing prompts
        const existingPrompt = card.querySelector(".action-prompt");
        if (existingPrompt) {
          existingPrompt.remove();
          return;
        }

        // Apply Real-World Policy Checks
        const cancelCheck = canCancelBooking(booking.checkin);
        
        const promptEl = document.createElement("div");
        promptEl.className = "action-prompt";
        promptEl.style.cssText = "margin-top: 12px; padding: 12px; border-radius: 12px; font-size: .9rem;";
        
        if (!cancelCheck.allowed) {
            promptEl.style.background = "#fef2f2";
            promptEl.style.border = "1px solid rgba(248,113,113,.4)";
            promptEl.style.color = "#b91c1c";
            promptEl.innerHTML = `
              <div style="display:flex; gap:8px; align-items:center;">
                <i class="fa-solid fa-ban" style="font-size:1.5rem;"></i>
                <div style="flex:1;">
                  <strong>Policy Violation</strong><br>
                  ${cancelCheck.message}
                </div>
              </div>
            `;
        } else {
            promptEl.style.background = "#fef2f2";
            promptEl.style.border = "1px solid rgba(248,113,113,.6)";
            promptEl.innerHTML = `
              <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap; color:#b91c1c; font-weight:700;">
                <span><i class="fa-solid fa-triangle-exclamation"></i> Are you absolutely sure you want to cancel? This cannot be undone.</span>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-outline close-p" style="padding:4px 10px; font-size:.8rem;">Keep Booking</button>
                  <button type="button" class="btn btn-primary cnf-cancel" style="padding:4px 10px; font-size:.8rem; background:#b91c1c; border-color:#b91c1c;">Confirm Cancel</button>
                </div>
              </div>
            `;
        }

        card.querySelector(".booking-side").appendChild(promptEl);

        const closeBtn = promptEl.querySelector(".close-p");
        if(closeBtn) closeBtn.onclick = () => promptEl.remove();

        const confCancel = promptEl.querySelector(".cnf-cancel");
        if(confCancel) confCancel.onclick = () => {
           API.bookings.cancel(id).then(() => applyAndRender()).catch(err => alert(err.message || "Cancel failed"));
        };
      });
    });

    // --- EXTENSION LOGIC ---
    document.querySelectorAll(".extent-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".booking-card");
        if (!card) return;
        const id = Number(card.dataset.id);
        const roomId = Number(card.dataset.room);
        const booking = list.find(bk => bk.id === id);

        const existingPrompt = card.querySelector(".action-prompt");
        if (existingPrompt) {
          existingPrompt.remove();
          return;
        }

        const promptEl = document.createElement("div");
        promptEl.className = "action-prompt";
        promptEl.style.cssText = "margin-top: 12px; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-body);";
        
        let minDate = new Date(booking.checkout);
        minDate.setDate(minDate.getDate() + 1);
        const minDateStr = minDate.toISOString().split("T")[0];

        promptEl.innerHTML = `
           <div style="margin-bottom:8px; font-weight:700; color:var(--text-color);">Extend Checkout Date</div>
           <div style="display:flex; gap:8px;">
             <input type="date" class="new-ext-date" min="${minDateStr}" style="flex:1; padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
             <button class="btn btn-primary exe-ext">Validate & Extend</button>
           </div>
           <small class="ext-err" style="color:#ef4444; margin-top:6px; display:block; font-weight:600;"></small>
        `;
        
        card.querySelector(".booking-side").appendChild(promptEl);
        
        const executeExt = promptEl.querySelector(".exe-ext");
        const dateInput = promptEl.querySelector(".new-ext-date");
        const errMap = promptEl.querySelector(".ext-err");

        executeExt.onclick = () => {
           const newCheckout = dateInput.value;
           if(!newCheckout || newCheckout <= booking.checkout) {
              errMap.textContent = "Please select a checkout date strictly after your current stay ends.";
              return;
           }

           API.bookings.extend(id, newCheckout)
             .then(() => {
               alert("Extension Successful!");
               applyAndRender();
             })
             .catch(err => { errMap.textContent = err.message || "Extension failed."; });
        };
      });
    });
  }


  async function clearAllBookings() {
    const all = await loadBookings();
    const cancellable = all.filter(b => b.status !== "cancelled");
    if (!cancellable.length) {
      alert("No active bookings to cancel.");
      return;
    }

    const sure = window.confirm(`Cancel all ${cancellable.length} active booking(s) on the server? This cannot be undone.`);
    if (!sure) return;

    const errors = [];
    for (const b of cancellable) {
      try {
        await API.bookings.cancel(b.id);
      } catch (err) {
        errors.push(`#${b.id}: ${err.message}`);
      }
    }
    if (errors.length) {
      alert("Some bookings could not be cancelled:\n" + errors.join("\n"));
    }
    await applyAndRender();
  }

  async function applyAndRender() {
    const all = await loadBookings();
    const sortMode = byId("sortSelect").value;
    const sorted = sortBookings(all, sortMode);
    renderStats(sorted);
    renderBookings(sorted);
  }

  function init() {
    window.QS_USER_NAV?.renderUserNavAuthArea();
    window.QS_HEADER?.initHeaderScroll(byId("siteHeader"));
    void applyAndRender();

    byId("sortSelect").addEventListener("change", () => void applyAndRender());
    byId("clearAllBtn").addEventListener("click", () => void clearAllBookings());
  }

  document.addEventListener("DOMContentLoaded", init);
})();

