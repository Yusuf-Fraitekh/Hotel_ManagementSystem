(function () {
  "use strict";

  const KEYS = {
    bookingDraft: "qs_bookingDraft",
  };

  const storage = window.sessionStorage;

  function getJson(key, fallback) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setJson(key, value) {
    if (value === null || value === undefined) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(value));
  }

  function remove(key) {
    storage.removeItem(key);
  }

  window.QS_STORAGE = {
    KEYS,
    getJson,
    setJson,
    remove,
  };
})();
