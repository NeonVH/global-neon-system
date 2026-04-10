import { updateProfile } from "../services/user-service.js";
import { formatCoin, formatDate, formatPermissionLabel, formatRoleLabel, formatStatusLabel, formatVipLabel } from "../utils/formatters.js";

export function renderProfilePage({ state, currentUser }) {
  if (!currentUser) {
    return `
      <section class="glass-panel feature-panel">
        <div class="eyebrow">Identity required</div>
        <h1 class="section-title">Bạn chưa đăng nhập</h1>
        <p class="section-copy">Hãy đăng nhập để cập nhật hồ sơ, coin, VIP và notification cá nhân.</p>
        <button class="btn btn-primary" type="button" data-profile-auth="true">Mở đăng nhập</button>
      </section>
    `;
  }
  const myNotifications = state.notifications.filter((item) => item.toUid === currentUser.id).slice(0, 5);
  const permissions = Object.entries(currentUser.permissions || {}).filter(([, allowed]) => allowed).map(([permission]) => permission);
  return `
    <section class="details-grid">
      <article class="profile-panel glass-panel animate-rise">
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
          <div class="avatar-badge" style="width:5rem;height:5rem;border-radius:1.5rem;">
            ${currentUser.avatarUrl ? `<img src="${currentUser.avatarUrl}" alt="${currentUser.username}">` : currentUser.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="eyebrow">${formatRoleLabel(currentUser.role)}</div>
            <h1 class="section-title" style="font-size:2rem;">${currentUser.username}</h1>
            <p class="section-copy">${currentUser.bio || "Chưa cập nhật bio."}</p>
          </div>
        </div>
        <div class="content-grid-2" style="margin-top:1rem;">
          <div class="info-row"><span>VIP</span><strong>${formatVipLabel(currentUser.vipLevel)}</strong></div>
          <div class="info-row"><span>Coin</span><strong>${formatCoin(currentUser.coin)}</strong></div>
          <div class="info-row"><span>Trạng thái</span><strong>${formatStatusLabel(currentUser.accountStatus)}</strong></div>
          <div class="info-row"><span>Đăng nhập gần đây</span><strong>${formatDate(currentUser.lastLoginAt)}</strong></div>
        </div>
        <div style="margin-top:1rem;">
          <div class="eyebrow">Active permissions</div>
          <div class="inline-actions" style="margin-top:0.6rem;">
            ${permissions.length ? permissions.map((permission) => `<span class="chip chip-violet">${formatPermissionLabel(permission)}</span>`).join("") : `<span class="muted">Tài khoản member không có quyền admin.</span>`}
          </div>
        </div>
      </article>

      <article class="profile-panel glass-panel animate-rise">
        <div class="section-head">
          <div>
            <div class="eyebrow">Profile editor</div>
            <h2 class="section-title">Cập nhật hồ sơ</h2>
          </div>
        </div>
        <form id="profile-form" class="stack">
          <div class="field">
            <label for="profile-avatar-url">Avatar URL</label>
            <input id="profile-avatar-url" name="avatarUrl" value="${currentUser.avatarUrl || ""}" placeholder="https://...">
          </div>
          <div class="field">
            <label for="profile-avatar-file">Hoặc upload ảnh</label>
            <input id="profile-avatar-file" name="avatarFile" type="file" accept="image/png,image/jpeg,image/webp">
          </div>
          <div class="field">
            <label for="profile-bio">Bio</label>
            <textarea id="profile-bio" name="bio">${currentUser.bio || ""}</textarea>
          </div>
          <div class="inline-actions">
            <button class="btn btn-primary" type="submit">Lưu hồ sơ</button>
          </div>
        </form>
      </article>
    </section>

    <section class="notification-card glass-panel">
      <div class="section-head">
        <div>
          <div class="eyebrow">Inbox preview</div>
          <h2 class="section-title">Thông báo gần đây</h2>
        </div>
        <a class="btn btn-secondary" href="#/notifications">Xem tất cả</a>
      </div>
      <div class="notification-list">
        ${myNotifications.length ? myNotifications.map((item) => `
          <div class="notification-item">
            <div>
              <strong>${item.title}</strong>
              <div class="muted">${item.msg}</div>
            </div>
            <span class="chip ${item.read ? "chip-cyan" : "chip-gold"}">${item.read ? "Đã đọc" : "Mới"}</span>
          </div>
        `).join("") : `<div class="notification-item"><span class="muted">Hộp thư của bạn đang trống.</span></div>`}
      </div>
    </section>
  `;
}

export function mountProfilePage({ showToast, openAuthModal }) {
  const authButton = document.querySelector("[data-profile-auth='true']");
  if (authButton) {
    authButton.addEventListener("click", () => openAuthModal("login"));
    return () => {};
  }
  const form = document.getElementById("profile-form");
  if (!form) {
    return () => {};
  }
  const onSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      await updateProfile({
        avatarUrl: String(formData.get("avatarUrl") || ""),
        avatarFile: formData.get("avatarFile"),
        bio: String(formData.get("bio") || "")
      });
      showToast({
        title: "Hồ sơ đã cập nhật",
        message: "Thông tin mới của bạn đã được lưu.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Không thể lưu hồ sơ",
        message: error.message,
        tone: "error"
      });
    }
  };
  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}
