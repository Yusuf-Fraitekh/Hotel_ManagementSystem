(function () {
  "use strict";

  const { KEYS, getJson, setJson } = window.QS_STORAGE;
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

  function init() {
    window.QS_USER_NAV?.renderUserNavAuthArea();
    initBookingDefaults();
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
