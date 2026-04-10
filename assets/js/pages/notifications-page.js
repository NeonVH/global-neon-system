import { markAllNotificationsRead, markNotificationRead } from "../services/notification-service.js";
import { formatDate } from "../utils/formatters.js";

export function renderNotificationsPage({ state, currentUser }) {
  if (!currentUser) {
    return `
      <section class="glass-panel feature-panel">
        <h1 class="section-title">Bạn chưa đăng nhập</h1>
        <p class="section-copy">Đăng nhập để xem inbox realtime và các tín hiệu từ admin.</p>
        <button class="btn btn-primary" type="button" data-noti-auth="true">Đăng nhập</button>
      </section>
    `;
  }
  const notifications = state.notifications
    .filter((item) => item.toUid === currentUser.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    <section class="notification-card glass-panel animate-rise">
      <div class="section-head">
        <div>
          <div class="eyebrow">Realtime inbox</div>
          <h1 class="section-title">Thông báo của bạn</h1>
          <p class="section-copy">Toàn bộ tín hiệu cá nhân và nội dung được đẩy từ admin.</p>
        </div>
        <button class="btn btn-secondary" type="button" id="mark-all-read">Đánh dấu đã đọc</button>
      </div>
      <div class="notification-list">
        ${notifications.length ? notifications.map((item) => `
          <button class="notification-item" type="button" data-mark-read="${item.id}">
            <div style="text-align:left;">
              <strong>${item.title}</strong>
              <div class="muted">${item.msg}</div>
              <div class="muted">${formatDate(item.createdAt)}</div>
            </div>
            <span class="chip ${item.read ? "chip-cyan" : "chip-gold"}">${item.read ? "Đã đọc" : "Mới"}</span>
          </button>
        `).join("") : `<div class="notification-item"><span class="muted">Hộp thư đang trống.</span></div>`}
      </div>
    </section>
  `;
}

export function mountNotificationsPage({ currentUser, showToast, openAuthModal }) {
  const authButton = document.querySelector("[data-noti-auth='true']");
  if (authButton) {
    authButton.addEventListener("click", () => openAuthModal("login"));
    return () => {};
  }
  document.querySelectorAll("[data-mark-read]").forEach((button) => {
    button.addEventListener("click", async () => {
      await markNotificationRead(button.dataset.markRead);
    });
  });
  const markAllButton = document.getElementById("mark-all-read");
  const onClick = async () => {
    try {
      await markAllNotificationsRead(currentUser.id);
      showToast({
        title: "Đã cập nhật inbox",
        message: "Tất cả thông báo đã được đánh dấu đã đọc.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Không thể cập nhật inbox",
        message: error.message,
        tone: "error"
      });
    }
  };
  markAllButton?.addEventListener("click", onClick);
  return () => markAllButton?.removeEventListener("click", onClick);
}
