(function () {
  "use strict";

  function todayIsoDate() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().split("T")[0];
  }

  function calcNights(checkin, checkout) {
    if (!checkin || !checkout) return null;
    const ms = new Date(checkout) - new Date(checkin);
    return ms > 0 ? Math.round(ms / 86400000) : null;
  }

  function formatDateLong(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function doDatesOverlap(start1, end1, start2, end2) {
    if (!start1 || !end1 || !start2 || !end2) return false;
    return start1 < end2 && start2 < end1;
  }

  window.QS_DATES = {
    todayIsoDate,
    calcNights,
    formatDateLong,
    formatDateShort,
    doDatesOverlap,
  };
})();

