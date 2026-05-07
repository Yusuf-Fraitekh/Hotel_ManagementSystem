(function () {
  "use strict";

  const { KEYS, getJson, setJson } = window.QS_STORAGE;
  const API = window.QS_API;
  const { escapeHtml, byId } = window.QS_DOM;
  const { todayIsoDate, calcNights, formatDateShort, doDatesOverlap } = window.QS_DATES;

  /* ─── Booking Summary Banner ──────────────────────────────────── */
  function loadBookingSummary() {
    const draft = getJson(KEYS.bookingDraft, null);
    const summaryEl = byId("bookingSummary");
    if (!summaryEl) return;
    if (!draft || !draft.checkin || !draft.checkout) {
      summaryEl.innerHTML = "";
      return;
    }
    const nights = calcNights(draft.checkin, draft.checkout);
    summaryEl.innerHTML = `
      <span class="chip">
        <i class="fa-regular fa-calendar-days"></i>
        ${formatDateShort(draft.checkin)} → ${formatDateShort(draft.checkout)}${nights ? ` • ${nights} Night(s)` : ""}
      </span>
      <span class="chip">
        <i class="fa-solid fa-user-group"></i>
        ${draft.guests || 1} Guest(s)
      </span>
      ${draft.floor ? `<span class="chip"><i class="fa-solid fa-building"></i> Floor ${draft.floor}</span>` : ""}
    `;
  }

  /* ─── Room Data from LocalStorage (Admin-synced) ────────────── */
  const DEFAULT_ROOMS = [
    {
      id: 1, floor: 1,
      name: "Economy Single Room", type: "room", bed: "single", view: "city",
      tags: [], maxGuests: 1, price: 220, stayType: "flex", stars: 3,
      image: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
      description: "A practical choice for short-term individual stays with essential amenities."
    },
    {
      id: 2, floor: 1,
      name: "Business Single Room", type: "room", bed: "single", view: "city",
      tags: ["business"], maxGuests: 1, price: 280, stayType: "business", stars: 4,
      image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
      description: "Designed for business travelers, featuring a dedicated workspace."
    },
    {
      id: 3, floor: 1,
      name: "Standard Double Room", type: "room", bed: "double", view: "city",
      tags: [], maxGuests: 2, price: 320, stayType: "flex", stars: 4,
      image: "https://images.unsplash.com/photo-1551887373-6d7f8bfc4f84?auto=format&fit=crop&w=1200&q=80",
      description: "Comfortable room with a double bed, perfect for couples or friends."
    },
    {
      id: 4, floor: 2,
      name: "Ocean View Double", type: "room", bed: "double", view: "sea",
      tags: ["couples"], maxGuests: 2, price: 420, stayType: "flex", stars: 4,
      image: "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
      description: "Beautifully appointed room with a stunning view of the coastline."
    },
    {
      id: 5, floor: 2,
      name: "Executive Suite", type: "suite", bed: "king", view: "city",
      tags: ["private", "business"], maxGuests: 2, price: 650, stayType: "business", stars: 5,
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
      description: "Spacious suite with a private living area and premium services."
    },
    {
      id: 6, floor: 2,
      name: "Luxury Sea View Suite", type: "suite", bed: "king", view: "sea",
      tags: ["private", "couples"], maxGuests: 2, price: 780, stayType: "flex", stars: 5,
      image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      description: "Ultra-luxury suite featuring a private balcony overlooking the sea."
    },
    {
      id: 7, floor: 3,
      name: "Family Two-Bedroom Suite", type: "suite", bed: "mixed", view: "city",
      tags: ["family"], maxGuests: 4, price: 720, stayType: "family", stars: 4,
      image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      description: "Ideal for families up to 4, offering separate spaces and shared amenities."
    },
    {
      id: 8, floor: 3,
      name: "Grand Family Sea View", type: "suite", bed: "mixed", view: "sea",
      tags: ["family"], maxGuests: 5, price: 880, stayType: "family", stars: 5,
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      description: "Our largest suite for big families, combining luxury with space."
    },
    {
      id: 9, floor: 4,
      name: "Business King Room", type: "room", bed: "double", view: "city",
      tags: ["business"], maxGuests: 2, price: 360, stayType: "business", stars: 4,
      image: "https://images.unsplash.com/photo-1582719371805-1c00da5819e8?auto=format&fit=crop&w=1200&q=80",
      description: "Equipped with high-speed internet and an ergonomic workstation."
    }
  ];

  /* ─── Helper: get element value safely ───────────────────────── */
  function getVal(id) {
    const el = byId(id);
    return el ? el.value : "";
  }

  function setVal(id, val) {
    const el = byId(id);
    if (el) el.value = val;
  }

  /* ─── Apply URL Params → Sidebar Filters ─────────────────────── */
  function applyQueryToFilters() {
    const p = new URLSearchParams(window.location.search);
    const td = todayIsoDate();

    // Direct dropdown maps
    if (p.get("type"))     setVal("filterType",     p.get("type"));
    if (p.get("stayType")) setVal("filterStayType", p.get("stayType"));
    if (p.get("floor"))    setVal("filterFloor",    p.get("floor"));
    if (p.get("bed"))      setVal("filterBed",      p.get("bed"));
    if (p.get("view"))     setVal("filterView",     p.get("view"));
    if (p.get("tag"))      setVal("filterTag",      p.get("tag"));
    if (p.get("sort"))     setVal("filterSort",     p.get("sort"));
    if (p.get("priceMin")) setVal("filterPriceMin", p.get("priceMin"));
    if (p.get("priceMax")) setVal("filterPriceMax", p.get("priceMax"));

    // Dates — only apply if valid future dates
    const checkin  = p.get("checkin")  || "";
    const checkout = p.get("checkout") || "";
    if (checkin  && checkin  >= td) setVal("filterCheckin",  checkin);
    if (checkout && checkout >  (checkin || td)) setVal("filterCheckout", checkout);

    // Guests
    const gp = p.get("guests") || p.get("maxGuests") || p.get("minGuests") || "";
    if (gp) {
      const g = parseInt(gp, 10);
      if      (g >= 5) setVal("filterGuests", "5");
      else if (g >= 4) setVal("filterGuests", "4");
      else if (g >= 3) setVal("filterGuests", "3");
      else if (g === 2) setVal("filterGuests", "2");
      else              setVal("filterGuests", "1");
    }

    // Tag-based filtering (couples/family/business/private) → stored for filterRooms
    const tag = p.get("tag") || "";
    window._QS_TAG_FILTER = tag;

    // Save incoming params back to draft if they carry booking data
    if (checkin || checkout || p.get("floor") || p.get("guests")) {
      const draft = getJson(KEYS.bookingDraft, null) || {};
      setJson(KEYS.bookingDraft, {
        ...draft,
        checkin:  checkin  || draft.checkin  || "",
        checkout: checkout || draft.checkout || "",
        floor:    p.get("floor")  || draft.floor  || "",
        guests:   gp ? parseInt(gp) : (draft.guests || 1),
        stayType: p.get("stayType") || draft.stayType || "flex",
      });
    }
  }

  /* ─── Get Current Filter Values ───────────────────────────────── */
  function getCurrentFilters() {
    return {
      type:     getVal("filterType"),
      bed:      getVal("filterBed"),
      view:     getVal("filterView"),
      floorVal: getVal("filterFloor"),
      guestsVal:getVal("filterGuests"),
      stayType: getVal("filterStayType"),
      priceMin: parseInt(getVal("filterPriceMin") || "0", 10),
      priceMax: (() => { const v = getVal("filterPriceMax"); return v ? parseInt(v, 10) : null; })(),
      sort:     getVal("filterSort") || "recommended",
      tag:      getVal("filterTag") || window._QS_TAG_FILTER || "",
    };
  }

  /* ─── Filter Logic ────────────────────────────────────────────── */
  
  function getRoomOccupancy(roomId) {
    const today = todayIsoDate();
    const allBookings = getJson(KEYS.bookings, []);
    let occupiedUntil = null;
    
    for (const b of allBookings) {
        if (b.roomId === roomId && b.checkout > today && b.checkin <= today) {
            if (!occupiedUntil || b.checkout > occupiedUntil) {
                occupiedUntil = b.checkout;
            }
        }
    }
    return occupiedUntil;
  }
  
  // Custom filter logic hook to exclude strictly booked rooms from Date filters

  function getRoomsDB() {
    // Always read fresh from LocalStorage so admin changes reflect instantly
    const stored = getJson(KEYS.rooms, null);
    if (stored && stored.length > 0) return stored;
    // Fallback: write defaults then return them
    setJson(KEYS.rooms, DEFAULT_ROOMS);
    return DEFAULT_ROOMS;
  }

  async function filterRooms() {
    const f = getCurrentFilters();
    const data = await API.rooms.list({
      checkIn: getVal("filterCheckin"),
      checkOut: getVal("filterCheckout"),
      guests: f.guestsVal ? parseInt(f.guestsVal, 10) : undefined,
      type: f.type || undefined,
      bed: f.bed || undefined,
      view: f.view || undefined,
      floor: f.floorVal || undefined,
      stayType: f.stayType || undefined,
      tag: f.tag || undefined,
      priceMin: f.priceMin || undefined,
      priceMax: f.priceMax || undefined,
      sort: f.sort || "recommended",
      page: 1,
      pageSize: 100,
    });
    return (data.items || []).map(API.rooms.mapRoom);
  }

  /* ─── Render Room Cards ───────────────────────────────────────── */
  async function renderRooms() {
    const grid = byId("roomsGrid");
    const info = byId("resultsInfo");
    const list = await filterRooms();

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No matching rooms found</h3>
          <p>Try adjusting your filters to find more options.</p>
          <button type="button" class="btn btn-ghost" id="emptyResetBtn" style="margin-top:12px;">
            <i class="fa-solid fa-rotate-left"></i> Reset Filters
          </button>
        </div>
      `;
      info.textContent = "";
      const btn = byId("emptyResetBtn");
      if (btn) btn.addEventListener("click", resetFilters);
      return;
    }

    info.textContent = `Showing ${list.length} room(s)`;

    grid.innerHTML = list.map(room => {
      const viewLabel  = room.view  === "sea"   ? "Sea View"  : "City View";
      const typeLabel  = room.type  === "suite"  ? "Suite"    : "Room";
      const bedLabel   = { single: "Single Bed", double: "Double Bed", king: "King Bed", mixed: "Mixed Beds" }[room.bed] || room.bed;
      const stayLabel  = { flex: "Flexible", business: "Business", family: "Family" }[room.stayType] || room.stayType;

      
      const occupancyBadge = "";

      return `
        <article class="room-card" style="position:relative;">
          ${occupancyBadge}
          <div class="room-card__media">

            <img src="${escapeHtml((room.images && room.images[0]) || room.image || '')}" alt="${escapeHtml(room.name)}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
          </div>
          <div class="room-card__body">
            <h2 class="room-card__title">${escapeHtml(room.name)}</h2>
            <div class="room-card__meta">
              <span><i class="fa-solid fa-bed"></i> ${typeLabel} · ${bedLabel}</span>
              <span><i class="fa-solid fa-eye"></i> ${viewLabel}</span>
              <span><i class="fa-solid fa-user-group"></i> Up to ${room.maxGuests} Guests</span>
              <span><i class="fa-solid fa-building"></i> Floor ${room.floor}</span>
              <span><i class="fa-solid fa-layer-group"></i> ${stayLabel}</span>
            </div>
            <p class="room-card__desc">${escapeHtml(room.description)}</p>
            <div class="room-card__foot">
              <div class="room-card__price">
                SAR ${room.price}
                <small>per night</small>
              </div>
              <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                <span class="badge">
                  <i class="fa-solid fa-circle-check"></i>
                  Free Cancellation
                </span>
                <a class="btn btn-primary" href="room_details.html?id=${room.id}">
                  View Details <i class="fa-solid fa-arrow-right"></i>
                </a>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  /* ─── Reset All Filters ───────────────────────────────────────── */
  function resetFilters() {
    ["filterType","filterBed","filterView","filterTag","filterGuests","filterStayType",
     "filterFloor","filterCheckin","filterCheckout"].forEach(id => setVal(id, ""));
    setVal("filterSort",     "recommended");
    setVal("filterPriceMin", "");
    setVal("filterPriceMax", "");
    window._QS_TAG_FILTER = "";
    void renderRooms();
  }

  /* ─── Date Guards ─────────────────────────────────────────────── */
  function initDateGuards() {
    const td   = todayIsoDate();
    const fin  = byId("filterCheckin");
    const fout = byId("filterCheckout");

    if (fin)  fin.min  = td;
    if (fout) fout.min = td;

    if (fin) {
      fin.addEventListener("change", () => {
        if (fout) {
          fout.min = fin.value || td;
          if (fout.value && fout.value <= fin.value) fout.value = "";
        }
        void renderRooms();
      });
    }
    if (fout) fout.addEventListener("change", () => void renderRooms());
  }

  /* ─── Init ────────────────────────────────────────────────────── */
  function init() {
    window.QS_USER_NAV?.renderUserNavAuthArea();
    window.QS_HEADER?.initHeaderScroll(byId("siteHeader"));
    loadBookingSummary();
    applyQueryToFilters();
    initDateGuards();
    void renderRooms();

    // Wire all filter dropdowns and inputs
    [
      "filterType", "filterBed", "filterView", "filterTag", "filterGuests",
      "filterStayType", "filterFloor", "filterSort"
    ].forEach(id => {
      const el = byId(id);
      if (el) el.addEventListener("change", () => void renderRooms());
    });

    ["filterPriceMin", "filterPriceMax"].forEach(id => {
      const el = byId(id);
      if (el) {
        el.addEventListener("change", () => void renderRooms());
        el.addEventListener("input",  () => void renderRooms());
      }
    });

    const resetBtn = byId("resetFilters");
    if (resetBtn) resetBtn.addEventListener("click", resetFilters);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
