(function () {
  "use strict";

  function initHeaderScroll(headerEl) {
    if (!headerEl) return;
    window.addEventListener("scroll", () => {
      headerEl.classList.toggle("is-scrolled", window.scrollY > 14);
    });
  }

  window.QS_HEADER = {
    initHeaderScroll,
  };
})();

