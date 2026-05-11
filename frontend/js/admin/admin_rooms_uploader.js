(function () {
  "use strict";

  let pendingImages = []; // array of base64 strings
  const fileInput = document.getElementById("f-images");
  const previewGrid = document.getElementById("img-preview-grid");
  const uploadZone = document.getElementById("img-upload-zone");

  if (!fileInput || !previewGrid || !uploadZone) return;

  // Expose to admin_rooms.js (existing contract)
  window._adminRoomImages = {
    get: () => pendingImages,
    set: (imgs) => {
      pendingImages = imgs || [];
      renderPreviews();
    },
    clear: () => {
      pendingImages = [];
      previewGrid.innerHTML = "";
    },
  };

  function renderPreviews() {
    previewGrid.innerHTML = pendingImages
      .map(
        (src, i) => `
      <div class="img-preview-item">
        <img src="${src}" alt="Room photo ${i + 1}"/>
        <div class="remove-img" data-idx="${i}"><i class="fa-solid fa-xmark"></i></div>
      </div>
    `,
      )
      .join("");

    previewGrid.querySelectorAll(".remove-img").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        pendingImages.splice(parseInt(btn.dataset.idx, 10), 1);
        renderPreviews();
      });
    });
  }

  function readImages(files) {
    const images = Array.from(files).filter((f) => f.type && f.type.startsWith("image/"));
    if (!images.length) return;

    let loaded = 0;
    images.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        pendingImages.push(e.target.result);
        loaded += 1;
        if (loaded === images.length) renderPreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  fileInput.addEventListener("change", () => {
    readImages(fileInput.files);
    fileInput.value = ""; // allow re-selecting same files
  });

  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = "var(--brand)";
  });

  uploadZone.addEventListener("dragleave", () => {
    uploadZone.style.borderColor = "";
  });

  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = "";
    readImages(e.dataTransfer.files);
  });
})();

