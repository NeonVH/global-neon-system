import { formatCoin, formatRoleLabel, formatVipLabel } from "../utils/formatters.js";
import { getInitials, hasPermission } from "../utils/security.js";

function navLink(path, label, icon, currentPath) {
  const active = currentPath === path ? "is-active" : "";
  return `
    <a class="nav-link ${active}" href="#${path}">
      <i class="${icon}"></i>
      <span>${label}</span>
    </a>
  `;
}

export function renderHeader({ currentPath, currentUser, unreadCount }) {
  const vipTone = currentUser?.vipLevel === "vvip" ? "gold" : currentUser?.vipLevel === "vip" ? "violet" : "cyan";
  return `
    <header class="nav-shell glass-panel animate-rise">
      <div class="brand-mark">
        <button class="btn btn-secondary lg:hidden" type="button" data-action="toggle-drawer" aria-label="Mở menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <a class="brand-mark" href="#/">
          <div class="brand-mark__logo">
            <i class="fa-solid fa-wave-square"></i>
          </div>
          <div>
            <p class="brand-mark__title">NEONVH</p>
            <p class="brand-mark__subtitle">Visual Novel Ecosystem</p>
          </div>
        </a>
      </div>
      <nav class="nav-links">
        ${navLink("/", "Trang Chủ", "fa-solid fa-satellite-dish", currentPath)}
        ${navLink("/library", "Thư Viện", "fa-solid fa-book-open", currentPath)}
        ${navLink("/vip", "VIP", "fa-solid fa-gem", currentPath)}
        ${navLink("/notifications", "Thông Báo", "fa-solid fa-bell", currentPath)}
        ${currentUser && hasPermission(currentUser, "canViewAdminPanel") ? navLink("/admin", "Admin", "fa-solid fa-shield-halved", currentPath) : ""}
      </nav>
      <div class="header-actions">
        ${currentUser ? `
          <a class="btn btn-secondary desktop-only" href="#/profile">
            <i class="fa-solid fa-wallet"></i>
            <span>${formatCoin(currentUser.coin)}</span>
          </a>
          <a class="btn btn-secondary desktop-only" href="#/notifications">
            <i class="fa-solid fa-bell"></i>
            <span>${unreadCount}</span>
          </a>
          <a class="chip chip-${vipTone}" href="#/profile">
            <span class="avatar-badge" style="width:2.2rem;height:2.2rem;border-radius:0.85rem;">${currentUser.avatarUrl ? `<img src="${currentUser.avatarUrl}" alt="${currentUser.username}">` : getInitials(currentUser.username)}</span>
            <span>${currentUser.username}</span>
            <span class="muted">${formatRoleLabel(currentUser.role)} · ${formatVipLabel(currentUser.vipLevel)}</span>
          </a>
          <button class="btn btn-ghost" type="button" data-action="logout">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        ` : `
          <button class="btn btn-primary" type="button" data-action="open-auth">
            <i class="fa-solid fa-right-to-bracket"></i>
            <span>Đăng nhập</span>
          </button>
        `}
      </div>
    </header>
  `;
}
