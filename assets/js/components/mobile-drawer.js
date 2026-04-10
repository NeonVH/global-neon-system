import { hasPermission } from "../utils/security.js";

function drawerLink(path, label, icon) {
  return `
    <a class="nav-link" href="#${path}" data-action="close-drawer">
      <i class="${icon}"></i>
      <span>${label}</span>
    </a>
  `;
}

export function renderMobileDrawer({ open, currentUser }) {
  return `
    <div class="mobile-drawer ${open ? "is-open" : ""}" id="mobile-drawer">
      <div class="mobile-drawer__overlay" data-action="close-drawer"></div>
      <aside class="mobile-drawer__panel">
        <div class="stack">
          <div>
            <div class="eyebrow">Navigation</div>
            <h3 class="section-title" style="font-size:1rem;">Neon Menu</h3>
          </div>
          ${drawerLink("/", "Trang Chủ", "fa-solid fa-satellite-dish")}
          ${drawerLink("/library", "Thư Viện", "fa-solid fa-book-open")}
          ${drawerLink("/vip", "Khu VIP", "fa-solid fa-gem")}
          ${drawerLink("/notifications", "Thông Báo", "fa-solid fa-bell")}
          ${currentUser && hasPermission(currentUser, "canViewAdminPanel") ? drawerLink("/admin", "Admin", "fa-solid fa-shield-halved") : ""}
          ${currentUser ? drawerLink("/profile", "Hồ Sơ", "fa-solid fa-user-astronaut") : `
            <button class="btn btn-primary" type="button" data-action="open-auth">Đăng nhập</button>
          `}
        </div>
      </aside>
    </div>
  `;
}
