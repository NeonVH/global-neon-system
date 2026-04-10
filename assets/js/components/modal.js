let root;

export function initModal() {
  root = document.getElementById("modal-root");
  if (!root || root.dataset.ready === "true") {
    return;
  }
  root.dataset.ready = "true";
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.dataset.modalClose === "true") {
      closeModal();
    }
  });
}

export function openModal({ title, content, wide = false }) {
  if (!root) {
    initModal();
  }
  root.classList.add("is-open");
  root.innerHTML = `
    <div class="modal-overlay" data-modal-close="true"></div>
    <div class="modal-dialog glass-panel ${wide ? "w-full max-w-5xl" : ""}">
      <div class="section-head" style="margin-bottom:1rem;">
        <div>
          <div class="eyebrow">NeonVH</div>
          <h3 class="section-title" style="font-size:1.05rem;">${title}</h3>
        </div>
        <button class="btn btn-ghost" type="button" data-modal-close="true">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div>${content}</div>
    </div>
  `;
}

export function closeModal() {
  if (!root) {
    return;
  }
  root.classList.remove("is-open");
  root.innerHTML = "";
}
