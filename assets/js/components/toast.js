let root;

export function initToastRoot() {
  root = document.getElementById("toast-root");
}

export function showToast({ title, message, tone = "info", timeout = 3200 }) {
  if (!root) {
    initToastRoot();
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${tone}`;
  toast.innerHTML = `
    <strong>${title}</strong>
    <div class="muted" style="margin-top:0.35rem;">${message}</div>
  `;
  root.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    window.setTimeout(() => toast.remove(), 180);
  }, timeout);
}
