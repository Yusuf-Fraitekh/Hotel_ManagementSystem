(function () {
  "use strict";

  const { KEYS, getJson, setJson } = window.QS_STORAGE;
  const API = window.QS_API;
  const { byId } = window.QS_DOM;
  const { todayIsoDate, calcNights } = window.QS_DATES;

  function getVal(id) {
    const el = byId(id);
    return el ? el.value : "";
  }
  function setVal(id, v) {
    const el = byId(id);
    if (el && v) el.value = v;
  }

  function initBookingDefaults() {
    const checkinEl  = byId("checkin");
    const checkoutEl = byId("checkout");
    const td = todayIsoDate();

    checkinEl.min  = td;
    checkoutEl.min = td;

    checkinEl.addEventListener("change", () => {
      if (checkoutEl.value && checkoutEl.value <= checkinEl.value) {
        const d = new Date(checkinEl.value);
        d.setDate(d.getDate() + 1);
        checkoutEl.value = d.toISOString().split("T")[0];
      }
      checkoutEl.min = checkinEl.value || td;
    });

    const draft = getJson(KEYS.bookingDraft, null);
    if (draft?.checkin && draft?.checkout && draft.checkin >= td) {
      checkinEl.value  = draft.checkin;
      checkoutEl.value = draft.checkout;
      setVal("guests", draft.guests);
      setVal("stayType", draft.stayType);
      setVal("roomType", draft.type);
      setVal("bedType", draft.bed);
      setVal("viewType", draft.view);
      setVal("experienceTag", draft.tag);
      setVal("floor", draft.floor);
      return;
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    checkinEl.valueAsDate  = today;
    checkoutEl.valueAsDate = tomorrow;
  }

  function saveBookingDraft() {
    const checkin  = getVal("checkin");
    const checkout = getVal("checkout");
    const guests   = parseInt(getVal("guests"), 10) || 1;
    const stayType = getVal("stayType");
    const type     = getVal("roomType");
    const bed      = getVal("bedType");
    const view     = getVal("viewType");
    const tag      = getVal("experienceTag");
    const floor    = getVal("floor");

    setJson(KEYS.bookingDraft, { checkin, checkout, guests, stayType, type, bed, view, tag, floor });
  }

  function buildRoomsQuery() {
    const params = new URLSearchParams();

    ["checkin","checkout","stayType","floor"].forEach(k => {
      const el = byId(k);
      if (el && el.value) params.set(k, el.value);
    });

    if (getVal("guests")) params.set("guests", getVal("guests"));
    if (getVal("roomType")) params.set("type", getVal("roomType"));
    if (getVal("bedType")) params.set("bed", getVal("bedType"));
    if (getVal("viewType")) params.set("view", getVal("viewType"));
    if (getVal("experienceTag")) params.set("tag", getVal("experienceTag"));
    if (getVal("experienceTag") === "luxury") {
      params.set("type", "suite");
    }

    const qs = params.toString();
    return qs ? `rooms.html?${qs}` : "rooms.html";
  }

  function onBookingSubmit(e) {
    e.preventDefault();
    const checkin  = getVal("checkin");
    const checkout = getVal("checkout");
    const td = todayIsoDate();

    if (checkin < td) {
      alert("Check-in date cannot be in the past.");
      byId("checkin").value = td;
      return;
    }
    if (!calcNights(checkin, checkout)) {
      alert("Check-out must be after check-in.");
      return;
    }

    saveBookingDraft();
    window.location.href = buildRoomsQuery();
  }

  function toQueryString(queryObj) {
    const p = new URLSearchParams();
    Object.entries(queryObj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    });
    const qs = p.toString();
    return qs ? `rooms.html?${qs}` : "rooms.html";
  }

  function getRoomImage(room) {
    if (Array.isArray(room.images) && room.images.length && room.images[0]) return room.images[0];
    if (room.image) return room.image;
    return "https://placehold.co/1600x900?text=Room";
  }

  function renderCategories(rooms) {
    const grid = byId("categoriesGrid");
    if (!grid) return;

    const categories = [
      { title: "Single Rooms", text: "Perfect for solo travelers.", tag: "Solo", icon: "fa-user", badge: "1 Guest", query: { type: "room", bed: "single" }, match: r => r.bed === "single" },
      { title: "Double Rooms", text: "Ideal for two guests.", tag: "Double", icon: "fa-user-group", badge: "2 Guests", query: { type: "room", bed: "double" }, match: r => r.bed === "double" },
      { title: "Rooms for Couples", text: "Romantic and quiet rooms.", tag: "Couples", icon: "fa-heart", badge: "Romantic", query: { tag: "couples", guests: 2 }, match: r => (r.tags || []).includes("couples") },
      { title: "Sea View Rooms", text: "Rooms with ocean horizon views.", tag: "Sea View", icon: "fa-water", badge: "Sea View", query: { view: "sea" }, match: r => r.view === "sea" },
      { title: "City View Rooms", text: "Overlook the city skyline.", tag: "City View", icon: "fa-city", badge: "City View", query: { view: "city" }, match: r => r.view === "city" },
      { title: "Business Rooms", text: "Great for productive stays.", tag: "Business", icon: "fa-briefcase", badge: "Work", query: { type: "room", tag: "business", stayType: "business" }, match: r => r.stayType === "business" || (r.tags || []).includes("business") },
      { title: "Private Suites", text: "Premium privacy and comfort.", tag: "Private", icon: "fa-crown", badge: "Suite", query: { type: "suite", tag: "private" }, match: r => r.type === "suite" && (r.tags || []).includes("private") },
      { title: "Family Rooms & Suites", text: "Spacious layouts for families.", tag: "Family", icon: "fa-people-roof", badge: "3+ Guests", query: { tag: "family", stayType: "family", guests: 3 }, match: r => r.maxGuests >= 3 || (r.tags || []).includes("family") },
    ];

    const cards = categories
      .map((c) => {
        const room = rooms.find(c.match);
        if (!room) return null;
        return `
          <a class="card" href="${toQueryString(c.query)}" aria-label="${c.title}">
            <div class="card__media">
              <span class="tag"><i class="fa-solid ${c.icon}"></i> ${c.tag}</span>
              <img src="${getRoomImage(room)}" alt="${c.title}" loading="lazy" onerror="this.src='https://placehold.co/1600x900?text=Room'">
            </div>
            <div class="card__body">
              <div class="card__title">${c.title}</div>
              <div class="card__text">${c.text}</div>
            </div>
            <div class="card__foot">
              <span class="btn btn-ghost" style="pointer-events:none;">Explore <i class="fa-solid fa-arrow-right"></i></span>
              <span class="muted" style="font-weight:900;">${c.badge}</span>
            </div>
          </a>
        `;
      })
      .filter(Boolean);

    if (!cards.length) {
      grid.innerHTML = `
        <div class="card">
          <div class="card__body">
            <div class="card__title">No categories available yet</div>
            <div class="card__text">Please add rooms from admin panel first.</div>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = cards.join("");
  }

  async function loadRoomCategories() {
    const grid = byId("categoriesGrid");
    if (!grid) return;
    try {
      const result = await API.rooms.list({ page: 1, pageSize: 20, sort: "recommended" });
      const rooms = (result.items || []).map(API.rooms.mapRoom);
      renderCategories(rooms);
    } catch (_) {
      grid.innerHTML = `
        <div class="card">
          <div class="card__body">
            <div class="card__title">Could not load categories</div>
            <div class="card__text">Please refresh the page.</div>
          </div>
        </div>
      `;
    }
  }

  function init() {
    window.QS_USER_NAV?.renderUserNavAuthArea();
    initBookingDefaults();
    void loadRoomCategories();
    window.QS_HEADER?.initHeaderScroll(byId("siteHeader"));

    const form = byId("bookingForm");
    if (form) form.addEventListener("submit", onBookingSubmit);

    ["checkin", "checkout", "guests", "stayType", "roomType", "bedType", "viewType", "experienceTag", "floor"].forEach(id => {
      const el = byId(id);
      if (el) el.addEventListener("change", saveBookingDraft);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
